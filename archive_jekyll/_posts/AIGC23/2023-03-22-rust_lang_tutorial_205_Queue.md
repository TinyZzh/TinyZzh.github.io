---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 先进先出队列 Queue
date: 2023-03-22 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, FIFO, 先进先出]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Queue，即队列，是数据结构中非常重要的一种数据结构，是广泛应用于计算机科学中的一种数据存储结构。Queue可以被看作是一种特殊的线性表，这种结构又称为先进先出(First In First Out, FIFO)的线性表。Queue常常被用来保存要被计算的任务，并按照FIFO的方式进行处理。

Rust是一门由Mozilla组织开发的系统编程语言。其具有高效、安全、并发性强等特点，在网络编程、操作系统、游戏开发、高性能计算和物联网等领域都有广泛的应用。

在本文中，我们将通过实现一个线程安全的先进先出的Queue进一步学习Rust语言。

## 实战先进先出队列 Queue

Queue是FIFO（First-In-First-Out）数据结构，即先进先出的队列。可以把Queue看成是一个容器，按照FIFO的方式添加或删除元素。

通常情况下，Queue主要包含以下两个重要的方法：

 - push(val)：向Queue中添加一个元素。
 - pop()：从Queue中移除并返回第一个元素。

Queue的底层实现可以有多种方式，例如链表、数组、环形缓存等。

在本文中，我们将基于Rust标准库，使用Vec作为Queue底层的数据结构来实现线程安全的Queue，并提供以下功能：

 - push：添加一个元素到Queue尾部。
 - pop：从Queue头部弹出一个元素。
 - peek: 获取队列头部的第一个元素，但不从Queue中弹出。
 - isEmpty: 判断Queue是否为空。
 - length: 获取Queue中元素的个数。
  
为了实现线程安全的Queue，我们将使用Rust多线程编程的标准库：std::sync::Mutex。Mutex是一种同步原语，用来实现对共享资源的独占访问，从而保证线程安全。Mutex允许某个线程锁定Mutex以获取对资源的独占访问（即获得锁）并进行修改，其他尝试获取锁的线程会阻塞，直到拥有锁的线程释放它。

### Queue代码实现
首先，我们从Queue的定义出发，定义一个Queue结构体，并实现Queue的所有方法。结构体如下所示：

```rust
use std::sync::{Mutex, Arc};

pub struct Queue<T> {
    inner: Arc<Mutex<Vec<T>>>,
}

impl<T: Clone> Queue<T> {
    pub fn new() -> Self {
        Queue {
            inner: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn push(&self, val: T) {
        let mut inner = self.inner.lock().unwrap();
        inner.push(val);
    }

    pub fn pop(&self) -> Option<T> {
        let mut inner = self.inner.lock().unwrap();
        match inner.len() {
            0 => None,
            _ => Some(inner.remove(0)),
        }
    }

    pub fn peek(&self) -> Option<T> {
        let inner = self.inner.lock().unwrap();
        match inner.len() {
            0 => None,
            _ => Some(inner[0].clone()),
        }
    }

    pub fn is_empty(&self) -> bool {
        let inner = self.inner.lock().unwrap();
        inner.is_empty()
    }

    pub fn length(&self) -> usize {
        let inner = self.inner.lock().unwrap();
        inner.len()
    }
}
```

解释一下Queue中一些重要的部分：

```rust
pub fn new() -> Self {
    Queue {
        inner: Arc::new(Mutex::new(Vec::new())),
    }
}
```
定义了一个新的Queue实例，包含了内部数据的Arc<Mutex<Vec>>结构。这里，Arc是原子引用计数器的缩写，用来保证多线程安全。Arc<Mutex>则是智能指针，用于管理Mutex类型的内部数据。Arc以引用计数方式，管理Mutex实例内部数据的所有权，保证多线程安全。

Mutex内部是一个可变的Vec，它的类型参数是泛型T，表示Vec中可以存储任意类型的元素。push, pop等函数也是Queue结构体中最为重要的实现。

如下所示：

```rust
pub fn push(&self, val: T) {
    let mut inner = self.inner.lock().unwrap();
    inner.push(val);
}
```
该函数为向Queue中添加元素的函数，我们首先需要获取inner数据的可变引用，通过使用Mutex来获取可变引用，在获取操作之前，需要先使用mutex实例的lock方法加锁（获得锁），在获取到锁之后，就可以安全地对inner进行修改。如果不能获取到锁，则会阻塞当前线程，直到获取到锁。

```rust
let mut inner = self.inner.lock().unwrap();
```

然后，将要添加的元素val保存到inner中，这里我们使用Vec的push方法将元素val添加到inner的尾部。

```rust
inner.push(val);
```
        
下面是从Queue中弹出元素的函数实现：

```rust
let mut inner = self.inner.lock().unwrap();
match inner.len() {
        0 => None,
        _ => Some(inner.remove(0)),
    }
}
```
其中，首先使用了Mutex的lock()方法加锁，获取到inner上独占的可变引用inner，如果队列当前为空，则返回None。否则，通过Vec的remove方法，从inner中弹出并返回队列头部的第一个元素。

注意：使用Vec的remove方法，将队列头部的第一个元素弹出之后，将导致队列中所有元素都向前移动一个位置，执行效率较低。对于拥有大量元素的Queue，需要考虑使用链表等数据结构以提高效率。

Queue中还包含多个其他方法（例如peek, is_empty, length等），这里不再一一进行详解，读者在使用的同时结合注释理解即可。

### 编写Queue单元测试

在此为Queue编写单元测试。我们在Queue代码目录中新建测试代码文件，并在其中编写测试用例。

```rust
#[cfg(test)]
mod tests {
    use super::*;
 #[test]
    fn test_queue() {
        let queue: Queue<i32> = Queue::new();
        assert_eq!(queue.is_empty(), true);
        queue.push(10);
        queue.push(11);
        assert_eq!(queue.length(), 2);
        assert_eq!(queue.peek(), Some(10));
        assert_eq!(queue.pop(), Some(10));
        assert_eq!(queue.pop(), Some(11));
        assert_eq!(queue.pop(), None);
        assert_eq!(queue.is_empty(), true);
        queue.push(20);
        assert_eq!(queue.is_empty(), false);
    }
}
```
解释一下这段测试代码：

首先，我们需要引用Queue模块，并定义测试模块。在测试模块中，使用Queue::new创建一个新的Queue实例，并测试Queue的is_empty函数，确认新创建的队列为空。

```rust
#[test]
fn test_queue() {
    let queue: Queue<i32> = Queue::new();
    assert_eq!(queue.is_empty(), true);
}
```

然后，依次往队列中添加元素，它的长度会逐渐增大。添加完元素之后，我们使用peek函数，确认队列的头部元素，使用pop函数，逐一弹出队列中的所有元素，最后测试队列为空。

```rust
queue.push(10);
queue.push(11);
assert_eq!(queue.length(),2);
assert_eq!(queue.peek(), Some(&10));
assert_eq!(queue.pop(), Some(10));
assert_eq!(queue.pop(), Some(11));
assert_eq!(queue.pop(), None);
assert_eq!(queue.is_empty(), true);
```

最后一个测试用例测试了队列尾部添加的情况，添加一个元素后，使用is_empty函数判断队列不为空。

```rust
queue.push(20);
assert_eq!(queue.is_empty(), false);
```
上述测试代码通过测试，我们可以确认Queue实现是符合预期的。
