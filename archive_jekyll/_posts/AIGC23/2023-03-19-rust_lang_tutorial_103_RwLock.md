---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - RwLock读写锁
date: 2023-03-19 01:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, RwLock]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_103_RwLock.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)


Rust是一种系统级编程语言，它带有严格的内存管理、并发和安全性规则，因此很受广大程序员的青睐。RwLock（读写锁）是 Rust 中常用的线程同步机制之一，本文将详细介绍 Rust 语言中的 RwLock 的内部实现原理、常用接口的使用技巧和最佳实践。

## RwLock 的内部实现原理

### 基本概念

RwLock 是一种读写分离的锁，允许多个线程同时读取共享数据，但只允许一个线程写入数据。通过这种方式，可以避免读写操作之间的竞争，从而提高并发性能。

在 Rust 中，RwLock 的实现基于 std::sync::RwLock<T> 结构体。其中，T 表示被保护的数据类型，需要满足 Send 特质以便可以在线程之间传递，并且需要满足 Sync 特质以便可以在线程之间共享。

RwLock 是在 std::sync::RwLock<T> 结构体上实现的，为了方便说明，下文中假设 T 为 u32 类型。

### RwLock 的基本结构

RwLock 的基本结构如下：

```rust
use std::sync::RwLock;

let lock = RwLock::new(0u32);
```

该代码将创建一个 RwLock 对象，其中 T 类型为 u32，初始化值为 0，即该锁保护的是一个名为 data 的 u32 类型变量。

### RwLock 的锁定机制

我们可以通过锁定 RwLock 来对数据进行保护。RwLock 提供了四个方法来完成锁定操作：

1. `read()` 方法：获取读锁，并返回一个 RAII（资源获取即初始化）的读取守卫。多个线程可以同时获取读锁，但是不能同时持有写锁。
2. `try_read()` 方法：非阻塞地获取读锁。如果读锁已经被占用，则返回 None。
3. `write()` 方法：获取写锁，并返回一个 RAII 的写入守卫。如果有任何线程正在持有读锁或写锁，则阻塞等待直到它们释放锁。
4. `try_write()` 方法：非阻塞地获取写锁。如果写锁已经被占用，则返回 `None`。

对于读写锁，我们需要保证写操作在读操作之前，因此，在调用 write 方法时，会等待所有的读取守卫被释放，并阻止新的读取守卫的创建。为了避免死锁和优先级反转，写入守卫还可以降低优先级。

读写锁的实现主要是通过两个 Mutex 来实现的。一个 Mutex 用于保护读取计数器，另一个 Mutex 用于保护写入状态。读取计数器统计当前存在多少个读取锁，每当一个新的读取锁被请求时，读取计数器就会自增。当读取计数器为 0 时，写入锁可以被请求。

### RwLock 的 Poisoning

类似于 Mutex，RwLock 也支持 poisoning 机制。如果 RwLock 发生 panic，那么锁就成了 poison 状态，也就是无法再被使用。任何试图获取这个锁的线程都会 panic，而不是被阻塞。

```rust

use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let lock = Arc::new(RwLock::new(0u32));

    let readers = (0..6)
        .map(|_| {
            let lock = lock.clone();
            thread::spawn(move || {
                let guard = lock.read().unwrap();
                println!("read: {}", *guard);
            })
        })
        .collect::<Vec<_>>();

    let writers = (0..2)
        .map(|_| {
            let lock = lock.clone();
            thread::spawn(move || {
                let mut guard = lock.write().unwrap();
                *guard += 1;
                println!("write: {}", *guard);
            })
        })
        .collect::<Vec<_>>();

    for reader in readers {
        reader.join().unwrap();
    }
    for writer in writers {
        writer.join().unwrap();
    }
}
```

运行后，可能会出现以下异常信息：

```bash
thread 'main' panicked at 'PoisonError { inner: ...
```

这里的 `inner` 表示调用 RwLock 的线程 panic 时产生的错误信息。

## 常用接口的使用技巧

### `read()` 方法

`read()` 方法用于获取读锁，并返回一个 RAII 的读取守卫：

```rust
let lock = RwLock::new(0u32);

let r1 = lock.read().unwrap();
let r2 = lock.read().unwrap();
```

在上面的例子中，r1 和 r2 都是 RwLockWriteGuard&lt;u32&gt; 类型的对象，它们引用的数据类型是 u32。这意味着它们只允许读取 u32 类型的数据，并且无法改变它们的值。

读取守卫被析构时，RwLock 的读取计数器会减少，如果读取计数器变为 0，则写入锁可以被请求。

### `write()` 方法

`write()` 方法用于获取写锁，并返回一个 RAII 的写入守卫：

```rust
let lock = RwLock::new(0u32);

let mut w1 = lock.write().unwrap();
let mut w2 = lock.write().unwrap();
```

在上面的例子中，w1 和 w2 都是 RwLockWriteGuard&lt;u32&gt; 类型的对象，它们引用的数据类型是 u32。这意味着它们允许读写 u32 类型的数据，并且可以改变它们的值。

写入守卫被析构时，写入锁立即被释放，并且所有等待读取锁和写入锁的线程都可以开始运行。

### `try_read()` 方法

`try_read()` 方法用于非阻塞地获取读锁。如果读锁已经被占用，则返回 None。

```rust
let lock = RwLock::new(0u32);

if let Some(r) = lock.try_read() {
      println!("read: {}", *r);
} else {
      println!("read lock is already taken");
}
```

### `try_write()` 方法

`try_write()` 方法用于非阻塞地获取写锁。如果写锁已经被占用，则返回 None。

```rust
let lock = RwLock::new(0u32);

if let Some(mut w) = lock.try_write() {
    *w += 1;
    println!("write: {}", *w);
} else {
      println!("write lock is already taken");
}
```

### 共享所有权

如果你想在多个线程之间共享一个 RwLock 对象，就需要使用 Arc（atomic reference counting，原子引用计数）来包装它：

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let lock = Arc::new(RwLock::new(0u32));

    let readers = (0..6)
        .map(|_| {
            let lock = lock.clone();
            thread::spawn(move || {
                let guard = lock.read().unwrap();
                println!("read: {}", *guard);
            })
        })
        .collect::<Vec<_>>();

    let writers = (0..2)
        .map(|_| {
            let lock = lock.clone();
            thread::spawn(move || {
                let mut guard = lock.write().unwrap();
                *guard += 1;
                println!("write: {}", *guard);
            })
        })
        .collect::<Vec<_>>();

    for reader in readers {
        reader.join().unwrap();
    }
    for writer in writers {
        writer.join().unwrap();
    }
}
//  输出结果：
// read: 0
// read: 0
// read: 0
// read: 0
// read: 0
// read: 0
// write: 1
// write: 2
```

## 实现锁超时功能

Rust标准库中的RwLock目前是不支持读/写超时功能的。我们可以利用RwLock中非阻塞方法try_read和try_write实现超时的特征。

下面进一步讲解使用std::sync::RwLock和std::time::Duration来实现读超时，具体步骤如下：

 1. 创建一个名为TimeoutRwLock的trait，其中包含read_timeout方法。
 2. 在TimeoutRwLock中添加默认实现（default impl）。
 3. 在read_timeout方法中，通过RwLock的try_read_with_timeout方法来尝试获取读取器（Reader），并且指定一个等待时间。
 4. 如果在等待时间内成功获取到读取器，那么将读取器返回；否则，返回一个错误。
下面是代码实现：

```rust
use std::sync::{Arc, RwLock, RwLockReadGuard};
use std::time::Duration;
use std::thread;
use std::thread::sleep;

trait TimeoutRwLock<T> {
    fn read_timeout(&self, timeout: Duration) -> Result<RwLockReadGuard<'_, T>, String> {
        match self.try_read_with_timeout(timeout) {
            Ok(guard) => Ok(guard),
            Err(_) => Err(String::from("timeout")),
        }
    }

    fn try_read_with_timeout(&self, timeout: Duration) -> Result<RwLockReadGuard<'_, T>, ()>;
}

impl<T> TimeoutRwLock<T> for RwLock<T> {
    fn try_read_with_timeout(&self, timeout: Duration) -> Result<RwLockReadGuard<'_, T>, ()> {
        let now = std::time::Instant::now();
        loop {
            match self.try_read() {
                Ok(guard) => return Ok(guard),
                Err(_) => {
                    if now.elapsed() >= timeout {
                        return Err(());
                    }
                    std::thread::sleep(Duration::from_millis(10));
                }
            }
        }
    }
}

fn main() {
    let lock = Arc::new(RwLock::new(0u32));

    let reader = {
        let lock = lock.clone();
        thread::spawn(
            move || match lock.read_timeout(Duration::from_millis(100)) {
                Ok(guard) => {
                    println!("read: {}", *guard);
                }
                Err(e) => {
                    println!("error: {:?}", e);
                }
            },
        )
    };

    let writer = {
        let lock = lock.clone();
        thread::spawn(move || {
            sleep(Duration::from_secs(1));
            let mut guard = lock.write().unwrap();
            *guard += 1;
            println!("write: {}", *guard);
        })
    };

    reader.join().unwrap();
    writer.join().unwrap();
}
//    输出结果：
// read: 0
// write: 1
```

在这个实现中，trait TimeoutRwLock中定义了一个read_timeout方法，它与try_read方法具有相同的输入参数类型和输出类型。default impl方法是一个尝试在给定的等待时间内获取读取器（Reader）的循环，并在等待过程中使用线程（thread）的park_timeout方法来避免 CPU 占用过高。如果在等待时间内成功获取到读取器（Reader），则返回读取器；否则返回一个错误。

当然，除了自己实现Trait外，还可以使用成熟的第三方库，例如：`parking_lot`

## RwLock最佳实践

 - 避免使用锁

锁是一种解决并发问题的基本机制，但由于锁会引入竞争条件、死锁和其他问题，因此应尽量避免使用锁。如果可能，应使用更高级别的机制，例如 Rust 的通道（channel）。

 - 避免过度使用读写锁

在某些情况下，读写锁可能会比互斥锁更慢。例如，如果有太多的读取器，并且它们在拥有读取锁时花费了大量时间，那么写入器的等待时间可能会很长。因此，使用读写锁时，应仔细考虑读写比例，以避免过度使用读写锁。

 - 锁的可重入性

RwLock 是可重入的；一个线程占有写锁时可以再次占有读锁，并且同样可以占有写锁。但这种情况要非常小心，因为可能会导致死锁。

 - 尽量缩小锁的范围

锁的范围越小，竞争就越少，性能就越好。因此，应尽量在需要的地方使用锁，而在不需要的地方释放锁。例如，在读写数据之前，可以先将数据复制到本地变量中，然后释放锁，以便其它线程可以访问该数据，而不必争夺锁。在本地变量上执行读写操作时，不需要锁定。

 - 锁的超时设置

在使用锁时，应该避免出现无限等待的情况。可以使用带超时的锁，当等待时间超过指定的时间时，会返回一个错误。这将防止出现死锁或其他问题。

```rust
//    引入第三方库处理超时
//    parking_lot = "0.12.1"
use parking_lot::RwLock;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

fn main() {
    let rwlock = Arc::new(RwLock::new(0));
    let start = Instant::now();

    // 尝试在 1 秒内获取读锁
    let reader = loop {
        if let Some(r) = rwlock.try_read_for(Duration::from_secs(1)) {
            break r;
        }
        if start.elapsed() >= Duration::from_secs(5) {
            panic!("Failed to acquire read lock within 5 seconds.");
        }
    };

    // 尝试在 1 秒内获取写锁
    let mut writer = loop {
        if let Some(w) = rwlock.try_write_for(Duration::from_secs(1)) {
            break w;
        }
        if start.elapsed() >= Duration::from_secs(5) {
            panic!("Failed to acquire write lock within 5 seconds.");
        }
    };

    // 进行读写操作
    println!("Reader: {}", *reader);
    *writer += 1;
    println!("Writer: {}", *writer);
}
```

在上面的例子中，读取器等待 100 毫秒后超时，写入器等待 1 秒钟才能成功完成写入。

## 总结

RwLock 是 Rust 中一种常用的线程同步机制，可以提高程序的并发性能。它只允许一个线程写入数据，但可以让多个线程同时读取同一个数据。具体来说，RwLock 在实现上使用了两个 Mutex，一个用于保护读取计数器，另一个用于保护写入状态。在使用 RwLock 时，应该注意缩小锁的范围、避免使用过多读写锁以及防止死锁等问题。