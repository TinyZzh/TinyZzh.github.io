---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 枚举那些事儿
date: 2023-04-02 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 元组]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一种系统级编程语言，具有内存安全、并发性和高性能等优点。在 Rust 中，Enum 是一种非常重要的数据类型，它可以用来表示一组相关的值。Enum 的使用非常灵活，可以用来表示状态、错误类型、选项等。在本教程中，我们将深入了解 Rust 语言中 Enum 的基础用法和进阶用法，以及一些实践经验。

## 基础用法

### 定义 Enum

在 Rust 中，我们可以使用`enum`关键字来定义一个 Enum。Enum 可以包含一组具有不同类型的值。例如，我们可以定义一个表示颜色的 Enum：

```rust
enum Color {
    Red,
    Green,
    Blue,
}
```

在上面的代码中，我们定义了一个名为 Color 的 Enum，它包含了三个值：Red、Green 和 Blue。这些值都属于 Color 类型。

### 匹配 Enum

在 Rust 中，我们可以使用`match`表达式来匹配 Enum 的值。例如，我们可以编写一个函数来打印出给定颜色的名称：

```rust
fn print_color(color: Color) {
    match color {
        Color::Red => println!("The color is red"),
        Color::Green => println!("The color is green"),
        Color::Blue => println!("The color is blue"),
    }
}
```

在上面的代码中，我们定义了一个名为 print_color 的函数，它接受一个 Color 类型的参数。在函数体中，我们使用`match`表达式来匹配 color 的值，并打印出相应的颜色名称。

### 带有关联值的 Enum

在 Rust 中，Enum 可以带有关联值。这些关联值可以是任何类型，包括其他 Enum。例如，我们可以定义一个表示图形的 Enum，它可以是矩形或圆形，并带有相应的参数：

```rust
enum Shape {
    Rectangle(u32, u32),
    Circle(f64),
}
```

在上面的代码中，我们定义了一个名为 Shape 的 Enum，它包含了两个值：Rectangle 和 Circle。Rectangle 带有两个 u32 类型的参数，表示宽度和高度；Circle 带有一个 f64 类型的参数，表示半径。

### 匹配带有关联值的 Enum

在 Rust 中，我们可以使用`match`表达式来匹配带有关联值的 Enum。例如，我们可以编写一个函数来计算给定图形的面积：

```rust
fn calculate_area(shape: Shape) -> f64 {
    match shape {
        Shape::Rectangle(width, height) => width as f64 * height as f64,
        Shape::Circle(radius) => std::f64::consts::PI * radius * radius,
    }
}
```

在上面的代码中，我们定义了一个名为 calculate_area 的函数，它接受一个 Shape 类型的参数，并返回一个 f64 类型的值。在函数体中，我们使用`match`表达式来匹配 shape 的值，并计算相应的面积。

### Option Enum

在 Rust 中，Option Enum 是一种非常常用的类型，它表示一个值可能存在也可能不存在。Option Enum 有两个值：Some 和 None。Some 带有一个关联值，表示存在的值；None 表示不存在的值。例如，我们可以定义一个函数来查找一个数组中的最大值：

```rust
fn find_max(numbers: &[i32]) -> Option<i32> {
    if numbers.is_empty() {
        None
    } else {
        let mut max = numbers[0];
        for &number in numbers.iter() {
            if number > max {
                max = number;
            }
        }
        Some(max)
    }
}
```

在上面的代码中，我们定义了一个名为 find_max 的函数，它接受一个 i32 类型的数组，并返回一个 Option<i32>类型的值。在函数体中，我们首先检查数组是否为空，如果为空，则返回 None；否则，我们遍历数组，找到最大的值，并返回 Some(max)。

### Result Enum

在 Rust 中，Result Enum 是一种表示操作结果的类型，它有两个值：Ok 和 Err。Ok 表示操作成功，带有一个关联值，表示成功的结果；Err 表示操作失败，带有一个关联值，表示失败的原因。例如，我们可以定义一个函数来读取一个文件的内容：

```rust
use std::fs::File;
use std::io::Read;

fn read_file(path: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}
```

在上面的代码中，我们定义了一个名为 read_file 的函数，它接受一个字符串类型的参数，并返回一个 Result<String, std::io::Error>类型的值。在函数体中，我们首先打开文件，如果失败，则返回 Err；否则，我们读取文件的内容，并返回 Ok(contents)。

## 进阶用法

### 带有方法的 Enum

在 Rust 中，Enum 可以带有方法。这些方法可以是实例方法或关联方法。例如，我们可以定义一个表示颜色的 Enum，并为其定义一个方法来获取颜色的 RGB 值：

```rust
enum Color {
    Red,
    Green,
    Blue,
}

impl Color {
    fn rgb(&self) -> (u8, u8, u8) {
        match self {
            Color::Red => (255, 0, 0),
            Color::Green => (0, 255, 0),
            Color::Blue => (0, 0, 255),
        }
    }
}
```

在上面的代码中，我们为 Color Enum 定义了一个名为 rgb 的方法，它返回一个(u8, u8, u8)类型的元组，表示颜色的 RGB 值。

### 带有泛型的 Enum

在 Rust 中，Enum 可以带有泛型。这使得 Enum 可以适用于多种类型。例如，我们可以定义一个表示选项的 Enum，它可以是 Some 或 None，但可以适用于任何类型：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

在上面的代码中，我们定义了一个名为 Option 的 Enum，它带有一个泛型参数 T。Option 可以是 Some(T)，表示存在某个值；也可以是 None，表示不存在任何值。

### 带有生命周期的 Enum

在 Rust 中，Enum 可以带有生命周期。这使得 Enum 可以适用于多种情况。例如，我们可以定义一个表示字符串或字节数组的 Enum：

```rust
enum Data<'a> {
    String(&'a str),
    Bytes(&'a [u8]),
}
```

在上面的代码中，我们定义了一个名为 Data 的 Enum，它带有一个生命周期参数'a。Data 可以是 String(&'a str)，表示一个字符串；也可以是 Bytes(&'a [u8])，表示一个字节数组。

### 带有属性的 Enum

在 Rust 中，Enum 可以带有属性。这些属性可以用来标记 Enum 的特性。例如，我们可以定义一个表示状态的 Enum，并为其定义一个属性来标记它是不可变的：

```rust
#[derive(Debug, Copy, Clone)]
enum State {
    Active,
    Inactive,
}

#[derive(Debug)]
#[repr(u8)]
enum Status {
    Ok = 0,
    Error = 1,
}
```

在上面的代码中，我们为 State Enum 定义了一个名为 Debug 的属性，用于调试；同时，我们为 Status Enum 定义了一个名为 repr 的属性，用于指定它的内部表示。

### 带有默认值的 Enum

在 Rust 中，Enum 可以带有默认值。这使得 Enum 可以在某些情况下更加方便。例如，我们可以定义一个表示颜色的 Enum，并为其定义一个默认值：

```rust
enum Color {
    Red,
    Green,
    Blue,
}

impl Default for Color {
    fn default() -> Self {
        Color::Red
    }
}
```

在上面的代码中，我们为 Color Enum 实现了 Default trait，并为其定义了一个默认值为 Red。

## 实践经验

### 使用 Enum 来表示状态

在 Rust 中，Enum 可以用来表示状态。例如，我们可以定义一个表示线程状态的 Enum：

```rust
enum ThreadState {
    Running,
    Stopped,
    Blocked,
}
```

在上面的代码中，我们定义了一个名为 ThreadState 的 Enum，它包含了三个状态值：Running、Stopped 和 Blocked。这些状态值可以用来表示线程的运行状态。

### 使用 Enum 来表示错误类型

在 Rust 中，Enum 可以用来表示错误类型。例如，我们可以定义一个表示文件读取错误的 Enum：

```rust
enum FileError {
    NotFound,
    PermissionDenied,
    ReadError(std::io::Error),
}
```

在上面的代码中，我们定义了一个名为 FileError 的 Enum，它包含了三个错误类型：NotFound、PermissionDenied 和 ReadError。ReadError 带有一个 std::io::Error 类型的关联值，表示读取文件时发生的错误。

### 使用 Enum 来表示选项

在 Rust 中，Enum 可以用来表示选项。例如，我们可以定义一个表示性别的 Enum：

```rust
enum Gender {
    Male,
    Female,
    Unknown,
}
```

在上面的代码中，我们定义了一个名为 Gender 的 Enum，它包含了三个选项：Male、Female 和 Unknown。这些选项可以用来表示人的性别。

### 使用 Enum 来表示命令行参数

在 Rust 中，Enum 可以用来表示命令行参数。例如，我们可以定义一个表示命令行参数的 Enum：

```rust
enum Command {
    Help,
    Version,
    Run(String),
}
```

在上面的代码中，我们定义了一个名为 Command 的 Enum，它包含了三个命令：Help、Version 和 Run。Run 带有一个字符串类型的关联值，表示要运行的命令。

### 使用 Enum 来表示状态机

在 Rust 中，Enum 可以用来表示状态机。例如，我们可以定义一个表示 TCP 连接状态的 Enum：

```rust
enum TcpState {
    Closed,
    Listen,
    SynSent,
    SynReceived,
    Established,
    FinWait1,
    FinWait2,
    CloseWait,
    Closing,
    LastAck,
    TimeWait,
}
```

在上面的代码中，我们定义了一个名为 TcpState 的 Enum，它包含了多个状态值。这些状态值可以用来表示 TCP 连接的状态。

### 使用 Enum 来表示选项组合

在 Rust 中，Enum 可以用来表示选项组合。例如，我们可以定义一个表示文件权限的 Enum：

```rust
#[derive(Debug)]
enum FilePermission {
    Read = 0b100,
    Write = 0b010,
    Execute = 0b001,
    ReadWrite = Self::Read.bits() | Self::Write.bits(),
    ReadExecute = Self::Read.bits() | Self::Execute.bits(),
    WriteExecute = Self::Write.bits() | Self::Execute.bits(),
    All = Self::Read.bits() | Self::Write.bits() | Self::Execute.bits(),
    }

    impl FilePermission {
        fn bits(&self) -> u8 {
        *self as u8
    }
}
```

在上面的代码中，我们定义了一个名为 FilePermission 的 Enum，它表示文件的权限。每个权限都表示为一个二进制数，可以用位运算符来组合多个权限。我们还为 FilePermission 定义了一个名为 bits 的方法，用于获取该权限的二进制值。

## 结论

在本教程中，我们深入了解了 Rust 语言中 Enum 的基础用法和进阶用法，以及一些实践经验。Enum 是一种非常灵活的数据类型，可以用来表示状态、错误类型、选项等。在实际开发中，我们可以根据需要选择合适的 Enum 来实现我们的需求。
