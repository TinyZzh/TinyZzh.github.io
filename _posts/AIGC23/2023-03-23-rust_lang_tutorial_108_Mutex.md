---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 互斥锁 Mutex
date: 2023-03-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Mutex]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

锁是在多线程程序中最常用的同步机制。锁可以确保线程的安全访问共享内存区域。Rust中引入了具有高级内存安全性和线程安全性的锁类型，称之为Mutex。

本教程将介绍Rust中的Mutex，包括其含义、常用业务场景和用法、进阶用法以及最佳实践。

## Mutex （互斥锁）

在Rust中，Mutex是一种同步原语（synchronization primitive），它是用于保护共享资源的关键部分不被同时访问的一种机制。Mutex分为两种类型：Mutex和RwLock（读写锁）。在本教程中，我们将着重介绍Mutex。

Mutex支持两种操作：lock和unlock。任何试图访问由mutex保护的共享变量的线程都必须首先获得锁定，否则将陷入等待状态，直到锁被释放。

## 常用业务场景和用法

使用Mutex的主要原因是保证线程安全，特别是在操作共享数据时。下面是一些常见使用场景：

1. 多个线程访问同一变量时。例如，在多线程网络编程中，有一个counter变量被多个线程共享，每当有请求被处理时，counter的值就会更新。但是，在多个线程尝试同时更新counter变量时，会导致数据不一致性的问题。在这种情况下，使用Mutex变量保护counter变量是必要的。

2. 在并发环境中对数据结构进行访问和操作时。例如，在访问标准库中的哈希表时，当多个线程同时访问哈希表时，需要加锁来确保线程安全。

下面是一些示例代码：

```rust
use std::sync::Mutex;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let c = Arc::clone(&counter);
        let handle = std::thread::spawn(move || {
            let mut num = c.lock().unwrap();
            *num += 1;
        });

        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    println!("Result: {}", *counter.lock().unwrap());
}
```

在上面的代码中，我们创建了一个Mutex实例counter，它包含一个整型变量0。接下来，我们创建了10个线程，每次都会锁定Mutex，并递增counter变量的值。最后，我们打印结果。

## 进阶用法

随着对Mutex的掌握程度的提高，您可以开始深入了解更高级的用法。下面是一些进阶用法：

### 使用MutexGuard

当您获得了Mutex，您将拥有一个MutexGuard。这是一种托管类型，使您可以安全地使用Mutex中的值。在下面的示例代码中，我们将演示如何使用MutexGuard。

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(0);
    {
        let mut data = mutex.lock().unwrap();
        *data += 1;
        println!("Data: {}", *data);
    }
    let mut data = mutex.lock().unwrap();
    *data += 1;
    println!("Data: {}", *data);
}
// Data: 1
// Data: 2
```

在上面的示例代码中，我们首先获取Mutex的所有权，并对其进行加锁，然后引用被保护的变量，并对其进行递增操作。在大括号中引入了一个新的作用域，这意味着MutexGuard的生命周期将在大括号结束时结束，而Mutext本身仍然没有被释放。在大括号结束后，我们再次获取Mutex的所有权，然后更新变量的值。

### 使用try_lock

在某些情况下，您需要尝试获取Mutex的所有权，但不希望等待直到别的线程释放它。在这种情况下，您可以使用try_lock方法。如果该方法成功地获取了Mutex的所有权，则返回一个包含保护变量的MutexGuard。如果该方法无法获得Mutex的所有权，则返回Err而不是阻塞线程。

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(0);
    let mut guard1 = mutex.lock().unwrap();
    let guard2 = mutex.try_lock();
    assert!(guard2.is_err()); // 返回值是 Err    *guard1 += 1;
}
```

在上面的示例代码中，我们首先获得Mutex的所有权，并使用lock方法锁定它。接下来，尝试使用try_lock方法获取Mutex，并检查该方法是否返回了Err。最后，更新变量值并释放保护。

### Mutex和Arc的结合使用

Arc是一种具有线程安全引用计数的类型。Mutex可以和Arc结合使用，以提供对共享数据的并发访问。下面是一些示例代码。

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

在上面的代码中，我们创建了一个Mutex实例及其Arc的实例。然后，我们使用Arc的clone方法创建多个指向Mutex的引用，并在每个线程中使用被保护的变量。最后，我们打印结果。

### RwLock 读写锁

除了Mutex之外，Rust还提供了RwLock（读写锁）来支持多个线程同时读取共享数据。RwLock允许多个线程同时获得读锁，但只允许一个线程获得写锁。

下面是一个使用RwLock的示例代码：

```rust
use std::sync::{RwLock, Arc};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(0));

    let read_data = data.clone();
    let t1 = thread::spawn(move || {
        let data = read_data.read().unwrap();
        println!("Thread 1: {}", *data);
    });

    let write_data = data.clone();
    let t2 = thread::spawn(move || {
        let mut data = write_data.write().unwrap();
        *data = 42;
    });

    t1.join().unwrap();
    t2.join().unwrap();
}
// Thread 1: 0
```

在这个示例中，我们创建了一个RwLock来保护一个整数。然后我们创建了两个线程，一个线程读取该整数，另一个线程修改该整数。由于RwLock允许多个线程同时获得读锁，但只允许一个线程获得写锁，所以我们可以安全地访问共享数据。

## 最佳实践

在使用Mutex时，需要注意以下几点：

 - 尽量避免死锁：当一个线程获得Mutex的锁时，它会一直占用该锁，直到该线程释放Mutex的锁。如果该线程在占用Mutex的锁的同时，还需要获得其他Mutex的锁，那么就可能会发生死锁的情况。因此，需要尽量避免在一个线程中同时占用多个Mutex的锁。

 - 尽量避免竞争条件：当多个线程同时访问共享数据时，就会出现竞争条件的问题。为了避免这种情况，可以使用Mutex来保护共享数据的访问。

 - 尽量避免锁的过多使用：当一个线程持有Mutex的锁时，其他线程就无法访问共享数据。如果一个线程持有Mutex的锁的时间过长，那么就可能会导致其他线程长时间等待。因此，需要尽量减少锁的使用次数，以提高程序的并发性能。

 - 尽量使用RwLock：当多个线程需要同时读取共享数据时，可以使用RwLock来提高程序的并发性能。RwLock允许多个线程同时获得读锁，但只允许一个线程获得写锁，从而避免了竞争条件的问题。

## 结论

Mutex是一个互斥量，用于保护共享数据的访问。它提供了两个方法：lock和unlock。当一个线程需要访问共享数据时，它需要先获得Mutex的锁，然后才能访问共享数据。当访问完成后，该线程需要释放Mutex的锁，以便其他线程可以访问共享数据。

除了基本用法之外，Mutex还提供了一些进阶用法，如MutexGuard、Condvar和RwLock等。在使用Mutex时，需要注意避免死锁和竞争条件，并尽量减少锁的使用次数。在多个线程需要同时读取共享数据时，可以使用RwLock来提高程序的并发性能。
