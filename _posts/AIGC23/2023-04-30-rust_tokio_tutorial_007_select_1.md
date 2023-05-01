---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的select!宏(下)
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Tokio 是一个基于 Rust 语言的异步编程框架，它提供了一组工具和库，使得异步编程变得更加容易和高效。其中最重要的组件之一就是 select!宏。

select!宏是 Tokio 中的一个核心宏，它可以让我们同时监听多个异步事件，一旦其中一个事件触发，就可以立即执行相应的代码。在本教程中，我们将详细介绍 select!宏的进阶用法，并提供多个示例来帮助您更好地理解和掌握这个宏的使用方法。

## 进阶用法

除了基础用法之外，select!宏还有一些进阶用法，可以帮助我们更好地利用这个宏的强大功能。下面让我们来介绍一些进阶用法，并提供相应的示例。

### 使用 select!宏的循环

select!宏可以嵌套在循环语句中，以便我们可以持续监听异步事件的状态。下面是一个示例，它演示了如何使用 select!宏在循环中持续监听两个 Future 的状态：

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
    loop {
        select! {
            result1 = future1().fuse() => {
                println!("future1 completed with result: {}", result1);
            }
            result2 = future2().fuse() => {
                println!("future2 completed with result: {}", result2);
            }
        }
    }
}
```

在这个示例中，我们使用 select!宏在一个无限循环中持续监听 future1 和 future2 的状态。这样，无论何时其中一个 Future 完成，我们都可以立即处理其结果。

### 使用 select!宏的复合模式

select!宏还支持使用复合模式来匹配多个事件。复合模式由多个简单模式组成，它们之间使用|运算符连接。下面是一个示例，它演示了如何使用复合模式来监听多个 Future 的状态：

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
    loop {
        select! {
            result1 = future1().fuse() | result2 = future2().fuse() => {
                if let Some(result) = result1 {
                    println!("future1 completed with result: {}", result);
                }
                if let Some(result) = result2 {
                    println!("future2 completed with result: {}", result);
                }
            }
        }
    }
}
```

在这个示例中，我们使用复合模式来监听 future1 和 future2 的状态。如果其中一个 Future 完成，我们就可以在代码块中处理其结果。

### 使用 loop 和 break 来实现多次选择

假设我们有一个异步任务`task`，我们希望在它完成之前等待一段时间，如果这段时间内它还没有完成，就认为它已经超时了。但是，我们希望在超时之后再等待一段时间，如果这段时间内它还没有完成，就再次认为它已经超时了。这时，我们可以使用 loop 和 break 来实现多次选择：

```rust
use tokio::select;
use tokio::time::{Duration, sleep};

#[tokio::main]
async fn main() {
    let mut task = async {
        // 异步任务的代码
    };

    loop {
        let result = select! {
            result = task => result,
            _ = sleep(Duration::from_secs(5)) => {
                println!("task timeout");
                None
            }
        };

        if let Some(result) = result {
            println!("completed task result: {}", result);
            break;
        }
    }
}
```

在这个示例中，我们定义了一个异步任务`task`，并使用`select!`宏来等待它完成。同时，我们还使用了`sleep`函数来等待 5 秒钟。当`task`完成时，我们会返回它的结果；当 5 秒钟过去后，我们会返回一个`None`。在`loop`中，我们会不断地使用`select!`宏来等待`task`的完成或超时，并根据返回值来决定是否跳出循环。

### 使用 if let 来处理多个异步任务的结果

假设我们有多个异步任务`task1`、`task2`和`task3`，我们希望在它们全部完成后对它们的结果进行处理。这时，我们可以使用 if let 来处理多个异步任务的结果：

```rust
use tokio::select;

#[tokio::main]
async fn main() {
    let mut task1 = async {
        // 异步任务1的代码
        Ok("task1 result")
    };
    let mut task2 = async {
        // 异步任务2的代码
        Ok("task2 result")
    };
    let mut task3 = async {
        // 异步任务3的代码
        Ok("task3 result")
    };

    let mut result1 = None;
    let mut result2 = None;
    let mut result3 = None;

    select! {
        r = task1 => {
            result1 = Some(r);
        },
        r = task2 => {
            result2 = Some(r);
        },
        r = task3 => {
            result3 = Some(r);
        }
    }

    if let (Some(result1), Some(result2), Some(result3)) = (result1, result2, result3) {
        println!("completed task results: {}, {}, {}", result1, result2, result3);
    }
}
```

在这个示例中，我们定义了多个异步任务，并使用`select!`宏来等待它们全部完成。同时，我们使用了三个变量`result1`、`result2`和`result3`来存储它们的结果。在`if let`中，我们会判断这三个变量是否都有值，如果都有值，就打印出它们的结果。

### 使用 select!宏来实现异步任务的取消

假设我们有一个异步任务`task`，我们希望在它完成之前等待一段时间，如果这段时间内它还没有完成，就取消它。这时，我们可以使用 select!宏来实现异步任务的取消：

```rust
use tokio::select;
use tokio::time::{Duration, sleep};

#[tokio::main]
async fn main() {
    let mut task = async {
        // 异步任务的代码
    };

    let result = select! {
        result = task => result,
        _ = sleep(Duration::from_secs(5)) => {
            task.abort();
            None
        }
    };

    match result {
        Some(result) => println!("completed task result: {}", result),
        None => println!("task cancelled")
    }
}
```

在这个示例中，我们定义了一个异步任务`task`，并使用`select!`宏来等待它完成。同时，我们还使用了`sleep`函数来等待 5 秒钟。当`task`完成时，我们会返回它的结果；当 5 秒钟过去后，我们会取消`task`。最后，我们会根据`result`的值来打印出完成的任务的结果或取消信息。

## 结语

在本篇教程中，我们介绍了 Rust 语言中的 Tokio 模块 select!宏的进阶用法，并提供了一些示例代码。通过学习这些内容，我们可以更好地掌握这个宏的使用，从而编写出更加高效和高质量的异步代码。
