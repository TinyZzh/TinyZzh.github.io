---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的Channel(下)
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Channel 是一种在多线程环境下进行通信的机制，可以让线程之间互相发送消息和共享数据。Rust 语言中的 Tokio 模块提供了一种异步的 Channel 实现，使得我们可以在异步程序中方便地进行消息传递和数据共享。

在本教程是 Channel 的下篇，我们将介绍如何使用 Tokio 模块的 Channel，包括如何使用异步 Channel 和如何使用标准库中的同步 Channel 来扩展 Tokio 的 Channel。我们还将讨论背压和有界队列的概念，并提供相关的实践和示例代码。

## 异步 Channel

异步 Channel 是 Tokio 模块中的一种实现，它使用了 async/await 语法和 futures-rs 库来实现异步通信。在使用异步 Channel 之前，我们需要在项目的 Cargo.toml 文件中添加 tokio 和 futures-rs 的依赖：

```toml
[dependencies]
tokio = { version = "1.28.0", features = ["full"] }
futures = "0.3.17"
```

接下来，我们可以使用 tokio::sync::mpsc 模块中的 unbounded_channel 函数来创建一个异步 Channel：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::unbounded_channel();
    // ...
}
```

在上面的代码中，我们使用了 tokio::main 宏来启动异步运行时，并使用 mpsc::unbounded_channel 函数创建了一个异步 Channel。该函数返回了两个值，一个是发送端（tx），一个是接收端（rx）。

接下来，我们可以使用 tx.send 方法向 Channel 中发送消息，使用 rx.recv 方法从 Channel 中接收消息。这些方法都是异步的，因此我们需要在使用它们时使用 await 关键字。

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = mpsc::unbounded_channel();
    tokio::spawn(async move {
        tx.send("hello").await.unwrap();
    });
    let msg = rx.recv().await.unwrap();
    println!("{}", msg);
}
```

在上面的代码中，我们使用了 tokio::spawn 函数创建了一个异步任务，该任务向 Channel 中发送了一条消息。接着，我们使用 rx.recv 方法从 Channel 中接收消息，并将消息打印出来。

### 扩展异步 Channel

异步 Channel 在 Tokio 中是一个非常有用的工具，但是它有一些限制。例如，它只支持无界队列，这意味着当发送者发送消息时，如果接收者没有及时接收消息，那么消息将一直积累在队列中，直到内存耗尽。

为了解决这个问题，我们可以使用 async-channel 模块来扩展 Tokio 的异步 Channel。async-channel 是一个基于 futures-rs 的异步通信库，它提供了有界队列和背压功能。

在使用 async-channel 之前，我们需要在项目的 Cargo.toml 文件中添加 async-channel 的依赖：

```toml
[dependencies]
tokio = { version = "1.28.0", features = ["full"] }
futures = "0.3.17"
async-channel = "1.7.3"
```

接下来，我们可以使用 async_channel::bounded 函数来创建一个有界队列的异步 Channel：

```rust
use async_channel::{bounded, Sender, Receiver};

#[tokio::main]
async fn main() {
    let (tx, rx) = bounded(10);
    // ...
}
```

在上面的代码中，我们使用了 async_channel::bounded 函数创建了一个有界队列的异步 Channel。该函数返回了两个值，一个是发送端（tx），一个是接收端（rx）。在这个例子中，我们创建了一个容量为 10 的有界队列。

接下来，我们可以使用 tx.send 方法向 Channel 中发送消息，使用 rx.recv 方法从 Channel 中接收消息。这些方法都是异步的，因此我们需要在使用它们时使用 await 关键字。

```rust
use async_channel::{bounded, Sender, Receiver};

#[tokio::main]
async fn main() {
    let (tx, rx) = bounded(10);
    tokio::spawn(async move {
        tx.send("hello").await.unwrap();
    });
    let msg = rx.recv().await.unwrap();
    println!("{}", msg);
}
```

在上面的代码中，我们使用了 tokio::spawn 函数创建了一个异步任务，该任务向 Channel 中发送了一条消息。接着，我们使用 rx.recv 方法从 Channel 中接收消息，并将消息打印出来。

## 同步 Channel

除了异步 Channel 之外，我们还可以使用标准库中的同步 Channel 来扩展 Tokio 的 Channel。标准库中的同步 Channel 使用了 std::sync::mpsc 模块来实现多线程之间的通信。

在使用同步 Channel 之前，我们需要在项目的 Cargo.toml 文件中添加 tokio 的依赖：

```toml
[dependencies]
tokio = { version = "1.14.0", features = ["full"] }
```

接下来，我们可以使用 std::sync::mpsc 模块中的 channel 函数来创建一个同步 Channel：

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    // ...
}
```

在上面的代码中，我们使用了 mpsc::channel 函数创建了一个同步 Channel。该函数返回了两个值，一个是发送端（tx），一个是接收端（rx）。

接下来，我们可以使用 tx.send 方法向 Channel 中发送消息，使用 rx.recv 方法从 Channel 中接收消息。这些方法都是阻塞的，因此我们不需要使用 await 关键字。

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        tx.send("hello").unwrap();
    });
    let msg = rx.recv().unwrap();
    println!("{}", msg);
}
```

在上面的代码中，我们使用了 std::thread::spawn 函数创建了一个线程，该线程向 Channel 中发送了一条消息。接着，我们使用 rx.recv 方法从 Channel 中接收消息，并将消息打印出来。

### 扩展同步 Channel

同步 Channel 在标准库中是一个非常有用的工具，但是它也有一些限制。例如，它只支持阻塞式的消息传递，这意味着当发送者发送消息时，如果接收者没有及时接收消息，那么发送者将一直阻塞，直到消息被接收。

为了解决这个问题，我们可以使用有界队列和背压来扩展同步 Channel。有界队列和背压可以使用 crossbeam-channel 模块来实现。

在使用 crossbeam-channel 之前，我们需要在项目的 Cargo.toml 文件中添加 crossbeam-channel 的依赖：

```toml
[dependencies]
crossbeam-channel = "0.5.1"
```

接下来，我们可以使用 crossbeam_channel::bounded 函数来创建一个有界队列的同步 Channel：

```rust
use crossbeam_channel::{bounded, Sender, Receiver};

fn main() {
    let (tx, rx) = bounded(10);
    // ...
}
```

在上面的代码中，我们使用了 crossbeam_channel::bounded 函数创建了一个有界队列的同步 Channel。该函数返回了两个值，一个是发送端（tx），一个是接收端（rx）。在这个例子中，我们创建了一个容量为 10 的有界队列。

接下来，我们可以使用 tx.send 方法向 Channel 中发送消息，使用 rx.recv 方法从 Channel 中接收消息。这些方法都是阻塞的，因此我们不需要使用 await 关键字。

```rust
use crossbeam_channel::{bounded, Sender, Receiver};

fn main() {
    let (tx, rx) = bounded(10);
    std::thread::spawn(move || {
        tx.send("hello").unwrap();
    });
    let msg = rx.recv().unwrap();
    println!("{}", msg);
}
```

在上面的代码中，我们使用了 std::thread::spawn 函数创建了一个线程，该线程向 Channel 中发送了一条消息。接着，我们使用 rx.recv 方法从 Channel 中接收消息，并将消息打印出来。

## 背压和有界队列

在异步编程中，背压和有界队列是非常重要的概念。背压是一种流量控制机制，用于控制消息发送的速度，以避免消息积压和内存耗尽。有界队列是一种限制队列长度的机制，用于控制消息的数量，以避免队列溢出和内存耗尽。

在 Tokio 中，我们可以使用 async-channel 模块和 crossbeam-channel 模块来实现背压和有界队列。

### 使用 async-channel 实现背压和有界队列

在 async-channel 中，我们可以使用 Sender::try_send 方法来实现背压和有界队列。try_send 方法尝试向 Channel 中发送一条消息，如果 Channel 已满，则返回错误。这样，我们就可以在发送消息时进行流量控制和队列长度控制。

```rust
use async_channel::{bounded, Sender, Receiver};

#[tokio::main]
async fn main() {
    let (tx, rx) = bounded(10);
    tokio::spawn(async move {
        loop {
            if let Err(_) = tx.try_send("hello") {
                // Channel is full, wait for a moment
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
            }
        }
    });
    loop {
        let msg = rx.recv().await.unwrap();
        // Process the message
    }
}
```

在上面的代码中，我们使用了 tx.try_send 方法向 Channel 中发送消息，如果 Channel 已满，则等待 1 秒钟。接下来，我们使用 rx.recv 方法从 Channel 中接收消息，并进行处理。

### 使用 crossbeam-channel 实现背压和有界队列

在 crossbeam-channel 中，我们可以使用 Sender::try_send 方法和 Receiver::recv_timeout 方法来实现背压和有界队列。try_send 方法尝试向 Channel 中发送一条消息，如果 Channel 已满，则返回错误。recv_timeout 方法尝试从 Channel 中接收一条消息，如果 Channel 为空，则等待一段时间后返回错误。这样，我们就可以在发送消息时进行流量控制和队列长度控制。

```rust
use crossbeam_channel::{bounded, Sender, Receiver};

fn main() {
    let (tx, rx) = bounded(10);
    std::thread::spawn(move || {
        loop {
            if let Err(_) = tx.try_send("hello") {
                // Channel is full, wait for a moment
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        }
    });
    loop {
        match rx.recv_timeout(std::time::Duration::from_secs(1)) {
            Ok(msg) => {
                // Process the message
            }
            Err(_) => {
                // Channel is empty, wait for a moment
            }
        }
    }
}
```

在上面的代码中，我们使用了 tx.try_send 方法向 Channel 中发送消息，如果 Channel 已满，则等待 1 秒钟。接下来，我们使用 rx.recv_timeout 方法从 Channel 中接收消息，并进行处理。如果 Channel 为空，则等待 1 秒钟后继续尝试接收消息。

## 总结

在本教程中，我们介绍了如何使用 Tokio 模块的 Channel，包括如何使用异步 Channel 和如何使用标准库中的同步 Channel 来扩展 Tokio 的 Channel。我们还讨论了背压和有界队列的概念，并提供了相关的实践和示例代码。

异步 Channel 是 Tokio 中非常有用的工具，它可以帮助我们在异步程序中方便地进行消息传递和数据共享。然而，由于它只支持无界队列，因此在某些情况下可能会导致内存耗尽。为了解决这个问题，我们可以使用 async-channel 模块来扩展 Tokio 的异步 Channel，实现有界队列和背压功能。

同步 Channel 在标准库中是一个非常有用的工具，它可以帮助我们在多线程程序中方便地进行消息传递和数据共享。然而，由于它只支持阻塞式的消息传递，因此在某些情况下可能会导致发送者一直阻塞，直到消息被接收。为了解决这个问题，我们可以使用 crossbeam-channel 模块来扩展同步 Channel，实现有界队列和背压功能。
