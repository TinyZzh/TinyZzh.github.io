---
layout: post
read_time: true
show_date: true
title: 详解Rust语言的trait关键字
date: 2023-03-06 22:22:00 +0800
categories: [rust, trait]
tags: [rust, trait]
toc: yes
image_scaling: true
---

trait是Rust中非常重要的关键字，借助这个关键字可以实现多重继承，使得Rust程序员可以使用它来为不同的类型创建行为。Traits通过定义可被其他类型实现的方法，来实现“ Mixins”模式：将行为加载到不同的类型上。

trait关键字可以用来定义traits，traits代表了一组具有相同特征的集合，指定trait的实现者必须提供实现每一个成员函数的具体实现。例如，如果你定义了一个Comparator trait，那么它的实现者必须实现equal、greater和less三个函数。

## trait关键字的优缺点

traits有三大优点：

 - 代码复用。 traits可以避免重复地实现相同的逻辑，而是可以被不同的实现者共享。
 - 动态调用。 traits实现的函数可以有动态多态，这意味着在编译时不需要知道实现者，而只需要确保trait被实现即可。
 - 更好的设计。使用traits来对实现进行抽象，可以更好的将实现和概念分离，这样既可以更好的理解代码，也可以更好的扩展代码。

traits也有一些缺点，例如：它的实现是静态绑定的，而且在涉及到大量traits的实现时，容易造成膨胀性和代码冗余。无法实现动态多态，导致的动态多态的潜在性能开销。

## trait 基础用法示例

```rust
以下是一个示例trait，它定义了一个"swim"函数，用来描述如何游泳：

// Define a trait for swimming 
trait Swimming { fn swim(&self); }

// Implement the trait for a type struct Fish; 
impl Swimming for Fish { fn swim(&self) { println!("Fish is swimming!"); } }

// Use the trait
fn do_something<T: Swimming>(x: T) { x.swim(); }

fn main() { // Create a value of type Fish
 let fish = Fish;

// Pass the fish to the function
do_something(fish);
} 
```

实现多重继承，示例代码如下：


```rust
// Define two traits for swimming and flying
trait Swimming {
    fn swim(&self);
}
 
trait Flying {
    fn fly(&self);
}

// Implement the two traits for a type
struct Fish;
impl Swimming for Fish {
    fn swim(&self) {
        println!("Fish is swimming!");
    }
}

impl Flying for Fish {
    fn fly(&self) {
        println!("Fish is flying!");
    }
}

// Use the trait
fn do_something<T: Swimming + Flying>(x: T) {
    x.swim();
    x.fly();
}

fn main() {
    // Create a value of type Fish
    let fish = Fish;

    // Pass the fish to the function
    do_something(fish);
}
```

### trait 泛型约束

trait约束是Rust中一种非常有用的特性，它可以让程序员定义更具体的类型要求，而不是使用通用的类型。Rust中的trait约束通过一个where子句指定，可以用来定义函数参数类型必须实现的trait。

例如，假设你有一个trait Summable， 它定义了一个sum方法：

```rust
trait Summable {
    fn sum(&self);
}
```

现在你想定义一个函数，它的参数必须是Summable trait的实现者，那么可以使用trait约束：

```rust
fn foo<T: Summable>(x: T) {
    x.sum();
}
```

这样 foo 函数就只能接受 Summable trait 的实现者作为参数，而其他类型则会导致编译错误。


### trait 别名

trait 别名是Rust中另一种有用的特性，它可以为trait创建别名，从而更容易地使用多个trait作为类型参数。

例如，假设你有一个trait Swimmable，它定义了一个 swim 方法：

```rust
trait Swimmable {
    fn swim(&self);
}
```

现在你想定义一个函数，它的参数必须是Swimmable trait或者Flyable trait的实现者，为此可以使用trait别名：

```rust
// Create a trait alias for Swimmable and Flyable
trait CanMove = Swimmable + Flyable;

fn foo<T: CanMove>(x: T) {
    x.swim();
    x.fly();
}
```

这样foo函数就可以接受Swimmable和Flyable trait的实现者作为参数，而其他类型则会导致编译错误。

## derive

derive是Rust中一种特殊语法，它可以自动实现某些trait。 当使用derive时，Rust会在编译阶段自动分析代码，并为你生成所需的 trait 实现。 这允许开发者更快速地实现那些已经被编写过多次的 trait。

例如，有一个Traversable trait，它可以用来表示访问器。它包含一个traverse函数，用来指定一个访问器应该如何遍历一个容器：

```rust
trait Traversable {
    fn traverse(&self);
}
```

如果想要为Vec类型实现这个trait，可以使用#[derive]标记：

```rust
# [derive(Traversable)]
struct Vec<T> {
    // ...
}
```

这意味着Rust会在编译阶段自动为 Vec 生成 Traversable trait 的实现，而不需要程序员自己实现它。


## 总结

本文详细的讲解了trait关键字优缺点，通过示例介绍了基础语法，讲解了泛型约束和别名。并扩展的介绍了derive属性，以及如何结合trait关键字工作。