---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 匹配模式
date: 2023-04-02 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Match]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一门现代化的系统编程语言，它拥有高性能、内存安全和并发性等特点。Rust 的语法设计非常优秀，其中 match 语句是一种非常强大的语言特性。match 语句可以让我们根据不同的匹配模式执行不同的代码，这在处理复杂的逻辑时非常有用。在本教程中，我们将深入了解 Rust 的 match 语句，包括基础用法、进阶用法和实践经验等方面。

## 基础用法

match 语句是 Rust 中的一种控制流语句，它可以让我们根据不同的模式匹配执行不同的代码。match 语句的基本语法如下：

```rust
match value {
    pattern1 => {
    // code1
    }
    pattern2 => {
    // code2
    }
    _ => {
    // 没有任何匹配
    }
}
```

其中，value 是要匹配的变量，pattern 是匹配模式，=>后面是要执行的代码块。如果 value 匹配了某个模式，就会执行对应的代码块。如果 value 没有匹配任何模式，就会执行默认的代码块（即_ => {...}）。

接下来，我们将通过一些示例来介绍 match 语句的基础用法。

###   匹配整数

```rust
fn main() {
    let x = 1;
    
    match x {
        1 => println!("x is one"),
        2 => println!("x is two"),
        _ => println!("x is not one or two"),
    }
}
//  x is one
```

在这个示例中，我们定义了一个整数变量 x，并使用 match 语句匹配它。如果 x 等于 1，就会执行第一个代码块，输出"x is one"；如果 x 等于 2，就会执行第二个代码块，输出"x is two"；如果 x 不等于 1 或 2，就会执行默认的代码块，输出"x is not one or two"。

###   匹配枚举类型

```rust
enum Color {
    Red,
    Green,
    Blue,
}

let color = Color::Green;

match color {
    Color::Red => println!("The color is red"),
    Color::Green => println!("The color is green"),
    Color::Blue => println!("The color is blue"),
}
```

在这个示例中，我们定义了一个枚举类型 Color，并将变量 color 赋值为 Color::Green。然后，我们使用 match 语句匹配 color。如果 color 等于 Color::Red，就会执行第一个代码块，输出"The color is red"；如果 color 等于 Color::Green，就会执行第二个代码块，输出"The color is green"；如果 color 等于 Color::Blue，就会执行第三个代码块，输出"The color is blue"。

###   匹配元组

```rust
let point = (1, 2);

match point {
    (0, 0) => println!("The point is at the origin"),
    (_, 0) => println!("The point is on the x-axis"),
    (0, _) => println!("The point is on the y-axis"),
    (x, y) => println!("The point is at ({}, {})", x, y),
}
```

在这个示例中，我们定义了一个元组变量 point，并使用 match 语句匹配它。如果 point 等于(0, 0)，就会执行第一个代码块，输出"The point is at the origin"；如果 point 的第二个元素等于 0，就会执行第二个代码块，输出"The point is on the x-axis"；如果 point 的第一个元素等于 0，就会执行第三个代码块，输出"The point is on the y-axis"；否则，就会执行第四个代码块，输出"The point is at ({}, {})"。

###   匹配范围

```rust
let age = 20;

match age {
    0..=17 => println!("You are a minor"),
    18..=64 => println!("You are an adult"),
    _ => println!("You are a senior"),
}
```

在这个示例中，我们定义了一个整数变量 age，并使用 match 语句匹配它。如果 age 的值在 0 到 17 之间，就会执行第一个代码块，输出"You are a minor"；如果 age 的值在 18 到 64 之间，就会执行第二个代码块，输出"You are an adult"；否则，就会执行默认的代码块，输出"You are a senior"。

###   匹配引用

```rust
let x = 1;
let y = &x;

match y {
    &1 => println!("The value is one"),
    _ => println!("The value is not one"),
}
```

在这个示例中，我们定义了一个整数变量 x 和一个指向 x 的引用 y。然后，我们使用 match 语句匹配 y。由于 y 是一个引用，所以我们需要在模式中使用&符号来匹配它。如果 y 指向的值等于 1，就会执行第一个代码块，输出"The value is one"；否则，就会执行默认的代码块，输出"The value is not one"。

###   匹配守卫

```rust
let x = 5;

match x {
    n if n < 0 => println!("The value is negative"),
    n if n > 10 => println!("The value is greater than 10"),
    _ => println!("The value is between 0 and 10"),
}
```

在这个示例中，我们定义了一个整数变量 x，并使用 match 语句匹配它。在模式中，我们使用 if 语句添加了一个守卫条件。如果 x 小于 0，就会执行第一个代码块，输出"The value is negative"；如果 x 大于 10，就会执行第二个代码块，输出"The value is greater than 10"；否则，就会执行默认的代码块，输出"The value is between 0 and 10"。

## 进阶用法

除了上面介绍的基础用法，match 语句还有一些进阶用法，可以让我们更加灵活地使用它。接下来，我们将介绍 match 语句的一些进阶用法，并通过示例来演示它们的用法。

###   使用|匹配多个模式

```rust
let x = 1;

match x {
    1 | 2 => println!("The value is one or two"),
    _ => println!("The value is not one or two"),
}
```

在这个示例中，我们定义了一个整数变量 x，并使用 match 语句匹配它。在模式中，我们使用|符号来匹配多个模式。如果 x 等于 1 或 2，就会执行第一个代码块，输出"The value is one or two"；否则，就会执行默认的代码块，输出"The value is not one or two"。

###   使用..=匹配范围

```rust
let age = 20;

match age {
    0..=17 => println!("You are a minor"),
    18..=64 => println!("You are an adult"),
    _ => println!("You are a senior"),
}
```

在这个示例中，我们定义了一个整数变量 age，并使用 match 语句匹配它。在模式中，我们使用..=符号来匹配范围。如果 age 的值在 0 到 17 之间，就会执行第一个代码块，输出"You are a minor"；如果 age 的值在 18 到 64 之间，就会执行第二个代码块，输出"You are an adult"；否则，就会执行默认的代码块，输出"You are a senior"。

###   使用@绑定变量

```rust
let x = Some(5);

match x {
    Some(n @ 1..=10) => println!("The value is between 1 and 10: {}", n),
    Some(n @ 11..=20) => println!("The value is between 11 and 20: {}", n),
    Some(_) => println!("The value is not between 1 and 20"),
    None => (),
}
```

在这个示例中，我们定义了一个 Option 类型的变量 x，并使用 match 语句匹配它。在模式中，我们使用@符号来绑定一个变量。如果 x 是一个 Some 类型，并且它的值在 1 到 10 之间，就会执行第一个代码块，输出"The value is between 1 and 10"；如果 x 是一个 Some 类型，并且它的值在 11 到 20 之间，就会执行第二个代码块，输出"The value is between 11 and 20"；如果 x 是一个 Some 类型，但它的值不在 1 到 20 之间，就会执行第三个代码块，输出"The value is not between 1 and 20"；如果 x 是一个 None 类型，就不会执行任何代码。

###   使用_忽略模式

```rust
let x = Some(5);

match x {
    Some(_) => println!("The value is some"),
    None => println!("The value is none"),
}
```

在这个示例中，我们定义了一个 Option 类型的变量 x，并使用 match 语句匹配它。在模式中，我们使用_符号来忽略模式。如果 x 是一个 Some 类型，就会执行第一个代码块，输出"The value is some"；如果 x 是一个 None 类型，就会执行第二个代码块，输出"The value is none"。

###   使用 if let 简化模式匹配

```rust
let x = Some(5);

if let Some(n) = x {
    println!("The value is {}", n);
} else {
    println!("The value is None");
}
```

在这个示例中，我们定义了一个 Option 类型的变量 x，并使用 if let 语句匹配它。如果 x 是一个 Some 类型，就会执行 if 语句块，输出"The value is x"；如果 x 是一个 None 类型，就会执行 else 语句块，输出"The value is None"。使用 if let 语句可以简化模式匹配的代码，使代码更加清晰和简洁。

###   使用 while let 遍历迭代器

```rust
let mut v = vec![1, 2, 3];
while let Some(n) = v.pop() {
    println!("{}", n);
}
```

在这个示例中，我们定义了一个整数数组 v，并使用 while let 语句遍历它的元素。在 while let 语句中，我们使用 pop()方法从数组中依次取出元素，并将它们绑定到变量 n 中。如果数组中还有元素，就会执行 while 语句块，输出元素的值；否则，就会退出 while 循环。使用 while let 语句可以方便地遍历迭代器或者其他可迭代对象。

## 实践经验

在实际开发中，我们经常需要使用 match 语句来处理复杂的逻辑。以下是一些实践经验，可以帮助我们更好地使用 match 语句。

### 给每个分支加上花括号

在 match 语句中，每个分支的代码块通常都比较复杂，因此我们应该给每个分支加上花括号，以便更好地阅读和维护代码。例如：

```rust
fn main() {
    let x = 1;
    
    match x {
        1 => {
            println!("The value is one");
            println!("This is a long message");
        }
        2 => {
            println!("The value is two");
        }
        _ => {
            println!("The value is not one or two");
        }
    }
}
// The value is one
// This is a long message
```

### 使用_忽略不需要的变量

在 match 语句中，我们可以使用_符号来忽略不需要的变量。这样可以简化代码，并且让代码更加清晰。例如：

```rust
let x = (1, 2);

match x {
    (1, _) => println!("The first element is 1"),
    (_, 2) => println!("The second element is 2"),
    _ => (),
}
```

在这个示例中，我们使用_符号来忽略第二个元素，因为我们只关心第一个元素是否等于 1。

### 使用 if let 简化模式匹配

在某些情况下，我们只需要匹配一个模式，而不需要处理其他模式。此时，我们可以使用 if let 语句来简化模式匹配的代码。例如：

```rust
let x = Some(5);

if let Some(n) = x {
    println!("The value is {}", n);
}
```

在这个示例中，我们只需要匹配 Some 类型的值，而不需要处理 None 类型的值。因此，使用 if let 语句可以让代码更加简洁和清晰。

### 使用 while let 遍历迭代器

在遍历迭代器时，我们可以使用 while let 语句来依次取出元素，并进行处理。例如：

```rust
fn main() {
    let v = vec![1, 2, 3];

    for n in &v {
        println!("{}", n);
    }

    let mut v = vec![1, 2, 3];
    while let Some(n) = v.pop() {
        println!("{}", n);
    }
}
```

在这个示例中，我们使用 for 循环和 while let 语句来遍历整数数组 v 的元素。使用 while let 语句可以让代码更加简洁和清晰。

## 总结

match 语句是 Rust 中非常强大的语言特性，它可以让我们根据不同的匹配模式执行不同的代码。在本教程中，我们介绍了 match 语句的基础用法、进阶用法和实践经验等方面。通过学习本教程，相信读者已经掌握了 match 语句的基本用法，并能够在实际开发中灵活运用它。
