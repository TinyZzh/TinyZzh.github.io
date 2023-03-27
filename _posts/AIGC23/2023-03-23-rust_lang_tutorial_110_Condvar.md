---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 条件变量 Condvar
date: 2023-03-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Condvar]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在并发编程中，条件变量（Condvar）是一种用于等待特定条件的线程同步机制。它允许线程等待另一个线程发出信号，以便在满足条件时恢复执行。Rust语言提供了Condvar类型，可以用于实现线程之间的同步。本文将介绍Rust语言中的Condvar，包括其含义、常用业务场景和用法、进阶用法以及最佳实践。

条件变量是一种线程同步机制，它允许一个或多个线程等待另一个线程发出信号。条件变量通常用于等待某个共享资源的可用性，或者等待某个条件的满足。在Rust语言中，条件变量由Condvar类型表示。Condvar是一个智能指针类型，它包装了一个MutexGuard类型的值，并提供了wait和notify_one方法，用于等待和唤醒线程。

## 常用业务场景和用法

### 等待共享资源的可用性

在多线程应用程序中，有时需要等待某个共享资源的可用性。例如，假设有一个缓冲区，多个线程需要向该缓冲区写入数据，但是缓冲区已满时需要等待其他线程读取数据后才能继续写入。这种情况下，可以使用条件变量来等待缓冲区的可用性。下面是一个示例代码：

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;

struct Buffer {
    data: Vec<i32>,
    capacity: usize,
    mutex: Mutex<()>,
    condvar: Condvar,
}

impl Buffer {
    fn new(capacity: usize) -> Self {
        Self {
            data: vec![],
            capacity,
            mutex: Mutex::new(()),
            condvar: Condvar::new(),
        }
    }

    fn write(&self, value: i32) {
        let mut lock = self.mutex.lock().unwrap();
        while self.data.len() == self.capacity {
            lock = self.condvar.wait(lock).unwrap();
        }
        self.data.push(value);
        self.condvar.notify_one();
    }

    fn read(&self) -> i32 {
        let mut lock = self.mutex.lock().unwrap();
        while self.data.is_empty() {
            lock = self.condvar.wait(lock).unwrap();
        }
        let value = self.data.remove(0);
        self.condvar.notify_one();
        value
    }
}

fn main() {
    let buffer = Arc::new(Buffer::new(10));
    let mut handles = vec![];
    for i in 0..10 {
        let buffer = buffer.clone();
        let handle = thread::spawn(move || {
            for j in 0..10 {
                let value = i * 10 + j;
                buffer.write(value);
            }
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    let mut values = vec![];
    for _ in 0..100 {
        values.push(buffer.read());
    }
    assert_eq!(values, (0..100).collect::<Vec<_>>());
}
```

在这个示例代码中，我们定义了一个Buffer结构体，它包含一个Vec<i32>类型的数据、一个容量、一个Mutex类型的互斥锁和一个Condvar类型的条件变量。write方法用于向缓冲区写入数据，如果缓冲区已满，则等待其他线程读取数据后再进行写入。read方法用于从缓冲区读取数据，如果缓冲区为空，则等待其他线程写入数据后再进行读取。在主函数中，我们创建了10个线程，每个线程向缓冲区写入10个数据。最后，我们从缓冲区读取了100个数据，并检查它们是否按顺序排列。

### 等待某个条件的满足

在多线程应用程序中，有时需要等待某个条件的满足。例如，假设有一个计数器，多个线程需要等待计数器达到某个值后才能继续执行。这种情况下，可以使用条件变量来等待计数器的值达到某个值。下面是一个示例代码：

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;

struct Counter {
    value: i32,
    mutex: Mutex<()>,
    condvar: Condvar,
}

impl Counter {
    fn new() -> Self {
        Self {
            value: 0,
            mutex: Mutex::new(()),
            condvar: Condvar::new(),
        }
    }

    fn increment(&self) {
        let mut lock = self.mutex.lock().unwrap();
        self.value += 1;
        if self.value == 10 {
            self.condvar.notify_one();
        }
    }

    fn wait(&self) {
        let mut lock = self.mutex.lock().unwrap();
        while self.value < 10 {
            lock = self.condvar.wait(lock).unwrap();
        }
    }
}

fn main() {
    let counter = Arc::new(Counter::new());
    let mut handles = vec![];
    for _ in 0..10 {
        let counter = counter.clone();
        let handle = thread::spawn(move || {
            for _ in 0..10 {
                counter.increment();
            }
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    counter.wait();
    println!("Counter reached 10");
}
```

在这个示例代码中，我们定义了一个Counter结构体，它包含一个计数器值、一个Mutex类型的互斥锁和一个Condvar类型的条件变量。increment方法用于增加计数器的值，如果计数器的值达到10，则发出一个信号。wait方法用于等待计数器的值达到10。在主函数中，我们创建了10个线程，每个线程增加计数器的值10次。最后，我们等待计数器的值达到10，并输出一条消息。

## 进阶用法

在大多数情况下，wait和notify_one方法已经足够满足我们的需求。但是，在某些情况下，可能需要更高级的用法。例如，有时需要等待多个条件的满足，或者需要等待一段时间后自动唤醒线程。在这种情况下，可以使用wait_timeout和notify_all方法。

### 等待多个条件的满足

在某些情况下，需要等待多个条件的满足。例如，假设有一个队列，多个线程需要等待队列的长度达到某个值或者等待超时。这种情况下，可以使用wait_timeout方法来等待多个条件的满足。下面是一个示例代码：

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

struct Queue {
    data: Vec<i32>,
    capacity: usize,
    mutex: Mutex<()>,
    condvar: Condvar,
}

impl Queue {
    fn new(capacity: usize) -> Self {
        Self {
            data: vec![],
            capacity,
            mutex: Mutex::new(()),
            condvar: Condvar::new(),
        }
    }

    fn push(&self, value: i32) {
        let mut lock = self.mutex.lock().unwrap();
        while self.data.len() == self.capacity {
            lock = self.condvar.wait(lock).unwrap();
        }
        self.data.push(value);
        self.condvar.notify_all();
    }

    fn pop(&self) -> Option<i32> {
        let mut lock = self.mutex.lock().unwrap();
        loop {
            if let Some(value) = self.data.pop() {
                self.condvar.notify_all();
                return Some(value);
            }
            lock = match self.condvar.wait_timeout(lock, Duration::from_secs(1)) {
                Ok((lock, _)) => lock,
                Err(_) => {
                    self.condvar.notify_all();
                    return None;
                }
            };
        }
    }
}

fn main() {
    let queue = Arc::new(Queue::new(10));
    let mut handles = vec![];
    for i in 0..10 {
        let queue = queue.clone();
        let handle = thread::spawn(move || {
            for j in 0..10 {
                let value = i * 10 + j;
                queue.push(value);
            }
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    let mut values = vec![];
    loop {
        if let Some(value) = queue.pop() {
            values.push(value);
        } else {
            break;
        }
    }
    assert_eq!(values.len(), 100);
}
```

在这个示例代码中，我们定义了一个Queue结构体，它包含一个Vec<i32>类型的数据、一个容量、一个Mutex类型的互斥锁和一个Condvar类型的条件变量。push方法用于向队列中添加数据，如果队列已满，则等待其他线程从队列中取出数据后再进行添加。pop方法用于从队列中取出数据，如果队列为空，则等待其他线程向队列中添加数据或者等待超时。在主函数中，我们创建了10个线程，每个线程向队列中添加10个数据。最后，我们从队列中取出了所有数据，并检查它们是否按顺序排列。

### 等待一段时间后自动唤醒线程

在某些情况下，需要等待一段时间后自动唤醒线程。例如，假设有一个任务，需要在一定时间内完成，如果超时则取消任务。这种情况下，可以使用wait_timeout方法来等待一段时间后自动唤醒线程。下面是一个示例代码：

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::{Duration, Instant};

struct Task {
    done: bool,
    mutex: Mutex<()>,
    condvar: Condvar,
}

impl Task {
    fn new() -> Self {
        Self {
            done: false,
            mutex: Mutex::new(()),
            condvar: Condvar::new(),
        }
    }

    fn run(&self, timeout: Duration) {
        let start = Instant::now();
        let mut lock = self.mutex.lock().unwrap();
        while !self.done {
            let elapsed = start.elapsed();
            if elapsed >= timeout {
                return;
            }
            let remaining = timeout - elapsed;
            lock = match self.condvar.wait_timeout(lock, remaining).unwrap() {
                (lock, true) => return,
                (lock, false) => lock,
            };
        }
    }

    fn cancel(&self) {
        let mut lock = self.mutex.lock().unwrap();
        self.done = true;
        self.condvar.notify_all();
    }
}

fn main() {
    let task = Arc::new(Task::new());
    let handle = thread::spawn(move || {
        task.run(Duration::from_secs(5));
    });
    thread::sleep(Duration::from_secs(2));
    task.cancel();
    handle.join().unwrap();
}
```

在这个示例代码中，我们定义了一个Task结构体，它包含一个标志位、一个Mutex类型的互斥锁和一个Condvar类型的条件变量。run方法用于执行任务，在一定时间内等待任务完成，如果超时则取消任务。cancel方法用于取消任务。在主函数中，我们创建了一个线程执行任务，并在2秒后取消任务。如果任务在5秒内完成，则线程将正常退出，否则将被取消。

## 最佳实践

在使用条件变量时，需要注意以下几点：

- 必须先获取互斥锁才能使用条件变量。
- 在等待条件变量之前，必须先检查条件是否满足，否则可能会出现死锁。
- 在发出信号之前，必须修改共享状态，否则可能会出现竞争条件。
- 在使用wait_timeout方法时，必须将剩余时间传递给wait_timeout方法，否则可能会等待超时。

## 结论

条件变量是一种用于等待特定条件的线程同步机制。在Rust语言中，条件变量由Condvar类型表示。Condvar可以用于实现线程之间的同步，例如等待共享资源的可用性或等待某个条件的满足。在使用条件变量时，需要注意一些最佳实践，以避免出现死锁和竞争条件。