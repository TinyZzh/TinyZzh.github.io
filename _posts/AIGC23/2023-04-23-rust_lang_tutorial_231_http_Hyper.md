---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 轻量级Http客户端Hyper
date: 2023-04-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Plotters]
toc: yes
image_scaling: true
mermaid: true
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

```rust
use hyper::Client;

fn main() {
    let client = Client::new();
    let res = client.get("http://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`get()`方法发送一个 GET 请求，并使用`send()`方法发送请求。最后，我们打印响应的状态码、头和内容。

### 发送 POST 请求

Hyper 还支持发送 POST 请求。下面是一个简单的示例，它使用 Hyper 发送一个 POST 请求并打印响应的内容：

```rust
use hyper::{Client, Request, Body};

fn main() {
    let client = Client::new();
    let req = Request::post("http://example.com")
        .body(Body::from("hello world"))
        .unwrap();
    let res = client.request(req).unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`Request::post()`方法创建一个 POST 请求，并使用`Body::from()`方法设置请求体。最后，我们使用`request()`方法发送请求，并打印响应的状态码、头和内容。

### 使用代理服务器

Hyper 还支持使用代理服务器发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个通过代理服务器的 HTTP 请求并打印响应的内容：

```rust
use hyper::{Client, Uri};

fn main() {
    let client = Client::builder()
        .proxy(Uri::from_static("http://proxy.example.com"))
        .build()
        .unwrap();
    let res = client.get("http://example.com").send().unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们使用`Client::builder()`方法创建一个 Hyper 客户端，并使用`proxy()`方法设置代理服务器的地址。然后，我们使用`get()`方法发送一个 GET 请求，并使用`send()`方法发送请求。最后，我们打印响应的状态码、头和内容。

### 使用自定义头

Hyper 还支持使用自定义头发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有自定义头的 HTTP 请求并打印响应的内容：

```rust
use hyper::{Client, header};

fn main() {
    let client = Client::new();
    let mut req = client.get("http://example.com").unwrap();
    req.headers_mut().insert(header::USER_AGENT, header::HeaderValue::from_static("my-user-agent"));
    let res = client.execute(req).unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`get()`方法创建一个 GET 请求，并使用`headers_mut()`方法插入一个自定义头。最后，我们使用`execute()`方法发送请求，并打印响应的状态码、头和内容。

### 使用异步 I/O

Hyper 支持异步 I/O，这使得它可以处理大量的并发请求。下面是一个简单的示例，它使用 Hyper 异步发送 HTTP 请求并打印响应的内容：

```rust
use hyper::{Client, Uri};

#[tokio::main]
async fn main() {
    let client = Client::new();
    let uri = Uri::from_static("http://example.com");
    let res = client.get(uri).await.unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    let body = res.into_body();
    let bytes = hyper::body::to_bytes(body).await.unwrap();
    println!("{}", String::from_utf8_lossy(&bytes));
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`Uri::from_static()`方法创建一个 URI，并使用`get()`方法发送一个 GET 请求。由于我们使用了`tokio::main`宏，因此我们可以使用`await`关键字等待异步请求的完成。最后，我们打印响应的状态码、头和内容。

### 使用 Cookies

Hyper 还支持使用 Cookies 发送 HTTP 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有 Cookies 的 HTTP 请求并打印响应的内容：

```rust
use hyper::{Client, Uri};
use hyper::header::{COOKIE, SET_COOKIE};

fn main() {
    let client = Client::new();
    let uri = Uri::from_static("http://example.com");
    let mut req = client.get(uri).unwrap();
    req.headers_mut().insert(COOKIE, header::HeaderValue::from_static("name=value"));
    let res = client.execute(req).unwrap();
    println!("{}", res.status());
    println!("{}", res.headers());
    if let Some(cookie) = res.headers().get(SET_COOKIE) {
        println!("{}", cookie.to_str().unwrap());
    }
    println!("{}", res.text().unwrap());
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`Uri::from_static()`方法创建一个 URI，并使用`get()`方法创建一个 GET 请求。然后，我们使用`headers_mut()`方法插入一个 Cookie 头。最后，我们使用`execute()`方法发送请求，并打印响应的状态码、头、设置的 Cookie 和内容。

### 处理错误

Hyper 的 API 返回的结果类型是`Result`，因此我们可以使用标准的 Rust 错误处理机制来处理错误。下面是一个简单的示例，它使用 Hyper 发送一个 HTTP 请求并处理错误：

```rust
use hyper::{Client, Uri};
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let uri = Uri::from_static("http://example.com");
    let res = client.get(uri)?.send()?;
    println!("{}", res.status());
    println!("{}", res.headers());
    println!("{}", res.text()?);
    Ok(())
}
```

在这个示例中，我们首先创建了一个 Hyper 客户端。然后，我们使用`Uri::from_static()`方法创建一个 URI，并使用`get()`方法创建一个 GET 请求。然后，我们使用`send()`方法发送请求，并使用`?`操作符处理可能的错误。最后，我们打印响应的状态码、头和内容，并返回一个`Result`类型的空值。

## 进阶用法

### 使用连接池

Hyper 支持使用连接池来提高 HTTP 请求的性能。下面是一个简单的示例，它使用 Hyper 连接池发送 HTTP 请求并打印响应的内容：

```rust
use hyper::{Client, Uri};
use hyper::client::HttpConnector;
use hyper::rt::{self, Future, Stream};
use hyper_tls::HttpsConnector;
use std::sync::Arc;

fn main() {
    let https = HttpsConnector::new(4).unwrap();
    let client = Client::builder()
        .build::<_, hyper::Body>(https);
    let uri = Uri::from_static("https://example.com");
    let req = client.get(uri).and_then(|res| {
        println!("{}", res.status());
        println!("{}", res.headers());
        res.into_body().concat2()
    }).map(|body| {
        println!("{}", String::from_utf8_lossy(&body));
    });
    rt::run(req);
}
```

在这个示例中，我们首先创建了一个 Hyper 连接池。然后，我们使用`Client::builder()`方法创建一个 Hyper 客户端，并使用`build()`方法设置连接池。然后，我们使用`get()`方法创建一个 GET 请求，并使用`and_then()`方法处理响应。最后，我们使用`concat2()`方法将响应体连接起来，并使用`map()`方法打印响应的内容。

### 使用 WebSocket

Hyper 还支持使用 WebSocket 协议。下面是一个简单的示例，它使用 Hyper 创建一个 WebSocket 连接并发送消息：

```rust
use hyper::{Client, Uri};
use tokio::runtime::Runtime;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::WebSocketStream;

fn main() {
    let mut rt = Runtime::new().unwrap();
    rt.block_on(async {
        let client = Client::new();
        let uri = Uri::from_static("ws://example.com");
        let (ws_stream, _) = client.websocket(uri).await.unwrap();
        let (mut write, mut read) = WebSocketStream::new(ws_stream).split();
        write.send(Message::Text("hello world".to_string())).await.unwrap();
        while let Some(msg) = read.next().await {
            let msg = msg.unwrap();
            println!("{}", msg.to_text().unwrap());
        }
    });
}
```

在这个示例中，我们首先创建了一个 Tokio 运行时。然后，我们使用`Client::new()`方法创建一个 Hyper 客户端。然后，我们使用`Uri::from_static()`方法创建一个 URI，并使用`websocket()`方法创建一个 WebSocket 连接。然后，我们使用`split()`方法将 WebSocket 流拆分为读取和写入两个部分。然后，我们使用`send()`方法发送一个文本消息，并使用`next()`方法等待接收消息。最后，我们打印接收到的消息。

### 处理连接超时

Hyper 支持设置连接和请求的超时时间。下面是一个简单的示例，它使用 Hyper 发送一个 HTTP 请求，并设置连接和请求的超时时间：

```rust
use hyper::{Client, Uri};
use std::time::Duration;

fn main() {
    let client = Client::builder()
        .keep_alive_timeout(Duration::from_secs(30))
        .build()
        .unwrap();
    let uri = Uri::from_static("http://example.com");
    let req = client.get(uri)
        .timeout(Duration::from_secs(10))
        .send()
        .map(|res| {
            println!("{}", res.status());
            println!("{}", res.headers());
            println!("{}", res.text().unwrap());
        });
    tokio::run(req);
}
```

在这个示例中，我们首先使用`Client::builder()`方法创建一个 Hyper 客户端，并使用`keep_alive_timeout()`方法设置连接的超时时间。然后，我们使用`timeout()`方法设置请求的超时时间。最后，我们使用`send()`方法发送请求，并使用`map()`方法处理响应。

### 使用自定义 TLS 配置

Hyper 支持使用自定义的 TLS 配置来发送 HTTPS 请求。下面是一个简单的示例，它使用 Hyper 发送一个带有自定义 TLS 配置的 HTTPS 请求并打印响应的内容：

```rust
use hyper::{Client, Uri};
use hyper_tls::HttpsConnector;
use std::error::Error;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use tokio::runtime::Runtime;

fn main() -> Result<(), Box<dyn Error>> {
    let mut rt = Runtime::new()?;
    rt.block_on(async {
        let mut buf = Vec::new();
        let mut file = File::open(Path::new("cert.pem"))?;
        file.read_to_end(&mut buf)?;
        let https = HttpsConnector::with_connector(HttpsConnector::new(4)?, &buf)?;
        let client = Client::builder()
            .build::<_, hyper::Body>(https);
        let uri = Uri::from_static("https://example.com");
        let res = client.get(uri).await?;
        println!("{}", res.status());
        println!("{}", res.headers());
        println!("{}", res.text().await?);
        Ok(())
    })
}
```

在这个示例中，我们首先创建了一个 Tokio 运行时。然后，我们使用`File::open()`方法打开一个证书文件，并使用`read_to_end()`方法读取证书内容。然后，我们使用`HttpsConnector::with_connector()`方法创建一个自定义的 HTTPS 连接器，并使用`Client::builder()`方法创建一个 Hyper 客户端。然后，我们使用`get()`方法创建一个 GET 请求，并使用`await`关键字等待异步请求的完成。最后，我们打印响应的状态码、头和内容，并返回一个`Result`类型的空值。

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
