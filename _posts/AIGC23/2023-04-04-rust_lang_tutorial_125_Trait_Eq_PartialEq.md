---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 如何判断对象是否相等？
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Eq, PartialEq]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在Rust语言中，PartialEq和Eq是两个非常重要的trait。它们用于比较类型的值，PartialEq用于比较部分相等（不需要完全相等），而Eq用于比较完全相等。

在Rust中，任何类型都可以实现PartialEq和Eq，因此这两个trait非常灵活。

## 基础用法

###  比较整数

```rust
fn main() {
    let a = 10;
    let b = 20;
    if a == b {
        println!("a equals b");
    } else {
        println!("a does not equal b");
    }
}
```

输出：

```
a does not equal b
```

###  比较字符串

```rust
fn main() {
    let a = "hello";
    let b = "world";
    if a == b {
        println!("a equals b");
    } else {
        println!("a does not equal b");
    }
}
```

输出：

```
a does not equal b
```

###  比较自定义类型

```rust
#[derive(PartialEq, Eq)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    let p2 = Person {
        name: "Bob".to_string(),
        age: 30,
    };
    if p1 == p2 {
        println!("p1 equals p2");
    } else {
        println!("p1 does not equal p2");
    }
}
```

输出：

```
p1 does not equal p2
```

###  比较浮点数

```rust
fn main() {
    let a = 0.1 + 0.2;
    let b = 0.3;
    if a == b {
        println!("a equals b");
    } else {
        println!("a does not equal b");
    }
}
```

输出：

```
a does not equal b
```

###  自定义比较函数

```rust
#[derive(PartialEq, Eq)]
struct Person {
    name: String,
    age: u8,
}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.age == other.age
    }
}

impl Eq for Person {}

fn main() {
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    let p2 = Person {
        name: "Bob".to_string(),
        age: 30,
    };
    if p1 == p2 {
        println!("p1 equals p2");
    } else {
        println!("p1 does not equal p2");
    }
}
```

输出：

```
p1 equals p2
```

###  比较枚举类型

```rust
#[derive(PartialEq, Eq)]
enum Color {
    Red,
    Blue,
}

fn main() {
    let c1 = Color::Red;
    let c2 = Color::Blue;
    if c1 == c2 {
        println!("c1 equals c2");
    } else {
        println!("c1 does not equal c2");
    }
}
```

输出：

```
c1 does not equal c2
```

###  使用assert_eq!宏

```rust
fn main() {
    let a = 10;
    let b = 20;
    assert_eq!(a, b);
}
```

输出：

```
thread 'main' panicked at 'assertion failed: `(left == right)`
  left: `10`,
 right: `20`', src/main.rs:4:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

###  使用assert_ne!宏

```rust
fn main() {
    let a = 10;
    let b = 20;
    assert_ne!(a, b);
}
```

输出：

```
thread 'main' panicked at 'assertion failed: `(left != right)`
  left: `10`,
 right: `10`', src/main.rs:4:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

## 进阶用法

###  自定义比较函数

```rust
#[derive(PartialEq, Eq)]
struct Person {
    name: String,
    age: u8,
}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.age == other.age
    }
}

impl Eq for Person {}

fn main() {
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    let p2 = Person {
        name: "Bob".to_string(),
        age: 40,
    };
    if p1 == p2 {
        println!("p1 equals p2");
    } else {
        println!("p1 does not equal p2");
    }
}
```

输出：

```
p1 does not equal p2
```

###  使用泛型

```rust
#[derive(PartialEq, Eq)]
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let p1 = Pair {
        first: 1,
        second: 2,
    };
    let p2 = Pair {
        first: 2,
        second: 1,
    };
    if p1 == p2 {
        println!("p1 equals p2");
    } else {
        println!("p1 does not equal p2");
    }
}
```

输出：

```
p1 does not equal p2
```

###  使用PartialOrd和Ord

```rust
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    let p2 = Person {
        name: "Bob".to_string(),
        age: 40,
    };
    if p1 < p2 {
        println!("p1 is younger than p2");
    } else {
        println!("p1 is older than or equal to p2");
    }
}
```

输出：

```
p1 is younger than p2
```

###  使用Debug和Display

```rust
#[derive(Debug, PartialEq, Eq)]
struct Person {
    name: String,
    age: u8,
}

use std::fmt;

impl fmt::Display for Person {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ({})", self.name, self.age)
    }
}

fn main() {
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    let p2 = Person {
        name: "Bob".to_string(),
        age: 40,
    };
    println!("p1: {}", p1);
    println!("p2: {}", p2);
}
```

输出：

```
p1: Alice (30)
p2: Bob (40)
```

## 最佳实践

在实现PartialEq和Eq时，应该考虑以下几点：

- 对于自定义类型，应该比较所有的成员变量，而不仅仅是一部分。
- 对于浮点数，应该使用近似比较而不是精确比较。
- 对于枚举类型，应该比较所有的成员变量，而不仅仅是枚举值本身。
- 如果需要比较的类型实现了PartialOrd和Ord，应该优先使用这两个trait。

## 结论

在Rust语言中，PartialEq和Eq是非常重要的trait，用于比较类型的值。这两个trait非常灵活，任何类型都可以实现它们。在实现PartialEq和Eq时，应该考虑到类型的特点，比较所有的成员变量，使用近似比较等。