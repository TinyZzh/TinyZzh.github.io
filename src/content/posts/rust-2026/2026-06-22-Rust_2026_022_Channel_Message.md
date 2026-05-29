---
title: "Rust 2026 经验谈 - 通道与消息传递"
published: 2026-06-22
description: "mpsc/mpmc channel 选型、channel 背压策略、select 模式、与 Go channel 的对比、MPSC 生产者-消费者实战。"
image: "/images/rust-2026/5.jpg"
tags: [Rust, Rust 2026, Channel, 消息传递, 并发]
category: Rust
draft: false
lang: zh_CN
---

![并发与同步](/images/rust-2026/5.jpg)

"不要通过共享内存来通信，而要通过通信来共享内存。"这句话在 Rust 中有更深的含义——channel 的所有权语义天然防止数据竞争。本文详解 Rust channel 的选型、背压、select 模式，以及与 Go channel 的关键差异。

## mpsc/mpmc channel 选型

### std::sync::mpsc：标准库的 MPSC

```rust
use std::sync::mpsc;
use std::thread;

fn std_mpsc_example() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        tx.send("hello".to_owned()).unwrap();
        tx.send("world".to_owned()).unwrap();
    });

    // rx 在主线程
    while let Ok(msg) = rx.try_recv() {
        println!("收到: {msg}");
    }
}
```

**std::sync::mpsc 的特点**：

| 特性 | 支持情况 |
|------|----------|
| 多生产者 | 支持（`tx.clone()`） |
| 单消费者 | 是（`Receiver` 不 `Clone`） |
| 有界 channel | `sync_channel(capacity)` |
| 无界 channel | `channel()` |
| select | 已废弃（`select!` 宏在 1.0 前） |
| 性能 | 一般（内部用 Mutex + Condvar） |

**踩坑**：`std::sync::mpsc` 的 `Receiver` 不是 `Sync`，意味着你不能在多线程中同时从同一个 channel 读取。如果你需要多消费者，必须换方案。

### crossbeam-channel：高性能 MPMC

```rust
use crossbeam_channel as channel;
use std::thread;

fn crossbeam_example() {
    let (tx, rx) = channel::bounded(100);

    // 多生产者
    let mut producers = vec![];
    for i in 0..4 {
        let tx = tx.clone();
        producers.push(thread::spawn(move || {
            for j in 0..50 {
                tx.send((i, j)).unwrap();
            }
        }));
    }

    // 多消费者
    let mut consumers = vec![];
    for _ in 0..2 {
        let rx = rx.clone();
        consumers.push(thread::spawn(move || {
            while let Ok((i, j)) = rx.recv() {
                println!("消费者收到: producer={i}, item={j}");
            }
        }));
    }

    // 关闭生产者
    drop(tx);
    for p in producers {
        p.join().unwrap();
    }
    // 消费者会在 channel 关闭后退出
    for c in consumers {
        c.join().unwrap();
    }
}
```

**crossbeam-channel 的优势**：

| 特性 | std::sync::mpsc | crossbeam-channel |
|------|----------------|-------------------|
| MPMC | 否 | 是 |
| select | 否 | 是（`select!` 宏） |
| 性能 | ~200ns/op | ~50ns/op |
| 有界/无界 | 都支持 | 都支持 |
| `Receiver: Clone` | 否 | 是 |
| 零分配(bounded) | 否 | 是（环形缓冲区） |
| `Send` 超时 | 否 | 是（`send_timeout`） |

### flume：异步友好的 MPMC

```rust
use flume;
use std::thread;

fn flume_example() {
    let (tx, rx) = flume::bounded(50);

    // flume 的 rx 可以同时用于同步和异步
    // 异步接收
    let rx_async = rx.clone();
    let async_task = tokio::spawn(async move {
        while let Ok(msg) = rx_async.recv_async().await {
            println!("异步收到: {msg}");
        }
    });

    // 同步发送
    thread::spawn(move || {
        for i in 0..100 {
            if tx.send(i).is_err() {
                break;
            }
        }
    });
}
```

**flume 的特点**：

| 特性 | crossbeam-channel | flume |
|------|-------------------|-------|
| 异步支持 | 否 | 是（`recv_async`/`send_async`） |
| MPMC | 是 | 是 |
| select | 是 | 否（用 tokio::select! 代替） |
| 性能 | 最高 | 略低（~70ns/op） |
| 无 std 依赖 | 否 | 可选（`no_std` 支持） |

### 选型决策树

```
需要 channel？
├── 只需 MPSC + 不需要 select？
│   └── std::sync::mpsc（零依赖）
├── 需要 MPMC 或 select？
│   ├── 需要异步支持？
│   │   └── flume
│   └── 纯同步高性能？
│       └── crossbeam-channel
└── 在 tokio 运行时中？
    └── tokio::sync::mpsc（异步原生）
```

## channel 背压策略

### 有界 vs 无界：核心选择

```rust
use crossbeam_channel as channel;

// 无界：生产者永远不会阻塞
let (tx, rx) = channel::unbounded();
// 风险：如果生产者速度 >> 消费者速度，内存暴涨

// 有界：生产者在满时阻塞
let (tx, rx) = channel::bounded(1000);
// 优势：天然背压，生产者被限速
```

**踩坑故事**：我曾在一个日志系统中用无界 channel，消费者写磁盘慢时，channel 中积压了几百万条日志，最终 OOM。改用 bounded(10000) 后，生产者在 channel 满时阻塞，日志丢不了，内存也稳定了。

### 有界 channel 的三种策略

```rust
use crossbeam_channel::{bounded, SendError, TrySendError};
use std::time::Duration;

let (tx, rx) = bounded(100);

// 策略 1：阻塞等待（默认行为）
// 适用于：不能丢消息，可以容忍生产者慢
match tx.send(42) {
    Ok(()) => {}
    Err(SendError(_)) => println!("channel 已关闭"),
}

// 策略 2：非阻塞尝试 + 丢弃
// 适用于：宁可丢消息也不能阻塞（如监控指标）
match tx.try_send(42) {
    Ok(()) => {}
    Err(TrySendError::Full(_)) => {
        // channel 满了，丢弃这条消息
        // 或者记到本地缓冲区
    }
    Err(TrySendError::Disconnected(_)) => {}
}

// 策略 3：超时等待
// 适用于：等一会儿，实在不行就放弃
match tx.send_timeout(42, Duration::from_millis(100)) {
    Ok(()) => {}
    Err(crossbeam_channel::SendTimeoutError::Disconnected(_)) => println!("channel 已关闭"),
    Err(crossbeam_channel::SendTimeoutError::Timeout(_)) => println!("发送超时"),
}
```

### 动态背压：根据消费速度调整

```rust
use crossbeam_channel as channel;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

struct AdaptiveProducer {
    tx: channel::Sender<i32>,
    backpressure_count: AtomicUsize,
}

impl AdaptiveProducer {
    fn send(&self, item: i32) -> bool {
        match self.tx.try_send(item) {
            Ok(()) => {
                self.backpressure_count.store(0, Ordering::Relaxed);
                true
            }
            Err(channel::TrySendError::Full(_)) => {
                let count = self.backpressure_count.fetch_add(1, Ordering::Relaxed);
                // 指数退避
                let backoff_ms = 1u64 << count.min(10);
                std::thread::sleep(Duration::from_millis(backoff_ms));
                // 重试一次
                self.tx.try_send(item).is_ok()
            }
            Err(channel::TrySendError::Disconnected(_)) => false,
        }
    }
}
```

### 有界 channel 容量选择指南

| 场景 | 推荐容量 | 原因 |
|------|----------|------|
| 任务分发 | CPU 核数 × 2 | 平衡延迟和吞吐 |
| 日志收集 | 1000 ~ 10000 | 批量写入磁盘 |
| 事件流 | 根据峰值 × 时间窗口 | 吸秒级突发 |
| 控制信号 | 1 ~ 10 | 低延迟优先 |

**经验**：channel 容量不是越大越好。容量越大，缓存行竞争越严重，吞吐量反而下降。用 benchmark 调参。

## select 模式

### crossbeam select 基本用法

```rust
use crossbeam_channel as channel;

fn select_example() {
    let (tx1, rx1) = channel::bounded(1);
    let (tx2, rx2) = channel::bounded(1);

    thread::spawn(move || {
        tx1.send("from channel 1").unwrap();
    });
    thread::spawn(move || {
        tx2.send("from channel 2").unwrap();
    });

    // select：等待多个 channel，哪个先就绪就处理哪个
    channel::select! {
        recv(rx1) -> msg => println!("rx1: {:?}", msg),
        recv(rx2) -> msg => println!("rx2: {:?}", msg),
    }
}
```

### 多轮 select + 超时

```rust
use crossbeam_channel as channel;
use std::time::Duration;

fn event_loop(rx1: channel::Receiver<i32>, rx2: channel::Receiver<String>) {
    let timeout = channel::after(Duration::from_secs(5));
    let tick = channel::tick(Duration::from_millis(100));

    loop {
        channel::select! {
            recv(rx1) -> msg => {
                match msg {
                    Ok(val) => println!("收到数字: {val}"),
                    Err(_) => break, // channel 关闭
                }
            }
            recv(rx2) -> msg => {
                if let Ok(val) = msg {
                    println!("收到字符串: {val}");
                }
            }
            recv(tick) -> _ => {
                // 定时任务：每 100ms 执行一次
                // 如：心跳、指标采集
            }
            recv(timeout) -> _ => {
                println!("5 秒超时，退出");
                break;
            }
        }
    }
}
```

### 优先级 select

crossbeam 的 `select!` 是公平的（随机选择就绪的 channel）。如果需要优先级，手动实现：

```rust
use crossbeam_channel as channel;

fn priority_select(high: channel::Receiver<i32>, low: channel::Receiver<i32>) {
    loop {
        // 先检查高优先级
        if let Ok(val) = high.try_recv() {
            println!("高优先级: {val}");
            continue;
        }
        // 高优先级无消息时，select 等待
        channel::select! {
            recv(high) -> msg => {
                if let Ok(val) = msg { println!("高优先级: {val}"); }
            }
            recv(low) -> msg => {
                if let Ok(val) = msg { println!("低优先级: {val}"); }
            }
        }
    }
}
```

## 与 Go channel 的对比

### 所有权语义：最本质的差异

```rust
// Rust：值被 move 到 channel 中
let (tx, rx) = std::sync::mpsc::channel();
let data = vec![1, 2, 3];
tx.send(data).unwrap();
// data 在这里已经不可用了！所有权转移到了 channel
// println!("{:?}", data); // 编译错误！
```

```go
// Go：值被复制到 channel 中
data := []int{1, 2, 3}
ch <- data
// data 仍然可用
fmt.Println(data) // 正常工作
```

这是最根本的差异：**Rust channel 传递所有权，Go channel 传递值的副本**。

这意味着：

| 维度 | Rust channel | Go channel |
|------|-------------|-----------|
| 语义 | Move（所有权转移） | Copy（值复制） |
| 零拷贝 | 天然支持（move 无开销） | 需要传指针 |
| 共享引用 | 编译期禁止（除非 Arc） | 运行时允许（传指针后共享） |
| 数据竞争 | 编译期消除 | 运行时检测（race detector） |

### Go 传指针的问题

```go
// Go：传指针到 channel —— 危险！
data := &MyStruct{...}
ch <- data  // 传递了指针
// 现在 sender 和 receiver 都能访问同一数据
// 如果 sender 继续修改 data —— 数据竞争！
```

Go 社区的最佳实践是"传值不传指针"或"传指针后不再使用"——但这只是约定，编译器不强制。

Rust 的 channel 天然解决了这个问题：`send(data)` 之后 `data` 被 move，发送者无法再访问。

### buffered channel 行为对比

```rust
// Rust (crossbeam)：bounded channel 满时，send 阻塞
let (tx, rx) = crossbeam_channel::bounded(1);
tx.send(1).unwrap();     // 成功
tx.send(2).unwrap();     // 阻塞，直到有接收者
```

```go
// Go：buffered channel 满时，send 也阻塞
ch := make(chan int, 1)
ch <- 1  // 成功
ch <- 2  // 阻塞
```

行为一致，但 Rust 的 bounded channel 在 crossbeam 实现中是无锁的（SPSC 时），性能优于 Go 的 channel（Go channel 内部有锁）。

### channel 关闭语义

```rust
// Rust (std::sync::mpsc)：drop 所有 Sender 后，recv 返回 Err
let (tx, rx) = std::sync::mpsc::channel();
drop(tx);
assert!(rx.recv().is_err()); // channel 关闭
```

```go
// Go：close(ch) 后，recv 返回零值
ch := make(chan int, 1)
close(ch)
val, ok := <-ch  // val = 0, ok = false
```

Go 的 `close` 是显式的，Rust 的"关闭"是隐式的（drop Sender）。Go 的方式更灵活但也更危险——close 一个已经 close 的 channel 会 panic，向一个 closed channel 发送也会 panic。Rust 不会。

## MPSC 在生产者-消费者模式中的实战

### 模式一：工作窃取任务池

```rust
use crossbeam_channel as channel;
use std::thread;

struct WorkerPool {
    senders: Vec<channel::Sender<Task>>,
    steal_rx: channel::Receiver<Task>,
}

struct Task {
    id: usize,
    payload: Vec<u8>,
}

impl WorkerPool {
    fn new(num_workers: usize) -> Self {
        let (steal_tx, steal_rx) = channel::bounded(100);

        let mut senders = vec![];
        for _ in 0..num_workers {
            let (tx, rx) = channel::bounded(50);
            let steal_tx = steal_tx.clone();
            thread::spawn(move || {
                loop {
                    // 优先从自己的队列取任务
                    match rx.try_recv() {
                        Ok(task) => Self::process(task),
                        Err(_) => {
                            // 队列空，尝试窃取或等待
                            match channel::select! {
                                recv(rx) -> task => {
                                    if let Ok(t) = task { Self::process(t); }
                                    else { break; }
                                }
                                recv(steal_rx) -> task => {
                                    if let Ok(t) = task { Self::process(t); }
                                }
                            }
                        }
                    }
                }
            });
            senders.push(tx);
        }

        WorkerPool { senders, steal_rx }
    }

    fn submit(&self, task: Task) {
        // 轮询分发到 worker
        static COUNTER: std::sync::atomic::AtomicUsize =
            std::sync::atomic::AtomicUsize::new(0);
        let idx = COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed) % self.senders.len();
        if self.senders[idx].try_send(task).is_err() {
            // worker 满了，放入窃取队列
            let _ = self.senders[0].send(task);
        }
    }

    fn process(task: Task) {
        // 实际处理逻辑
        println!("处理任务 {}", task.id);
    }
}
```

### 模式二：流水线（Pipeline）

```rust
use crossbeam_channel as channel;
use std::thread;

fn pipeline_example() {
    // Stage 1: 生成数据
    let (input_tx, input_rx) = channel::bounded(100);

    // Stage 2: 解析
    let (parsed_tx, parsed_rx) = channel::bounded(100);
    let parse_rx = input_rx.clone();
    thread::spawn(move || {
        while let Ok(raw) = parse_rx.recv() {
            let parsed: i32 = raw.parse().unwrap_or(0);
            if parsed_tx.send(parsed).is_err() { break; }
        }
    });

    // Stage 3: 过滤
    let (filtered_tx, filtered_rx) = channel::bounded(100);
    thread::spawn(move || {
        while let Ok(val) = parsed_rx.recv() {
            if val > 0 {
                if filtered_tx.send(val).is_err() { break; }
            }
        }
    });

    // Stage 4: 聚合
    thread::spawn(move || {
        let mut sum = 0i64;
        let mut count = 0usize;
        while let Ok(val) = filtered_rx.recv() {
            sum += val as i64;
            count += 1;
        }
        println!("总和: {sum}, 数量: {count}");
    });

    // 喂数据
    for i in 0..1000 {
        input_tx.send(i.to_string()).unwrap();
    }
    drop(input_tx);
}
```

流水线模式的优势：每个 stage 独立运行，可以分配到不同线程，backpressure 自然传播。

### 模式三：扇出-扇入（Fan-out/Fan-in）

```rust
use crossbeam_channel as channel;
use std::thread;

fn fan_out_fan_in() {
    let (input_tx, input_rx) = channel::bounded(100);
    let (output_tx, output_rx) = channel::bounded(100);

    // 扇出：多个 worker 从同一 input 读取（MPMC）
    let num_workers = 4;
    for worker_id in 0..num_workers {
        let rx = input_rx.clone();
        let tx = output_tx.clone();
        thread::spawn(move || {
            while let Ok(item) = rx.recv() {
                let result = item * 2; // 处理
                if tx.send((worker_id, result)).is_err() { break; }
            }
        });
    }
    drop(input_rx);  // 关闭 worker 的接收端
    drop(output_tx); // 关闭 worker 的发送端

    // 扇入：一个收集者从 output 读取
    thread::spawn(move || {
        while let Ok((worker_id, result)) = output_rx.recv() {
            println!("worker {worker_id} 产出: {result}");
        }
    });

    // 喂数据
    for i in 1..=100 {
        input_tx.send(i).unwrap();
    }
    drop(input_tx);
}
```

## 实战经验总结

### 1. 永远用 bounded channel，除非你确信不会积压

无界 channel 是 OOM 的温床。bounded channel 提供天然背压，是系统稳定性的保障。

### 2. channel 容量调优靠 benchmark，不靠猜

从 `CPU 核数 × 2` 开始，用真实负载 benchmark 调优。容量太小导致吞吐下降，太大增加延迟和内存。

### 3. Rust channel 的所有权是特性，不是限制

Go 程序员初学 Rust 时常觉得 channel "不够灵活"——不能共享引用。但这正是 Rust 消除数据竞争的机制。用 `Arc` 包装需要共享的数据，而非传引用。

### 4. crossbeam 的 select 是同步世界的利器

如果你在做事件循环、多路复用、超时控制，`crossbeam::select!` 比手写 poll 循环简洁且正确得多。

### 5. 异步世界用 tokio::sync::mpsc，同步世界用 crossbeam

不要在 tokio 运行时中用 `std::sync::mpsc`——它的阻塞会浪费整个 worker thread。用 `tokio::sync::mpsc` 让 await point 正确让出。
