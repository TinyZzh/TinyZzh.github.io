---
title: "Rust 2026 经验谈 - async/await 底层机制"
published: 2026-06-14
description: "Future trait 详解、pinning 心智模型、poll 语义与状态转换、编译器生成的状态机反编译查看、与 goroutine/green thread 的对比。"
image: "/images/rust-2026/4.jpg"
tags: [Rust, Rust 2026, async, Future, pinning, 状态机]
category: Rust
draft: false
lang: zh_CN
---

![异步 Rust 深度实践](/images/rust-2026/4.jpg)

`async fn` 和 `.await` 在语法层面简洁优雅，但底层是一个编译器生成的状态机——不理解它就无法理解性能特征、Pin 的必要性、以及为什么 async Rust 和其他语言的并发模型根本不同。本文将从 Future trait 的原始接口开始，一层层拆解 async/await 的底层机制。

## Future trait 详解

### 原始定义

```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),    // 完成，返回结果
    Pending,     // 未完成，稍后再 poll
}
```

这就是全部。没有线程、没有事件循环、没有魔法——Future 只是一个可以被重复 poll 的状态机。

### poll 的语义

`poll` 的核心契约：

1. **`poll` 返回 `Pending` 时，Future 必须安排自己将来被重新唤醒**——通过 `cx.waker()` 注册唤醒器
2. **`poll` 返回 `Ready` 后，不应再被 poll**——这是 Future 的终结状态
3. **`poll` 是非阻塞的**——如果操作没就绪，立即返回 `Pending`，而非阻塞等待

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct TimerFuture {
    shared_state: Arc<Mutex<TimerSharedState>>,
}

struct TimerSharedState {
    completed: bool,
    waker: Option<Waker>,
}

impl Future for TimerFuture {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut shared_state = self.shared_state.lock().unwrap();

        if shared_state.completed {
            Poll::Ready(())
        } else {
            // 注册 waker：定时器触发时会调用 waker.wake()
            shared_state.waker = Some(cx.waker().clone());
            Poll::Pending
        }
    }
}
```

### Context 与 Waker

`Context` 本质上是 `Waker` 的容器。`Waker` 是执行者（executor）提供的回调——当 IO 就绪或定时器到期时，执行者通过它知道"这个 Future 需要再 poll 一次"。

```rust
// Waker 的核心方法
impl Waker {
    fn wake(self);         // 消费 self，通知执行者
    fn wake_by_ref(&self); // 不消费 self 的版本
}
```

**Waker 是连接 Future 和执行者的桥梁**——Future 不知道谁在执行它，只知道通过 Waker 说"我准备好了"。

### 手写 Future 的实际场景

大多数时候你不需要手写 Future——`async fn` 会自动生成。但在以下场景需要手写：

1. **性能优化**：避免 async fn 生成的状态机开销（比如零拷贝 IO）
2. **FFI 集成**：把 C 的回调包装成 Future
3. **无法用 async fn 表达的模式**：比如需要在多个 waker 之间协调

```rust
// 实际案例：把 C 的 IO 完成回调包装成 Future
struct IoFuture {
    fd: RawFd,
    registered: bool,
}

impl Future for IoFuture {
    type Output = io::Result<Vec<u8>>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if !self.registered {
            // 把 cx.waker() 注册到 epoll/io_uring
            EPOLL.register(self.fd, cx.waker().clone());
            self.registered = true;
            return Poll::Pending;
        }

        match EPOLL.try_read(self.fd) {
            Ok(data) => Poll::Ready(Ok(data)),
            Err(e) if e.kind() == io::ErrorKind::WouldBlock => {
                // 还没就绪，更新 waker（可能 Context 变了）
                EPOLL.update_waker(self.fd, cx.waker().clone());
                Poll::Pending
            }
            Err(e) => Poll::Ready(Err(e)),
        }
    }
}
```

## Pinning 心智模型

`Pin` 是 async Rust 中最让人困惑的概念——但它解决的是一个真实的安全问题。

### 问题的根源

async fn 生成的 Future 内部可能包含**自引用**：

```rust
async fn example() {
    let data = vec![1, 2, 3];
    let reference = &data;  // reference 指向 data
    sleep(Duration::from_secs(1)).await;  // .await 可能导致 Future 被移动
    println!("{:?}", reference);  // 如果 Future 被移动了，reference 就悬垂了！
}
```

如果这个 Future 在 `.await` 期间被移动到另一个内存地址，`reference` 就会指向旧地址——经典的 use-after-free。

**Pin 的作用：保证被 Pin 住的值不会被移动。**

### Structural Pin vs Unstructural Pin

**Structural Pinning**（结构化固定）：

`Pin<&mut T>` 保证 `T` 不会被移动。如果 `T` 内部有 `Pin<&mut U>` 字段，那么 `U` 也不会被移动——这是"结构化"的传递性。

```rust
// 编译器为 async fn 生成的 Future 是 structural pin 的
// 你不能通过 Pin<&mut AsyncFuture> 获取 &mut 内部字段
// 除非那个字段也实现了 Unpin
```

**Unstructural Pinning**（非结构化固定）：

`Unpin` 标记的类型可以在 `Pin` 内安全移动——因为它们不包含自引用。

```rust
// 大多数类型是 Unpin 的
// i32, String, Vec<T>, HashMap<K, V> 都是 Unpin
// 只有编译器生成的 async Future 可能不是 Unpin

fn demo_unpin<T: Unpin>(pin: Pin<&mut T>) {
    // Unpin 类型可以安全地从 Pin 中取出
    let inner: &mut T = pin.get_mut();  // 安全！
}
```

### 为什么 async fn 需要 Pin

```rust
// Future::poll 的签名
fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
```

`self: Pin<&mut Self>` 而非 `self: &mut Self`——poll 接受的是 **Pin 住的可变引用**，因为：

1. poll 可能被多次调用，Future 必须留在同一个地址
2. Future 内部可能有自引用，移动会破坏它们
3. 执行者（executor）在 spawn 时把 Future 放在堆上，地址固定

### 实战：何时需要关心 Pin

**99% 的情况下你不需要手动处理 Pin。** 你需要关心的场景：

1. **手写 Future**：`poll` 的 `self` 类型是 `Pin<&mut Self>`
2. **在 struct 中存储 async fn 返回的 Future**：

```rust
use std::pin::Pin;
use std::future::Future;

// 错误：不能存储 !Unpin 的 Future 在 struct 中并安全地 poll 它
// struct Task<F: Future> {
//     future: F,  // 如果 F 是 !Unpin，我们不能安全地 get &mut F
// }

// 正确：用 Pin 包装
struct Task<F: Future> {
    future: Pin<Box<F>>,  // Box 保证了固定地址
}
```

3. **实现 Future 组合子**（select、join 等）——需要理解 structural pinning 的安全保证

### Pin 的速查心智模型

- `Pin` = "这个值不能被移动"
- `Unpin` = "这个值移动也无所谓"（大多数类型）
- `async fn` 生成的 Future 可能 `!Unpin`（因为自引用）
- `Pin<Box<T>>` = 堆上分配，地址永远不变
- `Pin<&mut T>` = 栈上的引用，承诺不移动

## Poll 语义与状态转换

Future 的生命周期就是一系列 poll 调用，每次调用对应一个状态转换。

### 状态机视角

```
[初始状态] --poll--> Pending  (注册 waker)
    |                        |
    | (waker 被唤醒)          |
    v                        v
[等待中] --poll--> Pending (更新 waker) 或 Ready(T)
```

关键理解：**从 Pending 到 Ready 的转换，一定是由外部事件（IO 就绪、定时器到期）触发 waker，导致执行者再次 poll。** Future 自己不会"醒来"——它只是被动地被 poll。

### 一个完整的状态机示例

```rust
// async fn read_and_process() -> Result<()> {
//     let data = read_socket().await?;  // 状态 0 → 1
//     let result = process(data).await?; // 状态 1 → 2
//     write_response(result).await?;     // 状态 2 → 3
//     Ok(())                              // 状态 3 (Ready)
// }
```

编译器生成的状态机大致等价于：

```rust
enum ReadAndProcessFuture {
    State0,                          // 初始，准备调用 read_socket
    State1(Data),                    // read_socket 完成，准备 process
    State2(Result),                  // process 完成，准备 write
    State3,                          // 完成（或用 Ready 终结）
}

impl Future for ReadAndProcessFuture {
    type Output = Result<()>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        loop {
            match self.as_mut().get_mut() {
                State0 => {
                    match read_socket().as_mut().poll(cx) {
                        Poll::Ready(data) => *self = State1(data),
                        Poll::Pending => return Poll::Pending,
                    }
                }
                State1(data) => {
                    match process(data).as_mut().poll(cx) {
                        Poll::Ready(result) => *self = State2(result),
                        Poll::Pending => return Poll::Pending,
                    }
                }
                State2(result) => {
                    match write_response(result).as_mut().poll(cx) {
                        Poll::Ready(Ok(())) => return Poll::Ready(Ok(())),
                        Poll::Ready(Err(e)) => return Poll::Ready(Err(e)),
                        Poll::Pending => return Poll::Pending,
                    }
                }
                _ => unreachable!(),
            }
        }
    }
}
```

每个 `.await` 点是一个状态转换——这也是为什么 async fn 的大小与 `.await` 点数量相关。

## 编译器生成的状态机反编译查看

理解底层机制的最好方式是看编译器实际生成了什么。

### 方法 1：cargo-expand 展开宏

```bash
cargo install cargo-expand
cargo expand
```

这会展开所有宏，包括 async fn 转换后的代码。但 async fn 的生成器（generator）转换发生在更早的编译阶段，cargo-expand 看不到完整的状态机。

### 方法 2：查看 MIR / LLVM IR

```bash
# 查看 MIR（Mid-level IR）——最接近状态机结构
# 需要 nightly 工具链
cargo +nightly rustc -- -Z dump-mir=all

# 输出在 target/mir/ 目录下
# 找到你的 async fn 对应的 MIR 文件
```

MIR 中你会看到：
- 每个 `.await` 点对应一个 `SwitchInt`（状态分支）
- 每个 `Resume` 点对应一个 poll 调用
- 局部变量跨 `.await` 点时被存储在状态机的"保存槽"中

### 方法 3：用 rustc 反编译

```bash
# 查看 LLVM IR（需要 nightly）
rustc +nightly --edition 2024 -Z llvm-ir=my_function.ll src/main.rs

# 或查看汇编
rustc --edition 2024 --emit=asm src/main.rs
```

### 实际例子：简单 async fn 的状态机大小

```rust
async fn simple() {
    let a = 1;
    let b = 2;
    println!("{}", a + b);
}

async fn with_await() {
    let a = expensive_computation();  // a 必须跨 .await 保存
    sleep(Duration::from_secs(1)).await;
    println!("{}", a);  // 使用保存的 a
}

fn main() {
    let f1 = simple();
    println!("simple: {} bytes", std::mem::size_of_val(&f1));  // 0 或很小
    let f2 = with_await();
    println!("with_await: {} bytes", std::mem::size_of_val(&f2));  // 包含 a + 状态 + waker
}
```

**经验：Future 的大小取决于跨 `.await` 点存活的变量。** 如果一个大 `Vec` 跨 `.await` 存活，它会被直接嵌入状态机中——Future 的 `size_of` 会很大。

```rust
// 反模式：大对象跨 .await 存活
async fn bad() {
    let big_buffer = vec![0u8; 1024 * 1024];  // 1MB
    write_socket(&big_buffer).await;  // 整个 Future 至少 1MB！
}

// 正确：用 Arc 共享
async fn good() {
    let big_buffer = Arc::new(vec![0u8; 1024 * 1024]);  // Arc 只占 8 字节
    write_socket(&big_buffer).await;  // Future 很小
}
```

## 与 goroutine / green thread 的对比

这是理解 Rust async 设计哲学的关键——Rust 选择了与 Go 完全不同的路径。

### 模型对比

| 维度 | Rust async/await | Go goroutine | Java virtual thread |
|------|-----------------|--------------|-------------------|
| 抽象单元 | Future（状态机） | goroutine（栈） | virtual thread（栈） |
| 内存模型 | 堆分配的状态机 | 栈（2KB 起始，动态增长） | 栈（动态） |
| 调度方式 | 协作式（poll） | 抢占式（preemption） | 抢占式 |
| 上下文切换 | 无（只是函数调用） | 保存/恢复寄存器 | 保存/恢复寄存器 |
| 创建成本 | ~分配状态机大小 | ~2KB 栈分配 | ~几百字节 |
| 数量级 | 百万级 | 百万级 | 百万级 |

### Rust 的选择：零成本抽象

Rust 的 async 设计目标是**零成本**——你不使用 async 时，没有运行时开销；你使用时，开销精确等于你写的代码所需的最小开销。

这意味着：
- **没有隐式运行时**：Go 有 runtime，Rust 需要 tokio/async-std 等显式引入
- **没有隐式调度**：Go 的 goroutine 被自动调度，Rust 的 Future 需要被显式 spawn
- **协作式调度**：Go 在任意点可以抢占，Rust 只在 `.await` 点让出控制权

### "协作式"的后果

```rust
// 反模式：CPU 密集型工作不 yield，阻塞整个线程
async fn cpu_intensive() {
    let mut sum = 0u64;
    for i in 0..1_000_000_000 {
        sum += i;  // 没有 .await，不会让出！
    }
}

// 正确：用 spawn_blocking 或手动 yield
async fn cpu_intensive() {
    tokio::task::spawn_blocking(move || {
        let mut sum = 0u64;
        for i in 0..1_000_000_000 {
            sum += i;
        }
        sum
    }).await
}
```

在 Go 中，上面的循环会被抢占调度器自动中断——其他 goroutine 不受影响。在 Rust 中，这个循环会独占 worker thread，直到 `.await` 点才让出。

### Rust 的优势：精确控制

Rust 付出"需要手动管理"的代价，换来的是：

1. **可预测的延迟**：没有 GC 停顿、没有调度器抢占、没有隐式栈增长
2. **零运行时**：可以在内核、嵌入式、WASM 中使用——Go runtime 做不到
3. **自定义执行者**：可以根据场景选择 tokio、async-std、smol、或自己写
4. **编译期优化**：状态机的大小在编译期确定，没有运行时动态分配

### 选择建议

- **IO 密集型服务端**：Rust async 和 Go goroutine 都好，Go 更简单，Rust 更可控
- **低延迟系统**：Rust async 的可预测性是优势
- **嵌入式 / WASM / 内核**：只有 Rust async 可行（零运行时）
- **快速原型**：Go goroutine 的心智负担更低

## 实战经验总结

1. **Future 就是状态机**：poll 是驱动它的唯一方式，waker 是它联系执行者的唯一桥梁
2. **Pin 解决自引用安全**：99% 时候不需要手动处理，理解 `Unpin` 边界即可
3. **Future 大小 = 跨 .await 存活的变量之和**：大对象用 Arc 共享，不要嵌入状态机
4. **协作式调度意味着你必须显式 yield**：CPU 密集型工作用 spawn_blocking
5. **手写 Future 是高级技能**：只在性能关键路径和 FFI 集成时需要
6. **Rust async ≠ Go goroutine**：零成本抽象的代价是需要手动管理，但换来精确控制
