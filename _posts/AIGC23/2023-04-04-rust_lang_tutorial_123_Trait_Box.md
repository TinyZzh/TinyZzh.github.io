---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 堆对象智能指针Box
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Box]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一种系统编程语言，它的设计目标是提供安全性、并发性和性能。它是一种静态类型语言，具有内存安全和数据竞争安全的特性。

在 Rust 中，Box 是一种智能指针，它允许在堆上分配内存，并在不需要时自动释放。Box 是 Rust 中最基本的智能指针之一，它是对堆上分配的内存的所有权的一种抽象。

## 基础用法

### 创建一个 Box

```rust
let b = Box::new(5);
```

这个例子创建了一个 Box，它包含一个整数 5。Box 的类型是`Box<i32>`。

### 将一个值放入 Box 中

```rust
let x = 5;
let b = Box::new(x);
```

这个例子将一个整数 5 放入了 Box 中。

### 从 Box 中获取值

```rust
let b = Box::new(5);
let x = *b;
```

这个例子从 Box 中获取了一个整数 5，并将其赋值给变量 x。注意，需要使用解引用运算符`*`来获取 Box 中的值。

### 在函数中传递 Box

```rust
fn print_box(b: Box<i32>) {
    println!("The value of b is {}", *b);
}

let b = Box::new(5);
print_box(b);
```

这个例子定义了一个函数`print_box`，它接受一个 Box 作为参数，并打印 Box 中的值。然后，创建一个 Box 并将其传递给函数。

### 在函数中返回 Box

```rust
fn create_box() -> Box<i32> {
    Box::new(5)
}

let b = create_box();
```

这个例子定义了一个函数`create_box`，它返回一个 Box，其中包含整数 5。然后，创建一个 Box 并将其赋值给变量 b。

### 将 Box 转换为引用

```rust
let b = Box::new(5);
let r = &*b;
```

这个例子将一个 Box 转换为一个引用。注意，需要使用解引用运算符`*`来获取 Box 中的值，然后使用引用运算符`&`来获取引用。

### 将 Box 转换为可变引用

```rust
let mut b = Box::new(5);
let r = &mut *b;
*r = 6;
```

这个例子将一个 Box 转换为一个可变引用。注意，需要使用解引用运算符`*`来获取 Box 中的值，然后使用可变引用运算符`&mut`来获取可变引用。

### 在结构体中使用 Box

```rust
struct Point {
    x: i32,
    y: i32,
}

struct Rectangle {
    top_left: Box<Point>,
    bottom_right: Box<Point>,
}

let rect = Rectangle {
    top_left: Box::new(Point { x: 0, y: 0 }),
    bottom_right: Box::new(Point { x: 10, y: 10 }),
};
```

这个例子定义了两个结构体，Point 和 Rectangle。Rectangle 包含两个 Box<Point>，它们分别表示矩形的左上角和右下角。然后，创建一个 Rectangle 并初始化它的两个 Box。

## 进阶用法

### 使用 Box 在堆上分配大量内存

```rust
let mut v = Vec::new();
for i in 0..1000000 {
    v.push(Box::new(i));
}
```

这个例子创建了一个包含 1000000 个整数的 Vec。由于整数是通过 Box 分配在堆上的，因此 Vec 的大小只包含指针的大小，而不是整个整数的大小。

### 使用 Box 实现递归数据结构

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
```

这个例子定义了一个递归的 List 枚举类型。它可以包含一个整数和一个指向另一个 List 的 Box，或者是一个空 List。然后，创建一个包含两个整数的 List。

### 使用 Box 实现自引用结构体

```rust
struct Node {
    value: i32,
    next: Option<Box<Node>>,
}

let mut n1 = Node {
    value: 1,
    next: None,
};
let mut n2 = Node {
    value: 2,
    next: None,
};
n1.next = Some(Box::new(n2));
n2.next = Some(Box::new(n1));
```

这个例子定义了一个 Node 结构体，它包含一个整数和一个指向另一个 Node 的 Box。然后，创建两个 Node 并将它们相互引用。

### 使用 Box 实现动态分配的多态类型

```rust
trait Shape {
    fn area(&self) -> f64;
}

struct Circle {
    radius: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

let shapes: Vec<Box<dyn Shape>> = vec![
    Box::new(Circle { radius: 1.0 }),
    Box::new(Rectangle { width: 2.0, height: 3.0 }),
];
for shape in shapes {
    println!("Area = {}", shape.area());
}
```

这个例子定义了一个 Shape trait 和两个实现它的结构体 Circle 和 Rectangle。然后，创建一个包含两个 Shape 的 Vec，并遍历它打印每个 Shape 的面积。

## 最佳实践

- 避免过度使用 Box

Box 是在堆上分配内存的一种方式，因此使用过多的 Box 可能会导致性能问题。在 Rust 中，应该尽可能地使用栈上分配内存，只在需要时才使用 Box。

- 使用 Box 来避免所有权问题

在 Rust 中，所有权是一个重要的概念。使用 Box 可以避免所有权问题，因为 Box 可以在不同的作用域中传递所有权。

- 使用 Box 实现递归数据结构

在 Rust 中，递归数据结构是一种常见的数据结构。使用 Box 可以方便地实现递归数据结构，因为 Box 可以在堆上分配内存，并在不需要时自动释放。

- 使用 Box 实现动态分配的多态类型

在 Rust 中，多态类型是一种常见的编程模式。使用 Box 可以方便地实现动态分配的多态类型，因为 Box 可以在堆上分配内存，并在不需要时自动释放。

## 总结

Box 是 Rust 中最基本的智能指针之一，它允许在堆上分配内存，并在不需要时自动释放。在本教程中，我们介绍了 Box 的基础用法和进阶用法，并提供了示例代码。最后，我们提供了一些最佳实践，以帮助您更好地使用 Box。
