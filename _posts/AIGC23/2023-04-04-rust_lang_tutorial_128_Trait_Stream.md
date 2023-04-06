---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Stream特征
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Stream]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Stream 是 Rust 语言中的一种迭代器，它可以使得我们在处理数据时更加高效、灵活。Stream 不仅可以处理大量数据，还可以进行异步操作，这使得它在处理网络请求等 IO 操作时非常有用。

Stream 的核心概念是将数据视为流，每次处理一个元素，而不是将整个数据集加载到内存中。这样可以避免内存占用过大的问题，同时也能够提高程序的效率。

## 基础用法

### 创建 Stream

在 Rust 中，我们可以使用`iter`方法来创建 Stream。例如，我们可以使用以下代码来创建一个包含 1 到 5 的 Stream：

```rust
let stream = (1..=5).into_iter();
```

这里使用了`into_iter`方法将一个范围转换为 Stream。

### 遍历 Stream

遍历 Stream 可以使用`for_each`方法，例如：

```rust
stream.for_each(|x| println!("{}", x));
```

这里使用了闭包来打印每个元素。

### 过滤 Stream

我们可以使用`filter`方法来过滤 Stream 中的元素，例如：

```rust
let stream = (1..=5).into_iter().filter(|x| x % 2 == 0);
```

这里使用了闭包来判断元素是否为偶数。

### 映射 Stream

我们可以使用`map`方法来对 Stream 中的元素进行映射，例如：

```rust
let stream = (1..=5).into_iter().map(|x| x * 2);
```

这里使用了闭包来将每个元素乘以 2。

### 合并 Stream

我们可以使用`chain`方法来合并多个 Stream，例如：

```rust
let stream1 = (1..=3).into_iter();
let stream2 = (4..=6).into_iter();
let stream = stream1.chain(stream2);
```

这里使用了`chain`方法将两个 Stream 合并为一个。

### 排序 Stream

我们可以使用`sorted`方法来对 Stream 中的元素进行排序，例如：

```rust
let stream = vec![3, 1, 4, 1, 5, 9].into_iter().sorted();
```

这里使用了`sorted`方法将 Stream 中的元素按照升序排序。

### 取前 n 个元素

我们可以使用`take`方法来取 Stream 中的前 n 个元素，例如：

```rust
let stream = (1..=5).into_iter().take(3);
```

这里使用了`take`方法取 Stream 中的前 3 个元素。

### 跳过前 n 个元素

我们可以使用`skip`方法来跳过 Stream 中的前 n 个元素，例如：

```rust
let stream = (1..=5).into_iter().skip(2);
```

这里使用了`skip`方法跳过 Stream 中的前 2 个元素。

### 统计元素个数

我们可以使用`count`方法来统计 Stream 中的元素个数，例如：

```rust
let stream = (1..=5).into_iter();
let count = stream.count();
println!("{}", count);
```

这里使用了`count`方法统计 Stream 中的元素个数，并打印出来。

## 进阶用法

### 异步 Stream

在 Rust 中，我们可以使用`futures`库来创建异步 Stream。例如，我们可以使用以下代码来创建一个异步 Stream：

```rust
use futures::stream::StreamExt;

let stream = futures::stream::iter(vec![1, 2, 3]);
```

这里使用了`iter`方法来创建一个包含 1 到 3 的异步 Stream。

### 并行 Stream

在 Rust 中，我们可以使用`rayon`库来创建并行 Stream。例如，我们可以使用以下代码来创建一个并行 Stream：

```rust
use rayon::iter::ParallelIterator;

let stream = (1..=5).into_par_iter();
```

这里使用了`into_par_iter`方法将一个范围转换为并行 Stream。

### 处理 Stream 中的错误

在处理 Stream 时，有时候会出现错误。我们可以使用`Result`来处理这些错误。例如，我们可以使用以下代码来处理 Stream 中的错误：

```rust
let stream = vec![1, 2, "a", 3].into_iter().map(|x| {
    if let Some(y) = x.downcast_ref::<i32>() {
        Ok(*y)
    } else {
        Err("not a number")
    }
});

for item in stream {
    match item {
        Ok(x) => println!("{}", x),
        Err(e) => println!("{}", e),
    }
}
```

这里使用了`downcast_ref`方法将元素转换为`i32`类型，如果转换失败则返回错误。

### 无限 Stream

在 Rust 中，我们可以使用`repeat`方法来创建一个无限 Stream。例如，我们可以使用以下代码来创建一个包含无限个 1 的 Stream：

```rust
let stream = std::iter::repeat(1);
```

这里使用了`repeat`方法将 1 重复无限次。

### 处理 Stream 中的重复元素

在处理 Stream 时，有时候会出现重复元素的情况。我们可以使用`dedup`方法来去除 Stream 中的重复元素。例如：

```rust
let stream = vec![1, 2, 2, 3, 3, 3].into_iter().dedup();
```

这里使用了`dedup`方法去除 Stream 中的重复元素。

### 处理 Stream 中的空元素

在处理 Stream 时，有时候会出现空元素的情况。我们可以使用`filter`方法来过滤掉 Stream 中的空元素。例如：

```rust
let stream = vec![1, 2, "", 3, "", ""].into_iter().filter(|x| !x.is_empty());
```

这里使用了`filter`方法过滤掉 Stream 中的空元素。

### 处理 Stream 中的 None 值

在处理 Stream 时，有时候会出现 None 值的情况。我们可以使用`filter_map`方法来过滤掉 Stream 中的 None 值。例如：

```rust
let stream = vec![Some(1), None, Some(2), None, Some(3)].into_iter().filter_map(|x| x);
```

这里使用了`filter_map`方法过滤掉 Stream 中的 None 值。

### 处理 Stream 中的重复元素

在处理 Stream 时，有时候会出现重复元素的情况。我们可以使用`dedup_by`方法来去除 Stream 中的重复元素。例如：

```rust
let stream = vec!["a", "b", "bc", "cd", "de", "ef"].into_iter().dedup_by(|a, b| a.chars().next() == b.chars().next());
```

这里使用了`dedup_by`方法去除 Stream 中的重复元素，去重条件是元素的首字母相同。

## 最佳实践

在使用 Stream 时，我们应该注意以下几点：

- 尽量使用异步 Stream 来处理 IO 操作，这样可以避免阻塞线程。
- 在处理大量数据时，应该使用并行 Stream 来提高程序的效率。
- 在处理错误时，应该使用`Result`来处理错误，避免程序崩溃。
- 在处理无限 Stream 时，应该使用`take`方法限制 Stream 的大小，避免程序无限运行。
- 在处理重复元素时，应该使用`dedup`或`dedup_by`方法去除重复元素，避免重复计算。

## 示例代码

下面是一个完整的示例代码，演示了如何使用 Stream 来处理数据：

```rust
use futures::stream::StreamExt;
use itertools::Itertools;
use rayon::iter::ParallelIterator;

fn main() {
    // 创建Stream
    let stream = (1..=5).into_iter();

    // 遍历Stream
    stream.for_each(|x| println!("{}", x));

    // 过滤Stream
    let stream = (1..=5).into_iter().filter(|x| x % 2 == 0);
    stream.for_each(|x| println!("{}", x));

    // 映射Stream
    let stream = (1..=5).into_iter().map(|x| x * 2);
    stream.for_each(|x| println!("{}", x));

    // 合并Stream
    let stream1 = (1..=3).into_iter();
    let stream2 = (4..=6).into_iter();
    let stream = stream1.chain(stream2);
    stream.for_each(|x| println!("{}", x));

    // 排序Stream
    let stream = vec![3, 1, 4, 1, 5, 9].into_iter().sorted();
    stream.for_each(|x| println!("{}", x));

    // 取前n个元素
    let stream = (1..=5).into_iter().take(3);
    stream.for_each(|x| println!("{}", x));

    // 跳过前n个元素
    let stream = (1..=5).into_iter().skip(2);
    stream.for_each(|x| println!("{}", x));

    // 统计元素个数
    let stream = (1..=5).into_iter();
    let count = stream.count();
    println!("{}", count);

    // 异步Stream
    let stream = futures::stream::iter(vec![1, 2, 3]);
    futures::executor::block_on(async {
        stream.for_each(|x| async move {
            println!("{}", x);
        }).await;
    });

    // 并行Stream
    let stream = (1..=5).into_par_iter();
    stream.for_each(|x| println!("{}", x));

    // 处理Stream中的错误
    let stream = vec![1, 2, "a", 3].into_iter().map(|x| {
        if let Some(y) = x.downcast_ref::<i32>() {
            Ok(*y)
        } else {
            Err("not a number")
        }
    });

    for item in stream {
        match item {
            Ok(x) => println!("{}", x),
            Err(e) => println!("{}", e),
        }
    }

    // 无限Stream
    let stream = std::iter::repeat(1).take(5);
    stream.for_each(|x| println!("{}", x));

    // 处理Stream中的重复元素
    let stream = vec![1, 2, 2, 3, 3, 3].into_iter().dedup();
    stream.for_each(|x| println!("{}", x));

    // 处理Stream中的空元素
    let stream = vec![1, 2, "", 3, "", ""].into_iter().filter(|x| !x.is_empty());
    stream.for_each(|x| println!("{}", x));

    // 处理Stream中的None值
    let stream = vec![Some(1), None, Some(2), None, Some(3)].into_iter().filter_map(|x| x);
    stream.for_each(|x| println!("{}", x));

    // 处理Stream中的重复元素
    let stream = vec!["a", "b", "bc", "cd", "de", "ef"].into_iter().dedup_by(|a, b| a.chars().next() == b.chars().next());
    stream.for_each(|x| println!("{}", x));
}
```

## 总结

Stream 是 Rust 语言中非常重要的一个概念，它可以使得我们在处理数据时更加高效、灵活。在使用 Stream 时，我们应该注意异步、并行、错误处理、无限 Stream、重复元素等问题，这样才能写出高效、健壮的程序。
