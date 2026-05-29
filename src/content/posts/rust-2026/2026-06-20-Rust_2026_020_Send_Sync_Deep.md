---
title: "Rust 2026 经验谈 - Send/Sync 深度理解"
published: 2026-06-20
description: "Send/Sync 自动 trait 机制、手动 impl 的场景与安全论证、Cell/RefCell 为何不 Send、跨线程安全传递模式、Negative impl。"
image: "/images/rust-2026/5.jpg"
tags: [Rust, Rust 2026, Send, Sync, 并发安全]
category: Rust
draft: false
lang: zh_CN
---

![并发与同步](/images/rust-2026/5.jpg)

Send 和 Sync 是 Rust 并发安全的基石——它们不是标记 trait 那么简单，而是编译器自动推导的"自动 trait"（auto trait），有着独特的语义和约束。深入理解 Send/Sync，是写出正确并发代码的前提，也是排查"future cannot be sent between threads safely"等错误的钥匙。

## Send/Sync 自动 trait 机制

### 定义回顾

```rust
pub unsafe trait Send {}
pub unsafe trait Sync {}
```

- `Send`：类型 T 的值可以安全地**转移所有权**到另一个线程
- `Sync`：类型 T 的值可以安全地被**多个线程同时引用**（`&T` 是 Send 的）

关键等价关系：**`T: Sync` 当且仅当 `&T: Send`**。

### 自动推导规则

编译器对 auto trait 的推导是**自动的、递归的、保守的**：

1. **自动**：如果一个类型的所有字段都满足 Send/Sync，则该类型自动满足
2. **递归**：推导会递归检查所有字段类型
3. **保守**：只要有一个字段不满足，整个类型就不满足

```rust
struct MyStruct {
    data: Vec<i32>,      // Send + Sync
    name: String,        // Send + Sync
}

// MyStruct 自动是 Send + Sync

struct NotSendStruct {
    data: Vec<i32>,      // Send + Sync
    rc: std::rc::Rc<i32>, // Send? 不是！
}

// NotSendStruct 自动不是 Send（因为 Rc 不是 Send）
// 但 NotSendStruct 是 Sync 吗？也不是，因为 Rc 不是 Sync
```

### 自动 trait 与普通 trait 的区别

| 维度 | 普通 trait | 自动 trait (Send/Sync) |
|------|-----------|----------------------|
| 实现 | 显式 `impl` | 编译器自动推导 |
| 否定 | 无内置否定机制 | 有 negative impl |
| 覆盖 | 显式 impl 覆盖自动推导 | 显式 impl 覆盖自动推导 |
| 泛型约束 | 显式 `where T: Trait` | 编译器自动检查 |
| 不可控 | 无 | 类型作者无法阻止用户 impl |

最后一条极其重要：**你无法阻止外部代码为你的类型 unsafe impl Send**。这是 unsafe 的语义——调用者承诺安全性。

### 推导示例

```rust
use std::sync::Arc;
use std::marker::PhantomData;

// 例 1：含 PhantomData 的推导
struct MyType<T> {
    _marker: PhantomData<T>,
    data: Vec<u8>,
}

// MyType<T>: Send 当且仅当 T: Send
// MyType<T>: Sync 当且仅当 T: Sync
// 因为 PhantomData<T> 的 Send/Sync 与 T 一致

// 例 2：裸指针的推导
struct WithRawPtr {
    ptr: *const i32,  // *const T 不是 Send 也不是 Sync
}

// WithRawPtr 自动不是 Send 也不是 Sync

// 例 3：Arc 的推导
// Arc<T>: Send 当且仅当 T: Send + Sync
// Arc<T>: Sync 当且仅当 T: Send + Sync
// 因为 Arc 的引用计数是原子操作（Send + Sync），
// 但内部的 T 需要能被多个线程访问（Sync）且能被发送（Send）
```

## 手动 impl Send/Sync 的场景与安全论证

### 场景一：封装内部同步

当你用内部同步机制保护数据时，即使内部字段不是 Send/Sync，整体可以是：

```rust
use std::sync::Mutex;
use std::rc::Rc;

struct ThreadSafeRc {
    inner: Mutex<Rc<i32>>,  // Rc 不是 Send 也不是 Sync
}

// 安全论证：
// 1. Rc 被锁在 Mutex 内部
// 2. 任何时刻只有一个线程能通过 lock() 访问 Rc
// 3. Rc 不会跨线程转移（在锁内使用）
// 4. 因此 ThreadSafeRc 可以安全地跨线程共享

unsafe impl Send for ThreadSafeRc {}
unsafe impl Sync for ThreadSafeRc {}
```

**论证检查清单**：
- [ ] 内部可变性是否被同步原语保护？
- [ ] 非线程安全数据是否只在持有锁时访问？
- [ ] 析构时是否安全？（不会在另一个线程正在使用时 drop）
- [ ] 是否有裸指针需要特别处理？

### 场景二：FFI 类型

C 库返回的不透明指针类型通常是线程安全的，但 Rust 编译器不知道：

```rust
use std::ffi::c_void;

// C 库声明的不透明类型
#[repr(C)]
pub struct FfiContext {
    _private: [u8; 0],
}

// C 库的函数声明
unsafe extern "C" {
    fn ffi_context_new() -> *mut FfiContext;
    fn ffi_context_process(ctx: *mut FfiContext, data: *const c_void, len: usize) -> i32;
    fn ffi_context_free(ctx: *mut FfiContext);
}

// 如果 C 库文档说 FfiContext 可以在多线程中使用：
unsafe impl Send for FfiContext {}
unsafe impl Sync for FfiContext {}

// 如果 C 库文档说 FfiContext 不是线程安全的：
// 什么都不 impl——保持非 Send 非 Sync
```

**安全论证原则**：
1. **以 C 库文档为准**——不看源码无法确定
2. **"可以跨线程调用"** → impl Send
3. **"可以同时在不同线程使用同一实例"** → impl Sync
4. **"每个线程使用独立实例"** → 只 impl Send，不 impl Sync
5. **"单线程使用"** → 什么都不 impl

### 场景三：零大小类型（ZST）标记

```rust
struct ThreadLocalMarker;

// ZST 不包含数据，转移是空操作
// 如果逻辑上这个标记只用于单线程，可以不 impl
// 如果逻辑上它可以跨线程（只是个标记），可以 impl：
unsafe impl Send for ThreadLocalMarker {}
unsafe impl Sync for ThreadLocalMarker {}
```

### 手动 impl 的常见错误

```rust
// 错误 1：为含 Rc 的类型盲目 impl Send
struct Bad {
    rc: std::rc::Rc<Vec<i32>>,
}
unsafe impl Send for Bad {}  // 未定义行为！Rc 的引用计数不是原子操作

// 错误 2：为含 Cell 的类型盲目 impl Sync
struct AlsoBad {
    cell: std::cell::Cell<i32>,
}
unsafe impl Sync for AlsoBad {}  // 未定义行为！Cell 无同步，多线程写入是数据竞争

// 正确的做法：用 Mutex 包装
struct Good {
    inner: Mutex<std::cell::Cell<i32>>,
}
unsafe impl Send for Good {}  // 安全：Cell 被锁保护
unsafe impl Sync for Good {}  // 安全：同上
```

## Cell/RefCell 为何不 Send 的本质

### Cell 不是 Sync

```rust
use std::cell::Cell;

// Cell<i32> 是 Send 但不是 Sync
// 为什么不是 Sync？
// 因为 Cell 允许通过 &Cell 进行修改（内部可变性）
// 如果 &Cell 可以跨线程共享（Sync），两个线程可以同时写入——数据竞争
```

核心原因：`Cell` 的 `set` 方法签名是 `fn set(&self, val: T)`——只需要共享引用就能修改。如果 `&Cell` 能跨线程共享，两个线程可以同时调用 `set`，产生数据竞争。

### RefCell 不是 Send（在含非 Send 内部类型时）也不是 Sync

```rust
use std::cell::RefCell;

// RefCell<T>: Send 当且仅当 T: Send
// RefCell<T>: 永远不是 Sync

// 不是 Sync 的原因与 Cell 类似：
// borrow_mut() 只需 &self，如果 &RefCell 跨线程共享，
// 两个线程可以同时 borrow_mut()——未定义行为
```

### 本质归纳

| 类型 | Send | Sync | 原因 |
|------|------|------|------|
| `Cell<T>` | T: Send 时 | 永远不是 | 内部可变性，共享引用可修改 |
| `RefCell<T>` | T: Send 时 | 永远不是 | 同上 + 运行时借用检查不是线程安全的 |
| `Rc<T>` | 永远不是 | 永远不是 | 引用计数非原子，跨线程增减会溢出/下溢 |
| `Mutex<T>` | T: Send 时 | T: Send 时 | 锁保护内部访问，但 MutexGuard 不是 Send |
| `RwLock<T>` | T: Send+Sync 时 | T: Send+Sync 时 | 同 Mutex |
| `Arc<T>` | T: Send+Sync 时 | T: Send+Sync 时 | 原子引用计数 + 内部 T 需要线程安全 |

**一句话总结**：`Cell`/`RefCell`/`Rc` 不 Sync（或不 Send）的本质是——它们的共享引用允许修改，但没有同步机制保护，多线程同时修改是数据竞争。

## 跨线程安全传递的模式

### 模式一：Arc\<Mutex\<T\>\> vs Arc\<T\> where T: Sync

这是 Rust 并发编程最核心的模式选择。

```rust
use std::sync::{Arc, Mutex};

// 模式 A：Arc<Mutex<T>>——需要修改
let shared_data: Arc<Mutex<Vec<i32>>> = Arc::new(Mutex::new(vec![]));

// 多个线程修改同一数据
let mut handles = vec![];
for i in 0..4 {
    let data = shared_data.clone();
    handles.push(std::thread::spawn(move || {
        let mut guard = data.lock().unwrap();
        guard.push(i);
    }));
}

// 模式 B：Arc<T> where T: Sync——只读共享
let shared_config: Arc<Vec<String>> = Arc::new(vec![
    "config1".to_owned(),
    "config2".to_owned(),
]);

// 多个线程只读同一数据
for i in 0..4 {
    let config = shared_config.clone();
    std::thread::spawn(move || {
        // 无需加锁，直接读取
        println!("线程 {i} 读取: {:?}", *config);
    });
}
```

### 何时用哪个

| 场景 | 选择 | 原因 |
|------|------|------|
| 多线程读写 | `Arc<Mutex<T>>` | Mutex 保证互斥访问 |
| 多线程只读 | `Arc<T>` (T: Sync) | 无锁，零开销共享 |
| 读多写少 | `Arc<RwLock<T>>` | 读并行，写互斥 |
| 分片数据 | `Arc<[Mutex<T>; N]>` | 减少锁竞争 |
| 无需共享 | 消息传递 (channel) | 无锁，更清晰 |

### 模式二：Scoped Threads（Rust 1.63+）

```rust
use std::thread;

fn parallel_process(data: &[i32]) -> Vec<i32> {
    let mut results = vec![0; data.len()];

    thread::scope(|s| {
        // 分片处理，无需 Arc
        let chunk_size = (data.len() + 3) / 4;
        for (i, chunk) in data.chunks(chunk_size).enumerate() {
            let result_slice = &mut results[i * chunk_size..][..chunk.len()];
            s.spawn(move || {
                for (j, &val) in chunk.iter().enumerate() {
                    result_slice[j] = val * 2;
                }
            });
        }
    });

    results
}
```

`thread::scope` 的优势：无需 `Arc`，无需 `'static`，借用可以在 scope 内跨线程。编译器保证所有线程在 scope 结束前 join，所以借用安全。

### 模式三：Arc + DashMap

```rust
use dashmap::DashMap;
use std::sync::Arc;

fn concurrent_map() {
    let map: Arc<DashMap<String, i32>> = Arc::new(DashMap::new());

    // DashMap 内部分片，减少锁竞争
    let mut handles = vec![];
    for i in 0..8 {
        let map = map.clone();
        handles.push(std::thread::spawn(move || {
            map.insert(format!("key-{i}"), i);
            if let Some(v) = map.get(&format!("key-{}", i % 4)) {
                println!("读取: {}", *v);
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
}
```

`DashMap` 是 `HashMap` 的并发版本，内部分成 N 个 shard（每个 shard 一个 `RwLock`），比 `Arc<Mutex<HashMap>>` 的并发度高得多。

### 模式四：OnceLock / Once（Rust 1.70+）

```rust
use std::sync::OnceLock;
use std::sync::Arc;

static GLOBAL_CONFIG: OnceLock<Arc<Config>> = OnceLock::new();

struct Config {
    db_url: String,
    max_connections: usize,
}

fn get_config() -> &'static Arc<Config> {
    GLOBAL_CONFIG.get_or_init(|| {
        Arc::new(Config {
            db_url: "postgres://localhost".to_owned(),
            max_connections: 10,
        })
    })
}

// 任何线程调用 get_config() 都是安全的
// 第一次调用初始化，后续调用返回已有值
```

`OnceLock` 是 Rust 1.70 稳定的"初始化一次，读取多次"模式，比 `lazy_static!` 更轻量、更标准。

## Negative impl（Nightly）

### 问题：阻止 auto trait 的自动推导

auto trait 的自动推导是"全有或全无"的——如果所有字段都满足，类型就自动满足。但有时你需要一个类型**明确不满足**某个 auto trait，即使其字段都满足：

```rust
// nightly-only
#![feature(negative_impls)]

// 即使 i32 是 Send + Sync，这个类型明确不是
struct LocalOnly(i32);

impl !Send for LocalOnly {}
impl !Sync for LocalOnly {}
```

### 为什么需要 negative impl

没有 negative impl 时，阻止 Send 推导的唯一方式是包含一个非 Send 字段：

```rust
// stable 上的做法：用 PhantomData<*Rc<()>> 阻止 Send
use std::marker::PhantomData;

struct LocalOnly {
    data: i32,
    _not_send: PhantomData<*const ()>,  // *const () 不是 Send
}
// LocalOnly 自动不是 Send

// 问题：LocalOnly 也不是 Sync（因为 *const () 也不是 Sync）
// 如果你想 LocalOnly 是 Sync 但不是 Send，stable 上做不到
```

```rust
// nightly：精确控制
#![feature(negative_impls)]

struct LocalOnly {
    data: i32,
}

impl !Send for LocalOnly {}
// LocalOnly 不是 Send
// 但 LocalOnly 是 Sync（因为 i32 是 Sync，且没有 negative impl !Sync）
```

### negative impl 的应用场景

1. **线程局部类型**：明确标记只能在当前线程使用
2. **FFI 类型**：精确控制哪些 trait 不满足
3. **防止意外 Send**：库作者确保类型不会跨线程，即使用户 unsafe impl 也不行（negative impl 无法被覆盖）
4. **文档意图**：比 `PhantomData<*const ()>` 更清晰地表达"不是 Send"

### 当前状态（2026 年）

negative impl 仍在 nightly，RFC 3397 已被接受但实现和稳定化进展缓慢。**生产环境使用 `PhantomData<*const ()>` 或 `PhantomData<Rc<()>>` 作为权宜方案**：

```rust
use std::marker::PhantomData;

// 阻止 Send + Sync
struct NotSendNotSync {
    _marker: PhantomData<*const ()>,
}

// 阻止 Send 但允许 Sync（用 Cell，Cell 是 Send 但不是 Sync... 不对）
// 实际上 stable 上无法做到"不是 Send 但是 Sync"
// 只能用 PhantomData<*const ()> 同时阻止两者
```

## Send/Sync 与泛型约束

### 正确的泛型约束写法

```rust
use std::sync::Arc;

// 约束太松：可能编译失败
fn spawn_task<T>(data: Arc<T>) {
    // tokio::spawn 要求 Future 是 Send
    // 但 Arc<T> 的 Send 需要 T: Send + Sync
    // 如果 T 只满足 Send 但不满足 Sync，这里会出错
}

// 约束精确
fn spawn_task_correct<T: Send + Sync + 'static>(data: Arc<T>) {
    tokio::spawn(async move {
        // 现在 Arc<T> 确定是 Send
        let _ = &*data;
    });
}

// 另一种模式：不需要 Arc，直接传 T
fn spawn_with_value<T: Send + 'static>(data: T) {
    tokio::spawn(async move {
        // T 转移到新线程，只需 Send
        let _ = &data;
    });
}
```

### Arc\<T\> 的 Send/Sync 推导规则

```
Arc<T>: Send  ⟺  T: Send + Sync
Arc<T>: Sync  ⟺  T: Send + Sync
```

为什么 `Arc<T>: Send` 需要 `T: Sync`？因为把 `Arc<T>` 发送到另一个线程后，两个线程可能同时持有 `&T`（通过 `Deref`），这需要 `T: Sync`。

这个推导规则导致了一个常见陷阱：

```rust
// 想在多线程间共享 Mutex<T>
// Arc<Mutex<T>> 需要 T: Send + Sync
// 但 Mutex<T>: Send + Sync 只需要 T: Send
// 所以 Arc<Mutex<T>> 只需要 T: Send（不需要 T: Sync）

// 这是因为 Mutex 内部保护了 T 的访问
// 即使 T 不是 Sync，Mutex<T> 也是 Sync（因为锁保证了互斥访问）

// 但如果 T 含非 Send 字段（如 Rc），Arc<Mutex<T>> 也不行
```

## 实战经验总结

### 1. 先理解，再 unsafe impl

每次写 `unsafe impl Send` 或 `unsafe impl Sync` 之前，写一段注释论证安全性：

```rust
// SAFETY: FfiContext 被互斥锁保护，所有访问都通过 lock() 进行。
// C 库文档（v2.3 §4.1）明确 FfiContext 是线程安全的。
// Rc 被封装在 Mutex 内部，不会跨线程转移。
unsafe impl Send for MyWrapper {}
unsafe impl Sync for MyWrapper {}
```

### 2. 用 trait bound 表达约束，而非在运行时检查

```rust
// 好：编译时检查
fn process<T: Send>(data: T) { ... }

// 坏：运行时检查（且不可能实现——Send 没有运行时表示）
fn process(data: impl Any) {
    if !data.is::<Send>() { panic!("not send"); } // 不可能
}
```

### 3. 含裸指针的类型默认不是 Send/Sync——这是正确的

编译器对 `*const T` / `*mut T` 的保守态度是合理的。裸指针的别名和生命周期没有编译器保护，自动推导为非 Send/Sync 避免了大量未定义行为。

### 4. PhantomData 是表达"逻辑上包含但不物理上包含"的工具

```rust
use std::marker::PhantomData;

// 逻辑上持有 T 的引用，但不实际存储
struct Observer<T> {
    _ref: PhantomData<&'static T>,
    id: usize,
}
// Observer<T>: Send 当且仅当 T: Sync（因为 &T 是 Send 当且仅当 T: Sync）
```

### 5. 用 thread::scope 替代 Arc + 'static

如果你的并发任务不需要超过当前函数的生命周期，`thread::scope` 比 `Arc` 更简洁、更高效。
