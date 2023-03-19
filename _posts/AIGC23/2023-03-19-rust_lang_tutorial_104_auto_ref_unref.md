---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 自动引用和解引用
date: 2023-03-19 01:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, RwLock]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_104_auto_ref_unref.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言是一种静态类型的系统编程语言，具有强类型和所有权的概念。在Rust中，每个值都具有所有权，并且所有权只能有一个所有者。这种所有权模型使得Rust在内存安全方面有很好的表现。

在Rust中，如果我们想要使用一个变量或值，我们需要将其分配给一个变量。这个变量可以是一个引用，也可以是一个拥有所有权的变量。当我们使用一个引用时，我们需要使用`&`符号来创建一个指向该值的引用。

在某些情况下，Rust会自动为我们创建引用或解引用。这称为自动引用和解引用。在这篇文章中，我们将讨论Rust语言的自动引用和解引用，以及如何在代码中使用它们。

## 自动引用

自动引用是指编译器在某些情况下自动为我们创建引用。这个过程被称为自动引用。

当我们使用一个变量或值时，如果该变量或值不是一个引用，则编译器会自动为我们创建一个引用。这个引用的类型是根据上下文推断出来的。

例如，考虑以下代码：

```rust
fn main() {
    let x = 5;
    let y = &x;

    println!("x = {}", x);
    println!("y = {}", y);
}
```

在这个例子中，我们定义了一个变量`x`，它的值是5。然后，我们定义了一个变量`y`，它是指向`x`的引用。

但是，我们可以在没有显式创建引用的情况下使用`x`：

```rust
fn main() {
    let x = 5;
    let y = &x;

    println!("x = {}", x);

    // 自动引用
    println!("y = {}", y);
    println!("*y = {}", *y); // 解引用
}
```

在这个例子中，我们使用了`x`和`y`。当我们使用`x`时，编译器会自动为我们创建一个指向`x`的引用。当我们使用`y`时，我们实际上也是在使用一个引用，因为`y`本身就是一个引用。

在这个例子中，我们还使用了`*y`来解引用`y`。这意味着我们要访问`y`指向的值。当我们使用`*`运算符时，编译器会自动为我们解引用`y`。

## 自动解引用

自动解引用是指编译器在某些情况下自动为我们解引用一个引用。这个过程被称为自动解引用。

当我们使用一个引用调用一个方法或访问一个字段时，编译器会自动为我们解引用该引用。这是因为方法和字段都是使用`.`运算符来访问的，而不是`*`运算符。

例如，考虑以下代码：

```rust
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;

        ((dx * dx + dy * dy) as f64).sqrt()
    }
}

fn main() {
    let p1 = Point::new(0, 0);
    let p2 = Point::new(3, 4);

    // 自动解引用
    println!("distance = {}", p1.distance(&p2));
}
```

在这个例子中，我们定义了一个`Point`结构体，它有两个字段`x`和`y`。我们还为`Point`实现了一个`distance`方法，

它计算了两个点之间的距离。

在`main`函数中，我们创建了两个`Point`实例`p1`和`p2`。然后，我们使用`p1`的`distance`方法来计算`p1`和`p2`之间的距离。

在这个例子中，我们使用了`p1.distance(&p2)`来调用`distance`方法。这里的`&p2`是一个引用，它传递给`distance`方法作为参数。

但是，我们不需要在调用`distance`方法时显式地解引用`p1`。这是因为编译器会自动为我们解引用`p1`。所以，我们可以直接使用`p1.distance(&p2)`，而不是`(*p1).distance(&p2)`。

## 自动引用和解引用的规则

Rust中的自动引用和解引用有一些规则。这些规则决定了编译器何时会自动为我们创建引用或解引用。

### 1. 方法调用

当我们调用一个方法时，编译器会自动为我们解引用该方法的接收者。这是因为方法调用使用`.`运算符，而不是`*`运算符。

例如，考虑以下代码：

```rust
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;

        ((dx * dx + dy * dy) as f64).sqrt()
    }
}

fn main() {
    let p1 = Point::new(0, 0);
    let p2 = Point::new(3, 4);

    // 自动解引用
    println!("distance = {}", p1.distance(&p2));
}
```

在这个例子中，我们调用了`p1`的`distance`方法。编

译器会自动为我们解引用`p1`，因为`p1`是`distance`方法的接收者，并且方法调用使用`.`运算符。

### 2. 解引用强制多态

当我们使用`*`运算符来解引用一个实现了`Deref` trait的类型时，编译器会自动为我们调用该类型的`deref`方法。这被称为解引用强制多态。

例如，考虑以下代码：

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    // 解引用强制多态
    assert_eq!(5, *y);
}
```

在这个例子中，我们定义了一个`MyBox`类型，它包装了一个值。我们还为`MyBox`实现了`Deref` trait，使得我们可以通过解引用来访问该值。

在`main`函数中，我们创建了一个`x`变量，它的值是5。然后，我们使用`MyBox::new`方法来创建一个`MyBox`实例`y`，它包装了`x`的值。

在`assert_eq!(5, *y)`这一行中，我们使用`*`运算符来解引用`y`。编译器会自动为我们调用`y`的`deref`方法，这使得我们可以访问`y`包装的值。

### 3. 函数和方法参数

当我们将一个值作为函数或方法的参数传递时，编译器会自动为我们创建一个引用。这是因为函数和方法的参数使用了`&`运算符，而不是`*`运算符。

例如，考虑以下代码：

```rust
fn print(x: &i32) {
    println!("x = {}", x);
}

fn main() {
    let x = 5;

    // 自动引用
    print(&x);
}
```

在这个例子中，我们定义了一个`print`函数，它的参数是一个`i32`类型的引用。在`main`函数中，我们创建了一个`x`变量，它的值是5。然后，我们将`&x`作为参数传递给`print`函数。

在`print(&x)`这一行中，我们没有显式地使用`&`运算符来创建一个引用。但是，编译器会自动为我们创建一个引用，因为`print`函数的参数使用了`&`运算符。

### 4. 解引用可变借用

当我们使用`*`运算符来解引用一个可变借用时，编译器会自动为我们创建一个可变引用。这是因为解引用可变借用时，我们需要访问可变借用所指向的值，而这需要一个可变引用。

例如，考虑以下代码：

```rust
fn print(x: &mut i32) {
    println!("x = {}", x);
}

fn main() {
    let mut x = 5;

    // 解引用可变借用
    *(&mut x) += 1;
    print(&mut x);
}
```

在这个例子中，我们定义了一个`print`函数，它的参数是一个可变借用。在`main`函数中，我们创建了一个`x`变量，它的值是5。然后，我们使用`&mut x`来创建一个可变借用，并使用`*(&mut x)`来解引用它。这会自动为我们创建一个可变引用，使我们可以修改`x`的值。

在`*(&mut x) += 1`这一行中，我们将`x`的值增加了1。然后，我们将`&mut x`作为参数传递给`print`函数。

## 自动引用和解引用的注意点

虽然自动引用和解引用能够使代码更加简洁和易读，但是在使用它们时需要注意一些事项。

### 1. 可能的歧义

自动引用和解引用可能会导致歧义。例如，考虑以下代码：

```rust
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;

        ((dx * dx + dy * dy) as f64).sqrt()
    }
}

fn main() {
    let p1 = Point::new(0, 0);
    let p2 = Point::new(3, 4);

    // 没有歧义
    println!("distance = {}", p1.distance(&p2));

    // 可能的歧义
    let distance = p1.distance;
    println!("distance = {}", distance(&p2));
}
```

在这个例子中，我们定义了一个`Point`类型和一个`distance`方法，它计算两个点之间的距离。

在`main`函数中，我们创建了两个`Point`实例`p1`和`p2`。然后，我们使用`p1`的`distance`方法来计算`p1`和`p2`之间的距离。

在第二个`println!`语句中，我们将`p1.distance`赋值给了`distance`变量。然后，我们使用`distance(&p2)`来调用`distance`方法。这里的`&p2`是一个引用，它传递给`distance`方法作为参数。

在这个例子中，编译器不能确定我们想要自动为哪个对象创建引用或解引用哪个对象。所以，它会报告一个错误，要求我们明确指定使用哪个对象。

### 2. 性能问题

自动引用和解引用可能会带来一些性能问题。当我们使用自动引用时，编译器会为我们创建一个引用，这可能会导致额外的开销和内存分配。

例如，考虑以下代码：

```rust
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;

        ((dx * dx + dy * dy) as f64).sqrt()
    }
}

fn main() {
    let p1 = Point::new(0, 0);
    let p2 = Point::new(3, 4);

    // 自动引用
    println!("distance = {}", p1.distance(&p2));
}
```

在这个例子中，我们使用了自动引用来调用`p1`的`distance`方法。编译器会为我们创建一个`&Point`类型的引用，这会导致额外的开销和内存分配。

如果我们手动创建一个`&Point`类型的引用，代码可能会更加高效：

```rust
fn main() {
    let p1 = Point::new(0, 0);
    let p2 = Point::new(3, 4);

    // 手动创建引用
    println!("distance = {}", (&p1).distance(&p2));
}
```

在这个例子中，我们手动创建了一个`&Point`类型的引用，这避免了编译器为我们创建引用所带来的开销和内存分配。

## 总结

自动引用和解引用是Rust中非常有用的特性。它们能够使代码更加简洁和易读，但是在使用它们时需要注意可能出现的歧义和性能问题。

当我们使用`.`运算符来调用方法时，编译器会自动为我们创建一个引用。当我们使用`*`运算符来解引用一个值时，编译器会自动为我们创建一个引用或可变引用，具体取决于该值是否可变。

自动引用和解引用可以使代码更加简洁和易读，但是在使用它们时需要注意可能出现的歧义和性能问题。为了避免可能的歧义和提高性能，我们可以手动创建引用或可变引用。

最后，我们需要注意的是，Rust的所有权和借用系统是这些特性的基础。自动引用和解引用能够使我们更方便地使用借用系统，但是借用规则仍然适用。在使用自动引用和解引用时，我们仍然必须遵循借用规则，以确保代码的正确性和安全性。