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


Hyper是一个用于构建HTTP客户端和服务器的Rust语言库。它提供了一个简单易用的API，使得开发者可以轻松地构建高性能、可靠的HTTP应用程序。Hyper的设计目标是安全、高效和易于使用。

Hyper的主要特点包括：

- 支持HTTP/1和HTTP/2协议
- 纯Rust实现，无需外部依赖
- 支持异步I/O和多线程
- 提供简单易用的API

在本教程中，我们将介绍Hyper的基础用法和进阶用法，并提供一些最佳实践。

> 相比于系列文章中介绍的reqwest, Hyper设计的更底层，模块化的设计，可以最大限度的允许用户在硬件配置较低的嵌入式设备上使用。
> 假如只是需要一个“好用”的Http客户端，推荐使用reqwest模块

## 基础用法

### 发送HTTP请求

使用Hyper发送HTTP请求非常简单。下面是一个简单的示例，它使用Hyper发送一个GET请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`get()`方法发送一个GET请求，并使用`send()`方法发送请求。最后，我们打印响应的状态码、头和内容。

### 发送POST请求

Hyper还支持发送POST请求。下面是一个简单的示例，它使用Hyper发送一个POST请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`Request::post()`方法创建一个POST请求，并使用`Body::from()`方法设置请求体。最后，我们使用`request()`方法发送请求，并打印响应的状态码、头和内容。

### 使用代理服务器

Hyper还支持使用代理服务器发送HTTP请求。下面是一个简单的示例，它使用Hyper发送一个通过代理服务器的HTTP请求并打印响应的内容：

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

在这个示例中，我们使用`Client::builder()`方法创建一个Hyper客户端，并使用`proxy()`方法设置代理服务器的地址。然后，我们使用`get()`方法发送一个GET请求，并使用`send()`方法发送请求。最后，我们打印响应的状态码、头和内容。

### 使用自定义头

Hyper还支持使用自定义头发送HTTP请求。下面是一个简单的示例，它使用Hyper发送一个带有自定义头的HTTP请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`get()`方法创建一个GET请求，并使用`headers_mut()`方法插入一个自定义头。最后，我们使用`execute()`方法发送请求，并打印响应的状态码、头和内容。

### 使用异步I/O

Hyper支持异步I/O，这使得它可以处理大量的并发请求。下面是一个简单的示例，它使用Hyper异步发送HTTP请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`Uri::from_static()`方法创建一个URI，并使用`get()`方法发送一个GET请求。由于我们使用了`tokio::main`宏，因此我们可以使用`await`关键字等待异步请求的完成。最后，我们打印响应的状态码、头和内容。

### 使用Cookies

Hyper还支持使用Cookies发送HTTP请求。下面是一个简单的示例，它使用Hyper发送一个带有Cookies的HTTP请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`Uri::from_static()`方法创建一个URI，并使用`get()`方法创建一个GET请求。然后，我们使用`headers_mut()`方法插入一个Cookie头。最后，我们使用`execute()`方法发送请求，并打印响应的状态码、头、设置的Cookie和内容。

### 处理错误

Hyper的API返回的结果类型是`Result`，因此我们可以使用标准的Rust错误处理机制来处理错误。下面是一个简单的示例，它使用Hyper发送一个HTTP请求并处理错误：

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

在这个示例中，我们首先创建了一个Hyper客户端。然后，我们使用`Uri::from_static()`方法创建一个URI，并使用`get()`方法创建一个GET请求。然后，我们使用`send()`方法发送请求，并使用`?`操作符处理可能的错误。最后，我们打印响应的状态码、头和内容，并返回一个`Result`类型的空值。

## 进阶用法

### 使用连接池

Hyper支持使用连接池来提高HTTP请求的性能。下面是一个简单的示例，它使用Hyper连接池发送HTTP请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Hyper连接池。然后，我们使用`Client::builder()`方法创建一个Hyper客户端，并使用`build()`方法设置连接池。然后，我们使用`get()`方法创建一个GET请求，并使用`and_then()`方法处理响应。最后，我们使用`concat2()`方法将响应体连接起来，并使用`map()`方法打印响应的内容。

### 使用WebSocket

Hyper还支持使用WebSocket协议。下面是一个简单的示例，它使用Hyper创建一个WebSocket连接并发送消息：

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

在这个示例中，我们首先创建了一个Tokio运行时。然后，我们使用`Client::new()`方法创建一个Hyper客户端。然后，我们使用`Uri::from_static()`方法创建一个URI，并使用`websocket()`方法创建一个WebSocket连接。然后，我们使用`split()`方法将WebSocket流拆分为读取和写入两个部分。然后，我们使用`send()`方法发送一个文本消息，并使用`next()`方法等待接收消息。最后，我们打印接收到的消息。

### 处理连接超时

Hyper支持设置连接和请求的超时时间。下面是一个简单的示例，它使用Hyper发送一个HTTP请求，并设置连接和请求的超时时间：

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

在这个示例中，我们首先使用`Client::builder()`方法创建一个Hyper客户端，并使用`keep_alive_timeout()`方法设置连接的超时时间。然后，我们使用`timeout()`方法设置请求的超时时间。最后，我们使用`send()`方法发送请求，并使用`map()`方法处理响应。

### 使用自定义TLS配置

Hyper支持使用自定义的TLS配置来发送HTTPS请求。下面是一个简单的示例，它使用Hyper发送一个带有自定义TLS配置的HTTPS请求并打印响应的内容：

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

在这个示例中，我们首先创建了一个Tokio运行时。然后，我们使用`File::open()`方法打开一个证书文件，并使用`read_to_end()`方法读取证书内容。然后，我们使用`HttpsConnector::with_connector()`方法创建一个自定义的HTTPS连接器，并使用`Client::builder()`方法创建一个Hyper客户端。然后，我们使用`get()`方法创建一个GET请求，并使用`await`关键字等待异步请求的完成。最后，我们打印响应的状态码、头和内容，并返回一个`Result`类型的空值。


## 最佳实践

- 使用连接池提高性能

Hyper提供了连接池的功能，可以有效地提高HTTP请求的性能。在实际开发中，我们应该尽可能地使用连接池来发送HTTP请求，以提高性能和减少资源消耗。

- 使用异步I/O提高并发性能

Hyper使用异步I/O实现了高性能的HTTP客户端和服务器端，我们应该尽可能地使用异步I/O来提高并发性能。

- 使用HTTPS保证安全性

在发送HTTP请求时，我们应该尽可能地使用HTTPS来保证通信的安全性。Hyper提供了对HTTPS的支持，可以轻松地实现HTTPS通信。

- 使用请求/响应拦截器进行处理

Hyper提供了请求/响应拦截器的功能，可以对HTTP请求和响应进行处理。在实际开发中，我们应该尽可能地使用请求/响应拦截器来实现一些通用的处理逻辑，例如日志记录、错误处理等。

## 总结

Hyper是Rust语言中一个非常流行的HTTP客户端和服务器端开发库，它提供了一套简单易用的API，可以轻松地构建高性能的Web应用程序。在本教程中，我们介绍了Hyper的基础用法和进阶用法，并提供了一些最佳实践和示例代码。希望这个教程能够帮助你更好地了解Hyper，并在实际开发中使用它。