---
title: "Rust 2026 经验谈 - 网络编程：从 TCP 到 HTTP"
published: 2026-07-04
description: "tokio::net 基础、hyper 底层 HTTP Service trait、tower middleware 生态、axum 0.8 实战 extractor 与 State、与 actix-web 选型对比。"
image: "/images/rust-2026/8.jpg"
tags: [Rust, Rust 2026, 网络编程, tokio, hyper, axum, tower]
category: Rust
draft: false
lang: zh_CN
---

![生态与架构实战](/images/rust-2026/8.jpg)

Rust 的网络编程栈从 TCP 到 HTTP 构成了完整的层次：tokio 提供异步 I/O，hyper 构建 HTTP，tower 提供中间件抽象，axum 提供应用框架。本文从底层到上层逐层讲解，并给出 axum 0.8 的实战经验。

## tokio::net 基础

### TcpListener / TcpStream

```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    loop {
        let (stream, addr) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream).await {
                eprintln!("Error handling {}: {}", addr, e);
            }
        });
    }
}

async fn handle_connection(mut stream: TcpStream) -> Result<(), std::io::Error> {
    let mut buf = vec![0u8; 1024];
    loop {
        let n = stream.read(&mut buf).await?;
        if n == 0 {
            return Ok(());  // 连接关闭
        }
        stream.write_all(&buf[..n]).await?;  // echo
    }
}
```

### TcpStream 配置

```rust
use tokio::net::TcpStream;
use std::time::Duration;

let stream = TcpStream::connect("127.0.0.1:8080").await?;

// 设置 TCP_NODELAY（禁用 Nagle 算法）
stream.set_nodelay(true)?;

// 设置 SO_KEEPALIVE（通过 socket2::SockRef 操作已有连接）
let sock_ref = socket2::SockRef::from(&stream);
sock_ref.set_keepalive(Some(Duration::from_secs(30)))?;

// 设置读写超时
// tokio 的 TcpStream 没有 set_timeout——用 tokio::time::timeout 包裹
let result = tokio::time::timeout(
    Duration::from_secs(5),
    stream.read(&mut buf),
).await;
```

### UdpSocket

```rust
use tokio::net::UdpSocket;

let socket = UdpSocket::bind("0.0.0.0:9090").await?;

let mut buf = vec![0u8; 1500];
loop {
    let (n, addr) = socket.recv_from(&mut buf).await?;
    println!("Received {} bytes from {}", n, addr);

    // echo
    socket.send_to(&buf[..n], addr).await?;
}
```

### 踩坑：tokio TcpStream vs std TcpStream

```rust
// ❌ 在 tokio 运行时中使用 std::net::TcpStream
// std 的 TcpStream 是同步的，.read() 会阻塞整个 tokio 工作线程
// 这是 Rust 异步网络编程最常见的错误之一

// ✓ 始终用 tokio::net::TcpStream
// 如果必须从 std 转换：
let std_stream = std::net::TcpStream::connect("127.0.0.1:8080")?;
let tokio_stream = tokio::net::TcpStream::from_std(std_stream)?;
```

## hyper 底层 HTTP

### Service trait

hyper 的核心抽象是 `Service` trait——一个请求到响应的异步函数：

```rust
use hyper::{Request, Response, body::Incoming};
use hyper::service::Service;
use http_body_util::Full;
use hyper::body::Bytes;

struct HelloWorldService;

impl Service<Request<Incoming>> for HelloWorldService {
    type Response = Response<Full<Bytes>>;
    type Error = std::convert::Infallible;
    type Future = std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + Send>,
    >;

    fn call(&mut self, _req: Request<Incoming>) -> Self::Future {
        let resp = Response::new(Full::new(Bytes::from("Hello, World!")));
        Box::pin(async move { Ok(resp) })
    }
}
```

### hyper 1.x 服务器

```rust
use hyper::{Request, Response, Method, StatusCode};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use http_body_util::Full;
use hyper::body::Bytes;
use tokio::net::TcpListener;

async fn handle(req: Request<hyper::body::Incoming>) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let resp = match (req.method(), req.uri().path()) {
        (&Method::GET, "/") => Response::new(Full::new(Bytes::from("Home"))),
        (&Method::GET, "/health") => Response::new(Full::new(Bytes::from("OK"))),
        _ => {
            let mut r = Response::new(Full::new(Bytes::from("Not Found")));
            *r.status_mut() = StatusCode::NOT_FOUND;
            r
        }
    };
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    loop {
        let (stream, _) = listener.accept().await?;
        tokio::spawn(async move {
            let service = service_fn(handle);
            if let Err(e) = http1::Builder::new().serve_connection(stream, service).await {
                eprintln!("Error serving connection: {}", e);
            }
        });
    }
}
```

### Body 类型体系

hyper 1.x 的 Body 是 `http_body::Body` trait：

```rust
use http_body_util::{Full, StreamBody, Empty, combinators::BoxBody};
use hyper::body::{Bytes, Frame};
use futures_util::stream::{self, StreamExt};

// 空 body
let empty: Empty<Bytes> = Empty::new();

// 完整 body
let full: Full<Bytes> = Full::new(Bytes::from("hello"));

// 流式 body
let stream = stream::iter(vec![
    Ok::<_, std::convert::Infallible>(Frame::data(Bytes::from("chunk1"))),
    Ok(Frame::data(Bytes::from("chunk2"))),
]);
let stream_body = StreamBody::new(stream);

// Boxed body（用于统一返回类型）
fn response(body: impl http_body::Body<Error = std::convert::Infallible> + Send + 'static) -> Response<BoxBody<Bytes, std::convert::Infallible>> {
    Response::new(body.boxed())
}
```

## tower middleware 生态

### Service trait（tower 版本）

tower 的 `Service` trait 与 hyper 的相同——一个请求-响应的异步函数。中间件是 `Service` 的组合：

```rust
use tower::Service;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use tower_http::cors::CorsLayer;
use tower_http::compression::CompressionLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;
use std::time::Duration;

// ServiceBuilder 层叠中间件
let service = ServiceBuilder::new()
    .layer(TraceLayer::new_for_http())                    // 请求追踪日志
    .layer(TimeoutLayer::new(Duration::from_secs(30)))    // 请求超时
    .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024))  // 请求体限制 10MB
    .layer(CompressionLayer::new())                       // 响应压缩
    .layer(CorsLayer::permissive())                       // CORS
    .service(my_handler);
```

### 常用 middleware

```rust
use tower_http::classify::ServerErrorsFailureClass;
use tower_http::request_id::{MakeRequestId, RequestId, SetRequestIdLayer, PropagateRequestIdLayer};
use tower_http::sensitive_headers::SetSensitiveRequestHeadersLayer;
use tower_http::limit::ConcurrencyLimitLayer;
use tower_http::rate_limit::RateLimitLayer;

// 请求 ID
#[derive(Clone)]
struct MyRequestId;
impl MakeRequestId for MyRequestId {
    fn make_request_id<B>(&mut self) -> Option<RequestId> {
        let id = uuid::Uuid::now_v7().to_string();
        Some(RequestId::new(id.parse().unwrap()))
    }
}

let service = ServiceBuilder::new()
    .layer(SetRequestIdLayer::x_request_id(MyRequestId))
    .layer(PropagateRequestIdLayer::x_request_id())
    .layer(ConcurrencyLimitLayer::new(100))         // 最多 100 并发
    .layer(RateLimitLayer::new(100, Duration::from_secs(1)))  // 100 请求/秒
    .layer(TraceLayer::new_for_http())
    .service(my_handler);
```

### 自定义 middleware

```rust
use tower::{Layer, Service};
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct LoggingLayer;

impl<S> Layer<S> for LoggingLayer {
    type Service = LoggingService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        LoggingService { inner }
    }
}

struct LoggingService<S> {
    inner: S,
}

impl<S, Request> Service<Request> for LoggingService<S>
where
    S: Service<Request>,
    S::Error: std::fmt::Display,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<()> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        println!("Request received");
        self.inner.call(req)
    }
}
```

## axum 0.8 实战

### 基本路由

```rust
use axum::{Router, routing::{get, post}, Json};
use serde::{Serialize, Deserialize};

let app = Router::new()
    .route("/", get(root))
    .route("/users", get(list_users).post(create_user))
    .route("/users/:id", get(get_user).delete(delete_user));

async fn root() -> &'static str {
    "Hello, World!"
}
```

### Extractor 系统

axum 的 extractor 从请求中提取数据——函数签名决定提取什么：

```rust
use axum::{
    extract::{Path, Query, State, Json, Extension, OriginalUri, ConnectInfo},
    Form, TypedHeader,
};
use serde::Deserialize;

// Path 参数
async fn get_user(Path(id): Path<u64>) -> Json<User> {
    Json(User { id, name: "Alice".into() })
}

// Query 参数
#[derive(Deserialize)]
struct ListParams {
    page: Option<u32>,
    per_page: Option<u32>,
}

async fn list_users(Query(params): Query<ListParams>) -> Json<Vec<User>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20);
    Json(vec![])
}

// JSON body
#[derive(Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

async fn create_user(Json(body): Json<CreateUser>) -> Json<User> {
    Json(User { id: 1, name: body.name, email: body.email })
}

// Form body
#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

async fn login(Form(form): Form<LoginForm>) -> &'static str {
    "logged in"
}

// 多个 extractor 组合
async fn complex(
    Path(id): Path<u64>,
    Query(params): Query<ListParams>,
    Json(body): Json<UpdateUser>,
) -> Json<User> {
    Json(User { id, name: body.name, email: body.email })
}
```

### State 共享

```rust
use axum::extract::State;
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db: Arc<DbPool>,
    config: Arc<Config>,
}

struct DbPool;
struct Config {
    max_connections: u32,
}

let state = AppState {
    db: Arc::new(DbPool),
    config: Arc::new(Config { max_connections: 100 }),
};

let app = Router::new()
    .route("/users", get(list_users))
    .with_state(state);

async fn list_users(State(state): State<AppState>) -> Json<Vec<User>> {
    // state.db, state.config 都可用
    Json(vec![])
}
```

**多个 State 类型**：

```rust
// axum 0.8 支持多个 State extractor
#[derive(Clone)]
struct DbState(Arc<DbPool>);

#[derive(Clone)]
struct CacheState(Arc<Cache>);

struct Cache;

let db_state = DbState(Arc::new(DbPool));
let cache_state = CacheState(Arc::new(Cache));

let app = Router::new()
    .route("/users", get(list_users))
    .with_state(db_state)
    .with_state(cache_state);

async fn list_users(
    State(db): State<DbState>,
    State(cache): State<CacheState>,
) -> Json<Vec<User>> {
    Json(vec![])
}
```

### Middleware 添加

```rust
use axum::Router;
use tower_http::trace::TraceLayer;
use tower_http::cors::{CorsLayer, Any};
use tower_http::compression::CompressionLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;
use std::time::Duration;

let app = Router::new()
    .route("/", get(root))
    .layer(TraceLayer::new_for_http())
    .layer(CompressionLayer::new())
    .layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    );

// 超时和限流只在特定路由
let api = Router::new()
    .route("/users", get(list_users))
    .layer(TimeoutLayer::new(Duration::from_secs(10)))
    .layer(RequestBodyLimitLayer::new(1024 * 1024));

let app = Router::new()
    .route("/", get(root))
    .nest("/api", api);
```

### 错误处理

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
struct ErrorResponse {
    code: u16,
    message: String,
}

enum AppError {
    NotFound(String),
    BadRequest(String),
    Internal(String),
    Unauthorized,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".into()),
        };

        let body = Json(ErrorResponse {
            code: status.as_u16(),
            message,
        });

        (status, body).into_response()
    }
}

// 在 handler 中使用 Result
async fn get_user(Path(id): Path<u64>) -> Result<Json<User>, AppError> {
    if id == 0 {
        return Err(AppError::BadRequest("id must be positive".into()));
    }
    let user = find_user(id).await.ok_or(AppError::NotFound(format!("User {}", id)))?;
    Ok(Json(user))
}
```

### 路由组织

```rust
use axum::{Router, routing::get, extract::State};

fn app_router(state: AppState) -> Router<AppState> {
    Router::new()
        .nest("/api/v1", api_v1_router())
        .nest("/api/v2", api_v2_router())
        .route("/health", get(health))
        .with_state(state)
}

fn api_v1_router() -> Router<AppState> {
    Router::new()
        .nest("/users", users_router())
        .nest("/posts", posts_router())
}

fn users_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).delete(delete_user))
        .route("/:id/posts", get(get_user_posts))
}

fn posts_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_posts).post(create_post))
        .route("/:id", get(get_post))
}

async fn health() -> &'static str {
    "OK"
}
```

### 请求追踪

```rust
use axum::extract::Request;
use axum::middleware::{self, Next};
use axum::response::Response;
use tracing::info_span;

async fn request_trace(req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();

    let span = info_span!(
        "request",
        method = %method,
        uri = %uri,
    );

    let response = span.in_scope(|| async { next.run(req).await }).await;

    tracing::info!(
        status = %response.status(),
        "response sent"
    );

    response
}

let app = Router::new()
    .route("/", get(root))
    .layer(middleware::from_fn(request_trace));
```

### 踩坑：State 的 Clone 语义

```rust
// axum 的 State 要求 Clone——每次请求 clone 一次
// 如果 State 包含大字段，clone 代价高

// ❌ 大 State 直接 Clone
#[derive(Clone)]
struct BadState {
    big_data: Vec<u8>,  // 每次 clone 复制整个 Vec！
}

// ✓ 用 Arc 共享
#[derive(Clone)]
struct GoodState {
    big_data: Arc<Vec<u8>>,  // clone 只增加引用计数
}

// ✓ 或整个 State 用 Arc
struct AppState {
    db: DbPool,
    cache: Cache,
}

let state = Arc::new(AppState { db, cache });
let app = Router::new()
    .route("/", get(root))
    .with_state(state);
```

### 踩坑：middleware 顺序

```rust
// middleware 是从底到顶应用的（洋葱模型）
// 路由级别的 layer 先于 Router 级别的 layer

let app = Router::new()
    .route("/api", get(api_handler))
        .layer(TimeoutLayer::new(Duration::from_secs(5)))  // 内层
    .layer(TraceLayer::new_for_http())                      // 外层
    .layer(CompressionLayer::new());                        // 最外层

// 请求流：Compression → Trace → Timeout → Handler
// 响应流：Handler → Timeout → Trace → Compression
```

## 与 actix-web 的选型对比

### 对比表

| 维度 | axum | actix-web |
|------|------|-----------|
| 异步运行时 | tokio（生态大） | actix-rt（Actor 模型） |
| 性能 | 极高（techempower 顶尖） | 极高（历史更久） |
| 中间件生态 | tower-http（丰富） | 内置 + actix 中间件 |
| 学习曲线 | 低（函数式） | 中（Actor、Arbiters） |
| 类型安全 | 高（extractor 模式） | 高（extractor 模式） |
| WebSocket | axum::extract::ws | actix-ws |
| 社区 | 增长快（Tokio 团队） | 稳定成熟 |
| 版本稳定性 | axum 0.8 较稳定 | actix-web 4 稳定 |

### 选型建议

**选 axum 的场景**：
- 已用 tokio 运行时
- 需要 tower 生态中间件
- 团队偏好函数式风格
- 需要与 tonic（gRPC）共享运行时

**选 actix-web 的场景**：
- 已有 actix 代码库
- 需要 Actor 模型管理长连接
- 需要 actix 特有的中间件
- 对 Arbiters（多线程调度）有需求

### 性能实测

```
# TechEmpower Framework Benchmarks (2026)
# 单机 Round 22

JSON serialization:
  axum:           ~465,000 req/s
  actix-web:      ~460,000 req/s

Single query:
  axum:           ~290,000 req/s
  actix-web:      ~285,000 req/s

Fortunes:
  axum:           ~180,000 req/s
  actix-web:      ~175,000 req/s
```

两者性能差异在 5% 以内——性能不是选型依据，生态和开发体验才是。

### axum + actix 互操作

```rust
// 通常不建议混用——但如果必须：
// 1. 用 hyper 作为底层，两者都基于 hyper
// 2. 通过反向代理（如 nginx）分发到不同服务
// 3. 用 FFI/消息队列跨运行时通信
```
