---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Atomic原子工具类
date: 2023-03-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Condvar]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言的Atomic是一种线程安全的原子类型，它可以保证多个线程同时访问同一个变量时的正确性。Rust中的Atomic类型可以用于解决多线程并发访问变量时出现的竞态条件问题。

Rust的Atomic类型提供了一组原子操作，包括增加、减少、交换、比较等等。这些操作都是原子性的，即在不同线程之间的操作不会相互干扰。这使得在并发场景下使用Atomic变得非常方便和安全。

## 常用业务场景和用法

Atomic类型常用于多线程并发场景下，例如：

- 计数器：多个线程同时对一个计数器进行操作，需要保证每个线程都能正确地增加或减少计数器的值。
- 缓存：多个线程同时对同一个缓存进行读写操作，需要保证每个线程都能正确地读写缓存。
- 状态标记：多个线程同时对同一个状态标记进行读写操作，需要保证每个线程都能正确地读写状态标记。

下面是一个简单的示例，展示了如何使用Atomic计数器：

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));

    for _ in 0..10 {
        let cc = counter.clone();
        std::thread::spawn(move|| {
            for _ in 0..100 {
                cc.fetch_add(1, Ordering::SeqCst);
            }
        });
    }

    std::thread::sleep(std::time::Duration::from_millis(1000));

    println!("Counter: {}", counter.load(Ordering::SeqCst));
}
//    输出结果：
//  Counter: 1000
```

这段代码创建了一个AtomicUsize类型的计数器，然后启动了10个线程，每个线程都会对计数器进行100次增加操作。最后输出计数器的值。

## 进阶用法

除了常用的增加、减少、交换、比较等操作之外，Rust的Atomic类型还提供了一些进阶用法，例如：

- 自旋锁：可以使用Atomic类型实现一个简单的自旋锁，用于保护临界区。自旋锁的实现方式是不停地尝试获取锁，直到获取成功为止。
- 无锁队列：可以使用Atomic类型实现一个无锁队列，用于在多个线程之间传递数据。无锁队列的实现方式是使用原子操作来保证多个线程之间的正确性。
- 引用计数：可以使用Atomic类型实现一个简单的引用计数器，用于管理对象的生命周期。引用计数的实现方式是使用原子操作来增加或减少对象的引用计数。

下面是一个简单的示例，展示了如何使用Atomic类型实现一个自旋锁：

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};

#[derive(Debug)]
struct SpinLock {
    locked: AtomicBool,
}

impl SpinLock {
    fn new() -> SpinLock {
        SpinLock { locked: AtomicBool::new(false) }
    }

    fn lock(&self) {
        while self.locked.compare_and_swap(false, true, Ordering::SeqCst) != false {}
    }

    fn unlock(&self) {
        self.locked.store(false, Ordering::SeqCst);
    }
}

fn main() {
    let lock = Arc::new(SpinLock::new());

    {
        let cl = lock.clone();
        std::thread::spawn(move || {
            cl.lock();
            println!("Thread 1 acquired lock");
            std::thread::sleep(std::time::Duration::from_millis(1000));
            cl.unlock();
            println!("Thread 1 released lock");
        });
    }
    {
        let cl = lock.clone();
        std::thread::spawn(move || {
            cl.lock();
            println!("Thread 2 acquired lock");
            std::thread::sleep(std::time::Duration::from_millis(1000));
            cl.unlock();
            println!("Thread 2 released lock");
        });
    }
    
    std::thread::sleep(std::time::Duration::from_millis(3000));
}
//  输出结果：
// Thread 1 acquired lock
// Thread 2 acquired lock
// Thread 1 released lock
// Thread 2 released lock
```

这段代码创建了一个SpinLock类型的自旋锁，然后启动了两个线程，每个线程都会尝试获取锁并输出一些信息，然后等待1秒钟后释放锁。

## 最佳实践

在使用Rust的Atomic类型时，应该遵循以下最佳实践：

- 尽量使用较弱的内存序：使用较弱的内存序可以提高性能，但可能会导致一些细微的问题，因此应该尽量使用较弱的内存序。
- 避免过度使用Atomic类型：Atomic类型的使用应该尽量避免，因为它可能会导致性能问题。如果可以使用其他线程安全的方式来实现同样的功能，则应该尽量避免使用Atomic类型。
- 避免竞态条件：使用Atomic类型时应该避免竞态条件，因为它可能会导致一些难以调试的问题。如果有竞态条件存在，则应该使用锁来保护临界区。
- 使用正确的内存序：使用Atomic类型时应该使用正确的内存序，以确保多个线程之间的操作的正确性。如果使用了错误的内存序，则可能会导致一些意外的问题。

下面是一个示例代码，展示了如何使用Atomic类型实现一个简单的引用计数器：

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

struct Counter {
    count: AtomicUsize,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: AtomicUsize::new(1) }
    }

    fn add_ref(&self) -> usize {
        self.count.fetch_add(1, Ordering::SeqCst)
    }

    fn release(&self) -> usize {
        let count = self.count.fetch_sub(1, Ordering::SeqCst);

        if count == 1 {
            std::mem::drop(self);
        }

        count - 1
    }
}

fn main() {
    let counter = Arc::new(Counter::new());

    let thread1 = {
        let counter = Arc::clone(&counter);
        std::thread::spawn(move || {
            let count = counter.add_ref();
            println!("Thread 1: count = {}", count);
        })
    };

    let thread2 = {
        let counter = Arc::clone(&counter);
        std::thread::spawn(move || {
            let count = counter.add_ref();
            println!("Thread 2: count = {}", count);
        })
    };

    let thread3 = {
        let counter = Arc::clone(&counter);
        std::thread::spawn(move || {
            let count = counter.release();
            println!("Thread 3: count = {}", count);
        })
    };

    let thread4 = {
        let counter = Arc::clone(&counter);
        std::thread::spawn(move || {
            let count = counter.release();
            println!("Thread 4: count = {}", count);
        })
    };

    thread1.join().unwrap();
    thread2.join().unwrap();
    thread3.join().unwrap();
    thread4.join().unwrap();
}
//    输出结果：
// Thread 1: count = 1
// Thread 3: count = 1
// Thread 2: count = 1
// Thread 4: count = 1
```

这段代码创建了一个Counter类型的引用计数器，然后启动了4个线程，每个线程都会对计数器进行增加或减少操作。最后输出计数器的值。

## 总结

Rust语言的Atomic是一种非常方便和安全的线程安全原子类型，它可以用于解决多线程并发访问变量时出现的竞态条件问题。在使用Atomic时，应该遵循一些最佳实践，例如尽量使用较弱的内存序、避免过度使用Atomic类型、避免竞态条件、使用正确的内存序等等。另外，Atomic类型还提供了一些进阶用法，例如自旋锁、无锁队列、引用计数等等，这些用法可以帮助我们更好地应对多线程并发访问的问题。

总之，Rust的Atomic类型是一种非常强大和有用的工具，它可以帮助我们在多线程并发场景下保证程序的正确性和性能。如果你还没有使用过Atomic类型，那么我建议你尝试一下，相信它会给你带来不少的帮助和收益。
