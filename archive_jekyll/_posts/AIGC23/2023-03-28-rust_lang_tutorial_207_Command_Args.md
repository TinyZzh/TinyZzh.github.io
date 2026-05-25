---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 解析控制台参数
date: 2023-03-28 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, structopt]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一种安全、高效的系统编程语言，其标准库以及外部库提供了很多处理控制台参数的方式。在本篇文章中，我们将分别介绍如何使用 Rust 的标准库处理控制台参数，以及如何使用 structopt 库处理控制台参数。我们还将介绍如何使用 structopt 处理复杂结构参数，并且提供相应的示例代码。

## 处理控制台参数

Rust 标准库提供了处理控制台参数的方式，主要基于三个模块：std::env、std::process 和 std::os::unix。在下面的例子中，我们将展示如何使用这些模块来处理控制台参数：

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    println!("program name is {}", args[0]);

    for arg in args.iter().skip(1) {
        println!("Argument: {}", arg);
        match arg.as_str() {
            "-v" => println!("version is xxx"),
            "-h" => println!("Help message"),
            _ => println!("Unknown argument: {}", arg),
        }
    }
}
```

在这个例子中，我们使用了 std::env::args 函数来获取命令行参数，该函数返回一个迭代器，我们需要将其转换为一个向量来方便地处理。接下来，我们使用'iter'函数和命令行参数向量创建一个迭代器。我们执行了'as_str'函数将迭代器值转换为其引用，我们再次使用 match 语句对参数进行筛选，并显示相应的消息。

在处理控制台参数时，我们通常需要定义一组选项和参数，这些选项和参数可以通过命令行传递给程序。很明显假如我们仅使用标准库提供的 API 手动解析命令行参数，会非常耗时且麻烦。万幸的是，Rust 社区提供了开源的 structopt 库来帮助我们解析。

## 使用 structopt 库处理控制台参数

structopt 库提供了一种定义命令行选项和参数的方式，并自动生成解析代码的方法。它使用`#[derive]`属性来自动生成解析代码，这使得处理控制台参数变得非常简单。

首先，我们需要将 structopt 库添加到我们的 Cargo.toml 文件中：

```toml
[dependencies]
structopt = "0.3.21"
```

然后，我们可以使用`#[derive]`来创建一个结构体，用于定义程序的所有选项和参数。例如，下面的代码定义了一个结构体，其中包含一个字符串参数和两个布尔选项：

```rust
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
struct Opt {
    #[structopt(parse(from_os_str))]
    filename: std::path::PathBuf,
    #[structopt(short = "v", long = "verbose")]
    verbose: bool,
    #[structopt(short = "f", long = "force")]
    force: bool,
}
```

在上面的代码中，我们使用`#[derive(StructOpt)]`属性来告诉 structopt 库自动生成解析代码。我们还定义了三个字段：一个路径参数`filename`，以及两个布尔选项`verbose`和`force`。在这里，我们将`filename`字段标记为`parse(from_os_str)`，以便自动将其转换为`PathBuf`类型。

接下来，我们可以在程序的`main`函数中使用`Opt::from_args()`函数来解析命令行参数并获取我们定义的选项和参数：

```rust
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
struct Opt {
    #[structopt(parse(from_os_str))]
    filename: std::path::PathBuf,
    #[structopt(short = "v", long = "verbose")]
    verbose: bool,
    #[structopt(short = "f", long = "force")]
    force: bool,
}

fn main() {
    let args = Opt::from_args();
    println!("{:?}", args);
}
```

上面的代码将打印出程序的所有选项和参数，例如，如果我们运行`./main -v -f /path/to/file.txt`，则输出将是`Opt { filename: "/path/to/file.txt", verbose: true, force: true }`。

structopt 库还提供了许多其他选项和参数，例如子命令、默认值和验证函数等。有关更多详细信息，请参见官方文档。

## structopt 处理复杂结构参数

在处理控制台参数时，我们通常需要处理一些复杂的结构参数，例如具有嵌套字段的结构体或向量。在这种情况下，我们可以使用 structopt 库的`#[structopt(flatten)]`和`#[structopt(skip)]`属性来解决问题。

首先，让我们考虑一个具有嵌套字段的结构体。例如，下面的代码定义了一个包含名称、年龄和地址的人员结构体，其中地址包含城市、州和国家等嵌套字段：

```rust
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
struct Address {
    city: String,
    state: String,
    country: String,
}

#[derive(Debug, StructOpt)]
struct Animal {
    name: String,
    age: u8,
    #[structopt(flatten)]
    address: Address,
}

fn main() {
    let args = Animal::from_args();
    println!("{:?}", args);
}
```

在上面的代码中，我们使用`#[structopt(flatten)]`属性将`Address`结构体的字段展开到`Animal`结构体中。现在，我们可以将`Animal`结构体作为命令行参数传递给程序：

```bash
$ ./main --name Tom --age 30 --city Chengdu --state Chengdu --country China
```

上面的命令将创建一个`Animal`结构体，其中包含名称为 Tom、年龄为 30 岁、地址为北京市、北京市、中国的人员信息。

接下来，让我们考虑一个包含向量字段的结构体。例如，下面的代码定义了一个包含名称、年龄和朋友列表的人员结构体：

```rust
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
struct Animal {
    name: String,
    age: u8,
    #[structopt(skip)]
    friends: Vec<String>,
}

fn main() {
    let args = Animal::from_args();
    println!("{:?}", args);
}
```

在上面的代码中，我们使用`#[structopt(skip)]`属性将`friends`字段跳过，因为我们将使用自定义代码来处理它。现在，我们可以将`Animal`结构体作为命令行参数传递给程序：

```bash
$ ./main --name Tom --age 30 --friends Bob --friends Charlie --friends Dave
```

上面的命令将创建一个`Animal`结构体，其中包含名称为 Tom、年龄为 30 岁、朋友列表包含 Bob、Charlie 和 Dave 的人员信息。我们还需要手动将命令行参数中的朋友列表转换为向量字段。我们可以使用`std::iter::FromIterator` trait 来将命令行参数转换为向量字段：

```rust
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
struct Animal {
    name: String,
    age: u8,
    #[structopt(skip)]
    friends: Vec<String>,
}

impl Animal {
    fn from_args() -> Self {
        let mut args = Vec::from_iter(std::env::args());
        let friends = args
            .iter()
            .enumerate()
            .filter_map(|(i, arg)| if i > 0 && args[i - 1] == "--friends" { Some(arg) } else { None })
            .map(|arg| arg.to_owned())
            .collect();
        let args = Animal::clap().get_matches_from(args);
        let name = args.value_of("name").unwrap().to_owned();
        let age = args.value_of("age").unwrap().parse().unwrap();
        Animal { name, age, friends }
    }
}

fn main() {
    let args = Animal::from_args();
    println!("{:?}", args);
}
```

上面的代码使用`std::env::args()`函数获取命令行参数，并使用`Vec::from_iter()`函数将其转换为向量。然后，我们使用`filter_map()`函数和`enumerate()`函数来获取命令行参数中的朋友列表。接下来，我们使用`std::iter::FromIterator` trait 将朋友列表转换为向量，并将其存储在`friends`字段中。最后，我们使用`Animal::clap().get_matches_from()`函数来解析其他选项和参数，并使用`name`和`age`字段创建一个`Animal`结构体。

## 结论

在本教程中，我们介绍了如何使用 Rust 的标准库和 structopt 库来处理控制台参数。我们讨论了处理简单参数和选项的方法，以及处理复杂结构参数的方法。structopt 库提供了一种简单而强大的方式来定义命令行选项和参数，并自动生成解析代码。如果您需要处理控制台参数，那么 structopt 库是您的最佳选择。
