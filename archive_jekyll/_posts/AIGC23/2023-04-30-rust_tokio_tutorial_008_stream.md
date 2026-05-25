---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的Stream
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在 Rust 语言中，Tokio 是一个非常流行的异步编程框架。它提供了一系列的模块，其中最常用的就是 Stream 模块。Stream 模块允许我们以异步的方式处理数据流，这在很多情况下非常有用。在本教程中，我们将介绍 Stream 模块的基础用法和进阶用法，并提供示例。

## 基础用法

在本节中，我们将介绍 Stream 模块的基础用法，并提供基础示例。

### 从 Vec 中创建 Stream

首先，我们将从一个 Vec 中创建一个 Stream。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let mut stream = tokio::stream::iter(vec);

    while let Some(num) = stream.next().await {
        println!("{}", num);
    }
}
```

在上面的代码中，我们使用了`StreamExt` trait 中的`next`方法来遍历 Stream 中的每个元素。注意，我们需要使用`await`关键字来等待每个元素的到来。

### 从文件中创建 Stream

接下来，我们将介绍如何从文件中创建一个 Stream。假设我们有一个名为`data.txt`的文件，其中包含一些文本行。我们可以使用`tokio::fs::File::open`方法来打开文件，并使用`tokio::io::BufReader`来读取文件中的每一行。

```rust
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::fs::File;

#[tokio::main]
async fn main() {
    let file = File::open("data.txt").await.unwrap();
    let mut reader = BufReader::new(file).lines();

    while let Some(line) = reader.next_line().await.unwrap() {
        println!("{}", line);
    }
}
```

在上面的代码中，我们使用了`AsyncBufReadExt` trait 中的`next_line`方法来遍历 Stream 中的每个元素。注意，我们需要使用`await`关键字来等待每个元素的到来。

### 使用 Stream 的 map 方法

接下来，我们将介绍如何使用 Stream 的`map`方法来对 Stream 中的元素进行转换。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream，并使用`map`方法将每个数字乘以 2。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let mut stream = tokio::stream::iter(vec).map(|x| x * 2);

    while let Some(num) = stream.next().await {
        println!("{}", num);
    }
}
```

在上面的代码中，我们使用了`map`方法将每个数字乘以 2。这种方式非常适合对 Stream 中的元素进行转换。

### 使用 Stream 的 filter 方法

接下来，我们将介绍如何使用 Stream 的`filter`方法来过滤 Stream 中的元素。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream，并使用`filter`方法将大于 5 的数字过滤出来。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let mut stream = tokio::stream::iter(vec).filter(|x| *x > 5);

    while let Some(num) = stream.next().await {
        println!("{}", num);
    }
}
```

在上面的代码中，我们使用了`filter`方法将大于 5 的数字过滤出来。这种方式非常适合对 Stream 中的元素进行过滤。

### 使用 Stream 的 take 方法

接下来，我们将介绍如何使用 Stream 的`take`方法来限制 Stream 中的元素数量。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream，并使用`take`方法限制只输出前 3 个数字。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let mut stream = tokio::stream::iter(vec).take(3);

    while let Some(num) = stream.next().await {
        println!("{}", num);
    }
}
```

在上面的代码中，我们使用了`take`方法限制只输出前 3 个数字。这种方式非常适合对 Stream 中的元素数量进行限制。

### 使用 Stream 的 fold 方法

最后，我们将介绍如何使用 Stream 的`fold`方法来对 Stream 中的元素进行累加。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream，并使用`fold`方法将每个数字相加。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let sum = tokio::stream::iter(vec).fold(0, |acc, x| async move { acc + x }).await;

    println!("{}", sum);
}
```

在上面的代码中，我们使用了`fold`方法将每个数字相加。注意，我们需要使用`async move`关键字来让闭包具有异步能力。

## 进阶用法

在本节中，我们将介绍 Stream 模块的进阶用法，并提供进阶示例。

### 使用 Stream 的 buffer_unordered 方法

首先，我们将介绍如何使用 Stream 的`buffer_unordered`方法来并发处理 Stream 中的元素。假设我们有一个包含数字 1 到 10 的 Vec，我们可以使用`stream::iter`函数来创建一个 Stream，并使用`buffer_unordered`方法并发处理每个数字。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let mut stream = tokio::stream::iter(vec).buffer_unordered(4);

    while let Some(num) = stream.next().await {
        println!("{}", num);
    }
}
```

在上面的代码中，我们使用了`buffer_unordered`方法并发处理每个数字。注意，我们需要使用`await`关键字来等待每个元素的到来。

### 使用 Stream 的 zip 方法

接下来，我们将介绍如何使用 Stream 的`zip`方法将两个 Stream 合并为一个 Stream。假设我们有两个包含数字 1 到 5 的 Vec，我们可以使用`stream::iter`函数来创建两个 Stream，并使用`zip`方法将它们合并为一个 Stream。

```rust
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let vec1 = vec![1, 2, 3, 4, 5];
    let vec2 = vec![6, 7, 8, 9, 10];
    let mut stream1 = tokio::stream::iter(vec1);
    let mut stream2 = tokio::stream::iter(vec2);
    let mut stream = stream1.zip(stream2);

    while let Some((num1, num2)) = stream.next().await {
        println!("{} {}", num1, num2);
    }
}
```

在上面的代码中，我们使用了`zip`方法将两个 Stream 合并为一个 Stream。注意，我们需要使用`await`关键字来等待每个元素的到来。

### 使用 Stream 的 forward 方法

最后，我们将介绍如何使用 Stream 的`forward`方法将一个 Stream 转发到另一个 Stream。假设我们有一个名为`data.txt`的文件，其中包含一些文本行。我们可以使用`tokio::fs::File::open`方法来打开文件，并使用`tokio::io::BufReader`来读取文件中的每一行。然后，我们可以使用`forward`方法将读取的每一行转发到标准输出。

```rust
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::fs::File;
use tokio::stream::StreamExt;

#[tokio::main]
async fn main() {
    let file = File::open("data.txt").await.unwrap();
    let mut reader = BufReader::new(file).lines();
    let stdout = tokio::io::stdout();
    let mut writer = tokio::io::BufWriter::new(stdout);

    reader.forward(&mut writer).await.unwrap();
}
```

在上面的代码中，我们使用了`forward`方法将读取的每一行转发到标准输出。注意，我们需要使用`await`关键字来等待每个元素的到来。

## 结论

在本教程中，我们介绍了 Rust 语言中的 Tokio 模块 Stream 的基础用法和进阶用法。Stream 模块提供了一种非常方便的方式来处理数据流，这在异步编程中非常有用。我们希望这个教程可以帮助你更好地理解 Stream 模块的用法和特性。
