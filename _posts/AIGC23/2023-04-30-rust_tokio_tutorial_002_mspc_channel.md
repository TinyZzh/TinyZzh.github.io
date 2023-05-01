---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的Channel(上)
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 语言是一种系统级编程语言，它具有强类型和内存安全性。Rust 语言中的 Tokio 模块是一个异步编程库，它提供了一种高效的方式来处理异步任务。其中，channel 是 Tokio 模块中的一个重要组成部分，它可以用于在异步任务之间传递数据。在本教程中，我们将介绍 Rust 语言中的 Tokio 模块 channel，并提供几个示例，以帮助您更好地理解它的使用方法。

## 什么是 Tokio 模块 Channel？

Tokio 模块中的 channel 是一种用于在异步任务之间传递数据的机制。它类似于操作系统中的管道，可以在不同的异步任务之间传递数据。Tokio 模块中的 channel 具有以下特点：

- 可以在异步任务之间传递任何类型的数据。
- 支持多个生产者和消费者。
- 支持异步操作。

Tokio 模块中的 channel 分为两种类型：mpsc 和 oneshot。其中，mpsc 是多个生产者和单个消费者的 channel，而 oneshot 是单个生产者和单个消费者的 channel。

## 创建一个 mpsc channel

在 Rust 语言中，使用 Tokio 模块创建一个 mpsc channel 非常简单。首先，需要在 Cargo.toml 文件中添加 Tokio 模块的依赖：

```toml
[dependencies]
tokio = { version = "1.28.0", features = ["full"] }
```

然后，在代码中导入 Tokio 模块和 mpsc channel：

```rust
use tokio::sync::mpsc;
```

接下来，可以使用 mpsc::channel()函数创建一个 mpsc channel：

```rust
let (tx, rx) = mpsc::channel(32);
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel，并返回了两个对象：tx 和 rx。tx 是一个发送者对象，它可以用于向 channel 中发送数据，而 rx 是一个接收者对象，它可以用于从 channel 中接收数据。

## 发送和接收字符串

下面是一个简单的示例，演示如何在异步任务之间发送和接收字符串：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        tx.send("hello".to_string()).await.unwrap();
        tx.send("world".to_string()).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("{}", msg);
    }
}
```

在这个例子中，我们首先创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务向 channel 中发送了两个字符串。最后，我们使用 while 循环从 channel 中接收数据，并打印出来。

## 发送和接收数字

下面是一个示例，演示如何在异步任务之间发送和接收数字：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        tx.send(1).await.unwrap();
        tx.send(2).await.unwrap();
        tx.send(3).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("{}", msg);
    }
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务向 channel 中发送了三个数字。最后，我们使用 while 循环从 channel 中接收数据，并打印出来。

## 发送和接收结构体

下面是一个示例，演示如何在异步任务之间发送和接收结构体：

```rust
use tokio::sync::mpsc;

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        tx.send(Point { x: 1, y: 2 }).await.unwrap();
        tx.send(Point { x: 3, y: 4 }).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("{:?}", msg);
    }
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务向 channel 中发送了两个结构体。最后，我们使用 while 循环从 channel 中接收数据，并打印出来。

## 发送和接收元组

下面是一个示例，演示如何在异步任务之间发送和接收元组：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        tx.send((1, 2)).await.unwrap();
        tx.send((3, 4)).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("{:?}", msg);
    }
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务向 channel 中发送了两个元组。最后，我们使用 while 循环从 channel 中接收数据，并打印出来。

## 发送和接收枚举

下面是一个示例，演示如何在异步任务之间发送和接收枚举：

```rust
use tokio::sync::mpsc;

enum Message {
    Text(String),
    Number(i32),
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        tx.send(Message::Text("hello".to_string())).await.unwrap();
        tx.send(Message::Number(123)).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        match msg {
            Message::Text(s) => println!("{}", s),
            Message::Number(n) => println!("{}", n),
        }
    }
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务向 channel 中发送了两个枚举。最后，我们使用 match 语句从 channel 中接收数据，并打印出来。

## 多个生产者和单个消费者

下面是一个示例，演示如何在异步任务之间使用多个生产者和单个消费者：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx1, mut rx) = mpsc::channel(32);
    let tx2 = tx1.clone();
    let tx3 = tx1.clone();

    tokio::spawn(async move {
        tx1.send("hello".to_string()).await.unwrap();
    });

    tokio::spawn(async move {
        tx2.send("world".to_string()).await.unwrap();
    });

    tokio::spawn(async move {
        tx3.send("!".to_string()).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("{}", msg);
    }
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel，并使用 tx1.clone()函数创建了两个新的发送者对象：tx2 和 tx3。然后，我们使用 tokio::spawn()函数创建了三个异步任务，每个任务向 channel 中发送一个字符串。最后，我们使用 while 循环从 channel 中接收数据，并打印出来。

## 使用 BufferedSink 发送数据

下面是一个示例，演示如何使用 BufferedSink 发送数据：

```rust
use std::io::Write;
use tokio::io::BufWriter;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        let mut writer = BufWriter::new(std::io::stdout());
        while let Some(msg) = rx.recv().await {
            writer.write_all(msg.as_bytes()).unwrap();
            writer.flush().unwrap();
        }
    });

    tx.send("hello\n".to_string()).await.unwrap();
    tx.send("world\n".to_string()).await.unwrap();
}
```

在这个例子中，我们创建了一个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了一个异步任务，该任务使用 BufferedSink 将数据写入标准输出。最后，我们使用 tx.send()函数向 channel 中发送两个字符串。

## 使用 select!宏选择最先到达的消息

下面是一个示例，演示如何使用 select!宏选择最先到达的消息：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx1, mut rx1) = mpsc::channel(32);
    let (mut tx2, mut rx2) = mpsc::channel(32);

    tokio::spawn(async move {
        tx1.send("hello".to_string()).await.unwrap();
    });

    tokio::spawn(async move {
        tx2.send("world".to_string()).await.unwrap();
    });

    loop {
        tokio::select! {
            Some(msg) = rx1.recv() => println!("{}", msg),
            Some(msg) = rx2.recv() => println!("{}", msg),
            else => break,
        }
    }
}
```

在这个例子中，我们创建了两个大小为 32 的 mpsc channel。然后，我们使用 tokio::spawn()函数创建了两个异步任务，每个任务向 channel 中发送一个字符串。最后，我们使用 tokio::select!宏选择最先到达的消息，并打印出来。

## 结论

在本教程中，我们介绍了 Rust 语言中的 Tokio 模块 channel，并提供了 8 个示例，以帮助您更好地理解它的使用方法。无论您是新手还是有经验的 Rust 开发人员，都可以从这些示例中学习到有用的知识。如果您想深入了解 Tokio 模块的其他功能，请查看 Tokio 模块的官方文档。
