---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 错误和异常处理
date: 2023-03-17 23:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_12_log.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

# Rust语言错误处理教程

在Rust语言中，错误处理是一项非常重要的任务。由于Rust语言采用静态类型检查，在编译时就能发现很多潜在的错误，这使得程序员能够更加自信和高效地开发程序。然而，即使我们在编译时尽可能地考虑了所有可能的错误，实际运行中仍然可能出现各种各样的错误，比如文件不存在、网络连接失败等等。对于这些不可预测的错误，我们必须使用错误处理机制来进行处理。在本教程中，我们将介绍Rust语言中错误处理的机制，以及如何编写安全、可靠的错误处理代码。

## Result和Error类型

首先，Rust语言中的错误处理基于两个特性，Result和Error。`Result`是Rust提供的一个枚举类，它里面包含了两个成员变量：`Ok(T)` 和 `Err(E)`。`Ok(T)` 表示操作成功返回的结果，它的类型为T；`Err(E)`表示操作失败时返回的错误，它的类型为E。如果一个函数返回类型为Result，那么就说明它有可能失败并返回一个错误类型，需要我们来处理这个Result。

一般情况下，我们可以通过模式匹配来处理Result类型的返回值。例如，对于以下代码：

```rust
fn divide(x: i32, y: i32) -> Result<i32, &'static str> {
    if y == 0 {
        return Err("Cannot divide by zero!");
    }
    Ok(x / y)
}

fn main() {
    let result = divide(10, 0);
    match result {
        Ok(value) => println!("Result is: {}", value),
        Err(error) => println!("Error: {}", error),
    }
}
//  输出结果：
//  Error: Cannot divide by zero!
```

在上述代码中，`divide` 函数尝试计算 `x/y` 的值，并返回一个 `Result<i32, &'static str>` 类型的值。如果 `y` 的值等于0，则会返回一个 `Err` 类型的错误值，否则会返回一个 `Ok` 类型的结果值。

在 `main` 函数中，我们通过 `match` 语句对函数返回的 `Result` 进行匹配。如果返回的是 `Ok` 类型的值，则输出计算结果；如果是 `Err` 类型的值，则输出错误信息。

注意，我们在 `Err` 类型中使用了 `'static` 生命周期。这是因为 `'static` 生命周期为编译器提供了一种判断一段数据是否永远可用的方法。对于字符串字面量，其生命周期被认为是 `'static`，因为它们通常存储在程序的只读内存区域中，并且在整个程序的执行周期内都存在。

## 自定义Error类型

除了使用标准库提供的错误类型之外，我们还可以自定义Rust中的错误类型。自定义错误类型通常可以更好地表达我们的程序逻辑，并为错误处理提供更好的支持。在Rust中，我们可以通过实现 `std::error::Error` trait 来定义自己的错误类型。这个trait定义了一些关于错误的元信息，比如错误消息、错误来源等等。

下面是一个自定义错误类型的例子：

```rust
use std::error::Error;
use std::fmt;

#[derive(Debug)]
struct MyError {
      message: String,
}

impl Error for MyError {}

impl fmt::Display for MyError {
      fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
          write!(f, "{}", self.message)
    }
}

fn main() -> Result<(), MyError> {
      let result = do_something()?;
    Ok(())
}

fn do_something() -> Result<(), MyError> {
      Err(MyError {
          message: String::from("Something went wrong!"),
    })
}
```

在上面的代码中，我们定义了一个 `MyError` 结构体来表示我们的自定义错误类型。该结构体实现了 `std::error::Error` trait 和 `std::fmt::Display` trait。 `std::error::Error` trait 定义了一些关于错误的元信息，比如错误消息、错误来源等等。 `std::fmt::Display` trait 定义了如何将 `MyError` 类型的实例转换为字符串输出。在 `main` 函数中，我们使用了 `?` 运算符来传播 `do_something` 函数返回的错误。如果 `do_something` 返回 `Ok` 值，则直接返回 `()` 类型的空值；否则返回一个 `MyError` 错误类型的值。

## Option类型

除了 `Result` 类型之外，Rust还提供了另一个基础错误处理类型，即 `Option` 类型。`Option` 类型表示一个可能不存在的值。它有两个成员变量，`Some(value)` 表示存在一个值为 `value` 的结果，`None` 则表示结果不存在。`Option` 类型通常用于表示可能出现空值的情况，比如查询某个元素是否存在等。

下面是一个使用 `Option` 类型的例子：

```rust
fn main() {
    let arr = [1, 2, 3];
    let index = 5;
    let value = arr.get(index);
    match value {
        Some(v) => println!("Value at index {}: {}", index, v),
        None => println!("Value not found at index {}", index),
    }
}
```

在上面的代码中，我们声明了一个数组 `arr` 和一个变量 `index`。我们通过 `arr.get(index)` 方法获取数组 `arr` 在下标 `index` 处的值，该方法会返回一个 `Option` 类型的值 `value`。如果下标 `index` 超出了数组边界，则 `value` 的值为 `None` 。如果 `value` 的值为 `Some(v)`，则说明数组中存在一个值为 `v` 的元素；否则说明数组中不存在该元素。

与 `Result` 类型一样，我们也可以使用 `if let` 简化 `Option` 类型的处理，如下所示：

```rust
fn main() {
    let arr = [1, 2, 3];
    let index = 5;
    if let Some(value) = arr.get(index) {
        println!("Value at index {}: {}", index, value);
    } else {
        println!("Value not found at index {}", index);
    }
}
```

## 结构化日志

最后，我们来介绍一个Rust语言中非常实用的技术，那就是结构化日志。在应用程序中，输出日志是一项非常重要的任务。通常，我们使用字符串来记录日志信息。然而，这种方式容易出现一些问题，比如日志格式不统一、关键信息难以定位等等。

为了解决这些问题，Rust语言提供了结构化日志的功能。结构化日志是一种利用结构化数据来描述日志信息的方式，它可以帮助我们更好地组织和分析日志信息。在Rust中，我们可以使用 [`log`](https://crates.io/crates/log) 库来实现结构化日志输出。

下面是一个使用 `log` 库的例子：

```rust
use std::env::set_var;
use log::{debug, error, info, trace, warn};

fn main() {
    //  设置日志输出的级别
    set_var("RUST_LOG", "trace");
    env_logger::init();

    trace!("This is a trace log");
    debug!("This is a debug log");
    info!("This is an info log");
    warn!("This is a warn log");
    error!("This is an error log");

    let value = "World";
    info!("Hello, {}!", value);
}
```

在上面的代码中，我们首先使用 `env_logger` 初始化了日志系统。然后，我们调用 `trace`、`debug`、`info`、`warn` 和 `error` 方法输出不同级别的日志信息。其中，`info` 方法中使用了变量 `value` 来动态地生成输出文本，这是Rust语言中非常方便的一个特性。

输出的日志信息如下所示：

```
[2023-03-17T15:52:14Z TRACE playground] This is a trace log
[2023-03-17T15:52:14Z DEBUG playground] This is a debug log
[2023-03-17T15:52:14Z INFO  playground] This is an info log
[2023-03-17T15:52:14Z WARN  playground] This is a warn log
[2023-03-17T15:52:14Z ERROR playground] This is an error log
[2023-03-17T15:52:14Z INFO  playground] Hello, World!
```

可以看到，输出的日志信息包含了时间戳、日志级别、文件名、函数名等元数据，这使得我们可以更好地定位问题所在。

## Animal结构体示例

最后，我们来演示一个使用 `Result` 类型处理错误的例子。假设我们要编写一个程序，对一些动物进行分类。我们定义一个 `Animal` 结构体来表示动物的属性，同时定义一个函数 `classify` 来根据动物的属性对其进行分类。分类规则如下：

* 如果动物的速度小于20，则属于“慢动物”；
* 如果动物的速度大于等于20且小于50，则属于“普通动物”；
* 如果动物的速度大于等于50，则属于“快动物”。

下面是代码实现：

```rust
#[derive(Debug)]
struct Animal {
    name: String,
    speed: i32,
}

impl Animal {
    fn new(name: &str, speed: i32) -> Animal {
        Animal {
            name: name.to_string(),
            speed: speed,
        }
    }
}

#[derive(Debug)]
enum AnimalType {
    Slow,
    Normal,
    Fast,
}

fn classify(animal: &Animal) -> Result<AnimalType, String> {
    if animal.speed < 20 {
        Ok(AnimalType::Slow)
    } else if animal.speed >= 20 && animal.speed < 50 {
        Ok(AnimalType::Normal)
    } else if animal.speed >= 50 {
        Ok(AnimalType::Fast)
    } else {
        Err(String::from("Invalid speed value"))
    }
}

fn main() {
    let animals = vec![
        Animal::new("Turtle", 10),
        Animal::new("Rabbit", 30),
        Animal::new("Cheetah", 80),
    ];

    for animal in &animals {
        match classify(animal) {
            Ok(animal_type) => {
                println!("{} is a {:?}", animal.name, animal_type);
            }
            Err(error) => {
                eprintln!("Error: {}", error);
            }
        }
    }
}
//  输出结果:
// Turtle is a Slow
// Rabbit is a Normal
// Cheetah is a Fast
```

在上面的代码中，我们定义了一个 `Animal` 结构体来表示动物的属性，同时定义了 `classify` 函数来根据动物的速度属性对其进行分类。在 `classify` 函数中，我们使用 `if` 语句来判断动物的速度所属的分类，如果速度合法，则返回一个 `Ok` 值，否则返回一个 `Err` 值。

在 `main` 函数中，我们定义了一个 `Animal` 数组，并使用 `for` 循环对其中的每一个元素进行处理。对于每一个元素，我们通过调用 `classify` 函数来进行分类，如果分类成功，则输出分类结果；如果失败，则输出错误信息。

## 总结

本篇教程简要介绍了Rust语言中的错误处理机制，并提供了一些例子来说明如何正确地处理错误。Rust语言的错误处理机制是其优秀的安全和可靠特性的重要组成部分，正确地处理错误可以增强程序的健壮性，提高程序的可维护性。当我们面临错误处理的问题时，务必要仔细分析问题，并根据具体情况选择合适的错误处理机制。
