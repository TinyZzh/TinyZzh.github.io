---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Copy特征
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Copy]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

`RefCell` 是 Rust 标准库提供的一种类型，它可以在运行时检查借用规则，使得我们可以在某些情况下绕过 Rust 的静态借用检查。`RefCell` 的主要作用是允许在不可变引用存在的情况下，获取可变引用。这样就可以在不破坏 Rust 的安全性和所有权规则的前提下，实现一些特殊的需求。

在 Rust 中，为了避免数据竞争，任何时候只能有一个可变引用或多个不可变引用。但是，在某些情况下，我们确实需要在不可变引用的情况下修改数据。这时候，就可以使用 `RefCell`。

## 基础用法

### 创建RefCell

首先，我们需要创建一个 `RefCell` 对象。可以使用 `new()` 方法来创建一个新的 `RefCell`，示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);
```

这里，我们创建了一个名为 `my_cell` 的 `RefCell`，并将其初始化为整数 42。

### 获取RefCell中的值

要访问 `RefCell` 中的值，我们需要使用 `borrow()` 方法。这个方法返回一个 `Ref` 对象，它像一个不可变引用一样使用，但是它可以访问 `RefCell` 中的值。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let my_ref = my_cell.borrow();
println!("The value in my_cell is: {}", *my_ref);
```

这里，我们首先创建了一个 `RefCell`，然后使用 `borrow()` 方法获取了一个 `Ref` 对象。我们可以使用 `*` 运算符来访问 `Ref` 中的值。

### 修改RefCell中的值

要修改 `RefCell` 中的值，我们需要使用 `borrow_mut()` 方法。这个方法返回一个 `RefMut` 对象，它像一个可变引用一样使用，但是它可以修改 `RefCell` 中的值。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let mut my_ref = my_cell.borrow_mut();
*my_ref = 100;
println!("The new value in my_cell is: {}", *my_ref);
```

这里，我们首先创建了一个 `RefCell`，然后使用 `borrow_mut()` 方法获取了一个 `RefMut` 对象。我们可以使用 `*` 运算符来修改 `RefMut` 中的值。

### 获取RefCell中的不可变引用

如果我们在获取 `RefCell` 的可变引用之前，已经获取了一个不可变引用，那么 Rust 会在运行时检查，如果发现了错误，就会 panic。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let my_ref = my_cell.borrow();
let my_mut_ref = my_cell.borrow_mut(); // panic!
```

这里，我们首先获取了一个不可变引用 `my_ref`，然后试图获取一个可变引用 `my_mut_ref`。由于我们已经有了一个不可变引用，所以 Rust 会在运行时检查，发现了错误，就会 panic。

### 获取RefCell中的可变引用

如果我们在获取 `RefCell` 的可变引用之前，已经获取了一个可变引用，那么 Rust 会在编译时检查，如果发现了错误，就会报错。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let mut my_mut_ref = my_cell.borrow_mut();
let my_ref = my_cell.borrow(); // compile error!
```

这里，我们首先获取了一个可变引用 `my_mut_ref`，然后试图获取一个不可变引用 `my_ref`。由于我们已经有了一个可变引用，所以 Rust 会在编译时检查，发现了错误，就会报错。

### 获取RefCell中的多个不可变引用

如果我们在获取 `RefCell` 的多个不可变引用时，其中一个引用已经被转换为可变引用，那么 Rust 会在运行时检查，如果发现了错误，就会 panic。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let my_ref1 = my_cell.borrow();
let my_ref2 = my_cell.borrow();
let mut my_mut_ref = my_cell.borrow_mut(); // panic!
```

这里，我们首先获取了两个不可变引用 `my_ref1` 和 `my_ref2`，然后试图获取一个可变引用 `my_mut_ref`。由于我们已经有了两个不可变引用，所以 Rust 会在运行时检查，发现了错误，就会 panic。

### 获取RefCell中的多个可变引用

如果我们在获取 `RefCell` 的多个可变引用时，其中一个引用已经被转换为不可变引用，那么 Rust 会在编译时检查，如果发现了错误，就会报错。示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(42);

let mut my_mut_ref1 = my_cell.borrow_mut();
let my_mut_ref2 = my_cell.borrow_mut(); // compile error!
```

这里，我们首先获取了一个可变引用 `my_mut_ref1`，然后试图获取另一个可变引用 `my_mut_ref2`。由于我们已经有了一个可变引用，所以 Rust 会在编译时检查，发现了错误，就会报错。

### 使用RefCell来实现引用计数

`RefCell` 还可以用来实现引用计数。我们可以将 `RefCell` 包装在一个 `Rc` 中，这样就可以在多个地方共享 `RefCell`。示例代码如下：

```rust
use std::cell::RefCell;
use std::rc::Rc;

let my_cell = Rc::new(RefCell::new(42));

let my_ref1 = my_cell.borrow();
let my_ref2 = my_cell.borrow();
let mut my_mut_ref = my_cell.borrow_mut();

*my_mut_ref = 100;

println!("The value in my_cell is: {}", *my_ref1);
println!("The value in my_cell is: {}", *my_ref2);
```

这里，我们首先创建了一个 `Rc<RefCell<i32>>`，然后分别获取了两个不可变引用 `my_ref1` 和 `my_ref2`，以及一个可变引用 `my_mut_ref`。我们可以使用 `*` 运算符来访问 `Ref` 和 `RefMut` 中的值。

## 进阶用法

### 使用RefCell来实现线程安全的可变变量

在 Rust 中，如果我们需要在线程之间共享可变变量，通常会使用 `Mutex` 或 `RwLock`。但是，这些类型的性能可能不太好，因为它们需要在每个访问上进行加锁和解锁操作。如果我们只需要在单个线程中共享可变变量，那么可以使用 `RefCell` 来实现，这样可以避免加锁和解锁的开销。

示例代码如下：

```rust
use std::cell::RefCell;

let my_cell = RefCell::new(0);

let mut my_mut_ref1 = my_cell.borrow_mut();
*my_mut_ref1 += 1;
let mut my_mut_ref2 = my_cell.borrow_mut();
*my_mut_ref2 += 2;

println!("The value in my_cell is: {}", *my_mut_ref1);
```

这里，我们首先创建了一个 `RefCell<i32>`，然后获取了两个可变引用 `my_mut_ref1` 和 `my_mut_ref2`，并分别修改了它们。由于我们只在单个线程中使用 `RefCell`，所以不需要加锁和解锁。

### 使用RefCell来实现循环引用

在 Rust 中，如果两个对象互相引用，那么它们之间就会形成一个循环引用。这时候，就可以使用 `RefCell` 来实现。示例代码如下：

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    value: i32,
    next: Option<Rc<RefCell<Node>>>,
}

let node1 = Rc::new(RefCell::new(Node { value: 1, next: None }));
let node2 = Rc::new(RefCell::new(Node { value: 2, next: None }));

node1.borrow_mut().next = Some(node2.clone());
node2.borrow_mut().next = Some(node1.clone());

println!("The value of node1 is: {}", node1.borrow().value);
println!("The value of node2 is: {}", node2.borrow().value);
```

这里，我们创建了两个 `Rc<RefCell<Node>>`，然后将它们互相引用。由于我们使用了 `RefCell`，所以可以在创建时互相引用，而不需要先创建一个对象，然后再修改它们的引用。

### 使用RefCell来实现可变借用嵌套

在 Rust 中，如果我们需要在一个可变引用中嵌套另一个可变引用，通常会出现编译时错误。但是，如果我们使用 `RefCell`，就可以实现可变借用嵌套。示例代码如下：

```rust
use std::cell::RefCell;

struct Node {
    value: i32,
    next: Option<Box<RefCell<Node>>>,
}

let mut node1 = Box::new(RefCell::new(Node { value: 1, next: None }));
let mut node2 = Box::new(RefCell::new(Node { value: 2, next: None }));

node1.borrow_mut().next = Some(node2);
node2.borrow_mut().next = Some(node1);

println!("The value of node1 is: {}", node1.borrow().value);
println!("The value of node2 is: {}", node2.borrow().value);
```

这里，我们创建了两个 `Box<RefCell<Node>>`，然后将它们互相引用。由于我们使用了 `RefCell`，所以可以在可变引用中嵌套另一个可变引用。

### 使用RefCell来实现内部可变性

在 Rust 中，如果我们需要在一个结构体中存储一个可变变量，通常会使用 `mut` 关键字来标记结构体字段。但是，如果我们使用 `RefCell`，就可以实现内部可变性。示例代码如下：

```rust
use std::cell::RefCell;

struct Person {
    name: String,
    age: RefCell<i32>,
}

let person = Person { name: "Alice".to_string(), age: RefCell::new(30) };

let mut my_age = person.age.borrow_mut();
*my_age += 1;

println!("{} is now {} years old.", person.name, *person.age.borrow());
```

这里，我们创建了一个 `Person` 结构体，其中包含一个 `String` 类型的 `name` 字段和一个 `RefCell<i32>` 类型的 `age` 字段。我们可以在不可变引用的情况下修改 `age` 字段中的值。

## 最佳实践

### 避免过多的可变引用

虽然 `RefCell` 可以在不可变引用的情况下修改数据，但是过多的可变引用会导致代码难以维护。因此，应该尽量避免过多的可变引用。

### 使用RefCell来实现状态机

`RefCell` 可以用于实现状态机。在状态机中，状态之间的转换通常需要修改状态机中的某些变量。由于状态机本身是不可变的，因此可以使用 `RefCell` 来存储状态机中的可变变量。

示例代码如下：

```rust
use std::cell::RefCell;

enum State {
    A,
    B,
    C,
}

struct StateMachine {
    state: RefCell<State>,
    count: RefCell<i32>,
}

impl StateMachine {
    fn new() -> StateMachine {
        StateMachine { state: RefCell::new(State::A), count: RefCell::new(0) }
    }

    fn next(&self) {
        let mut state = self.state.borrow_mut();
        let mut count = self.count.borrow_mut();

        match *state {
            State::A => {
                *state = State::B;
                *count += 1;
            },
            State::B => {
                *state = State::C;
                *count += 2;
            },
            State::C => {
                *state = State::A;
                *count += 3;
            },
        }
    }
}

let sm = StateMachine::new();

sm.next();
println!("State is {:?}, count is {}", *sm.state.borrow(), *sm.count.borrow());
sm.next();
println!("State is {:?}, count is {}", *sm.state.borrow(), *sm.count.borrow());
sm.next();
println!("State is {:?}, count is {}", *sm.state.borrow(), *sm.count.borrow());
```

这里，我们创建了一个 `StateMachine` 结构体，其中包含一个 `RefCell<State>` 类型的 `state` 字段和一个 `RefCell<i32>` 类型的 `count` 字段。我们可以在不可变引用的情况下修改 `state` 和 `count` 字段中的值。

### 使用RefCell来实现链表

`RefCell` 可以用于实现链表。在链表中，每个节点通常包含一个指向下一个节点的指针。由于每个节点的指针是可变的，因此可以使用 `RefCell` 来存储节点中的指针。

示例代码如下：

```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    value: i32,
    next: Option<Rc<RefCell<Node>>>,
}

fn main() {
    let node1 = Rc::new(RefCell::new(Node { value: 1, next: None }));
    let node2 = Rc::new(RefCell::new(Node { value: 2, next: None }));
    let node3 = Rc::new(RefCell::new(Node { value: 3, next: None }));

    node1.borrow_mut().next = Some(node2.clone());
    node2.borrow_mut().next = Some(node3.clone());

    let mut node = node1;
    while let Some(next) = node.borrow().next.clone() {
        println!("The value of node is: {}", node.borrow().value);
        node = next;
    }
    println!("The value of node is: {}", node.borrow().value);
}
```

这里，我们创建了三个 `Rc<RefCell<Node>>`，然后将它们连接成一个链表。我们可以使用 `borrow()` 方法来访问节点中的值，使用 `borrow_mut()` 方法来修改节点中的指针。

## 总结

`RefCell` 是 Rust 标准库提供的一种类型，它可以在运行时检查借用规则，使得我们可以在某些情况下绕过 Rust 的静态借用检查。`RefCell` 的主要作用是允许在不可变引用存在的情况下，获取可变引用。这样就可以在不破坏 Rust 的安全性和所有权规则的前提下，实现一些特殊的需求。

在使用 `RefCell` 时，需要注意避免过多的可变引用，以及使用 `RefCell` 实现状态机和链表等数据结构。