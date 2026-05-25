---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Tonic RPC框架入门实战
date: 2023-05-09 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Tonic]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言是一种系统级语言，被誉为“没有丧失性能的安全语言”。Rust语言的优势在于其内存安全机制，在编译时就能保证程序的内存安全。

Tonic模块是Rust语言的一个RPC（Remote Procedure Call，远程过程调用）框架，它在性能、可靠性、框架友好程度以及可扩展性等方面表现卓越。

> 本系列 Tonic 篇将由浅入深的从基础到实战，以一个完整的 Rust 语言子系列讲解tonic模块。

## 基础用法

### 添加Tonic依赖

在Rust项目的Cargo.toml文件中，加入以下依赖项：

```toml
[dependencies]
tonic = "0.9.2"
```

### 定义服务

在Tonic中，我们需要定义一个服务（service），服务包含了多个方法（method）。下面是一个示例：

```rust
use tonic::{Request, Response, Status};

// 定义一个服务
pub struct MyService {}

// 为服务实现方法
#[tonic::async_trait]
impl MyService {
    async fn my_method(&self, request: Request<MyRequest>) -> Result<Response<MyResponse>, Status> {
        // 做一些操作
        // 返回结果
    }
}
```

### 启动服务

我们使用tokio库来运行Tonic服务，示例代码如下：

```rust
use tokio::net::TcpListener;
use tonic::transport::Server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::]:50051".parse()?;
    let listener = TcpListener::bind(addr).await?;
    let my_service = MyService {};

    println!("Server listening on {}", addr);

    Server::builder()
        .add_service(MyServiceServer::new(my_service))
        .serve_with_incoming(listener)
        .await?;

    Ok(())
}
```

这个服务绑定在本地的50051端口上，并等待连接。

### 定义请求和响应结构体

在Tonic中，我们需要定义请求和响应的结构体，示例代码如下：

```rust
#[derive(Debug)]
pub struct MyRequest {
    pub name: String,
}

#[derive(Debug)]
pub struct MyResponse {
    pub message: String,
}
```

### 实现方法

我们在服务中，实现一些具体的方法。示例代码如下：

```rust
#[tonic::async_trait]
impl MyService {
    async fn my_method(&self, request: Request<MyRequest>) -> Result<Response<MyResponse>, Status> {
        let req = request.into_inner();

        println!("Request received: {:?}", req);
        
        // 构造响应
        let resp = MyResponse {
            message: format!("Hello, {}!", req.name),
        };

        Ok(Response::new(resp))
    }
}
```

### 调用服务

我们可以使用Tonic提供的客户端来调用服务。示例代码如下：

```rust
// 初始化客户端
let mut my_service_client = MyServiceClient::connect("http://[::1]:50051").await?;

// 构造请求
let request = Request::new(MyRequest {
    name: "world".into(),
});

// 发送请求
let response = my_service_client.my_method(request).await?;

println!("Response received: {:?}", response);
```

### 处理错误

在Rust中，我们使用`Result`来处理错误。例如：

```rust
#[tonic::async_trait]
impl MyService {
    async fn my_method(&self, request: Request<MyRequest>) -> Result<Response<MyResponse>, Status> {
        let req = request.into_inner();

        if req.name == "" {
            return Err(Status::invalid_argument("name cannot be empty"));
        }

        // 构造响应
        let resp = MyResponse {
            message: format!("Hello, {}!", req.name),
        };

        Ok(Response::new(resp))
    }
}
```

这个例子说明，如果请求的`name`字段是空字符串，将返回`Status::invalid_argument`错误。

### 使用连接池

Tonic提供了连接池的支持，通过这个机制，可以让我们复用连接，从而减少连接的创建和销毁。示例代码如下：

```rust
use tonic::transport::{Endpoint, Channel, security::ServerTlsOption, client::tls::rustls::RootCertStore};

// 初始化连接池
let channel = Endpoint::from_static("http://[::1]:50051")
    .connect_lazy()
    .unwrap();

// 使用连接池
let mut my_service_client = MyServiceClient::new(channel);
```

### 自定义认证

Tonic提供了自定义认证机制，例如，我们可以在服务端自定义一段中间件，来进行认证。示例代码如下：

```rust
use tonic::{Interceptor, Request, Response, Status};

struct AuthMiddleware {}

#[tonic::async_trait]
impl<O: Send + 'static> Interceptor<O> for AuthMiddleware {
    async fn call(&mut self, req: Request<O>, next: tonic::interceptor::Next<'_, O>) -> Result<Response<O>, Status> {
        // 检查用户是否已登录
        if !is_user_logged_in() {
            return Err(Status::unauthenticated("user is not logged in"));
        }

        next.run(req).await
    }
}
```

这个例子说明，我们可以利用`Interceptor`机制，在请求处理前，统一进行认证。

### 支持SSL连接

Tonic提供了SSL连接的支持，而且通过TLS选项配置加密和认证选项。示例代码如下：

```rust
use tonic::{transport::Channel, client::tls::rustls::RootCertStore, transport::{Endpoint, Server}};
use tonic::transport::server::TlsConfig;

// 初始化SSL连接
let root_ca = RootCertStore::from_path("ca.pem").unwrap();
let tls = ClientTlsConfig::new().root_ca_cert(root_ca).identity(...);
let channel = Endpoint::from_static("https://[::1]:50051")
            .tls_config(TlsConfig::new().client_tls_config(tls))
            .connect()
            .await?;

// 使用SSL连接访问
let mut my_service_client = MyServiceClient::new(channel);
```

这个例子说明，我们通过传递确切的TLS选项，在客户端连接时使用SSL。

## 总结

在本教程中，我们学习了如何使用Rust语言的Tonic模块创建一个简单的gRPC服务，并深入了解了一些高级功能。我们了解了如何支持TLS加密通信，如何支持自定义的拦截器，如何支持流式传输，以及如何支持异步/非阻塞I/O。我们还提供了一些最佳实践，以帮助您编写高质量的代码。
