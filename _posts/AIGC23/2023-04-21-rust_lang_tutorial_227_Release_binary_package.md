---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 发布你的跨平台二进制文件
date: 2023-04-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Cargo]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust是一种系统级编程语言，具有高效、安全、并发等特点，因此在一些领域得到了广泛的应用。但是，Rust语言本身并不提供跨平台编译的支持，这对于需要在不同操作系统上运行的项目来说是一个不小的挑战。为了解决这个问题，我们可以使用Cross工具，它可以帮助我们轻松地将Rust程序编译成各种平台的可执行文件。

在本教程中，我们将使用Cross工具来编译一个简单的`加`、`减`、`乘`、`除` 四则运算的计算器，并将其发布到Windows、Mac和Linux等平台。

## 安装Rust和Cargo

具体的安装步骤本篇文章不再赘述，请参考系列的前面的Cargo篇和Hello World篇。输入以下命令，确认编译环境是否准备就绪。

```bash
rustc --version
cargo --version
```

如果输出版本号，则说明环境正常。

## 安装Cross

接下来，我们需要安装Cross工具。在终端中输入以下命令进行安装：

```
cargo install cross
```

安装完成后，同样，在终端使用`cross --version`命令来验证安装是否成功。

## 创建项目

接下来，我们需要创建一个新的Rust项目。在终端中进入你想要创建项目的目录，然后运行以下命令：

```bash
cargo new calculator --bin
```

这将创建一个名为`calculator`的新项目，并且告诉Cargo这是一个二进制文件（`--bin`）。在项目目录中，你会看到一个`src`文件夹和一个`Cargo.toml`文件。

## 编写代码

现在，我们可以开始编写代码了。在`src/main.rs`文件中，输入以下代码：

```rust
use std::io::{self, Write};

fn main() {
    let mut input = String::new();
    print!("Enter an expression: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut input).unwrap();
    let tokens: Vec<&str> = input.trim().split(' ').collect();
    let num1 = tokens[0].parse::<f64>().unwrap();
    let num2 = tokens[2].parse::<f64>().unwrap();
    let operator = tokens[1];
    match operator {
        "+" => println!("{} + {} = {}", num1, num2, num1 + num2),
        "-" => println!("{} - {} = {}", num1, num2, num1 - num2),
        "*" => println!("{} * {} = {}", num1, num2, num1 * num2),
        "/" => println!("{} / {} = {}", num1, num2, num1 / num2),
        _ => println!("Invalid operator"),
    }
}
```

这是一个简单的计算器程序，它可以让用户输入一个操作，然后对两个数字执行该操作。如果操作无效，程序将提示用户重新输入。

## 构建项目

现在，我们可以使用Cargo来构建我们的项目。在终端中进入项目目录，然后运行以下命令：

```bash
cargo build --release
```

这将使用Rust编译器将我们的代码编译成一个二进制文件。`--release`标志将优化代码以提高性能。构建完成后，你将在`target/release`目录中找到一个名为`calculator`的二进制文件。

## 发布二进制文件

现在，我们可以将二进制文件发布到各种平台上，让用户可以使用我们的计算器程序。在Rust中，我们可以使用Cross工具来跨平台构建二进制文件。

首先，我们需要安装Cross。在终端中运行以下命令：

```bash
cargo install cross
```

安装完成后，我们可以使用Cross来构建二进制文件。运行以下命令：

```bash
cross build --release --target x86_64-pc-windows-gnu
cross build --release --target x86_64-apple-darwin
cross build --release --target x86_64-unknown-linux-gnu
```

这将分别构建Windows、Mac和Linux上的二进制文件。构建完成后，你将在`target/x86_64-pc-windows-gnu/release`、`target/x86_64-apple-darwin/release`和`target/x86_64-unknown-linux-gnu/release`目录中找到三个二进制文件。

## 测试二进制文件

现在，我们可以测试我们的二进制文件了。在Windows上，双击`calculator.exe`文件即可运行程序。在Mac和Linux上，打开终端并进入二进制文件所在的目录，然后运行以下命令：

```bash
./calculator
```

程序将启动并提示用户输入操作。输入操作后，程序将执行该操作并输出结果。

## 总结

在本教程中，我们学习了如何使用Rust编写一个简单的加减乘除计算器，并将其发布为二进制文件。我们使用Cargo来管理依赖和构建项目，使用Cross工具来跨平台构建二进制文件。通过这个例子，你可以学习如何使用Rust编写实用的命令行工具，并将其发布到各种平台上。