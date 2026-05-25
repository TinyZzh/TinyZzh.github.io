---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Sync和Send特征
date: 2023-04-10 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Sync, Send]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言是一门安全且并发的系统级语言，其提供了许多可以保证线程安全的特性，如Sync和Send。在Rust语言中，Sync和Send是两个用于线程安全编程的Trait，它们可以指导编译器对代码进行静态分析，确保你的代码是线程安全的。

Sync和Send的定义如下：

- Send：可以安全发送到别的线程。
- Sync：可以安全在多个线程中分享访问。

在Rust语言中，任何实现了Send或Sync Trait的类型都是线程安全的。

## 基础用法

###  基本类型和Send和Sync Trait

基本类型是指那些常常用于数据存储和算术操作的类型。这些类型都实现了Sync和Send Trait。

```rust
fn main() {
    let a: u32 = 1;
    let b: f32 = 3.14;
    let c: &str = "Hello";
    
    assert_eq!(std::mem::size_of::<u32>(), 4);
    assert_eq!(std::mem::size_of::<f32>(), 4);
    assert_eq!(std::mem::size_of::<&str>(), 16);
}
```

###  智能指针和Send Trait

智能指针，如Box、Rc、Arc等，是非常常见的类型。在多线程环境下，使用Box可以轻松地将一些变量从一个线程传递到另一个线程。

```rust
use std::thread;

fn main() {
    let hello = Box::new("Hello, Rust!");
    let child = thread::spawn(move || println!("{}", hello));
    child.join().unwrap();
}
```

###  Rc和Send Trait

Rc是Rust语言中常见的智能指针类型之一，可以让多个变量共享同一个值。在多线程环境下使用Rc的过程中需要注意一些问题。

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let rc_hello = Rc::new("Hello, Rust!");
    let child1 = thread::spawn(move || println!("{}", rc_hello));
    let child2 = thread::spawn(move || println!("{}", rc_hello));
    child1.join().unwrap();
    child2.join().unwrap();
}
```

###  Mutex和Send Trait

Mutex是Rust语言中实现同步操作的一种机制。它允许程序在共享资源上进行安全的并发访问。

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    let mut handles = vec![];

    for i in 0..2 {
        let data = data.clone();
        let handle = thread::spawn(move || {
            let mut data = data.lock().unwrap();
            data.push(i);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{:?}", data);
}
```

###  Arc和Send Trait

Arc是Rust语言中实现多线程共享的另一种机制。它可以让多个线程在同一时刻共享同一个变量。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = counter.clone();
        let handle = thread::spawn(move || {
            let mut counter = counter.lock().unwrap();
            *counter += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", *counter.lock().unwrap());
}
```

###  RwLock和Send Trait

RwLock是Rust语言中实现共享可变状态的一种机制。它允许某个线程对共享变量进行读取访问，同时也允许有限的写访问，从而提高程序的并发性能。

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
  let data = Arc::new(RwLock::new(0));

  // reader
  for i in 0..3 {
      let data = data.clone();
      thread::spawn(move || {
          let data = data.read().unwrap();
          println!("{}: read: {}", i, *data);
      });
  }

  // writer
  thread::spawn(move || {
      let mut data = data.write().unwrap();
      *data = 1;
      println!("write: {}", *data);
  });

  thread::sleep_ms(1000);
}
```

###  Atomic Types和Send Trait

Rust语言中提供了一些原子类型，如AtomicU8、AtomicU16、AtomicU32，它们提供了原子更新和访问的能力。这意味着无论有多少个线程对这些变量进行操作，它们都可以保证线程安全。

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let counter = AtomicUsize::new(0);
    let mut handles = vec![];

    for i in 0..10 {
        let counter = counter.clone();
        let handle = thread::spawn(move || {
            counter.fetch_add(1, Ordering::Relaxed);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", counter.load(Ordering::Relaxed));
}
```

###  线程同步

Rust语言中提供了一些机制用于实现线程同步，如Condvar、Once、Barrier、Latch等。

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for _ in 0..3 {
        let barrier = barrier.clone();
        let handle = thread::spawn(move || {
            println!("Before wait: {:?}", std::thread::current().id());
            barrier.wait();
            println!("After wait: {:?}", std::thread::current().id());
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## 进阶用法

###  使用MutexGuard

在Rust语言中MutexGuard是实现Mutex同步机制的一个关键类型之一。它可以确保在使用Mutex时不会发生死锁或数据竞争等情况。

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let data = data.clone();
        let handle = thread::spawn(move || {
            let mut data = data.lock().unwrap();
            *data += 1;
            println!("Thread {} incremented data to {}", i, *data);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{:?}", data);
}
```

###  使用Sync和Send 'static Bounds

在Rust语言中使用Sync和Send时，需要确保它们实现了'static约束。这可以确保它们具有一些关键的属性，如生命周期。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    let hello = Arc::new("Hello, Rust!".to_string());

    let child = thread::spawn(move || {
        let data = &*(data.lock().unwrap());
        let hello = &*hello;
        println!("{:?}, {:?}", data, hello);
    });

    child.join().unwrap();
}
```

###  使用Panic安全地终止线程

在Rust语言中，线程遇到panic时，会正常终止程序。可以在panic发生后清理它们的资源。

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        panic!("Hello, Rust!");
    });

    let result = handle.join();
    println!("{:?}", result);
}
```

###  使用独立线程并发执行计算

在Rust语言中使用线程可以在较短的时间内执行复杂的计算。这对于需要在短时间内执行大量计算的应用程序非常有# Rust语言Sync和Send教程

## 简介

Rust语言是一门安全且并发的系统级语言，其提供了许多可以保证线程安全的特性，如Sync和Send。在Rust语言中，Sync和Send是两个用于线程安全编程的Trait，它们可以指导编译器对代码进行静态分析，确保你的代码是线程安全的。

Sync和Send的定义如下：

- Send：可以安全发送到别的线程。
- Sync：可以安全在多个线程中分享访问。

在Rust语言中，任何实现了Send或Sync Trait的类型都是线程安全的。

## 基础用法

###  基本类型和Send和Sync Trait

基本类型是指那些常常用于数据存储和算术操作的类型。这些类型都实现了Sync和Send Trait。

```rust
fn main() {
    let a: u32 = 1;
    let b: f32 = 3.14;
    let c: &str = "Hello";
    
    assert_eq!(std::mem::size_of::<u32>(), 4);
    assert_eq!(std::mem::size_of::<f32>(), 4);
    assert_eq!(std::mem::size_of::<&str>(), 16);
}
```

###  智能指针和Send Trait

智能指针，如Box、Rc、Arc等，是非常常见的类型。在多线程环境下，使用Box可以轻松地将一些变量从一个线程传递到另一个线程。

```rust
use std::thread;

fn main() {
    let hello = Box::new("Hello, Rust!");
    let child = thread::spawn(move || println!("{}", hello));
    child.join().unwrap();
}
```

###  Rc和Send Trait

Rc是Rust语言中常见的智能指针类型之一，可以让多个变量共享同一个值。在多线程环境下使用Rc的过程中需要注意一些问题。

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let rc_hello = Rc::new("Hello, Rust!");
    let child1 = thread::spawn(move || println!("{}", rc_hello));
    let child2 = thread::spawn(move || println!("{}", rc_hello));
    child1.join().unwrap();
    child2.join().unwrap();
}
```

###  Mutex和Send Trait

Mutex是Rust语言中实现同步操作的一种机制。它允许程序在共享资源上进行安全的并发访问。

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    let mut handles = vec![];

    for i in 0..2 {
        let data = data.clone();
        let handle = thread::spawn(move || {
            let mut data = data.lock().unwrap();
            data.push(i);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{:?}", data);
}
```

###  Arc和Send Trait

Arc是Rust语言中实现多线程共享的另一种机制。它可以让多个线程在同一时刻共享同一个变量。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = counter.clone();
        let handle = thread::spawn(move || {
            let mut counter = counter.lock().unwrap();
            *counter += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", *counter.lock().unwrap());
}
```

###  RwLock和Send Trait

RwLock是Rust语言中实现共享可变状态的一种机制。它允许某个线程对共享变量进行读取访问，同时也允许有限的写访问，从而提高程序的并发性能。

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
  let data = Arc::new(RwLock::new(0));

  // reader
  for i in 0..3 {
      let data = data.clone();
      thread::spawn(move || {
          let data = data.read().unwrap();
          println!("{}: read: {}", i, *data);
      });
  }

  // writer
  thread::spawn(move || {
      let mut data = data.write().unwrap();
      *data = 1;
      println!("write: {}", *data);
  });

  thread::sleep_ms(1000);
}
```

###  Atomic Types和Send Trait

Rust语言中提供了一些原子类型，如AtomicU8、AtomicU16、AtomicU32，它们提供了原子更新和访问的能力。这意味着无论有多少个线程对这些变量进行操作，它们都可以保证线程安全。

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let counter = AtomicUsize::new(0);
    let mut handles = vec![];

    for i in 0..10 {
        let counter = counter.clone();
        let handle = thread::spawn(move || {
            counter.fetch_add(1, Ordering::Relaxed);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", counter.load(Ordering::Relaxed));
}
```

###  线程同步

Rust语言中提供了一些机制用于实现线程同步，如Condvar、Once、Barrier、Latch等。

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for _ in 0..3 {
        let barrier = barrier.clone();
        let handle = thread::spawn(move || {
            println!("Before wait: {:?}", std::thread::current().id());
            barrier.wait();
            println!("After wait: {:?}", std::thread::current().id());
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## 进阶用法

###  使用MutexGuard

在Rust语言中MutexGuard是实现Mutex同步机制的一个关键类型之一。它可以确保在使用Mutex时不会发生死锁或数据竞争等情况。

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let data = data.clone();
        let handle = thread::spawn(move || {
            let mut data = data.lock().unwrap();
            *data += 1;
            println!("Thread {} incremented data to {}", i, *data);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{:?}", data);
}
```

###  使用Sync和Send 'static Bounds

在Rust语言中使用Sync和Send时，需要确保它们实现了'static约束。这可以确保它们具有一些关键的属性，如生命周期。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));
    let hello = Arc::new("Hello, Rust!".to_string());

    let child = thread::spawn(move || {
        let data = &*(data.lock().unwrap());
        let hello = &*hello;
        println!("{:?}, {:?}", data, hello);
    });

    child.join().unwrap();
}
```

###  使用Panic安全地终止线程

在Rust语言中，线程遇到panic时，会正常终止程序。可以在panic发生后清理它们的资源。

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        panic!("Hello, Rust!");
    });

    let result = handle.join();
    println!("{:?}", result);
}
```

###  使用独立线程并发执行计算

在Rust语言中使用线程可以在较短的时间内执行复杂的计算。这对于需要在短时间内执行大量计算的应用程序非常有