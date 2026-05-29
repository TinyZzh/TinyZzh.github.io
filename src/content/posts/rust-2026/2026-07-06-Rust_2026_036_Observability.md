---
title: "Rust 2026 经验谈 - 可观测性三件套"
published: 2026-07-06
description: "tracing 框架深度用法（span/event/subscriber 三层模型）、metrics 集成（metrics crate + Prometheus）、opentelemetry-rust 接入三信号、结构化日志、生产环境可观测性最佳实践。"
image: "/images/rust-2026/8.jpg"
tags: [Rust, Rust 2026, 可观测性, tracing, OpenTelemetry, metrics]
category: Rust
draft: false
lang: zh_CN
---

![生态与架构实战](/images/rust-2026/8.jpg)

可观测性（Observability）是现代后端服务的生命线。Rust 社区在 2024-2026 年间形成了以 `tracing` 为核心、`metrics` 为指标层、`opentelemetry-rust` 为统一出口的可观测性技术栈。本文从 tracing 三层模型、metrics 集成、OpenTelemetry 接入、结构化日志、生产最佳实践五个方面，给出完整实战经验。

## tracing 三层模型深度用法

### Span / Event / Subscriber

`tracing` 的核心是三层模型：

- **Span**：代表一段时间内的操作，有进入和退出。一个 HTTP 请求处理就是一个 span。
- **Event**：代表某一时刻发生的事情，是一条日志记录。
- **Subscriber**：消费 span 和 event，决定如何输出、过滤、采样。

```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json", "fmt"] }
```

```rust
use tracing::{info, warn, error, instrument, span, Level};
use tracing_subscriber::{fmt, EnvFilter};

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    fmt()
        .with_env_filter(filter)
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .init();
}

fn main() {
    init_tracing();

    // Span：手动创建
    let span = span!(Level::INFO, "http_request", method = "GET", path = "/api/users");
    let _enter = span.enter(); // 进入 span

    info!(user_id = 42, "Processing request");
    warn!(latency_ms = 300, "Slow query detected");
    error!(error = %std::io::Error::new(std::io::ErrorKind::BrokenPipe, "connection reset"), "Connection failed");

    // _enter Drop 时自动退出 span
}
```

### Span 的进入与退出

span 的生命周期管理是初学者最容易搞混的地方：

```rust
use tracing::{span, info, Level};

fn span_lifecycle() {
    let outer = span!(Level::INFO, "outer");
    let inner = span!(Level::INFO, "inner");

    // 方式 1：enter() 返回 Entered 守卫，Drop 时退出
    {
        let _guard = outer.enter();
        info!("inside outer");
        // 可以嵌套
        {
            let _inner_guard = inner.enter();
            info!("inside both outer and inner");
        }
        info!("back to only outer");
    }
    info!("outside both");

    // 方式 2：in_scope 闭包，更安全
    outer.in_scope(|| {
        info!("inside outer via in_scope");
    });

    // 方式 3：entered() 消费 span，返回 EnteredSpan
    let span = span!(Level::INFO, "owned", id = 1).entered();
    info!("automatically inside owned span");
    drop(span); // 显式退出
}
```

**踩坑**：`enter()` 返回的守卫不能跨 `.await` 点——这是一个常见的编译错误：

```rust
use tracing::{span, info, Level};

// ❌ 守卫跨越 .await——编译失败
async fn bad_span() {
    let span = span!(Level::INFO, "async_op");
    let _enter = span.enter(); // Enter 不是 Send，不能跨 await
    some_async_work().await;   // 编译错误！
}

// ✓ 方式 1：instrument 属性宏（推荐）
#[tracing::instrument(skip_all)]
async fn good_span_via_instrument() {
    info!("before await");
    some_async_work().await;
    info!("after await");
}

// ✓ 方式 2：手动在每处设置 current span
async fn good_span_manual() {
    let span = tracing::span!(Level::INFO, "async_op");
    let _enter = span.enter();
    info!("before await");
    drop(_enter); // 退出 span

    some_async_work().await;

    let _enter = span.enter(); // 重新进入
    info!("after await");
}
```

### instrument 属性宏

`#[instrument]` 是最优雅的方式，自动为函数创建 span：

```rust
use tracing::{info, instrument, Level};

// 基本用法：自动用函数名作 span 名，参数作字段
#[instrument]
fn process_order(order_id: u64, item: &str) {
    info!("Processing started");
    // span: process_order, order_id=123, item="widget"
}

// 跳过某些参数（避免记录敏感数据或过大的值）
#[instrument(skip(db, password))]
async fn login(db: &Database, username: &str, password: &str) -> Result<Token, Error> {
    // span: login, username="alice"  （password 被跳过）
    info!("Attempting login");
    // ...
}

// 自定义 span 名和级别
#[instrument(name = "http_handler", level = Level::DEBUG, skip(request), fields(path = %request.path()))]
async fn handle_request(request: Request) -> Response {
    // span: http_handler, path="/api/users"
    info!("Handling request");
    // ...
}

// 追加额外字段
#[instrument(fields(correlation_id = %uuid::Uuid::new_v4()))]
async fn create_user(name: String) -> Result<User, Error> {
    info!("Creating user");
    // span: create_user, name="Bob", correlation_id="550e8400-..."
}
```

**instrument 与 async**：`#[instrument]` 天然支持 async 函数——它会在每个 `.await` 点正确地进出 span，而不会跨越 `.await` 持有守卫。这是推荐在异步代码中使用 tracing 的首选方式。

### Subscriber 层：过滤与格式化

```rust
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

fn init_production_tracing() {
    // 多层 subscriber：fmt 输出 + json 输出
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // 仅控制台（开发）
    #[cfg(debug_assertions)]
    {
        fmt()
            .with_env_filter(filter)
            .with_target(true)
            .with_thread_ids(true)
            .pretty() // 彩色美化输出
            .init();
    }

    // JSON 格式（生产）
    #[cfg(not(debug_assertions))]
    {
        fmt()
            .with_env_filter(filter)
            .json() // 结构化 JSON
            .with_target(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true)
            .init();
    }
}
```

### 踩坑：subscriber 只能设置一次

```rust
// ❌ 多次调用 init() 会 panic
fn bad() {
    tracing_subscriber::fmt().init();
    tracing_subscriber::fmt().init(); // panic: subscriber already set
}

// ✓ 使用 try_init() 或检查返回值
fn good() {
    let _ = tracing_subscriber::fmt().try_init(); // 忽略重复设置
}

// ✓ 测试中用 set_default 的作用域守卫
fn test_with_tracing() {
    let guard = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .set_default();
    // 测试代码...
    drop(guard); // 恢复
}
```

## metrics 集成

### metrics crate 基本用法

`metrics` crate 提供与 `tracing` 类似的宏接口，但专注于指标采集：

```toml
[dependencies]
metrics = "0.24"
metrics-exporter-prometheus = "0.16"
```

```rust
use metrics::{counter, gauge, histogram, describe_counter, describe_gauge, describe_histogram};

fn describe_metrics() {
    describe_counter!("http_requests_total", "Total HTTP requests");
    describe_gauge!("http_connections_active", "Active connections");
    describe_histogram!("http_request_duration_seconds", "Request duration in seconds");
}

fn handle_request() {
    counter!("http_requests_total", "method" => "GET", "path" => "/api/users").increment(1);

    gauge!("http_connections_active").increment(1.0);

    let start = std::time::Instant::now();
    // ... 处理请求 ...
    let elapsed = start.elapsed().as_secs_f64();

    histogram!("http_request_duration_seconds", "method" => "GET").record(elapsed);

    gauge!("http_connections_active").decrement(1.0);
}
```

### Prometheus 导出

```rust
use metrics_exporter_prometheus::PrometheusBuilder;
use std::net::SocketAddr;

async fn start_metrics_server() -> Result<(), Box<dyn std::error::Error>> {
    // 推荐方式：with_http_listener 自动启动 HTTP 端点
    PrometheusBuilder::new()
        .with_http_listener("0.0.0.0:9090".parse()?)
        .install()?;

    // 安装 recorder（必须在任何 metrics 宏调用之前）
    // install() 内部完成 recorder 安装 + HTTP 端点启动
    Ok(())
}
```

更简洁的启动方式：

```rust
use metrics_exporter_prometheus::PrometheusBuilder;

async fn setup_metrics() -> Result<(), Box<dyn std::error::Error>> {
    PrometheusBuilder::new()
        .with_http_listener("0.0.0.0:9090".parse()?)
        .install()?;

    describe_counter!("http_requests_total", "Total HTTP requests");
    Ok(())
}
```

### tracing 与 metrics 联动

`metrics-tracing-intermediary` 可以从 span 的字段中自动提取指标：

```toml
[dependencies]
metrics-tracing-intermediary = "0.3"
```

```rust
use metrics_tracing_intermediary::MetricsIntermediary;
use tracing_subscriber::layer::SubscriberExt;

fn init_with_metrics() {
    let intermediary = MetricsIntermediary::new();

    tracing_subscriber::fmt()
        .finish()
        .with(intermediary)
        .init();
}
```

更常见的手动联动模式——在中间件中同时打日志和记指标：

```rust
use axum::{middleware, extract::Request, response::Response};
use tracing::info;
use metrics::histogram;

async fn metrics_and_tracing_middleware(
    req: Request,
    next: axum::middleware::Next,
) -> Response {
    let method = req.method().clone();
    let path = req.uri().path().to_owned();
    let start = std::time::Instant::now();

    info!(method = %method, path = %path, "Request started");

    let response = next.run(req).await;

    let elapsed = start.elapsed();
    let status = response.status().as_u16();

    info!(
        method = %method, path = %path, status = status,
        elapsed_ms = elapsed.as_millis() as u64,
        "Request completed"
    );

    histogram!(
        "http_request_duration_seconds",
        "method" => method.as_str(),
        "path" => path.as_str(),
        "status" => status.to_string()
    ).record(elapsed.as_secs_f64());

    response
}
```

## OpenTelemetry 接入

### 三信号：Trace + Metrics + Logs

OpenTelemetry 定义了三大信号。`opentelemetry-rust` 在 2024-2025 年间完成了三大信号的稳定 API：

```toml
[dependencies]
opentelemetry = "0.27"
opentelemetry_sdk = { version = "0.27", features = ["rt-tokio"] }
opentelemetry-otlp = { version = "0.27", features = ["trace", "metrics", "logs", "grpc-tonic"] }
opentelemetry-semantic-conventions = "0.27"
tracing-opentelemetry = "0.28"
```

### Trace 接入

```rust
use opentelemetry_otlp::WithExportConfig;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracer() -> opentelemetry_sdk::trace::Tracer {
    // OTLP pipeline 直接返回 Tracer，无需手动构建 TracerProvider
    opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint("http://localhost:4317")
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .unwrap()
}

fn init_otel_tracing() {
    let tracer = init_tracer();
    let otel_layer = tracing_opentelemetry::layer().with_tracer(tracer);

    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .finish()
        .with(otel_layer)
        .init();
}
```

### Metrics 接入

```rust
use opentelemetry::metrics::MeterProvider;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::metrics::SdkMeterProvider;

fn init_otel_metrics() -> SdkMeterProvider {
    let exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint("http://localhost:4317");

    let meter_provider = opentelemetry_otlp::new_pipeline()
        .metrics()
        .with_exporter(exporter)
        .with_period(std::time::Duration::from_secs(30))
        .build();

    meter_provider
}

// 使用
fn record_metrics(meter_provider: &SdkMeterProvider) {
    let meter = meter_provider.meter("my-service");
    let counter = meter.u64_counter("http_requests_total").build();
    counter.add(1, &[opentelemetry::KeyValue::new("method", "GET")]);

    let histogram = meter.f64_histogram("http_request_duration_seconds").build();
    histogram.record(0.05, &[]);
}
```

### Logs 接入

```rust
use opentelemetry::logs::LoggerProvider;
use opentelemetry_otlp::WithExportConfig;

fn init_otel_logs() {
    let exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint("http://localhost:4317");

    let logger_provider = opentelemetry_otlp::new_pipeline()
        .logging()
        .with_exporter(exporter)
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .unwrap();

    let otel_log_layer = tracing_opentelemetry::OpenTelemetryLogsLayer::new(logger_provider);

    tracing_subscriber::fmt()
        .finish()
        .with(otel_log_layer)
        .init();
}
```

### 三信号统一初始化

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_observability() -> Result<(), Box<dyn std::error::Error>> {
    let tracer = init_tracer();
    let meter_provider = init_otel_metrics();

    let otel_trace_layer = tracing_opentelemetry::layer().with_tracer(tracer);
    let otel_log_layer = init_otel_log_layer();

    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env());

    tracing_subscriber::registry()
        .with(fmt_layer)
        .with(otel_trace_layer)
        .with(otel_log_layer)
        .init();

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    init_observability()?;

    // 从这里开始，所有 tracing 宏同时输出到：
    // 1. 控制台（fmt layer）
    // 2. OTLP collector（trace layer）
    // 3. OTLP collector（log layer）

    Ok(())
}
```

### 踩坑：graceful shutdown 必须 flush

```rust
use opentelemetry::trace::TracerProvider;
use opentelemetry::metrics::MeterProvider;
use opentelemetry::logs::LoggerProvider;

async fn graceful_shutdown(
    tracer_provider: opentelemetry_sdk::trace::TracerProvider,
    meter_provider: opentelemetry_sdk::metrics::SdkMeterProvider,
    logger_provider: opentelemetry_sdk::logs::LoggerProvider,
) {
    // 必须在退出前 flush，否则最后一批数据丢失！
    let _ = tracer_provider.shutdown();
    let _ = meter_provider.shutdown();
    let _ = logger_provider.shutdown();
}
```

## 结构化日志

### tracing-subscriber 的 fmt 与 json 输出

```rust
use tracing_subscriber::fmt;

// 开发：彩色人类可读
fn dev_format() {
    fmt()
        .pretty()
        .with_target(true)
        .with_thread_ids(true)
        .init();
}

// 生产：JSON 结构化
fn prod_format() {
    fmt()
        .json()
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .with_current_span(true)
        .with_span_list(true)
        .init();
}
```

JSON 输出示例：

```json
{
  "timestamp": "2026-07-06T10:30:45.123Z",
  "level": "INFO",
  "target": "my_app::handlers",
  "span": {"name": "http_request", "method": "GET", "path": "/api/users"},
  "fields": {"user_id": 42, "message": "Processing request"},
  "threadId": 1,
  "filename": "src/handlers.rs",
  "line_number": 42
}
```

### 自定义 JSON 字段

```rust
use tracing_subscriber::fmt::format::FmtContext;
use tracing_subscriber::fmt::FormatEvent;
use tracing_subscriber::registry::LookupSpan;
use serde_json::json;

// 如果需要自定义字段（如添加 hostname、service version），
// 最简单的方式是创建一个 wrapper layer
fn init_with_extra_fields() {
    let hostname = hostname::get().unwrap_or_default().to_string_lossy().into_owned();
    let version = env!("CARGO_PKG_VERSION").to_string();

    fmt()
        .json()
        .with_target(true)
        .init();

    // 在第一条日志中记录这些信息
    tracing::info!(
        hostname = %hostname,
        version = %version,
        "Service started"
    );
}
```

### 踩坑：日志中的大字段

```rust
use tracing::info;

// ❌ 记录整个请求体——日志膨胀
#[instrument(skip(request))]
async fn handle(request: Request) {
    let body = request.body().text().await?;
    info!(body = %body, "Received request"); // body 可能几十 MB
}

// ✓ 截断大字段
#[instrument(skip(request))]
async fn handle(request: Request) {
    let body = request.body().text().await?;
    let body_preview = &body[..body.len().min(1024)];
    info!(
        body_len = body.len(),
        body_preview = body_preview,
        "Received request"
    );
}
```

## 生产环境可观测性最佳实践

### 1. 采样策略

生产环境中不是所有 span 都要导出。高频低价值 span 应该采样：

```rust
use opentelemetry::trace::SamplingDecision;
use opentelemetry_sdk::trace::ShouldSample;

// 自定义采样器：错误必采，其余 10%
struct ProductionSampler;

impl ShouldSample for ProductionSampler {
    fn should_sample(
        &self,
        parent_context: Option<&opentelemetry::Context>,
        trace_id: opentelemetry::trace::TraceId,
        name: &str,
        span_kind: &opentelemetry::trace::SpanKind,
        attributes: &[opentelemetry::KeyValue],
        links: &[opentelemetry::trace::Link],
    ) -> opentelemetry::trace::SamplingResult {
        // 错误 span 必采
        if name.contains("error") {
            return opentelemetry::trace::SamplingResult::new(
                SamplingDecision::RecordAndSample,
                Vec::new(),
                opentelemetry::trace::TraceState::default(),
            );
        }

        // 10% 采样
        if rand::random::<f64>() < 0.1 {
            return opentelemetry::trace::SamplingResult::new(
                SamplingDecision::RecordAndSample,
                Vec::new(),
                opentelemetry::trace::TraceState::default(),
            );
        }

        opentelemetry::trace::SamplingResult::new(
            SamplingDecision::Drop,
            Vec::new(),
            opentelemetry::trace::TraceState::default(),
        )
    }
}
```

### 2. 资源属性

```rust
use opentelemetry::KeyValue;
use opentelemetry_sdk::Resource;

let resource = Resource::builder()
    .with_service_name("my-service")
    .with_attributes([
        KeyValue::new("service.version", env!("CARGO_PKG_VERSION")),
        KeyValue::new("deployment.environment", "production"),
        KeyValue::new("host.name", hostname::get().unwrap_or_default().to_string_lossy().into_owned()),
    ])
    .build();
```

### 3. 错误追踪模式

```rust
use tracing::{error, instrument, warn};
use thiserror::Error;

#[derive(Error, Debug)]
enum ServiceError {
    #[error("Database connection failed: {0}")]
    Database(#[source] sqlx::Error),
    #[error("External API error: {0}")]
    ExternalApi(#[source] reqwest::Error),
    #[error("Validation failed: {0}")]
    Validation(String),
}

// ✓ 用 instrument + error! 记录错误链
#[instrument(skip(pool))]
async fn create_user(pool: &PgPool, name: &str) -> Result<User, ServiceError> {
    if name.is_empty() {
        warn!(name = name, "Validation failed");
        return Err(ServiceError::Validation("name is empty".into()));
    }

    sqlx::query_as!(User, "INSERT INTO users (name) VALUES ($1) RETURNING *", name)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!(error = %e, "Database error during user creation");
            ServiceError::Database(e)
        })
}
```

### 4. 健康检查与就绪检查

```rust
use axum::{Json, extract::State};
use serde::Serialize;

#[derive(Serialize)]
struct HealthStatus {
    status: String,
    version: String,
    uptime_seconds: u64,
}

async fn health_check(State(state): State<AppState>) -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "ok".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        uptime_seconds: state.start_time.elapsed().as_secs(),
    })
}

async fn readiness_check(State(state): State<AppState>) -> Result<Json<HealthStatus>, StatusCode> {
    // 检查数据库连接
    if sqlx::query("SELECT 1").execute(&state.pool).await.is_err() {
        tracing::error!("Readiness check failed: database unreachable");
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }

    Ok(Json(HealthStatus {
        status: "ready".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        uptime_seconds: state.start_time.elapsed().as_secs(),
    }))
}
```

### 5. 完整生产初始化模板

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

fn init_production_observability() -> Result<ShutdownHandlers, Box<dyn std::error::Error>> {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // OTLP trace
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
                    .unwrap_or_else(|_| "http://localhost:4317".into()))
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    let otel_trace_layer = tracing_opentelemetry::layer().with_tracer(tracer);

    // Console + OTLP
    tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_subscriber::fmt::layer().json())
        .with(otel_trace_layer)
        .init();

    // Prometheus metrics
    metrics_exporter_prometheus::PrometheusBuilder::new()
        .with_http_listener("0.0.0.0:9090".parse()?)
        .install()?;

    Ok(ShutdownHandlers { /* tracer_provider, meter_provider, logger_provider */ })
}
```

### 6. 常见陷阱总结

| 陷阱 | 后果 | 解决方案 |
|------|------|----------|
| subscriber 重复 init | panic | `try_init()` 或 `set_default()` |
| span enter 跨 .await | 编译错误 | `#[instrument]` 或手动进出 |
| OTLP 未 flush | 丢失最后一批数据 | shutdown handler 中 flush |
| 日志记录大字段 | 日志膨胀、IO 瓶颈 | 截断或跳过 |
| 采样率过高 | Collector 压力大 | 错误必采 + 业务采样 |
| metrics recorder 未安装 | 宏静默无操作 | 安装 exporter 后再调用宏 |
| 缺少 resource 属性 | 无法区分服务实例 | 设置 service.name + version |
