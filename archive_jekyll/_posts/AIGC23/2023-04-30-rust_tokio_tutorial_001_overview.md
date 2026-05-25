---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 从Ping-Pong示例入门Tokio模块
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Tokio 是一个异步 I/O 框架，它提供了一种高效的方式来编写异步代码。它使用 Rust 语言的 Futures 库来管理异步任务，并使用 Reactor 模式来处理 I/O 事件。

> 本系列 Tokio 篇将由浅入深的从基础到实战，以一个完整的 Rust 语言子系列讲述网络编程。

## 为什么要使用 Tokio？

在 Rust 中，使用异步编程可以提高程序的性能和响应速度，但是异步编程往往需要编写大量的样板代码和复杂的控制流程。Tokio 提供了一种简单的方式来编写异步代码，它使用 Futures 库来管理异步任务，并提供了一组工具来处理异步 I/O 事件。

## 如何使用 Tokio？

使用 Tokio 编写异步代码需要掌握以下几个概念：

- Future：表示一个异步任务，可以理解为一个异步函数的返回值；
- Task：表示一个异步任务的执行上下文，可以理解为一个异步函数的执行环境；
- Reactor：表示一个 I/O 事件的处理器，可以理解为一个事件循环；
- Runtime：表示一个异步任务的执行环境，可以理解为一个异步函数的运行时环境。

下面我们将使用 Tokio 编写一个最基础的服务器和客户端程序，以便了解 Tokio 的基本用法。

## 编写服务器

我们将编写一个简单的 PingPong 服务器，它接收客户端的 Ping 请求，并返回 Pong 响应。首先，我们需要创建一个异步任务来处理客户端的请求。我们可以使用 Tokio 提供的`async`关键字来定义一个异步函数：

```rust
async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn Error>> {
    // ...
}
```

这个异步函数接收一个`TcpStream`对象，表示一个客户端连接。我们可以在函数内部处理客户端的请求，并返回一个`Result`对象表示异步任务的执行结果。在处理客户端请求之前，我们需要先向客户端发送一个欢迎消息：

```rust
async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn Error>> {
    println!("new client connected");

    let mut buf = [0; 1024];
    stream.write_all(b"Welcome to the PingPong server!\n").await?;

    // ...
}
```

在发送欢迎消息之后，我们需要不断地从客户端读取数据，并返回 Pong 响应。我们可以使用一个无限循环来实现这个功能：

```rust
async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn Error>> {
    println!("new client connected");

    let mut buf = [0; 1024];
    stream.write_all(b"Welcome to the PingPong server!\n").await?;

    loop {
        let n = stream.read(&mut buf).await?;
        if n == 0 {
            break;
        }
        stream.write_all(b"Pong\n").await?;
    }

    println!("client disconnected");
    Ok(())
}
```

在循环中，我们使用`stream.read()`方法从客户端读取数据，并使用`stream.write_all()`方法向客户端发送 Pong 响应。如果客户端关闭了连接，我们就退出循环并返回`Ok(())`表示异步任务执行成功。

现在我们已经编写了一个异步任务来处理客户端请求，接下来我们需要创建一个 Reactor 来处理 I/O 事件。我们可以使用 Tokio 提供的`TcpListener`对象来监听客户端连接：

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await?;
    println!("listening on {}", addr);

    loop {
        let (stream, _) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_client(stream).await {
                eprintln!("error: {}", e);
            }
        });
    }
}
```

在`main`函数中，我们首先创建一个`TcpListener`对象来监听客户端连接。然后我们使用一个无限循环来等待客户端连接，并使用`listener.accept()`方法来接收客户端连接。当有新的客户端连接时，我们就创建一个新的异步任务来处理客户端请求，并使用`tokio::spawn()`方法将任务提交到 Reactor 中执行。

现在我们已经完成了一个最基础的 PingPong 服务器，可以使用`cargo run`命令来运行程序，并使用 telnet 命令来测试服务器：

```bash
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/pingpong`
listening on 127.0.0.1:8080
```

```bash
$ telnet localhost 8080
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
Welcome to the PingPong server!
ping
Pong
ping
Pong
^]
telnet> quit
Connection closed.
```

## 编写客户端

现在我们已经编写了一个最基础的 PingPong 服务器，接下来我们将编写一个客户端程序来连接服务器并发送 Ping 请求。首先，我们需要创建一个异步任务来连接服务器：

```rust
async fn connect() -> Result<(), Box<dyn Error>> {
    let addr = "127.0.0.1:8080";
    let mut stream = TcpStream::connect(addr).await?;
    println!("connected to {}", addr);

    // ...
}
```

这个异步任务使用`TcpStream::connect()`方法来连接服务器，并返回一个`Result`对象表示连接结果。在连接成功之后，我们可以向服务器发送一个 Ping 请求：

```rust
async fn connect() -> Result<(), Box<dyn Error>> {
    let addr = "127.0.0.1:8080";
    let mut stream = TcpStream::connect(addr).await?;
    println!("connected to {}", addr);

    stream.write_all(b"Ping\n").await?;
    let mut buf = [0; 1024];
    let n = stream.read(&mut buf).await?;
    let pong = std::str::from_utf8(&buf[..n])?;
    println!("{}", pong);

    Ok(())
}
```

在发送 Ping 请求之后，我们使用`stream.read()`方法从服务器读取响应，并使用`std::str::from_utf8()`方法将响应转换为字符串。最后，我们将响应打印到控制台上，并返回`Ok(())`表示异步任务执行成功。

现在我们已经编写了一个异步任务来连接服务器并发送 Ping 请求，接下来我们需要在`main`函数中启动这个任务：

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    connect().await?;
    Ok(())
}
```

现在我们已经完成了一个最基础的 PingPong 客户端，可以使用`cargo run`命令来运行程序，并查看控制台输出：

```bash
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/pingpong`
connected to 127.0.0.1:8080
Pong
```

## 完整代码

最后，我们将完整的服务器和客户端代码放在一起，以便读者参考：

```rust
use std::error::Error;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn Error>> {
    println!("new client connected");

    let mut buf = [0; 1024];
    stream.write_all(b"Welcome to the PingPong server!\n").await?;

    loop {
        let n = stream.read(&mut buf).await?;
        if n == 0 {
            break;
        }
        stream.write_all(b"Pong\n").await?;
    }

    println!("client disconnected");
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await?;
    println!("listening on {}", addr);

    loop {
        let (stream, _) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_client(stream).await {
                eprintln!("error: {}", e);
            }
        });
    }
}

async fn connect() -> Result<(), Box<dyn Error>> {
    let addr = "127.0.0.1:8080";
    let mut stream = TcpStream::connect(addr).await?;
    println!("connected to {}", addr);

    stream.write_all(b"Ping\n").await?;
    let mut buf = [0; 1024];
    let n = stream.read(&mut buf).await?;
    let pong = std::str::from_utf8(&buf[..n])?;
    println!("{}", pong);

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    connect().await?;
    Ok(())
}
```

## 总结

通过本文的介绍，我们了解了 Tokio 的基本用法，并编写了一个最基础的 PingPong 服务器和客户端程序。Tokio 提供了一种简单的方式来编写异步代码，可以帮助我们提高程序的性能和响应速度。在实际开发中，我们可以根据需要使用 Tokio 提供的各种工具来编写更加复杂的异步程序。
