---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的select!宏(上)
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Tokio 是一个基于 Rust 语言的异步编程框架，它提供了一组工具和库，使得异步编程变得更加容易和高效。其中最重要的组件之一就是 select!宏。

select!宏是 Tokio 中的一个核心宏，它可以让我们同时监听多个异步事件，一旦其中一个事件触发，就可以立即执行相应的代码。在本教程中，我们将详细介绍 select!宏的基础用法和进阶用法，并提供多个示例来帮助您更好地理解和掌握这个宏的使用方法。

## 基础用法

在介绍 select!宏的基础用法之前，我们需要先了解一下 Tokio 中的 Future 和 Task。

### Future

Future 是 Tokio 中的一个重要概念，它代表了一个异步操作的未来结果。在 Rust 中，Future 是一个 trait，它定义了异步操作的执行过程和返回值。我们可以通过实现 Future trait 来定义自己的异步操作。

例如，下面的代码定义了一个简单的 Future，它返回一个字符串：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct MyFuture;

impl Future for MyFuture {
    type Output = String;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        Poll::Ready(String::from("Hello, world!"))
    }
}
```

在这个例子中，我们实现了 Future trait，并在 poll 函数中返回了一个包含字符串“Hello, world!”的 Ready 枚举值。这个 Future 的类型是 MyFuture，它的 Output 类型是 String。

### Task

Task 是 Tokio 中的另一个重要概念，它代表了一个异步操作的执行上下文。每个 Task 都有一个关联的 Future，它负责执行 Future 中定义的异步操作，并在操作完成时返回结果。

在 Tokio 中，每个 Task 都由一个 Executor 来管理。Executor 是一个可以执行异步操作的线程池，它负责调度和执行所有的异步操作。当我们创建一个 Task 时，它会被分配到 Executor 中的一个线程上，并在该线程上执行异步操作。

现在我们已经了解了 Future 和 Task 的基本概念，下面让我们来介绍 select!宏的基础用法。

### 基本语法

select!宏的基本语法如下：

```rust
select! {
    pattern1 => {
        // 处理pattern1的代码
    }
    pattern2 => {
        // 处理pattern2的代码
    }
    // ...
}
```

其中，pattern1、pattern2 等是一组用于匹配异步事件的模式。每个模式都可以与一个关联的 Future 相关联，如果该 Future 的状态与模式匹配，则执行相应的代码块。

下面是一个简单的示例，它演示了如何使用 select!宏同时监听两个 Future 的状态：

```rust
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

async fn future2() -> String {
    sleep(Duration::from_secs(2)).await;
    String::from("future2")
}

#[tokio::main]
async fn main() {
    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        result2 = future2().fuse() => {
            println!("future2 completed with result: {}", result2);
        }
    }
}
```

在这个示例中，我们定义了两个 Future：future1 和 future2。future1 会在 1 秒后返回一个字符串“future1”，而 future2 会在 2 秒后返回一个字符串“future2”。在 main 函数中，我们使用 select!宏同时监听这两个 Future 的状态，并在其中一个 Future 完成时打印出其返回值。

### 同时监听多个 Future

select!宏最常用的场景之一就是同时监听多个 Future 的状态。下面是一个示例，它演示了如何使用 select!宏同时监听三个 Future 的状态：

```rust
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

async fn future2() -> String {
    sleep(Duration::from_secs(2)).await;
    String::from("future2")
}

async fn future3() -> String {
    sleep(Duration::from_secs(3)).await;
    String::from("future3")
}

#[tokio::main]
async fn main() {
    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        result2 = future2().fuse() => {
            println!("future2 completed with result: {}", result2);
        }
        result3 = future3().fuse() => {
            println!("future3 completed with result: {}", result3);
        }
    }
}
```

在这个示例中，我们定义了三个 Future：future1、future2 和 future3。它们分别在 1 秒、2 秒和 3 秒后返回一个字符串。在 main 函数中，我们使用 select!宏同时监听这三个 Future 的状态，并在其中一个 Future 完成时打印出其返回值。

### 同时监听 Future 和 Channel

除了监听多个 Future 的状态，select!宏还可以同时监听 Future 和 Channel 的状态。下面是一个示例，它演示了如何使用 select!宏同时监听一个 Future 和一个 Channel 的状态：

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(10);

    tokio::spawn(async move {
        for i in 1..=5 {
            tx.send(i).await.unwrap();
            sleep(Duration::from_secs(1)).await;
        }
    });

    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        msg = rx.recv() => {
            println!("received message: {:?}", msg);
        }
    }
}
```

在这个示例中，我们定义了一个 Future：future1，它会在 1 秒后返回一个字符串。我们还创建了一个 Channel，它可以用于在异步任务之间传递消息。在 main 函数中，我们使用 select!宏同时监听 future1 和 Channel 的状态，并在其中一个事件触发时打印出相应的信息。

### 同时监听多个 Channel

select!宏还可以同时监听多个 Channel 的状态。下面是一个示例，它演示了如何使用 select!宏同时监听两个 Channel 的状态：

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (tx1, mut rx1) = mpsc::channel(10);
    let (tx2, mut rx2) = mpsc::channel(10);

    tokio::spawn(async move {
        for i in 1..=5 {
            tx1.send(i).await.unwrap();
            sleep(Duration::from_secs(1)).await;
        }
    });

    tokio::spawn(async move {
        for i in 1..=5 {
            tx2.send(i * 2).await.unwrap();
            sleep(Duration::from_secs(2)).await;
        }
    });

    select! {
        msg1 = rx1.recv() => {
            println!("received message from channel 1: {:?}", msg1);
        }
        msg2 = rx2.recv() => {
            println!("received message from channel 2: {:?}", msg2);
        }
    }
}
```

在这个示例中，我们创建了两个 Channel：rx1 和 rx2。它们分别在 1 秒和 2 秒后发送一系列整数。在 main 函数中，我们使用 select!宏同时监听这两个 Channel 的状态，并在其中一个 Channel 有消息到达时打印出相应的信息。

### 同时监听多个 Future 和 Channel

select!宏还可以同时监听多个 Future 和 Channel 的状态。下面是一个示例，它演示了如何使用 select!宏同时监听两个 Future 和两个 Channel 的状态：

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

async fn future2() -> String {
    sleep(Duration::from_secs(2)).await;
    String::from("future2")
}

#[tokio::main]
async fn main() {
    let (tx1, mut rx1) = mpsc::channel(10);
    let (tx2, mut rx2) = mpsc::channel(10);

    tokio::spawn(async move {
        for i in 1..=5 {
            tx1.send(i).await.unwrap();
            sleep(Duration::from_secs(1)).await;
        }
    });

    tokio::spawn(async move {
        for i in 1..=5 {
            tx2.send(i * 2).await.unwrap();
            sleep(Duration::from_secs(2)).await;
        }
    });

    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        result2 = future2().fuse() => {
            println!("future2 completed with result: {}", result2);
        }
        msg1 = rx1.recv() => {
            println!("received message from channel 1: {:?}", msg1);
        }
        msg2 = rx2.recv() => {
            println!("received message from channel 2: {:?}", msg2);
        }
    }
}
```

在这个示例中，我们创建了两个 Future：future1 和 future2，以及两个 Channel：rx1 和 rx2。它们分别在不同的时间发送一系列整数和字符串。在 main 函数中，我们使用 select!宏同时监听这四个事件的状态，并在其中一个事件触发时打印出相应的信息。

### 使用 timeout

select!宏还支持使用 timeout 来限制异步操作的执行时间。下面是一个示例，它演示了如何使用 select!宏和 timeout 来限制异步操作的执行时间：

```rust
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

#[tokio::main]
async fn main() {
    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        _ = sleep(Duration::from_secs(2)).fuse() => {
            println!("timeout");
        }
    }
}
```

在这个示例中，我们定义了一个 Future：future1，它会在 1 秒后返回一个字符串。在 main 函数中，我们使用 select!宏同时监听 future1 和一个 2 秒的 timeout。如果 future1 在 2 秒内完成，就会打印出其返回值；否则，会打印出“timeout”。

### 使用 select!宏的默认分支

最后一个基础用法示例演示了如何使用 select!宏的默认分支。默认分支可以用于处理所有未匹配的事件，这样我们就可以在一个 select!宏中同时监听多个异步事件，而不需要为每个事件都提供一个匹配模式。

```rust
use tokio::time::{sleep, Duration};

async fn future1() -> String {
    sleep(Duration::from_secs(1)).await;
    String::from("future1")
}

async fn future2() -> String {
    sleep(Duration::from_secs(2)).await;
    String::from("future2")
}

#[tokio::main]
async fn main() {
    select! {
        result1 = future1().fuse() => {
            println!("future1 completed with result: {}", result1);
        }
        result2 = future2().fuse() => {
            println!("future2 completed with result: {}", result2);
        }
        _ = tokio::time::sleep(Duration::from_secs(3)).fuse() => {
            println!("timeout");
        }
        _ = futures::future::pending().fuse() => {
            println!("pending");
        }
        _ = tokio::signal::ctrl_c().fuse() => {
            println!("ctrl-c");
        }
        _ = tokio::io::stdin().read_line(&mut String::new()).fuse() => {
            println!("stdin");
        }
        _ = tokio::net::TcpListener::bind("127.0.0.1:8080").unwrap().accept().fuse() => {
            println!("tcp listener");
        }
        _ = tokio::fs::File::open("test.txt").await.fuse() => {
            println!("file open");
        }
        _ = tokio::process::Command::new("ls").spawn().unwrap().fuse() => {
            println!("command");
        }
        _ => {
            println!("default");
        }
    }
}
```

在这个示例中，我们使用 select!宏同时监听多个异步事件，包括两个 Future、一个 timeout、一个 pending、一个 ctrl-c 信号、一个 stdin 读取、一个 TCP 监听、一个文件打开和一个命令执行。在这些事件中，我们只为前面两个 Future 提供了匹配模式，而其他事件都使用了默认分支来处理。

## 结语

在本篇教程中，我们介绍了 Rust 语言中的 Tokio 模块 select!宏的基础用法，并提供了一些示例代码。通过学习这些内容，我们可以更好地掌握这个宏的使用，从而编写出更加高效和高质量的异步代码。
