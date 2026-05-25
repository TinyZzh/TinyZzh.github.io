---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 玩转“适配器模式”
date: 2023-03-20 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 适配器模式]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

适配器模式是一种结构型设计模式，它允许对象之间通过适配器进行交互。适配器是一个能够将不兼容接口转换为另一个接口的对象，它使得那些原本无法协同工作的类可以合作无间。

Rust 是一门安全且高效的编程语言，它的类型系统和所有权模型极具优势。在实际应用中，我们经常会遇到需要整合不同接口或代码库的场景，适配器模式就显得尤为重要。

在本文中，我们将介绍 Rust 中适配器模式的实现方法，并探讨其适用场景、高级应用、最佳实践等方面。

## 常用业务场景

以下是几种适配器模式常见的业务场景：

 - 日志库整合
      
    最常见的应该是就是rust标准库里面的log日志门面，将第三方日志模块实现转换为应用程序所期望的接口。提供统一的日志级别、日志格式等服务。

 - ORM框架

    在实际应用中，我们有时需要连接多种不同的数据库。不同种类的数据库通常会有不同的 API 调用方式，这就需要对不同的数据库进行适配。适配器模式通过将不同数据库的接口统一，从而完成对各种数据库的统一调用。

 - 数据格式转换

    数据格式不同也是适配器模式的应用场景之一。例如我们要读取一个 XML 数据文件，然后将其转化为 JSON 格式。这时我们需要编写一个适配器，将 XML 解析器输出的结果转化为 JSON 格式。

 - 新旧系统整合

    在新旧系统整合的过程中，新旧系统使用的技术栈可能完全不同。比如新的系统可能使用了全新的框架，而旧的系统却是基于老旧的技术栈，这时就需要一个适配器来支持两个系统之间的交互。

## 基本用法

在 Rust 中实现适配器模式，可以使用 trait 和 impl 实现。考虑下面这样一个例子，我们想要将一个 `Vec<usize>` 转化为一个 `Vec<String>`，并输出结果：

```rust
fn main() {
    let nums: Vec<usize> = vec![1, 2, 3, 4, 5];
    let strs: Vec<String> = nums.iter().map(|n| n.to_string()).collect();
    println!("{:?}", strs);
}
```

上述做法能够正确地将一个 `Vec<usize>` 转化为 `Vec<String>`，但是它只适用于两个类型之间的简单转换。如果我们需要在更复杂的场景下进行适配，那么就需要使用 trait 和 impl 来实现适配器。

首先，我们需要定义适配器的接口，也就是一个 `trait`：

```rust
trait Adapter {
    fn convert(&self) -> String;
}
```

这里我们定义了一个 `Adapter` trait，用于进行适配操作。接下来，我们需要编写针对特定类型的适配器：

```rust
struct NumAdapter<'a> {
    nums: &'a Vec<usize>,
}

impl<'a> Adapter for NumAdapter<'a> {
    fn convert(&self) -> String {
        self.nums.iter().map(|n| n.to_string()).collect::<Vec<String>>().join(", ")
    }
}
```

在上述代码中，我们定义了一个 `NumAdapter` 类型，它接受一个 `&Vec<usize>` 类型的参数，同时实现了 `Adapter` trait 中定义的 `convert()` 方法。这个方法将输入的 `Vec<usize>` 转化为一个字符串（用逗号分隔），并返回结果。

现在我们可以使用适配器来将一个 `Vec<usize>` 对象转化为一个字符串了：

```rust
fn main() {
    let nums: Vec<usize> = vec![1, 2, 3, 4, 5];
    let adapter = NumAdapter { nums: &nums };
    let result = adapter.convert();
    println!("{}", result);
}
// 输出结果：
// 1, 2, 3, 4, 5
```

这个例子中，我们充分利用了 Rust 的 trait 以及 impl 实现适配器模式。通过定义 trait 和实现 trait 的结构，我们允许不同的类型之间进行转换，并支持不同类型的自定义实现。

## 适配器模式进阶用法

适配器模式的高级应用包括：`类适配器`和`对象适配器`。类适配器使用 Rust 继承特性实现，允许 Adapter 类继承源类并实现 interface 接口。对象适配器使用 Rust 组合特性实现，允许 Adapter 类通过持有 Source 类的对象实现 interface 接口。

### 类适配器

类适配器使用 Rust 继承特性实现，允许 Adapter 类继承源类并实现 interface 接口。这种方法相对简单，但是限制了 Adapter 类的继承关系。

在 Rust 中，我们可以使用 trait 继承其他 trait。考虑下面这样一个例子，我们定义了一个 `Shape` trait，用于表示图形的面积和周长：

```rust
trait Shape {
    fn area(&self) -> f64;
    fn perimeter(&self) -> f64;
}
```

现在我们需要将一个圆形转化为一个矩形，那么我们就可以使用 Adapter 实现这个功能：

```rust
struct Circle {
    radius: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }

    fn perimeter(&self) -> f64 {
        2.0 * std::f64::consts::PI * self.radius
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

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }
}

struct CircleAdapter {
    circle: Circle,
}

impl Shape for CircleAdapter {
    fn area(&self) -> f64 {
        let r = self.circle.radius;
        Rectangle {
            width: 2.0 * r,
            height: 2.0 * r,
        }
        .area()
    }

    fn perimeter(&self) -> f64 {
        let r = self.circle.radius;
        Rectangle {
            width: 2.0 * r,
            height: 2.0 * r,
        }
        .perimeter()
    }
}
```

在上述代码中，我们定义了三种类型，分别来表示图形接口、圆形和矩形。这两个具体类型都实现了 `Shape` trait，分别用于计算它们的面积和周长。

接下来，我们定义了一个 `CircleAdapter`，用于将一个圆形适配成一个矩形。`CircleAdapter` 继承 `Circle` 类型，并实现了 `Shape` trait。它的实现方式是基于一个公式，使用一个具有相同面积和周长的矩形来模拟圆形。

最后，我们可以测试一下这个类适配器是否可用：

```rust
fn main() {
    let circle = Circle { radius: 2.0 };
    println!("Circle area = {}", circle.area());
    println!("Circle perimeter = {}", circle.perimeter());
    let circle_adapter = CircleAdapter { circle };
    println!("Adapted rectangle area = {}", circle_adapter.area());
    println!(
        "Adapted rectangle perimeter = {}",
        circle_adapter.perimeter()
    );
}
//    输出结果为：
// Circle area = 12.566370614359172
// Circle perimeter = 12.566370614359172
// Adapted rectangle area = 16
// Adapted rectangle perimeter = 16
```

在这个例子中，我们使用了 Rust 的 trait 继承特性，定义了一个 `CircleAdapter` 类型，并将其适配为一个矩形。这种方法虽然相对简单，但是限制了 Adapter 类的继承关系。

### 对象适配器

对象适配器使用 Rust 组合特性实现，允许 Adapter 类通过持有 Source 类的对象实现 interface 接口。这种方法不限制 Adapter 类的继承关系，但是需要额外的结构体成员变量来保存源类对象的引用。

我们依旧采用 Shape trait 为例来讲解对象适配器的实现方式。同样，我们定义一个 `Shape` trait：

```rust
trait Shape {
    fn area(&self) -> f64;
    fn perimeter(&self) -> f64;
}
```

我们同时定义了一个 `Rectangle` 类型来表示矩形，还有一个 `Circle` 类型来表示圆形。接下来，我们需要编写一个 `CircleAdapter` 类型来将 `Circle` 类型适配成 `Rectangle` 类型：

```rust
struct CircleAdapter {
    circle: Circle,
}

impl Shape for CircleAdapter {
    fn area(&self) -> f64 {
          let r = self.circle.radius;
        Rectangle { width: 2.0 * r, height: 2.0 * r }.area()
    }

    fn perimeter(&self) -> f64 {
          let r = self.circle.radius;
        Rectangle { width: 2.0 * r, height: 2.0 * r }.perimeter()
    }
}
```

在上述代码中，我们定义了一个 `CircleAdapter` 结构体，并引入了 `Circle` 类型。通过组合的方式，我们将 `Circle` 类型与 `Rectangle` 类型适配起来。

最后我们可以测试一下此处的适配器是否可用：

```rust
fn main() {
    let circle = Circle { radius: 2.0 };
    println!("Circle area = {}", circle.area());
    println!("Circle perimeter = {}", circle.perimeter());
    let circle_adapter = CircleAdapter { circle };
    println!("Adapted rectangle area = {}", circle_adapter.area());
    println!("Adapted rectangle perimeter = {}", circle_adapter.perimeter());
}
```

在这个例子中，我们使用了 Rust 的组合特性，通过引入一个 `Circle` 对象，将其适配成 `Rectangle` 类型。这种方法不限制 Adapter 类的继承关系，但是需要额外的结构体成员变量来保存源类对象的引用。

### 双向适配器

适配器模式也可以实现双向适配器，这意味着两个系统之间都可以使用适配器。例如，如果两个系统之间需要进行双向数据交换，则可以编写一个适配器，将两个系统之间的数据转换为一种格式。

```rust
trait SystemA {
    fn method_a(&self);
}

trait SystemB {
    fn method_b(&self);
}

struct SystemAAdapter<T: SystemB> {
    system_b: T,
}

impl<T: SystemB> SystemAAdapter<T> {
    fn new(system_b: T) -> Self {
        Self { system_b }
    }
}

impl<T: SystemB> SystemA for SystemAAdapter<T> {
    fn method_a(&self) {
        self.system_b.method_b();
    }
}

struct SystemBAdapter<T: SystemA> {
    system_a: T,
}

impl<T: SystemA> SystemBAdapter<T> {
    fn new(system_a: T) -> Self {
        Self { system_a }
    }
}

impl<T: SystemA> SystemB for SystemBAdapter<T> {
    fn method_b(&self) {
        self.system_a.method_a();
    }
}
```

## 最佳实践

在 Rust 中使用适配器模式时，可以参考以下几点最佳实践：

- 使用 trait 和 impl 实现适配器模式；
- 对于简单适配场景，可以使用适配器模式快速处理；
- 对于复杂的适配场景，可以选择类适配器或对象适配器；
- 对于对象适配器，需要额外的结构体成员变量来保存源类对象的引用。
- 使用泛型实现适配器。使用泛型可以实现更通用的适配器，并使代码更加灵活。
- 将适配器分离到单独的文件中。将适配器代码分离到单独的文件中可以提高代码的可读性和可维护性。

## 结论

适配器模式是一种强大的结构性设计模式，它可以帮助我们解决许多不同类型之间的接口问题。在 Rust 中，我们可以使用 trait 和 impl 实现适配器，也可以选择类适配器或对象适配器来适应不同的应用场景。