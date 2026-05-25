---
title: Rust语言从入门到精通系列 - 轻量级Http客户端Hyper
published: 2023-04-23
description: ""
image: ""
tags: [Rust, 从入门到精通, Plotters]

category: Rust
draft: false
lang: zh_CN
---

![](/images/2023-03/rust_tutorial_logo.png)

Hyper 是一个用于构建 HTTP 客户端和服务器的 Rust 语言库。它提供了一个简单易用的 API，使得开发者可以轻松地构建高性能、可靠的 HTTP 应用程序。Hyper 的设计目标是安全、高效和易于使用。

Hyper 的主要特点包括：

- 支持 HTTP/1 和 HTTP/2 协议
- 纯 Rust 实现，无需外部依赖
- 支持异步 I/O 和多线程
- 提供简单易用的 API

在本教程中，我们将介绍 Hyper 的基础用法和进阶用法，并提供一些最佳实践。

> 相比于系列文章中介绍的 reqwest, Hyper 设计的更底层，模块化的设计，可以最大限度的允许用户在硬件配置较低的嵌入式设备上使用。
> 假如只是需要一个“好用”的 Http 客户端，推荐使用 reqwest 模块

## 基础用法

### 发送 HTTP 请求

使用 Hyper 发送 HTTP 请求非常简单。下面是一个简单的示例，它使用 Hyper 发送一个 GET 请求并打印响应的内容：

> **注意**: 以下示例已更新为 `reqwest`（推荐用于 HTTP 客户端场景）。Hyper 0.10.x 同步 API 已废弃，Hyper 1.x 仅支持异步且 API 完全不同。如需底层 HTTP 控制，请参考 [Hyper 1.x 文档](https://docs.rs/hyper/latest/hyper/)。

```rust
use reqwest::blocking::Client;

fn main() {
    let client = Client::new();
    let res = client.get("http://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest::blocking::Client` 创建了一个 HTTP 客户端，发送 GET 请求并打印响应的状态码、头和内容。Hyper 0.10.x 的同步 API（`Client::new()`, `client.get().send()`）已不再可用。

### 发送 POST 请求

Hyper 还支持发送 POST 请求。下面是一个简单的示例，它使用 Hyper 发送一个 POST 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;

fn main() {
    let client = Client::new();
    let res = client.post("http://example.com")
        .body("hello world")
        .send()
        .unwrap();
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 发送 POST 请求。Hyper 0.10.x 的 `Request::post().body()` 同步模式已废弃。

### 使用代理服务器

Hyper 还支持使用代理服务器发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个通过代理服务器的 HTTP 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;

fn main() {
    let client = Client::builder()
        .proxy(reqwest::Proxy::http("http://proxy.example.com").unwrap())
        .build()
        .unwrap();
    let res = client.get("http://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 设置代理服务器。Hyper 0.10.x 的 `Client::builder().proxy()` 同步模式已废弃。

### 使用自定义头

Hyper 还支持使用自定义头发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有自定义头的 HTTP 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;
use reqwest::header::{USER_AGENT, HeaderValue};

fn main() {
    let client = Client::new();
    let res = client.get("http://example.com")
        .header(USER_AGENT, HeaderValue::from_static("my-user-agent"))
        .send()
        .unwrap();
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 设置自定义请求头。Hyper 0.10.x 的同步请求构建模式已废弃。

### 使用异步 I/O

Hyper 支持异步 I/O，这使得它可以处理大量的并发请求。下面是一个简单的示例，它使用 Hyper 异步发送 HTTP 请求并打印响应的内容：

```rust
use reqwest::Client;

#[tokio::main]
async fn main() {
    let client = Client::new();
    let res = client.get("http://example.com").send().await.unwrap();
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text().await.unwrap());
}
```

在这个示例中，我们使用 `reqwest` 异步客户端。Hyper 1.x 异步客户端示例（需 `hyper_util` + `http_body_util`）：

```rust
use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use http_body_util::BodyExt;
use hyper::Request;

#[tokio::main]
async fn main() {
    let client: Client<_, String> = Client::builder(TokioExecutor::new()).build_http();
    let req = Request::builder()
        .uri("http://example.com")
        .body(String::new())
        .unwrap();
    let res = client.request(req).await.unwrap();
    println!("{}", res.status());
    let body = res.into_body().collect().await.unwrap().to_bytes();
    println!("{}", String::from_utf8_lossy(&body));
}
```

Hyper 0.10.x 的 `client.get(uri).await` 模式已废弃，Hyper 1.x 需通过 `hyper_util::client::legacy::Client` 构建请求。

### 使用 Cookies

Hyper 还支持使用 Cookies 发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有 Cookies 的 HTTP 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;
use reqwest::header::{COOKIE, SET_COOKIE};

fn main() {
    let client = Client::new();
    let res = client.get("http://example.com")
        .header(COOKIE, "name=value")
        .send()
        .unwrap();
    println!("{}", res.status());
    if let Some(cookie) = res.headers().get(SET_COOKIE) {
        println!("{}", cookie.to_str().unwrap());
    }
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 通过 Header 方式发送 Cookie。Hyper 0.10.x 的同步 Cookie 模式已废弃。

### 处理错误

Hyper 的 API 返回的结果类型是`Result`，因此我们可以使用标准的 Rust 错误处理机制来处理错误。下面是一个简单的示例，它使用 Hyper 发送一个 HTTP 请求并处理错误：

```rust
use reqwest::blocking::Client;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let res = client.get("http://example.com").send()?;
    println!("{}", res.status());
    println!("{:?}", res.headers());
    println!("{}", res.text()?);
    Ok(())
}
```

在这个示例中，我们使用 `reqwest` 并通过 `?` 操作符处理错误。Hyper 0.10.x 的同步 `client.get(uri)?.send()?` 模式已废弃。

## 进阶用法

### 使用连接池

Hyper 支持使用连接池来提高 HTTP 请求的性能。下面是一个简单的示例，它使用 Hyper 连接池发送 HTTP 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;
use std::time::Duration;

fn main() {
    let client = Client::builder()
        .pool_idle_timeout(Duration::from_secs(30))
        .build()
        .unwrap();
    let res = client.get("https://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 连接池配置。Hyper 0.10.x 的 `HttpConnector`/`HttpsConnector`/`rt::run`/`concat2` 模式已全部废弃，Hyper 1.x 需通过 `hyper_util` 管理。

### 使用 WebSocket

Hyper 还支持使用 WebSocket 协议。下面是一个简单的示例，它使用 Hyper 创建一个 WebSocket 连接并发送消息：

> **注意**: Hyper 本身不提供 WebSocket 客户端 API。以下示例使用 `tokio-tungstenite` 直接连接 WebSocket。

```rust
use tokio_tungstenite::tungstenite::Message;
use futures_util::StreamExt;
use tokio_tungstenite::connect_async;

#[tokio::main]
async fn main() {
    let (ws_stream, _) = connect_async("ws://example.com").await.unwrap();
    let (mut write, mut read) = ws_stream.split();
    write.send(Message::Text("hello world".into())).await.unwrap();
    while let Some(msg) = read.next().await {
        let msg = msg.unwrap();
        println!("{}", msg.to_text().unwrap());
    }
}
```

在这个示例中，我们使用 `tokio-tungstenite` 创建 WebSocket 连接。Hyper 0.10.x 的 `client.websocket(uri)` 方法不存在，WebSocket 需使用专用库如 `tokio-tungstenite`。

### 处理连接超时

Hyper 支持设置连接和请求的超时时间。下面是一个简单的示例，它使用 Hyper 发送一个 HTTP 请求，并设置连接和请求的超时时间：

```rust
use reqwest::blocking::Client;
use std::time::Duration;

fn main() {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .pool_idle_timeout(Duration::from_secs(30))
        .build()
        .unwrap();
    let res = client.get("http://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用 `reqwest` 设置请求超时和连接池超时。Hyper 0.10.x 的 `keep_alive_timeout()`/`timeout().send().map()`/`tokio::run()` 模式已废弃。

### 使用自定义 TLS 配置

Hyper 支持使用自定义的 TLS 配置来发送 HTTPS 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有自定义 TLS 配置的 HTTPS 请求并打印响应的内容：

```rust
use reqwest::blocking::Client;
use std::error::Error;
use std::path::Path;

fn main() -> Result<(), Box<dyn Error>> {
    let client = Client::builder()
        .add_root_certificate(reqwest::Certificate::from_pem(
            &std::fs::read(Path::new("cert.pem"))?,
        )?)
        .build()?;
    let res = client.get("https://example.com").send()?;
    println!("{}", res.status());
    println!("{}", res.text()?);
    Ok(())
}
```

在这个示例中，我们使用 `reqwest` 加载自定义 TLS 证书。Hyper 0.10.x 的 `hyper_tls::HttpsConnector::with_connector()` 模式已废弃，现代 Rust 推荐使用 `reqwest` 的 `add_root_certificate()` 或 `hyper-rustls`。

## 最佳实践

- 使用连接池提高性能

Hyper 提供了连接池的功能，可以有效地提高 HTTP 请求的性能。在实际开发中，我们应该尽可能地使用连接池来发送 HTTP 请求，以提高性能和减少资源消耗。

- 使用异步 I/O 提高并发性能

Hyper 使用异步 I/O 实现了高性能的 HTTP 客户端和服务器端，我们应该尽可能地使用异步 I/O 来提高并发性能。

- 使用 HTTPS 保证安全性

在发送 HTTP 请求时，我们应该尽可能地使用 HTTPS 来保证通信的安全性。Hyper 提供了对 HTTPS 的支持，可以轻松地实现 HTTPS 通信。

- 使用请求/响应拦截器进行处理

Hyper 提供了请求/响应拦截器的功能，可以对 HTTP 请求和响应进行处理。在实际开发中，我们应该尽可能地使用请求/响应拦截器来实现一些通用的处理逻辑，例如日志记录、错误处理等。

## 总结

Hyper 是 Rust 语言中一个非常流行的 HTTP 客户端和服务器端开发库，它提供了一套简单易用的 API，可以轻松地构建高性能的 Web 应用程序。在本教程中，我们介绍了 Hyper 的基础用法和进阶用法，并提供了一些最佳实践和示例代码。希望这个教程能够帮助你更好地了解 Hyper，并在实际开发中使用它。
