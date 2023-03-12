---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Cargo
date: 2023-03-12 12:01:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/2023-03-12-rust_lang_tutorial_02_cargo.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

Cargo是Rust语言的包管理器和构建工具。它能够帮助我们管理依赖、构建项目、运行测试和发布程序等。在Rust社区中，Cargo已经成为了标准的构建工具，它为Rust的开发者提供了极大的便利。

## 安装和使用 cargo

在安装Rust时，Cargo也已经随之安装。
如果你还没有安装Rust，可以参考系列教程的第一篇 `Rust语言从入门到精通系列 - Hello World!`, 也可以前往[官网](https://www.rust-lang.org/) 下载安装包进行安装。
安装完成后，可以通过以下命令来检查Cargo是否安装成功：

```powershell
cargo --version
# cargo 1.68.0 (115f34552 2023-02-26)
```

输出了Cargo的版本号，说明安装成功。环境检查完成，下面开始Cargo的学习。

我们先回顾一下上一篇文章中使用过的Cargo命令。
第一个使用Cargo命令是"cargo new", 创建了我们的第一个Rust项目。没看过第一篇的同学可以尝试如下命令创建：

```powershell
cargo new hello_world
```

这条命令会在当前目录下创建一个名为hello_world的新项目。其中，hello_world是项目的名称，可以根据自己的需要进行修改。
创建完成后，打开项目的目录hello_world。

目录结构如下图所示：

```powershell
/
├── Cargo.lock
├── Cargo.toml
├── crate-information.json
├── src/
│   ├── main.rs
└── target/
└── tools/
```

Cargo生成的最基本的项目结构，包括src目录(用于存放开发的源代码)和Cargo.toml文件(管理项目元数据、编译构建、第三方库依赖等等)。

在src目录下，我们看到一个名为main.rs的文件，它是Rust程序的入口文件，内部实现一个默认的main()方法：

```c
fn main() {
    println!("Hello, world!");
}
```

在main()方法体中输入 `println!("Hello, world!");`
这就是一个非常简单的程序，它的功能是再命令提示符窗口打印输出一句话“Hello, world!”。在VS Code中按 F5 运行你的第一个程序吧。

假如你没有配置VS Code启动配置，那么再运行程序之前，Cargo会先使用build命令来构建项目，生成可执行文件。
至此，我们又新接触了一个cargo命令 build：

```powershell
cargo build
```

cargo build 命令会在项目的根目录下生成一个target目录，其中包含了构建后的二进制文件。在默认情况下，Cargo会生成一个名为hello_world的二进制文件。

如果只想编译项目而不生成二进制文件，可以使用以下命令：

```powershell
cargo check
```

这条命令会检查代码是否可以编译通过，但不会生成二进制文件。

在构建完成后，我们可以使用以下命令来运行程序：

```powershell
cargo run
```

这条命令会自动编译并运行项目。如果一切正常，你应该能够看到和Vs Code按F5启动一样的“Hello, world!”的输出。

## 常用指令

上一小节，我们使用了Cargo的new，build, run, check四个指令，除了这几个指令外，Cargo 还提供了更多的指令，下面列举并注释其中最常用的一些指令：

- new: 指令可以创建一个新的 Rust 项目。它有两个参数，第一个参数是项目名称，第二个参数是项目类型，可以是 bin 或 lib。默认情况下，new 会创建一个二进制bin项目。
- init: 指令可以将当前目录初始化为一个 Rust 项目。它会创建一个默认的 src 目录和 Cargo.toml 文件。
- check: 指令可以检查代码是否可以编译通过，但 **不会生成二进制文件**。
- build: 指令可以编译 Rust 项目，并生成二进制文件。如果项目已经编译过，build 指令会跳过编译过程。
- run: 指令可以编译并运行 Rust 项目。如果项目已经编译过，run 指令会跳过编译过程。
- test: 指令可以运行项目中的测试。测试代码通常放在 src/test.rs 或 src/lib.rs 中。
- bench: 指令可以运行项目中的基准测试。基准测试用来测试代码的性能。
- doc: 指令可以生成项目的文档。文档通常使用 Rust 内置的文档工具 rustdoc 来生成。
- clean: 指令可以清除项目的构建文件和生成的二进制文件。
- update: 指令可以更新项目中的依赖。
- publish: 指令可以将项目发布到 crates.io 上，供其他人使用。

更多指令可以通过 cargo --help 或 cargo \<command> --help 查看。

## 依赖管理

在Rust项目中，我们可以使用Cargo来管理依赖。可以通过编辑Cargo.toml文件来添加依赖。
例如，我们想要使用rand库来生成随机数，可以在Cargo.toml文件中添加以下内容：

```ini
[dependencies]
rand = "0.8.4"
```

这条语句告诉Cargo，我们需要使用rand库，并且希望使用版本号为0.8.4的版本。在保存文件后，可以使用以下命令来安装依赖：
```rust
cargo build
```

这条命令会自动下载并安装依赖。
在代码中使用依赖时，我们需要在main.rs文件中添加以下语句：

```c
use rand::Rng;

fn main() {
    let mut rng = rand::thread_rng();
    let n: u8 = rng.gen();
    println!("Random number: {}", n);
}
```

这里，我们使用了rand库中的Rng trait和thread_rng函数来生成随机数。

### 版本号控制

上面的示例我们引入了指定0.8.4版本的rand库依赖，并在命令提示符中打印了随机数。这里我们进一步对依赖管理进行学习。

除了指定依赖的特定版本外，我们还可以使用逻辑运算符控制版本范围, 具体如下：

 - =: 等于某个版本。等同于直接填写版本号
 - \>: 大于某个版本。
 - <=: 小于等于某个版本。
 - ~: 大约等于某个版本，例如~1.2.3表示大约等于1.2.3，但是允许最后一位数字不同，例如1.2.4。
 - \^: 兼容某个版本，例如^1.2.3表示兼容1.2.x系列的所有版本，但是不兼容2.0.0及以上版本。

假如我们想指定依赖库的版本号大于等于0.7.3版本 且 小于0.8.4，示例：

```ini
[dependencies]
rand = ">=0.7.3, <0.8.4"
```

### 指定依赖项的特性

有些库提供了多个特性，可以用来启用或禁用某些功能。例如，serde库提供了一个名为derive的特性，用于启用派生宏。为了指定依赖项的特性，可以使用如下语法：

```ini
[dependencies]
库名称 = { version = "版本号", features = ["特性名称"] }
```

log是一个用于日志记录的库。它提供了多个特性，可以用来启用或禁用某些功能。下面是一些常见的特性及其用途：

 - std: 用于启用log的标准库支持，可以在标准库环境中使用log。
 - env_logger: 用于启用log的环境变量支持，可以使用环境变量来控制日志输出。
 - log4rs: 用于启用log的log4rs支持，可以使用log4rs库来配置日志输出。
 - simplelog: 用于启用log的simplelog支持，可以使用simplelog库来配置日志输出。

下面是一个示例：
```ini
[dependencies]
log = { version = "0.4", features = ["std"] }
```

除了启用特性之外，还可以禁用特性，例如：
```ini
[dependencies]
log = { version = "0.4", default-features = false }
```

### 指定依赖项的路径

在某些情况下，我们可能需要使用本地文件系统中的库。为了指定依赖项的路径，可以使用如下语法：
```ini
[dependencies]
rand = { path = "../rand" }
```

在这个例子中，我们指定了一个名为rand的库，路径为../rand。这告诉Cargo编译器，我们的项目需要使用本地文件系统中的rand库。当我们运行cargo build命令时，Cargo会自动编译指定路径下的rand库，并将它添加到我们的项目中。

除了使用本地文件系统中的库之外，我们还可以使用git仓库中的库。为了指定依赖项的git仓库，可以使用如下语法：
```ini
[dependencies]
rand = { git = "https://github.com/rust-lang-nursery/rand.git" }
```

## 项目元数据

本文的前面章节介绍了Cargo的常用质量，依赖管理特性。本小节主要讲解Cargo.toml文件中定义的程序元数据，例如：程序的名称、版本号、作者和描述等信息：

```ini
[package]
##    项目名(程序名称)
name = "hello_world"
##    版本号
version = "0.1.0"
##    作者, 多个按逗号分隔
authors = ["Your Name <your_email@example.com>"]
##    项目描述
description = "A hello world program in Rust."
##    Rust语言的版本，目前支持2015、2018和2021 三个版本。
edition = "2021"
```

除了基础的元数据外，我们还可以在[package.metadata]下自定义专属的元数据：

```ini
[package.metadata]
url = "https://github.com/username/hello-world"
doc = "https://docs.rs/hello-world"
repository = "https://github.com/username/hello-world.git"
```

## 总结

通过本文的介绍，我们了解了Rust语言的包管理器和构建工具Cargo。学习了如何创建一个新的Rust项目、编写Rust程序、构建和运行程序、添加依赖等操作。


