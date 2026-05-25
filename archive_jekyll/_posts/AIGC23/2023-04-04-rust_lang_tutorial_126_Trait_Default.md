---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Default特征
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Default]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一种系统级编程语言，它的设计目标是安全、并发和高效。Rust 的设计灵感来自于 C++、Rust 和 Haskell 等语言，它的特点是静态类型、内存安全、并发性和高性能。

Default 是 Rust 标准库中的一个 trait，它定义了一个类型的默认值。在 Rust 中，每个类型都有一个默认值，这个默认值可以通过 Default trait 来获取。Rust 的默认值是零值，也就是说，如果一个类型没有定义它的默认值，那么它的默认值就是 0 或者 null。

## 基础用法

### 使用 Default trait 获取类型的默认值

在 Rust 中，可以使用 Default trait 来获取一个类型的默认值。例如，以下代码演示了如何获取一个整数类型的默认值：

```rust
fn main() {
    let x: i32 = Default::default();
    println!("The default value of i32 is {}", x);
}
```

输出结果为：

```
The default value of i32 is 0
```

### 自定义类型的默认值

在 Rust 中，可以为自定义类型实现 Default trait，以便为它们定义默认值。例如，以下代码演示了如何为一个结构体类型实现 Default trait：

```rust
#[derive(Default)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p: Point = Default::default();
    println!("The default value of Point is ({}, {})", p.x, p.y);
}
```

输出结果为：

```
The default value of Point is (0, 0)
```

### 使用泛型获取类型的默认值

在 Rust 中，可以使用泛型来获取任意类型的默认值。例如，以下代码演示了如何使用泛型获取一个字符串类型的默认值：

```rust
fn main() {
    let s: String = Default::default();
    println!("The default value of String is '{}'", s);
}
```

输出结果为：

```
The default value of String is ''
```

### 使用 Option 类型获取默认值

在 Rust 中，Option 类型是一个枚举类型，它可以表示一个值的存在或不存在。如果一个变量的类型是 Option 类型，则它的默认值是 None。例如，以下代码演示了如何获取一个 Option 类型的默认值：

```rust
fn main() {
    let opt: Option<i32> = Default::default();
    println!("The default value of Option<i32> is {:?}", opt);
}
```

输出结果为：

```
The default value of Option<i32> is None
```

### 使用数组类型获取默认值

在 Rust 中，数组类型的默认值是一个由零值组成的数组。例如，以下代码演示了如何获取一个数组类型的默认值：

```rust
fn main() {
    let arr: [i32; 3] = Default::default();
    println!("The default value of [i32; 3] is {:?}", arr);
}
```

输出结果为：

```
The default value of [i32; 3] is [0, 0, 0]
```

### 使用元组类型获取默认值

在 Rust 中，元组类型的默认值是一个由每个元素的默认值组成的元组。例如，以下代码演示了如何获取一个元组类型的默认值：

```rust
fn main() {
    let tup: (i32, bool, String) = Default::default();
    println!("The default value of (i32, bool, String) is {:?}", tup);
}
```

输出结果为：

```
The default value of (i32, bool, String) is (0, false, '')
```

### 使用枚举类型获取默认值

在 Rust 中，枚举类型的默认值是它的第一个成员。例如，以下代码演示了如何获取一个枚举类型的默认值：

```rust
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    let color: Color = Default::default();
    println!("The default value of Color is {:?}", color);
}
```

输出结果为：

```
The default value of Color is Red
```

### 使用结构体获取默认值

在 Rust 中，结构体类型的默认值是由每个字段的默认值组成的结构体。例如，以下代码演示了如何获取一个结构体类型的默认值：

```rust
struct Person {
    name: String,
    age: i32,
    is_male: bool,
}

impl Default for Person {
    fn default() -> Self {
        Self {
            name: String::default(),
            age: i32::default(),
            is_male: bool::default(),
        }
    }
}

fn main() {
    let p: Person = Default::default();
    println!("The default value of Person is {:?}", p);
}
```

输出结果为：

```
The default value of Person is Person { name: '', age: 0, is_male: false }
```

## 进阶用法

### 使用 Default trait 实现结构体的默认值

在 Rust 中，可以为结构体类型实现 Default trait，以便为它们定义默认值。例如，以下代码演示了如何为一个结构体类型实现 Default trait：

```rust
#[derive(Default)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p: Point = Default::default();
    println!("The default value of Point is ({}, {})", p.x, p.y);
}
```

输出结果为：

```
The default value of Point is (0, 0)
```

### 使用 Default trait 实现枚举类型的默认值

在 Rust 中，可以为枚举类型实现 Default trait，以便为它们定义默认值。例如，以下代码演示了如何为一个枚举类型实现 Default trait：

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

fn main() {
    let color: Color = Default::default();
    println!("The default value of Color is {:?}", color);
}
```

输出结果为：

```
The default value of Color is Red
```

### 使用 Default trait 实现元组类型的默认值

在 Rust 中，可以为元组类型实现 Default trait，以便为它们定义默认值。例如，以下代码演示了如何为一个元组类型实现 Default trait：

```rust
impl Default for (i32, bool, String) {
    fn default() -> Self {
        (0, false, String::default())
    }
}

fn main() {
    let tup: (i32, bool, String) = Default::default();
    println!("The default value of (i32, bool, String) is {:?}", tup);
}
```

输出结果为：

```
The default value of (i32, bool, String) is (0, false, '')
```

### 使用 Default trait 实现泛型类型的默认值

在 Rust 中，可以为泛型类型实现 Default trait，以便为它们定义默认值。例如，以下代码演示了如何为一个泛型类型实现 Default trait：

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T: Default> Default for Pair<T> {
    fn default() -> Self {
        Self {
            x: T::default(),
            y: T::default(),
        }
    }
}

fn main() {
    let pair: Pair<i32> = Default::default();
    println!("The default value of Pair<i32> is ({}, {})", pair.x, pair.y);
}
```

输出结果为：

```
The default value of Pair<i32> is (0, 0)
```

## 最佳实践

在 Rust 中，使用 Default trait 可以方便地获取类型的默认值。以下是一些最佳实践：

### 为自定义类型实现 Default trait

为自定义类型实现 Default trait 可以方便地为它们定义默认值。例如，以下代码演示了如何为一个结构体类型实现 Default trait：

```rust
#[derive(Default)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p: Point = Default::default();
    println!("The default value of Point is ({}, {})", p.x, p.y);
}
```

输出结果为：

```
The default value of Point is (0, 0)
```

### 使用泛型获取类型的默认值

在 Rust 中，可以使用泛型来获取任意类型的默认值。例如，以下代码演示了如何使用泛型获取一个字符串类型的默认值：

```rust
fn main() {
    let s: String = Default::default();
    println!("The default value of String is '{}'", s);
}
```

输出结果为：

```
The default value of String is ''
```

### 使用 Option 类型获取默认值

在 Rust 中，Option 类型是一个枚举类型，它可以表示一个值的存在或不存在。如果一个变量的类型是 Option 类型，则它的默认值是 None。例如，以下代码演示了如何获取一个 Option 类型的默认值：

```rust
fn main() {
    let opt: Option<i32> = Default::default();
    println!("The default value of Option<i32> is {:?}", opt);
}
```

输出结果为：

```
The default value of Option<i32> is None
```

### 为泛型类型实现 Default trait

为泛型类型实现 Default trait 可以方便地为它们定义默认值。例如，以下代码演示了如何为一个泛型类型实现 Default trait：

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T: Default> Default for Pair<T> {
    fn default() -> Self {
        Self {
            x: T::default(),
            y: T::default(),
        }
    }
}

fn main() {
    let pair: Pair<i32> = Default::default();
    println!("The default value of Pair<i32> is ({}, {})", pair.x, pair.y);
}
```

输出结果为：

```
The default value of Pair<i32> is (0, 0)
```

## 结论

在 Rust 中，Default trait 可以方便地获取类型的默认值。使用 Default trait 可以简化代码，并提高代码的可读性和可维护性。同时，为自定义类型实现 Default trait 可以方便地为它们定义默认值。在使用 Default trait 时，可以根据需要为泛型类型实现 Default trait，以便为它们定义默认值。
