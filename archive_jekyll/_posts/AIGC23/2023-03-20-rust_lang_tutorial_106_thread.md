---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Thread 线程
date: 2023-03-20 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 线程, Thread]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust是一种强类型、高性能的系统编程语言，其官方文档中强调了Rust的标准库具有良好的并发编程支持。Thread是Rust中的一种并发编程方式，本文将介绍Rust中thread的相关概念、方法和字段。我们将从以下几个方面进行讲解：

1. 线程的基本概念和使用方法
2. 线程的字段和方法
3. 常用用法和示例
4. 进阶用法：多线程协作和锁
5. 最佳实践：安全地使用Thread

## 线程的基本概念和使用方法

Thread是Rust中并发编程的一种基本方式。Rust中的Thread使用标准库中的`std::thread::Thread`结构体表示。我们可以通过下面的代码来创建一个Thread：

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // 子线程执行的代码
    });
}
```

其中的`||`表示闭包，该闭包中的代码将在子线程中执行。调用`thread::spawn`方法会返回一个Result，该Result包含一个智能指针，该智能指针拥有对线程的所有权，如果线程执行成功则返回Ok，否则返回Err。通过这个智能指针我们可以管理线程的生命周期和操作线程。

当线程中的代码执行完毕时，我们可以使用以下代码将线程加入主线程：

```rust
handle.join().expect("执行失败");
```

Thread也支持通过`std::thread::Builder`结构体进行创建，Builder提供了一些线程的配置项，如线程名字、线程优先级、栈大小等。

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new().name("my_thread".into());
    let handle = builder.spawn(|| {
        // 子线程执行的代码
    });
}
```

## 线程的字段和方法

Thread结构体中提供了一些有用的字段和方法。

### 线程名称

Rust中的Thread对象有一个名称属性，可以通过`thread::current()`函数获取当前线程的名称，也可以通过`std::thread::Builder`结构体设置线程的名称。

```rust
use std::thread;

fn main() {
    let thr0 = thread::current();
    let thread_name = thr0.name().unwrap_or("unknown");
    println!("当前线程的名称：{}", thread_name);
    
    let builder = thread::Builder::new().name("my_thread".into());
    let handle = builder.spawn(move || {
        let thr = thread::current();
        let name = thr.name().unwrap_or("unknown");
        println!("当前线程的名称：{}", name);
    });
    handle.expect("执行失败").join().unwrap();
}
//  输出结果：
// 当前线程的名称：main
// 当前线程的名称：my_thread
```

### 线程id

Rust中的Thread对象还有一个id属性，可以通过`thread::current()`函数获取当前线程的id，也可以通过`std::thread::Builder`结构体设置线程的id。

```rust
use std::thread;

fn main() {
    let thread_id = thread::current().id();
    println!("当前线程的id：{:?}", thread_id);
    
    let builder = thread::Builder::new().name("my_thread".into());
    let handle = builder.spawn(|| {
        let id = thread::current().id();
        println!("当前线程的id：{:?}", id);
    });
    handle.expect("执行失败").join().unwrap();
}
//  输出结果：
// 当前线程的id：ThreadId(1)
// 当前线程的id：ThreadId(2)
```

### 线程休眠

Rust中Thread对象提供了一个sleep方法，用于让线程休眠指定时间。

```rust
use std::{thread, time};

fn main() {
    println!("线程休眠前：{:?}", time::Instant::now());
    thread::sleep(time::Duration::from_secs(2));
    println!("线程休眠后：{:?}", time::Instant::now());
}
//  输出结果：
// 线程休眠前：Instant { tv_sec: 9667960, tv_nsec: 471430161 }
// 线程休眠后：Instant { tv_sec: 9667962, tv_nsec: 471515229 }
```

### 线程状态

Rust中Thread对象表示的是系统中的一个线程，可以通过thread::JoinHandle结构体的is_finalized()和thread::Thread的panicking()方法来查看线程是否结束和是否因panic而结束。

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // TODO: 执行耗费时间的任务
    });
    while !handle.is_finished() {
        thread::sleep_ms(100);
    }
    if thread::panicking() {
        println!("线程因panic而结束");
    } else {
        println!("线程正常结束");
    }
}
```

## 常用用法和示例

### 单线程执行

我们可以使用Thread开启一个单线程，并在该线程中执行我们的代码。当该线程执行完毕后，我们通过JoinHandle.join()方法将该线程加入主线程。

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("Hello Thread!");
    });
    
    handle.join().unwrap();
}
```

### 多线程执行

我们可以使用多个Thread对象并行地执行任务，实现多线程编程。

```rust
use std::thread;

fn main() {
    let handle1 = thread::spawn(|| {
        for i in 0..5 {
            println!("Thread1: {}", i);
        }
    });
    let handle2 = thread::spawn(|| {
        for i in 0..5 {
            println!("Thread2: {}", i);
        }
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

### 线程间通信

Rust中线程间通信可以通过channel实现。在以下例子中，我们开启两个线程，一个线程向channel发送数据，另一个线程从channel接收数据。两个线程可以通过channel实现数据共享和交换。

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let handle1 = thread::spawn(move || {
        tx.send("Hello Thread!".to_string()).unwrap();
    });
    let handle2 = thread::spawn(move || {
        let msg = rx.recv().unwrap();
        println!("{}", msg);
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

## 进阶用法：多线程协作和锁

### 多线程协作

当线程之间需要协作执行任务时，我们可以通过Rust中提供的互斥锁Mutex和读写锁RwLock来实现。

以下是一个简单的例子，在这个例子中我们开启两个线程，一个线程向共享变量加1，另一个线程向共享变量减1。由于有两个线程同时修改共享变量，我们需要使用Mutex来进行加锁和解锁操作。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let shared_count = Arc::new(Mutex::new(0));
    let thread1 = shared_count.clone();
    let handle1 = thread::spawn(move || {
        for _ in 0..10 {
            let mut count = thread1.lock().unwrap();
            *count += 1;
        }
    });
    let thread2 = shared_count.clone();
    let handle2 = thread::spawn(move || {
        for _ in 0..10 {
            let mut count = thread2.lock().unwrap();
            *count -= 1;
        }
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
    println!("shared_count: {:?}", *shared_count.lock().unwrap());
}
//    输出结果：
//  shared_count: 0
```

### 锁

在多线程编程中，锁是一种常见的同步机制，它用于保护共享数据不受到并发访问的影响。Rust标准库中提供了锁的实现Mutex、RwLock、Barrier、Condvar等等。

#### Mutex

Mutex是Rust中最基本的锁机制，它提供了互斥访问的机制。当多个线程同时对一个共享资源进行访问时，Mutex会对该资源进行加锁，当一个线程访问该资源时，其他线程无法访问该资源，直到该线程解锁该资源。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let shared_data = Arc::new(Mutex::new(0));
    let thread1 = shared_data.clone();
    let handle1 = thread::spawn(move || {
        for _ in 0..10 {
            let mut data = thread1.lock().unwrap();
            *data += 1;
        }
    });
    let thread2 = shared_data.clone();
    let handle2 = thread::spawn(move || {
        for _ in 0..10 {
            let mut data = thread2.lock().unwrap();
            *data -= 1;
        }
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
    println!("shared_data: {:?}", *shared_data.lock().unwrap());
}
//    输出结果：
//  shared_data: 0
```

#### RwLock

RwLock是一种读写锁，它提供了两种访问方式：读取访问和写入访问，当同时有多个读操作时，RwLock会共享锁，允许多个线程同时访问该数据，当进行写操作时，RwLock会对该数据进行排它锁，只允许一个线程进行访问。

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let shared_data = Arc::new(RwLock::new(0));
    let thread1 = shared_data.clone();
    let handle1 = thread::spawn(move || {
        for _ in 0..10 {
            let mut data = thread1.write().unwrap();
            *data += 1;
        }
    });
    let thread2 = shared_data.clone();
    let handle2 = thread::spawn(move || {
        for _ in 0..10 {
            let data = thread2.read().unwrap();
            println!("data: {:?}", *data);
        }
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
    println!("shared_data: {:?}", *shared_data.read().unwrap());
}
//    输出结果：
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// data: 10
// shared_data: 10
```

RwLock还提供了一个try_read()方法，可以进行非阻塞式的读操作。

#### Barrier

Barrier是一种同步机制，它提供了一个点，当多个线程只有在该点处到达才能继续执行。Barrier有一个计数器，当计数器到达值N时，所有在该Barrier处等待的线程可以继续执行。

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let thread1 = barrier.clone();
    let handle1 = thread::spawn(move || {
        println!("Thread1 step1.");
        thread1.wait();
        println!("Thread1 step2.");
    });
    let thread2 = barrier.clone();
    let handle2 = thread::spawn(move || {
        println!("Thread2 step1.");
        thread2.wait();
        println!("Thread2 step2.");
    });
    
    handle1.join().unwrap();
    handle2.join().unwrap();
}
//    输出结果：
// Thread1 step1.
// Thread2 step1.
// ERROR Timeout
```

## 最佳实践：安全地使用Thread

在使用Thread进行多线程编程时，为了保证线程安全，我们需要注意以下几点：

- 在多线程程序中避免使用静态变量，单例模式和全局变量，这些变量可能被多个线程同时访问。
- 在多线程编程中，一定要避免使用裸指针和内存共享，这种方式可能导致数据竞争和未定义行为。
- 使用Rust的锁机制Mutex和RwLock等，保证共享数据的线程安全性。
- 编写多线程程序时，应该考虑线程池的设计，防止创建过多的线程带来的资源错乱和性能损失。
- 多线程程序的并发度一定要注意控制，过高的并发度反而会导致性能下降。

以上都是在使用Thread时应该注意的一些安全问题，遵循这些原则可以提高多线程程序的可维护性和安全性。

## 总结

本章节通过代码示例深入的探讨了Rust中thread的线程的基本概念，线程的字段和方法，常用用法和示例，多线程协作和锁以及thread最佳实践经验。