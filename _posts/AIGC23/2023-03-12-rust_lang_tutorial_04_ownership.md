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

Rust是一种系统编程语言，它在内存安全和并发性方面具有很高的保证。其中最重要的特性之一是所有权系统。所有权系统是一种内存管理方式，它可以避免常见的内存问题，如空指针、内存泄漏和数据竞争。在本教程中，我们将深入了解Rust的所有权系统。

## 所有权

在Rust中，每个值都有一个所有者。所有者是一个变量，它拥有该值并负责释放该值。当所有者超出范围时，它们拥有的值将被释放。这种方式确保了内存的安全和高效使用。
让我们看一个简单的例子：

```rust
fn main() {
    let s = String::from("hello");
    println!("{}", s);
}
```

在这个例子中，我们创建了一个字符串hello并将其赋值给变量s。变量s是该字符串的所有者。当程序执行到println!宏时，它打印字符串s的值。当程序执行完毕时，变量s超出了其作用域，该值将被自动释放。

### 所有权的转移

在Rust中，值的所有权可以通过将其赋值给另一个变量来转移。例如：
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s2);
}
//     输出内容：
// hello
```

在这个例子中，我们创建了一个字符串hello并将其赋值给变量s1。然后，我们将变量s1赋值给变量s2。这导致s1失去了对该字符串的所有权，而s2现在是该字符串的所有者。当程序执行到println!宏时，它打印字符串s2的值。当程序执行完毕时，变量s2超出了其作用域，该值将被自动释放。
需要注意的是，当值的所有权转移时，原始变量将不再有效。例如：
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1);
}

//    编译错误：
// error[E0382]: borrow of moved value: `s1`
//  --> src/main.rs:9:20
//   |
// 7 |     let s1 = String::from("hello");
//   |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
// 8 |     let s2 = s1;
//   |              -- value moved here
// 9 |     println!("{}", s1);
//   |                    ^^ value borrowed here after move
//   |
//   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
// help: consider cloning the value if the performance cost is acceptable
//   |
// 8 |     let s2 = s1.clone();
//   |                ++++++++

// For more information about this error, try `rustc --explain E0382`.
```

在这个例子中，我们尝试打印变量s1的值，但是由于该值的所有权已经转移到s2，所以编译器会报错。这强制我们在编写代码时考虑所有权的转移。

### 所有权的借用

在Rust中，我们可以将值的所有权借给一个变量，而不是转移所有权。这称为借用。例如：
```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
//     输出内容：
//    The length of 'hello' is 5.
```

在这个例子中，我们创建了一个字符串hello并将其赋值给变量s1。然后，我们通过将变量s1的引用传递给函数calculate_length来借用该字符串的所有权。该函数返回字符串的长度，该长度存储在变量len中。当程序执行到println!宏时，它打印字符串s1的值和变量len的值。当程序执行完毕时，变量s1超出了其作用域，但由于我们只是借用了它，所以该值并没有被释放。
需要注意的是，在借用时，我们需要使用引用符号&来指示我们要借用该值的所有权，而不是转移所有权。例如：
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = &s1;
    println!("{}", &s1);
}
//     输出内容：
// hello
```

在这个例子中，我们尝试打印变量s1的值，但是由于我们只是借用了该值的所有权，所以编译器会报错。这强制我们在编写代码时考虑所有权的借用。

## 可变借用

在Rust中，我们可以通过可变借用来允许修改借用的值。例如：
```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s);
}

fn change(s: &mut String) {
    s.push_str(", world");
}
//     输出内容：
//    hello, world
```

在这个例子中，我们创建了一个可变字符串hello并将其赋值给变量s。然后，我们通过将变量s的可变引用传递给函数change来可变借用该字符串的所有权。该函数将字符串world添加到字符串s的末尾。当程序执行到println!宏时，它打印字符串s的值，该值现在是hello, world。当程序执行完毕时，变量`s
超出了其作用域，但由于我们只是可变借用了它，所以该值并没有被释放。
需要注意的是，在可变借用时，我们需要使用可变引用符号&mut来指示我们要可变借用该值的所有权，而不是转移所有权。例如：
```rust
fn main() {
    let mut s = String::from("hello");
    let s_ref = &mut s;
    println!("{}", s);
}
```

在这个例子中，我们尝试打印变量s的值，但是由于我们只是可变借用了该值的所有权，所以编译器会报错。这强制我们在编写代码时考虑所有权的可变借用。

## 所有权和函数

在Rust中，函数可以接受值的所有权、借用值的所有权或返回值的所有权。例如：
```rust
fn main() {
    let s = String::from("hello");
    let (s, len) = calculate_length(s);
    println!("The length of '{}' is {}.", s, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let len = s.len();
    (s, len)
}
//     输出内容：
//    The length of 'hello' is 5.
```

在这个例子中，我们创建了一个字符串hello并将其赋值给变量s。然后，我们将变量s传递给函数calculate_length，该函数接受该字符串的所有权。该函数返回该字符串的长度和该字符串本身。我们使用元组来返回这两个值。当程序执行到println!宏时，它打印字符串s的值和变量len的值。当程序执行完毕时，变量s超出了其作用域，该值将被自动释放。
需要注意的是，在函数中接受值的所有权时，该值将被移动。如果我们想在函数中使用该值的引用而不是移动它，我们可以使用借用。例如：
```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);
    println!("The length of '{}' is {}.", s, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

在这个例子中，我们创建了一个字符串hello并将其赋值给变量s。然后，我们将变量s的引用传递给函数calculate_length，该函数借用该字符串的所有权。该函数返回该字符串的长度。当程序执行到println!宏时，它打印字符串s的值和变量len的值。当程序执行完毕时，变量s超出了其作用域，但由于我们只是借用了它，所以该值并没有被释放。

## 所有权和结构体

在Rust中，结构体可以拥有值的所有权。例如：
```rust
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let p = Person {
        name: String::from("Alice"),
        age: 30,
    };
    println!("{} is {} years old.", p.name, p.age);
}
```

在这个例子中，我们定义了一个结构体Person，它有两个字段：name和age。name字段是一个字符串，age字段是一个无符号8位整数。然后，我们创建了一个Person实例并将其赋值给变量p。该实例拥有name字段的所有权和age字段的所有权。当程序执行到println!宏时，它打印变量p的name字段和age字段的值。当程序执行完毕时，变量p超出了其作用域，该值将被自动释放。
需要注意的是，在结构体中拥有值的所有权时，该值将被移动。如果我们想在结构体中使用该值的引用而不是移动它，我们可以使用借用。例如：
```rust
struct Person<'a> {
    name: &'a str,
    age: u8,
}

fn main() {
    let name = String::from("Alice");
    let p = Person {
        name: &name,
        age: 30,
    };
    println!("{} is {} years old.", p.name, p.age);
}
```

在这个例子中，我们定义了一个结构体Person，它有两个字段：name和age。name字段是一个字符串的引用，age字段是一个无符号8位整数。然后，我们创建了一个字符串Alice并将其赋值给变量name。然后，我们创建了一个Person实例并将其赋值给变量p。该实例借用了变量name的值。当程序执行到println!宏时，它打印变量p的name字段和age字段的值。当程序执行完毕时，变量name和变量p超出了其作用域，但由于我们只是借用了它们，所以这些值并没有被释放。

## 所有权和Vec

在Rust中，Vec是一个动态数组，它可以拥有值的所有权。例如：
```rust
fn main() {
    let v = vec![1, 2, 3];
    for i in &v {
        println!("{}", i);
    }
}
```

在这个例子中，我们创建了一个Vec实例并将其赋值给变量v。该实例拥有三个整数的所有权。然后，我们使用for循环遍历v的引用并打印每个值。当程序执行完毕时，变量v超出了其作用域，该值将被自动释放。
需要注意的是，在Vec中拥有值的所有权时，该值将被移动。如果我们想在Vec中使用该值的引用而不是移动它，我们可以使用借用。例如：
```rust
fn main() {
    let v = vec![String::from("hello"), String::from("world")];
    for s in &v {
        println!("{}", s);
    }
}
```

在这个例子中，我们创建了一个Vec实例并将其赋值给变量v。该实例拥有两个字符串的所有权。然后，我们使用for循环遍历v的引用并打印每个字符串。当程序执行完毕时，变量v超出了其作用域，但由于我们只是借用了它们，所以这些值并没有被释放。

## 所有权和闭包

在Rust中，闭包可以拥有值的所有权。例如：
```rust
fn main() {
    let v = vec![1, 2, 3];
    let sum = |v: Vec<i32>| -> i32 {
        let mut total = 0;
        for i in v {
            total += i;
        }
        total
    };
    println!("{}", sum(v));
}
```

在这个例子中，我们创建了一个Vec实例并将其赋值给变量v。然后，我们创建了一个闭包sum，它接受一个Vec<i32>并返回一个i32。该闭包拥有v的所有权。然后，我们调用闭包sum并将变量v作为参数传递给它。该闭包计算v中所有整数的总和并返回该总和。当程序执行到println!宏时，它打印变量sum(v)的值。当程序执行完毕时，变量v超出了其作用域，该值将被自动释放。
需要注意的是，在闭包中拥有值的所有权时，该值将被移动。如果我们想在闭包中使用该值的引用而不是移动它，我们可以使用借用。例如：
```rust
fn main() {
    let v = vec![1, 2, 3];
    let sum = |v: &Vec<i32>| -> i32 {
        let mut total = 0;
        for i in v {
            total += i;
        }
        total
    };
    println!("{}", sum(&v));
}
```

在这个例子中，我们创建了一个Vec实例并将其赋值给变量v。然后，我们创建了一个闭包sum，它接受一个&Vec<i32>并返回一个i32。该闭包借用了v的值。然后，我们调用闭包sum并将变量v的引用作为参数传递给它。该闭包计算v中所有整数的总和并返回该总和。当程序执行到println!宏时，它打印变量sum(&v)的值。当程序执行完毕时，变量v超出了其作用域，但由于我们只是借用了它们，所以这些值并没有被释放。

### 自动引用和解引用



## 总结

在Rust中，所有权系统是一种内存管理方式，它可以避免常见的内存问题，如空指针、内存泄漏和数据竞争。在本教程中，我们深入了解了Rust的所有权系统，并了解了如何使用它来管理内存。我们学习了值的所有权、所有权的转移、所有权的借用、可变借用、所有权和函数、所有权和结构体、所有权和Vec、所有权和闭包等概念。希望本教程能够帮助你更好地理解Rust的所有权系统。
