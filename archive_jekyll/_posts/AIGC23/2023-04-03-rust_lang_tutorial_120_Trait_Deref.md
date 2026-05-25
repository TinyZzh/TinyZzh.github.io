---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Deref特征
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, deref]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在 Rust 语言中，Deref 特征用于将一个类型的引用转换为另一个类型的引用。这个特征在 Rust 中非常常见，特别是在处理数据结构中，例如字符串、向量等。Deref 特征的作用是让代码更加简洁，同时也提高了代码的可读性。

## 基础用法

在 Rust 中，Deref 特征是通过实现 Deref trait 来实现的。Deref trait 定义了一个叫做 deref 的方法，它返回一个指向当前类型的引用。下面是一个简单的示例代码：

```rust
struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

fn main() {
    let my_string = MyString { s: String::from("Hello, world!") };
    println!("{}", *my_string);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。在 main 函数中，我们通过解引用运算符（\*）来获取 MyString 结构体中的 String 类型的值，并将其打印出来。

下面是更多的示例代码：

### 使用 Deref 转换字符串类型

```rust
fn main() {
    let my_string = MyString { s: String::from("Hello, world!") };
    let s: &str = &*my_string;
    println!("{}", s);
}
```

在这个示例代码中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为字符串类型，并将其赋值给 s 变量。最后，我们将 s 变量打印出来。

### 使用 Deref 转换向量类型

```rust
struct MyVec<T> {
    v: Vec<T>,
}

impl<T> Deref for MyVec<T> {
    type Target = Vec<T>;

    fn deref(&self) -> &Self::Target {
        &self.v
    }
}

fn main() {
    let my_vec = MyVec { v: vec![1, 2, 3] };
    let v: &Vec<i32> = &*my_vec;
    println!("{:?}", v);
}
```

在这个示例代码中，我们定义了一个 MyVec 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyVec 结构体中的 Vec<T> 类型的引用。在 main 函数中，我们使用 Deref 将 MyVec 结构体中的 Vec<T> 类型转换为 Vec<i32> 类型，并将其赋值给 v 变量。最后，我们将 v 变量打印出来。

### 使用 Deref 转换智能指针类型

```rust
struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let my_box = MyBox(String::from("Hello, world!"));
    let s: &str = &*my_box;
    println!("{}", s);
}
```

在这个示例代码中，我们定义了一个 MyBox 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyBox 结构体中的 T 类型的引用。在 main 函数中，我们使用 Deref 将 MyBox 结构体中的 String 类型转换为字符串类型，并将其赋值给 s 变量。最后，我们将 s 变量打印出来。

### 使用 Deref 转换元组类型

```rust
struct MyTuple<T>(T);

impl<T> Deref for MyTuple<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let my_tuple = MyTuple((1, 2, 3));
    let t: &(i32, i32, i32) = &*my_tuple;
    println!("{:?}", t);
}
```

在这个示例代码中，我们定义了一个 MyTuple 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyTuple 结构体中的 T 类型的引用。在 main 函数中，我们使用 Deref 将 MyTuple 结构体中的元组类型转换为元组类型，并将其赋值给 t 变量。最后，我们将 t 变量打印出来。

### 使用 Deref 转换可变引用类型

```rust
struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

impl MyString {
    fn to_uppercase(&mut self) {
        self.s = self.s.to_uppercase();
    }
}

fn main() {
    let mut my_string = MyString { s: String::from("Hello, world!") };
    my_string.to_uppercase();
    println!("{}", *my_string);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。在 MyString 结构体中，我们定义了一个 to_uppercase 方法，用于将字符串转换为大写。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为可变引用类型，并调用 to_uppercase 方法将字符串转换为大写。最后，我们将转换后的字符串打印出来。

### 使用 Deref 转换为裸指针类型

```rust
struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

fn main() {
    let my_string = MyString { s: String::from("Hello, world!") };
    let p: *const String = &*my_string;
    println!("{:p}", p);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为裸指针类型，并将其赋值给 p 变量。最后，我们将 p 变量打印出来。

### 使用 Deref 转换为引用计数类型

```rust
use std::rc::Rc;

struct MyString {
    s: Rc<String>,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

fn main() {
    let my_string = MyString { s: Rc::new(String::from("Hello, world!")) };
    let s: &str = &*my_string;
    let my_string2 = my_string.clone();
    let s2: &str = &*my_string2;
    println!("{} {}", s, s2);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 Rc<String> 类型的引用。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为字符串类型，并将其赋值给 s 变量。然后，我们使用 Rc::clone 方法克隆 my_string 变量，并将其赋值给 my_string2 变量。最后，我们将 my_string 和 my_string2 变量中的字符串打印出来。

### 使用 Deref 转换为切片类型

```rust
struct MyVec<T> {
    v: Vec<T>,
}

impl<T> Deref for MyVec<T> {
    type Target = Vec<T>;

    fn deref(&self) -> &Self::Target {
        &self.v
    }
}

fn main() {
    let my_vec = MyVec { v: vec![1, 2, 3] };
    let slice: &[i32] = &*my_vec;
    println!("{:?}", slice);
}
```

在这个示例代码中，我们定义了一个 MyVec 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyVec 结构体中的 Vec<T> 类型的引用。在 main 函数中，我们使用 Deref 将 MyVec 结构体中的 Vec<T> 类型转换为切片类型，并将其赋值给 slice 变量。最后，我们将 slice 变量打印出来。

## 进阶用法

在 Rust 中，Deref 特征不仅可以用于简单的类型转换，还可以用于更复杂的场景。下面是一些进阶用法的示例代码：

### 使用 Deref 进行方法调用

```rust
struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

impl MyString {
    fn new(s: &str) -> MyString {
        MyString { s: String::from(s) }
    }

    fn to_uppercase(&mut self) {
        self.s = self.s.to_uppercase();
    }
}

fn main() {
    let mut my_string = MyString::new("Hello, world!");
    my_string.to_uppercase();
    println!("{}", *my_string);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。在 MyString 结构体中，我们定义了一个 new 方法，用于创建 MyString 结构体。我们还定义了一个 to_uppercase 方法，用于将字符串转换为大写。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为可变引用类型，并调用 to_uppercase 方法将字符串转换为大写。最后，我们将转换后的字符串打印出来。

### 使用 Deref 进行运算符重载

```rust
use std::ops::Add;

struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

impl Add for &MyString {
    type Output = MyString;

    fn add(self, other: &MyString) -> MyString {
        MyString { s: format!("{}{}", self, other) }
    }
}

fn main() {
    let my_string1 = MyString { s: String::from("Hello, ") };
    let my_string2 = MyString { s: String::from("world!") };
    let my_string3 = &my_string1 + &my_string2;
    println!("{}", *my_string3);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。我们还实现了 Add trait，用于将两个 MyString 结构体合并为一个。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为引用类型，并使用 + 运算符将两个 MyString 结构体合并为一个。最后，我们将合并后的字符串打印出来。

### 使用 Deref 进行类型转换

```rust
use std::convert::From;

struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

impl From<MyString> for u32 {
    fn from(my_string: MyString) -> u32 {
        my_string.parse().unwrap()
    }
}

fn main() {
    let my_string = MyString { s: String::from("123") };
    let n: u32 = u32::from(*my_string);
    println!("{}", n);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。我们还实现了 From trait，用于将 MyString 结构体转换为 u32 类型。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为字符串类型，并使用 From trait 将字符串类型转换为 u32 类型。最后，我们将 u32 类型的值打印出来。

### 使用 Deref 进行类型推导

```rust
struct MyString {
    s: String,
}

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.s
    }
}

fn print_string(s: &str) {
    println!("{}", s);
}

fn main() {
    let my_string = MyString { s: String::from("Hello, world!") };
    print_string(&*my_string);
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。我们还定义了一个 print_string 函数，用于打印字符串。在 main 函数中，我们使用 Deref 将 MyString 结构体中的 String 类型转换为字符串类型，并将其传递给 print_string 函数。由于 Rust 编译器可以推导出参数类型，因此我们不需要显式地指定参数类型。

## 最佳实践

在 Rust 中，Deref 特征是一个非常有用的特征，可以帮助我们编写更加简洁、易读的代码。以下是一些最佳实践：

- 在定义数据结构时，考虑是否需要实现 Deref trait，以方便类型转换。
- 在使用 Deref 特征时，尽量避免使用 \* 运算符，而是使用 & 运算符将类型转换为引用类型。
- 在实现 Deref trait 时，使用 type Target = T; 来指定目标类型。
- 在使用 Deref 特征时，注意类型转换的顺序，以避免出现类型错误。
- 在使用 Deref 特征时，注意避免引用循环，以避免出现内存泄漏。

下面是一个示例代码，演示了如何使用 Deref 特征来简化代码：

```rust
use std::ops::Deref;

struct MyString(String);

impl Deref for MyString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let my_string = MyString(String::from("Hello, world!"));
    println!("{}", my_string.len());
}
```

在这个示例代码中，我们定义了一个 MyString 结构体，并实现了 Deref trait。在 deref 方法中，我们返回了一个指向 MyString 结构体中的 String 类型的引用。在 main 函数中，我们使用 MyString 结构体的 len 方法来获取字符串的长度，而不需要使用 \* 运算符来解引用 MyString 结构体。这样可以让代码更加简洁、易读。
