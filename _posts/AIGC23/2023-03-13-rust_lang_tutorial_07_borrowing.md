---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 所有权
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


![](/images/2023-03/rust_tutorial_logo.png)

Rust是一门系统级编程语言，它的设计目标是安全、速度和并发。Rust中的引用和借用是其独特的特性之一，它们使得Rust能够在保证安全的前提下实现高效的内存管理。在本教程中，我们将介绍Rust中的引用和借用，以及如何使用它们来管理内存。

## 引用


在Rust中，引用是一种轻量级的指针，它允许我们在不拥有值的情况下访问它。引用可以是可变的或不可变的，它们分别对应于可变和不可变的数据。

### 不可变引用


不可变引用使用 `&` 符号来声明，例如：


```rust
fn main() {
    let x = 5;
    let y = &x;

    println!("x = {}, y = {}", x, y);
}
```

在上面的代码中，我们声明了一个不可变的整数 `x` ，然后创建了一个指向 `x` 的不可变引用 `y` 。我们可以通过 `y` 来访问 `x` 的值，但不能修改它。在打印 `x` 和 `y` 的值时，我们使用了 `{}` 占位符，这是Rust中的字符串插值语法。

### 可变引用


可变引用使用 `&mut` 符号来声明，例如：


```rust
fn main() {
    let mut x = 5;
    let y = &mut x;

    *y = 10;

    println!("x = {}, y = {}", x, y);
}
```

在上面的代码中，我们声明了一个可变的整数 `x` ，然后创建了一个指向 `x` 的可变引用 `y` 。我们使用 `*y` 来访问 `x` 的值，并将其修改为 `10` 。注意，在修改可变引用所指向的值时，我们需要使用 `*` 符号来解引用引用。最后，我们打印 `x` 和 `y` 的值。

### 引用的作用域


引用的作用域是指引用所在的代码块，它决定了引用在代码中的可用性。例如：


```rust
fn main() {
    let x = 5;

    {
        let y = &x;
        println!("x = {}, y = {}", x, y);
    }

    let z = &x;
    println!("x = {}, z = {}", x, z);
}
```

在上面的代码中，我们声明了一个整数 `x` ，然后在一个代码块中创建了一个指向 `x` 的不可变引用 `y` 。在该代码块结束后， `y` 的作用域就结束了，我们不能再使用它。然后，我们在另一个代码块中创建了一个指向 `x` 的不可变引用 `z` ，并打印了 `x` 和 `z` 的值。

## 借用


在Rust中，借用是一种将值的所有权转移给函数或代码块的方式。借用可以是可变的或不可变的，它们分别对应于可变和不可变的数据。

### 不可变借用


不可变借用使用 `&` 符号来声明，例如：


```rust
fn print_value(x: &i32) {
    println!("value = {}", x);
}

fn main() {
    let x = 5;
    print_value(&x);
}
```

在上面的代码中，我们声明了一个函数 `print_value` ，它接受一个指向不可变整数的借用。在 `main` 函数中，我们创建了一个整数 `x` ，然后将其借用给 `print_value` 函数。在函数中，我们使用 `{}` 占位符来打印借用的值。

### 可变借用


可变借用使用 `&mut` 符号来声明，例如：


```rust
fn modify_value(x: &mut i32) {
    *x = 10;
}

fn main() {
    let mut x = 5;
    modify_value(&mut x);
    println!("x = {}", x);
}
```

在上面的代码中，我们声明了一个函数 `modify_value` ，它接受一个指向可变整数的借用。在 `main` 函数中，我们创建了一个可变整数 `x` ，然后将其借用给 `modify_value` 函数。在函数中，我们使用 `*x` 来解引用借用，并将其修改为 `10` 。最后，我们打印 `x` 的值。

### 借用的生命周期


借用的生命周期是指借用所在的代码块，它决定了借用在代码中的可用性。例如：


```rust
fn main() {
    let x = 5;

    {
        let y = &x;
        println!("x = {}, y = {}", x, y);
    }

    let z = &mut x;
    *z = 10;

    println!("x = {}", x);
}
```

在上面的代码中，我们声明了一个整数 `x` ，然后在一个代码块中创建了一个指向 `x` 的不可变借用 `y` 。在该代码块结束后， `y` 的生命周期就结束了，我们不能再使用它。然后，我们在另一个代码块中创建了一个指向 `x` 的可变借用 `z` ，并将 `x` 的值修改为 `10` 。注意，当我们创建可变借用时，不能同时存在其他的借用，因为这会导致数据竞争。这是Rust的内存安全机制的一部分。

## 借用和引用的比较


借用和引用都是Rust中的重要概念，它们有一些相似之处，但也有一些不同之处。

相似之处:

- 借用和引用都是一种不拥有值的方式来访问数据。
- 借用和引用都有不可变和可变的版本。
- 借用和引用都有作用域和生命周期的概念。

不同之处:

- 引用是一种轻量级的指针，它可以在任何地方创建，而借用只能在函数或代码块中创建。
- 借用是一种所有权的转移，它可以更改数据的值，而引用只能访问数据的值。
- 借用有一个额外的限制，即不能同时存在多个可变借用或一个可变借用和任何其他借用。


## 示例代码


下面是一个示例代码，它演示了如何使用引用和借用来管理内存。


```rust
fn main() {
    let mut x = 5;
    let y = &x;
    let z = &mut x;

    println!("x = {}, y = {}, z = {}", x, y, z);

    modify_value(y);
    modify_value(z);

    println!("x = {}, y = {}, z = {}", x, y, z);
}

fn modify_value(x: &mut i32) {
    *x = 10;
}
```

在上面的代码中，我们创建了一个可变整数 `x` ，然后创建了一个指向 `x` 的不可变引用 `y` 和一个指向 `x` 的可变借用 `z` 。我们打印了 `x` 、 `y` 和 `z` 的值。然后，我们使用 `modify_value` 函数来修改 `y` 和 `z` 所指向的值。最后，我们再次打印 `x` 、 `y` 和 `z` 的值。注意，在修改可变借用所指向的值时，我们也需要使用 `*` 符号来解引用借用。

## 结论


引用和借用是Rust中的重要特性，它们使得Rust能够实现高效的内存管理。在本教程中，我们介绍了Rust中的引用和借用，以及如何使用它们来管理内存。我们还比较了引用和借用的异同点，并提供了示例代码来演示它们的用法。
