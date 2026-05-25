---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的Channel(中)
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 语言的 tokio 模块提供了一种高效的异步编程方式，其中的 channel 模块是其核心组件之一。本教程将介绍 tokio 模块 channel 的除了上文提到的 mspc::Channel 之外，还有三种类型，分别为：oneshot、broadcast 和 watch，本文分别分析它们的使用场景、业务特点和优缺点。

Channel 是一种用于在不同线程之间传递数据的通信机制。它可以让不同的线程之间通过发送和接收消息来传递数据，从而实现线程之间的协作和同步。

在 Rust 语言中，tokio 模块的 channel 组件提供了一种异步的、高效的、类型安全的 channel 实现。它支持多种类型的 channel，包括 oneshot、broadcast 和 watch。

## oneshot channel

oneshot channel 是一种只能发送一次消息的 channel。它的特点是发送端只能发送一次消息，接收端只能接收一次消息。一旦消息被发送或接收，channel 就会被关闭。

oneshot channel 适用于以下场景：

1. 线程之间需要传递一次性的消息。
2. 线程之间需要传递一个返回值。
3. 线程之间需要传递一个事件通知。

oneshot channel 的业务特点如下：

1. 只能发送一次消息，保证了消息的唯一性。
2. 只能接收一次消息，保证了消息的完整性。
3. 发送和接收操作都是非阻塞的，可以提高程序的并发性能。

oneshot channel 的优点包括：

1. 简单易用，只需要发送和接收消息即可。
2. 安全可靠，保证了消息的唯一性和完整性。
3. 高效性能，发送和接收操作都是非阻塞的。

缺点包括：

1. 只能发送一次消息，不适用于需要多次传递消息的场景。
2. 无法处理多个接收端的情况。

### 示例代码

下面是一个使用 oneshot channel 传递返回值的示例代码：

```rust
use tokio::sync::oneshot;

async fn do_something() -> i32 {
    // 创建一个oneshot channel
    let (tx, rx) = oneshot::channel();

    // 在一个异步任务中发送消息
    tokio::spawn(async move {
        let result = 42;
        tx.send(result).unwrap();
    });

    // 在当前任务中接收消息
    let result = rx.await.unwrap();
    result
}

#[tokio::main]
async fn main() {
    let result = do_something().await;
    println!("result = {}", result);
}
```

## broadcast channel

broadcast channel 是一种可以发送多次消息的 channel。它的特点是可以有多个接收端，每个接收端都可以接收到发送端发送的所有消息。

broadcast channel 适用于以下场景：

1. 线程之间需要传递多次消息。
2. 线程之间需要广播消息。

broadcast channel 的业务特点如下：

1. 可以发送多次消息，适用于需要多次传递消息的场景。
2. 可以有多个接收端，适用于需要广播消息的场景。
3. 发送和接收操作都是非阻塞的，可以提高程序的并发性能。

broadcast channel 的优点包括：

1. 可以发送多次消息，适用于需要多次传递消息的场景。
2. 可以有多个接收端，适用于需要广播消息的场景。
3. 高效性能，发送和接收操作都是非阻塞的。

缺点包括：

1. 无法保证消息的顺序性。
2. 需要额外的处理逻辑来处理多个接收端的情况。

### 示例代码

下面是一个使用 broadcast channel 广播消息的示例代码：

```rust
use tokio::sync::broadcast;

async fn do_something() {
    // 创建一个broadcast channel
    let (tx, mut rx) = broadcast::channel(10);

    // 在一个异步任务中发送消息
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).unwrap();
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    });

    // 在多个异步任务中接收消息
    for _ in 0..3 {
        let mut rx = rx.clone();
        tokio::spawn(async move {
            loop {
                match rx.recv().await {
                    Ok(msg) => println!("recv msg = {}", msg),
                    Err(_) => break,
                }
            }
        });
    }
}

#[tokio::main]
async fn main() {
    do_something().await;
}
```

## watch channel

watch channel 是一种可以发送多次消息的 channel。它的特点是可以有多个接收端，每个接收端都可以接收到发送端发送的最新消息。

watch channel 适用于以下场景：

1. 线程之间需要传递多次消息。
2. 线程之间需要订阅最新消息。

watch channel 的业务特点如下：

1. 可以发送多次消息，适用于需要多次传递消息的场景。
2. 可以有多个接收端，适用于需要订阅最新消息的场景。
3. 发送和接收操作都是非阻塞的，可以提高程序的并发性能。

watch channel 的优点包括：

1. 可以发送多次消息，适用于需要多次传递消息的场景。
2. 可以有多个接收端，适用于需要订阅最新消息的场景。
3. 高效性能，发送和接收操作都是非阻塞的。

缺点包括：

1. 无法保证消息的顺序性。
2. 需要额外的处理逻辑来处理多个接收端的情况。

### 示例代码

下面是一个使用 watch channel 订阅最新消息的示例代码：

```rust
use tokio::sync::watch;

async fn do_something() {
    // 创建一个watch channel
    let (tx, mut rx) = watch::channel(0);

    // 在一个异步任务中发送消息
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).unwrap();
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    });

    // 在多个异步任务中接收消息
    for _ in 0..3 {
        let mut rx = rx.clone();
        tokio::spawn(async move {
            loop {
                let msg = rx.recv().await.unwrap();
                println!("recv msg = {}", msg);
            }
        });
    }
}

#[tokio::main]
async fn main() {
    do_something().await;
}
```

## 总结

tokio 模块的 channel 组件是一种高效的异步通信机制，可以用于线程之间的协作和同步。其中的 oneshot、broadcast 和 watch 三种类型的 channel 各有特点，适用于不同的场景。在实际开发中，需要根据业务需求选择合适的类型，并进行合理的使用和处理。
