---
title: "Rust 2026 经验谈 - 共享状态并发实战"
published: 2026-06-23
description: "Mutex vs RwLock 选型、parking_lot 性能优势、lock ordering 防死锁、Arc 内部机制与优化、并发缓存设计实战。"
image: "/images/rust-2026/5.jpg"
tags: [Rust, Rust 2026, Mutex, RwLock, Arc, 并发]
category: Rust
draft: false
lang: zh_CN
---

![并发与同步](/images/rust-2026/5.jpg)

共享状态并发是"通过共享内存来通信"的范式——与 channel 的"通过通信来共享内存"相对。Rust 用 `Mutex`/`RwLock`/`Arc` 三件套确保共享状态的安全访问。本文从选型策略、性能优化、死锁防护到实际场景，系统总结共享状态并发的实战经验。

## Mutex vs RwLock 选型策略

### 核心区别

```rust
use std::sync::{Mutex, RwLock};

// Mutex：同一时刻只有一个线程能访问（无论读写）
let mutex_data: Mutex<Vec<i32>> = Mutex::new(vec![]);
{
    let mut guard = mutex_data.lock().unwrap();
    guard.push(42);  // 独占访问，无论读还是写
}

// RwLock：允许多个读者同时访问，或一个写者独占
let rwlock_data: RwLock<Vec<i32>> = RwLock::new(vec![]);
{
    let guard = rwlock_data.read().unwrap();  // 共享读
    println!("长度: {}", guard.len());
}
{
    let mut guard = rwlock_data.write().unwrap();  // 独占写
    guard.push(42);
}
```

### 选型决策

| 场景 | 推荐 | 原因 |
|------|------|------|
| 读多写少（读 ≥ 80%） | `RwLock` | 读并行，吞吐高 |
| 写多或读写相当 | `Mutex` | RwLock 开销更大 |
| 持锁时间极短 | `Mutex` | RwLock 的 read/write 比锁/解锁开销大 |
| 持锁时间长（读） | `RwLock` | 并行读的收益能覆盖开销 |
| 需要可变引用 | `Mutex` | Mutex 的 lock 返回 `MutexGuard` 可 DerefMut |
| 嵌套锁 | `Mutex` | RwLock 嵌套更容易死锁 |

### RwLock 的隐性成本

```rust
use std::sync::RwLock;

let data: RwLock<Vec<i32>> = RwLock::new(vec![]);

// RwLock 内部需要维护读者计数
// 每次 read()：原子 fetch_add（读者计数 +1）
// 每次 drop(read_guard)：原子 fetch_sub（读者计数 -1）
// 写者需要等待读者计数归零

// 而 Mutex 只需一次原子操作
```

**实测**：在短持锁场景（< 100ns）下，`Mutex` 比 `RwLock` 快 2-3 倍，因为 RwLock 的读者计数管理有额外开销。只有在持锁时间较长且读比例高时，RwLock 才有优势。

### 踩坑：RwLock 写者饥饿

```rust
use std::sync::RwLock;
use std::thread;

let data: RwLock<Vec<i32>> = RwLock::new(vec![]);

// 如果读者源源不断，写者可能永远等不到锁
// std::sync::RwLock 的策略：优先唤醒读者
// 这导致"写者饥饿"——写者等待时间无限增长
```

**解决方案**：
1. 用 `parking_lot::RwLock`（写者优先策略）
2. 限制读者持锁时间
3. 用 `Mutex` 替代（如果写操作足够频繁）

## parking_lot 性能优势与替换方法

### 为什么 parking_lot 更快

`parking_lot` 是 Rust 社区的高性能同步原语库，由 Amanieu d'Antras 开发。其核心优势：

| 维度 | std::sync | parking_lot |
|------|-----------|-------------|
| Mutex 实现 | OS futex（系统调用） | 自适应自旋 + futex |
| RwLock 策略 | 读者优先 | 可配置（写者优先/读者优先） |
| 内存占用 | 每个锁一个 OS 对象 | 仅 1 字节（未竞争时） |
| 首次锁 | 系统调用初始化 | 零初始化 |
| ReentrantMutex | 不提供 | 提供 |
| 死锁检测 | 无 | 可启用 |

### 替换方法

```toml
[dependencies]
parking_lot = "0.12"
```

```rust
// 替换前
use std::sync::{Mutex, RwLock, Arc};

// 替换后
use parking_lot::{Mutex, RwLock, Arc};  // parking_lot 也重导出了 Arc
// 或者更精确：
use parking_lot::{Mutex, RwLock};
use std::sync::Arc;
```

**关键差异**：parking_lot 的 `Mutex::lock()` 返回 `MutexGuard` 但**不会返回 Result**——因为它不使用 OS 的 poison 机制。

```rust
use parking_lot::Mutex;

let data = Mutex::new(vec![1, 2, 3]);

// parking_lot: lock() 直接返回 guard，不是 Result
let mut guard = data.lock();
guard.push(4);

// std: lock() 返回 Result，因为持锁期间 panic 会"毒化"锁
use std::sync::Mutex as StdMutex;
let std_data = StdMutex::new(vec![1, 2, 3]);
let mut std_guard = std_data.lock().unwrap();  // 需要 unwrap
```

### parking_lot 的 RwLock 策略选择

```rust
use parking_lot::{RwLock, RwLockReadGuard, RwLockWriteGuard};

let data: RwLock<Vec<i32>> = RwLock::new(vec![]);

// 默认：公平策略（写者优先避免饥饿）
let read_guard = data.read();
let write_guard = data.write();
```

parking_lot 的 RwLock 默认就是写者优先，这比 std 的读者优先更合理——写者通常需要尽快完成，避免读者读到过期数据。

### 全局 feature-flag 替换

如果你想在整个项目中替换 std 的锁，可以用 parking_lot 的 feature flag：

```toml
[dependencies]
parking_lot = { version = "0.12", features = ["deadlock_detection"] }
```

在 debug 模式下启用死锁检测，release 模式下禁用：

```toml
[target.'cfg(debug_assertions)'.dependencies]
parking_lot = { version = "0.12", features = ["deadlock_detection"] }

[target.'cfg(not(debug_assertions))'.dependencies]
parking_lot = "0.12"
```

## lock ordering 防死锁策略

### 死锁的四个必要条件

1. 互斥：锁同时只能被一个线程持有
2. 持有并等待：线程持有锁的同时等待另一个锁
3. 不可抢占：锁不能被强制释放
4. 循环等待：线程间形成环形等待

打破第 4 条（循环等待）是最实用的策略——**全局锁顺序**。

### 策略一：层级锁（Lock Hierarchy）

给每个锁分配一个层级号，规定**只能从低层锁向高层锁请求**：

```rust
use std::sync::Mutex;

struct LayeredLocks {
    // 层级 0：最底层，先锁
    config: Mutex<Config>,
    // 层级 1：中间层
    cache: Mutex<Cache>,
    // 层级 2：最顶层，最后锁
    stats: Mutex<Stats>,
}

struct Config { max_size: usize }
struct Cache { entries: Vec<String> }
struct Stats { hits: usize, misses: usize }

impl LayeredLocks {
    fn update_cache(&self, key: String) {
        // 正确：config(0) → cache(1) → stats(2)，层级递增
        let config = self.config.lock().unwrap();
        let mut cache = self.cache.lock().unwrap();
        let mut stats = self.stats.lock().unwrap();

        if config.max_size > cache.entries.len() {
            cache.entries.push(key);
            stats.hits += 1;
        } else {
            stats.misses += 1;
        }
    }

    // fn bad_order(&self) {
    //     // 错误：stats(2) → config(0)，层级递减！
    //     let stats = self.stats.lock().unwrap();
    //     let config = self.config.lock().unwrap(); // 可能死锁
    // }
}
```

**编译期强制**：用类型系统防止层级违反：

```rust
use std::sync::Mutex;
use std::marker::PhantomData;

struct LockLevel<const N: u8>;

struct HierarchicalLock<T, const N: u8> {
    inner: Mutex<T>,
    _level: PhantomData<LockLevel<N>>,
}

impl<T, const N: u8> HierarchicalLock<T, N> {
    fn new(data: T) -> Self {
        Self {
            inner: Mutex::new(data),
            _level: PhantomData,
        }
    }

    fn lock(&self) -> (std::sync::MutexGuard<'_, T>, u8) {
        // 返回 guard 和层级号，供运行时检查
        (self.inner.lock().unwrap(), N)
    }
}

// 使用
struct App {
    level0: HierarchicalLock<Config, 0>,
    level1: HierarchicalLock<Cache, 1>,
    level2: HierarchicalLock<Stats, 2>,
}
```

### 策略二：try_lock 超时

```rust
use std::sync::Mutex;
use std::time::{Duration, Instant};

fn try_lock_with_timeout<'a, T>(
    lock: &'a Mutex<T>,
    timeout: Duration,
) -> Option<std::sync::MutexGuard<'a, T>> {
    let start = Instant::now();
    loop {
        match lock.try_lock() {
            Ok(guard) => return Some(guard),
            Err(std::sync::TryLockError::WouldBlock) => {
                if start.elapsed() > timeout {
                    return None; // 超时
                }
                std::hint::spin_loop();
            }
            Err(std::sync::TryLockError::Poisoned(_)) => {
                // 锁被毒化，决定是否继续
                return lock.lock().ok();
            }
        }
    }
}
```

### 策略三：最小持锁范围

```rust
use std::sync::Mutex;

let data = Mutex::new(vec![]);

// 坏：持锁时间过长
{
    let mut guard = data.lock().unwrap();
    for i in 0..1000 {
        guard.push(i);  // 1000 次 push 都在锁内
    }
    let result = expensive_computation();  // 不需要锁的计算也在锁内！
    guard.push(result);
}

// 好：缩短持锁范围
{
    let result = expensive_computation();  // 先在锁外计算
    let mut guard = data.lock().unwrap();
    for i in 0..1000 {
        guard.push(i);
    }
    guard.push(result);
    // guard 在这里 drop，释放锁
}
```

**经验法则**：锁内只做数据结构的读写操作，不做计算、IO、其他锁的获取。

## Arc 内部机制与优化

### Arc vs Rc

```rust
use std::sync::Arc;
use std::rc::Rc;

// Rc：单线程引用计数，非原子操作
let rc: Rc<Vec<i32>> = Rc::new(vec![1, 2, 3]);
let rc2 = rc.clone();  // 非原子 fetch_add，快但不能跨线程

// Arc：多线程引用计数，原子操作
let arc: Arc<Vec<i32>> = Arc::new(vec![1, 2, 3]);
let arc2 = arc.clone();  // 原子 fetch_add，略慢但线程安全
```

### Arc 的内部结构

```
Arc<T> 的内存布局：

┌─────────────────┐
│  ArcInner<T>    │
├─────────────────┤
│  strong: AtomicUsize  │  ← 强引用计数
│  weak: AtomicUsize    │  ← 弱引用计数
│  data: T              │  ← 实际数据
└─────────────────┘
     ↑
     │  裸指针
  Arc<T>
```

`Arc::clone()` 做一次 `AtomicUsize::fetch_add(1, Relaxed)`——Relaxed 足矣，因为计数只做"是否为零"的判断，不需要同步数据。

### Arc::get_mut：零开销的"如果唯一引用则可变"

```rust
use std::sync::Arc;

let mut arc: Arc<Vec<i32>> = Arc::new(vec![1, 2, 3]);

// 如果只有一个 Arc 指向数据，直接获取可变引用（无需锁）
if let Some(data) = Arc::get_mut(&mut arc) {
    data.push(4);  // 直接修改，无原子操作
    println!("唯一引用，直接修改: {:?}", data);
}

// 如果有多个 Arc，get_mut 返回 None
let arc2 = arc.clone();
assert!(Arc::get_mut(&mut arc).is_none());
```

**使用场景**：当你需要在"单线程阶段"修改数据，之后"发布"到多线程。

```rust
use std::sync::Arc;

fn build_then_share() -> Arc<Vec<String>> {
    let mut data = Arc::new(Vec::with_capacity(1000));

    // 构建阶段：单线程，用 get_mut 避免原子开销
    if let Some(vec) = Arc::get_mut(&mut data) {
        for i in 0..1000 {
            vec.push(format!("item-{i}"));
        }
    }

    // 发布阶段：Arc 被克隆到多线程
    data
}
```

### Weak 引用：打破循环与缓存

```rust
use std::sync::{Arc, Weak};
use std::collections::HashMap;

struct CacheEntry {
    key: String,
    data: Vec<u8>,
}

struct Cache {
    entries: HashMap<String, Weak<CacheEntry>>,
}

impl Cache {
    fn get(&mut self, key: &str) -> Option<Arc<CacheEntry>> {
        if let Some(weak) = self.entries.get(key) {
            if let Some(strong) = weak.upgrade() {
                return Some(strong);  // 条目仍然存活
            }
        }
        // 条目已被回收，从缓存中移除
        self.entries.remove(key);
        None
    }

    fn insert(&mut self, entry: Arc<CacheEntry>) {
        self.entries.insert(
            entry.key.clone(),
            Arc::downgrade(&entry),
        );
    }
}
```

**Weak 的语义**：`Weak` 不阻止 drop，当最后一个 `Arc` 消失时数据被回收，`Weak::upgrade()` 返回 `None`。

### Arc 的性能陷阱

```rust
use std::sync::Arc;

// 陷阱 1：频繁 clone Arc（每次 clone 一次原子操作）
fn bad_many_clones(arc: &Arc<Vec<i32>>) {
    for _ in 0..10000 {
        let _clone = arc.clone();  // 10000 次原子 fetch_add + fetch_sub
    }
}

// 优化：传引用
fn good_pass_ref(arc: &Arc<Vec<i32>>) {
    for _ in 0..10000 {
        let _ref: &Vec<i32> = &**arc;  // 零开销
    }
}
```

```rust
// 陷阱 2：Arc<Mutex<T>> 的小数据——Arc 的堆分配 + Mutex 的堆分配
// 对于一个 i32，Arc<Mutex<i32>> 需要两个堆分配
// 改用 AtomicI32 更高效
use std::sync::atomic::AtomicI32;
let counter = AtomicI32::new(0);  // 栈上，零堆分配
```

## 实际场景：并发缓存设计

### 需求

- 多线程并发读写缓存
- 读多写少
- 支持过期淘汰
- 高吞吐、低延迟

### 设计一：Arc<RwLock<HashMap>>

最简单的方案：

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Instant, Duration};

pub struct SimpleCache<V> {
    inner: RwLock<HashMap<String, (V, Instant)>>,
    ttl: Duration,
}

impl<V: Clone> SimpleCache<V> {
    pub fn new(ttl: Duration) -> Self {
        Self {
            inner: RwLock::new(HashMap::new()),
            ttl,
        }
    }

    pub fn get(&self, key: &str) -> Option<V> {
        let inner = self.inner.read().unwrap();
        inner.get(key).and_then(|(v, inserted)| {
            if inserted.elapsed() < self.ttl {
                Some(v.clone())
            } else {
                None
            }
        })
    }

    pub fn insert(&self, key: String, value: V) {
        let mut inner = self.inner.write().unwrap();
        inner.insert(key, (value, Instant::now()));
    }

    pub fn remove_expired(&self) {
        let mut inner = self.inner.write().unwrap();
        let now = Instant::now();
        inner.retain(|_, (_, inserted)| now - *inserted < self.ttl);
    }
}
```

**问题**：全局一把 RwLock，写操作阻塞所有读操作。当缓存项很多时，一次 `remove_expired` 就让所有读者等待。

### 设计二：分片缓存（Sharded Cache）

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Instant, Duration};

const NUM_SHARDS: usize = 16;

pub struct ShardedCache<V> {
    shards: [RwLock<HashMap<String, (V, Instant)>>; NUM_SHARDS],
    ttl: Duration,
}

impl<V: Clone> ShardedCache<V> {
    pub fn new(ttl: Duration) -> Self {
        Self {
            shards: core::array::from_fn(|_| RwLock::new(HashMap::new())),
            ttl,
        }
    }

    fn shard_index(&self, key: &str) -> usize {
        // 用 key 的哈希值决定分片
        let hash = key.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64));
        (hash as usize) % NUM_SHARDS
    }

    pub fn get(&self, key: &str) -> Option<V> {
        let idx = self.shard_index(key);
        let shard = self.shards[idx].read().unwrap();
        shard.get(key).and_then(|(v, inserted)| {
            if inserted.elapsed() < self.ttl {
                Some(v.clone())
            } else {
                None
            }
        })
    }

    pub fn insert(&self, key: String, value: V) {
        let idx = self.shard_index(&key);
        let mut shard = self.shards[idx].write().unwrap();
        shard.insert(key, (value, Instant::now()));
    }
}
```

**提升**：写操作只阻塞同一分片的读者，其他分片不受影响。并发度提升 ~16 倍。

### 设计三：用 DashMap

```rust
use dashmap::DashMap;
use std::time::{Instant, Duration};
use std::sync::Arc;

pub struct DashCache<V> {
    inner: DashMap<String, (V, Instant)>,
    ttl: Duration,
}

impl<V: Clone> DashCache<V> {
    pub fn new(ttl: Duration) -> Self {
        Self {
            inner: DashMap::new(),
            ttl,
        }
    }

    pub fn get(&self, key: &str) -> Option<V> {
        self.inner.get(key).and_then(|entry| {
            let (v, inserted) = entry.value();
            if inserted.elapsed() < self.ttl {
                Some(v.clone())
            } else {
                None
            }
        })
    }

    pub fn insert(&self, key: String, value: V) {
        self.inner.insert(key, (value, Instant::now()));
    }

    pub fn remove_expired(&self) {
        let now = Instant::now();
        self.inner.retain(|_, (_, inserted)| now - *inserted < self.ttl);
    }
}
```

**DashMap 的优势**：内部分片（默认 16 个 shard）、API 与 HashMap 一致、`retain` 等操作自动分片处理，是并发 HashMap 的首选。

### 性能对比

| 方案 | 读 QPS | 写 QPS | 内存 | 复杂度 |
|------|--------|--------|------|--------|
| `RwLock<HashMap>` | 5M | 500K | 低 | 最低 |
| Sharded Cache | 40M | 4M | 中 | 中 |
| `DashMap` | 50M | 5M | 中 | 低 |

**选型建议**：
- 小缓存（< 1000 条）→ `RwLock<HashMap>`，简单够用
- 中等缓存 → DashMap，开箱即用
- 特大缓存 + 特殊需求 → 自定义分片

## 实战经验总结

### 1. 先用 Mutex，有证据再换 RwLock

RwLock 不是"更好的 Mutex"。它的额外开销常常被低估。用 benchmark 证明 RwLock 在你的负载下确实更快，再切换。

### 2. 用 parking_lot 替换 std 锁，几乎零风险

parking_lot 的 API 与 std 兼容，性能更好，还提供死锁检测。唯一注意点是 `lock()` 不返回 `Result`（不 poison）。

### 3. 锁的粒度是最重要的调优点

- 太粗：并发度低
- 太细：锁开销大，容易死锁
- 经验：**锁保护"不变量"，而非"数据"**

### 4. Arc::get_mut 是被低估的优化

在构建-发布模式中，`Arc::get_mut` 让你在单线程阶段零开销修改，在多线程阶段安全共享。

### 5. 不要"优化"掉 Arc 的原子操作

有人会用 `Rc` + `UnsafeCell` + 手动 `Send` impl 替代 `Arc`——这几乎一定是错的。Arc 的原子开销在 99% 场景下不是瓶颈。先 profile，再优化。
