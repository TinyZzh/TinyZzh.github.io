---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Http客户端reqwest模块实战
date: 2023-04-13 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, reqwest]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Reqwest 是一个 Rust 语言的 HTTP 客户端库，它提供了简单易用的 API，可以发送 HTTP 请求并处理响应。Reqwest 支持同步和异步操作，可以用于编写 Web 服务，爬虫，测试等应用。

## 基础用法

### 发送 GET 请求

```rust
use reqwest::blocking::Client;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 blocking 模块中的 Client 创建了一个 HTTP 客户端，然后使用 get 方法发送了一个 GET 请求，请求了 httpbin.org 的/get 接口，并使用 text 方法获取响应内容。

### 发送 POST 请求

```rust
use reqwest::blocking::Client;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.post("https://httpbin.org/post")
        .body("hello world")
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 post 方法发送了一个 POST 请求，请求了 httpbin.org 的/post 接口，并使用 body 方法设置请求体。

### 发送 JSON 请求

```rust
use reqwest::blocking::Client;
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let data = json!({
        "name": "Alice",
        "age": 20
    });
    let response = client.post("https://httpbin.org/post")
        .json(&data)
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 json!宏创建了一个 JSON 对象，然后使用 json 方法设置请求体，发送了一个 POST 请求。

### 发送表单请求

```rust
use reqwest::blocking::Client;
use std::collections::HashMap;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let mut data = HashMap::new();
    data.insert("name", "Alice");
    data.insert("age", "20");
    let response = client.post("https://httpbin.org/post")
        .form(&data)
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 HashMap 创建了一个表单数据，然后使用 form 方法设置请求体，发送了一个 POST 请求。

### 发送带有 Header 的请求

```rust
use reqwest::blocking::Client;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("https://httpbin.org/get")
        .header("X-My-Header", "hello")
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 header 方法设置了一个自定义的 Header，发送了一个 GET 请求。

### 发送带有 Cookie 的请求

```rust
use reqwest::blocking::Client;
use reqwest::cookie::Cookie;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let cookie = Cookie::new("name", "value");
    let response = client.get("https://httpbin.org/get")
        .cookie(&cookie)
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 Cookie 创建了一个 Cookie 对象，然后使用 cookie 方法设置了一个 Cookie，发送了一个 GET 请求。

### 发送带有代理的请求

```rust
use reqwest::blocking::Client;
use reqwest::Proxy;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .proxy(Proxy::http("http://localhost:8080")?)
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 builder 方法创建了一个 HTTP 客户端，使用 proxy 方法设置了一个代理服务器，发送了一个 GET 请求。

### 下载文件

```rust
use reqwest::blocking::Client;
use std::fs::File;
use std::io::copy;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let mut response = client.get("https://httpbin.org/image/png").send()?;
    let mut file = File::create("image.png")?;
    copy(&mut response, &mut file)?;
    Ok(())
}
```

这个例子中，我们发送了一个 GET 请求，下载了一个 PNG 图片，并保存到本地文件。

## 进阶用法

### 异步操作

```rust
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("https://httpbin.org/get").send().await?;
    println!("{}", response.text().await?);
    Ok(())
}
```

这个例子中，我们使用 async/await 语法，在异步上下文中发送了一个 GET 请求。

### 自定义 SSL 证书

```rust
use reqwest::blocking::Client;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .add_root_certificate(reqwest::Certificate::from_pem(
            &std::fs::read(Path::new("cert.pem"))?,
        ))
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 builder 方法创建了一个 HTTP 客户端，并使用 add_root_certificate 方法设置了一个自定义的 SSL 证书，发送了一个 GET 请求。

### 自定义连接池

```rust
use reqwest::blocking::Client;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .pool_idle_timeout(Duration::from_secs(30))
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 builder 方法创建了一个 HTTP 客户端，并使用 pool_idle_timeout 方法设置了连接池的空闲超时时间，发送了一个 GET 请求。

### 自定义重试策略

```rust
use reqwest::blocking::Client;
use reqwest::Url;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .retry(|attempt| {
            let url = Url::parse("https://httpbin.org/get").unwrap();
            if attempt > 3 {
                return None;
            }
            Some(Duration::from_secs(attempt * 2) + url.host_str().unwrap().len() as u64)
        })
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

这个例子中，我们使用 builder 方法创建了一个 HTTP 客户端，并使用 retry 方法设置了一个自定义的重试策略，发送了一个 GET 请求。

## 最佳实践

### 使用连接池

在高并发场景下，使用连接池可以提高 HTTP 客户端的性能和稳定性。可以使用 builder 方法设置连接池的大小和空闲超时时间。

```rust
use reqwest::blocking::Client;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .pool_idle_timeout(Duration::from_secs(30))
        .pool_max_idle_per_host(10)
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

### 处理错误

在发送 HTTP 请求时，可能会出现各种错误，如网络错误，服务器错误等。可以使用 Result 类型来处理错误，或者使用?运算符简化代码。

```rust
use reqwest::blocking::Client;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client.get("https://httpbin.org/get").send()?;
    if response.status().is_success() {
        println!("{}", response.text()?);
    } else {
        println!("Error: {}", response.status());
    }
    Ok(())
}
```

### 使用代理

在访问某些网站时，可能需要使用代理服务器。可以使用 builder 方法设置代理服务器的地址和端口。

```rust
use reqwest::blocking::Client;
use reqwest::Proxy;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .proxy(Proxy::http("http://localhost:8080")?)
        .build()?;
    let response = client.get("https://httpbin.org/get").send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

### 使用 JSON

在发送 HTTP 请求时，经常需要使用 JSON 格式的请求体。可以使用 serde_json 库来创建 JSON 对象，并使用 json 方法设置请求体。

```rust
use reqwest::blocking::Client;
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let data = json!({
        "name": "Alice",
        "age": 20
    });
    let response = client.post("https://httpbin.org/post")
        .json(&data)
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

### 使用表单

在发送 HTTP 请求时，经常需要使用表单格式的请求体。可以使用 HashMap 来创建表单数据，并使用 form 方法设置请求体。

```rust
use reqwest::blocking::Client;
use std::collections::HashMap;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let mut data = HashMap::new();
    data.insert("name", "Alice");
    data.insert("age", "20");
    let response = client.post("https://httpbin.org/post")
        .form(&data)
        .send()?;
    println!("{}", response.text()?);
    Ok(())
}
```

## 结论

在本教程中，我们介绍了 Rust 语言的 HTTP 客户端库 Reqwest 的基础用法和进阶用法，并提供了最佳实践和示例代码。使用 Reqwest 可以轻松地发送 HTTP 请求，并处理响应，满足各种应用场景的需求。
