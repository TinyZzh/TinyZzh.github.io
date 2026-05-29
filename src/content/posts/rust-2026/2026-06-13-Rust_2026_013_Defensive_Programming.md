---
title: "Rust 2026 经验谈 - 常见 bug 模式与防御性编程"
published: 2026-06-13
description: "unwrap 滥用与替代方案、整数溢出的 debug/release 行为差异、索引越界与 get 替代、deadlock 常见模式、clippy lint 驱动的防御性编码配置。"
image: "/images/rust-2026/3.jpg"
tags: [Rust, Rust 2026, 防御性编程, clippy, debug]
category: Rust
draft: false
lang: zh_CN
---

![错误处理与健壮性](/images/rust-2026/3.jpg)

Rust 的类型系统消除了整类 bug（空指针、数据竞争、use-after-free），但这不代表 Rust 程序就不会有 bug。unwrap 滥用、整数溢出、索引越界、死锁——这些仍然是生产事故的常客。本文从真实踩坑经验出发，总结常见 bug 模式和防御性编码策略，让你在 Code Review 时一眼识别这些问题。

## unwrap 滥用与替代方案

### 为什么 unwrap 是危险的？

`unwrap` 的语义是"我断言这里有值，否则 panic"。在以下场景中它是有意义的：
- 测试代码
- 初始化阶段（程序刚启动，失败就该死）
- 经过逻辑证明不可能为 None/Err 的地方

但实际代码中，80% 的 unwrap 用法都不属于这些场景。

### 替代方案矩阵

| 场景 | 错误做法 | 正确做法 |
|------|---------|---------|
| Option 有值 | `.unwrap()` | `.expect("为什么一定有值")` |
| Option 可能为空 | `.unwrap()` | `.ok_or(Error::Missing)?` |
| Result 一定成功 | `.unwrap()` | `.expect("为什么一定成功")` |
| Result 可能为 Err | `.unwrap()` | `?` 操作符 |
| 集合查找 | `.unwrap()` | `if let Some(v) = map.get(key)` |
| 解析输入 | `.unwrap()` | `.parse().map_err(...)?` |

### expect：让 panic 有语义

```rust
// 不好：panic 消息是 "called `Option::unwrap()` on a `None` value"
let port = config.get("port").unwrap();

// 好：panic 消息告诉你"为什么"这里不该失败
let port = config.get("port")
    .expect("config must contain 'port' — check config.toml");

// 更好：返回 Result，让调用者决定
let port = config.get("port")
    .ok_or(ConfigError::MissingField("port"))?;
```

**经验：每次写 `.unwrap()`，问自己"如果这里是 None/Err，是 bug 还是可预期的失败？"如果是后者，改成 `?`。**

### ok_or / ok_or_else：将 Option 转为 Result

```rust
// unwrap：失败时 panic
let user = users.find_by_id(id).unwrap();

// ok_or：失败时返回错误
let user = users.find_by_id(id)
    .ok_or(AppError::UserNotFound(id))?;

// 注意：ok_or 会急切求值错误表达式
// 如果创建错误对象有开销，用 ok_or_else
let user = users.find_by_id(id)
    .ok_or_else(|| AppError::UserNotFound(id))?;
```

`ok_or` vs `ok_or_else` 的区别类似于 `Option::or` vs `Option::or_else`——前者总是求值，后者只在 None 时求值。如果错误类型包含 `String` 或 `Box`，用 `ok_or_else` 避免不必要的分配。

### unwrap_or_default / unwrap_or：提供默认值

```rust
// 有合理默认值的场景
let timeout = config.get("timeout")
    .and_then(|v| v.parse().ok())
    .unwrap_or(30);  // 默认 30 秒

// 或用 unwrap_or_default（需要 Default trait）
let flags: Vec<String> = config.get_list("flags")
    .unwrap_or_default();  // 空Vec
```

## 整数溢出：debug vs release 的行为差异

这是 Rust 最阴险的 bug 模式之一——在 debug 和 release 模式下行为不同。

### 行为对比

```rust
let x: u8 = 255;
let y = x + 1;  // debug: panic!  |  release: 静默溢出为 0
```

- **Debug 模式**：整数溢出触发 panic（运行时检查）
- **Release 模式**：整数溢出静默回绕（为了性能，编译器假定不会溢出）

这意味着：**你的测试不会捕获溢出 bug，因为测试跑在 debug 模式下。** 而 bug 在 release 模式下才会显现。

### 真实事故案例

```rust
// 计算缓冲区大小
let buf_size = header_len + body_len;  // 如果 header_len + body_len > usize::MAX 呢？
let buf = vec![0u8; buf_size];  // 分配了一个"很小"的缓冲区（回绕后）

// 然后 body 数据写入时越界——但不是 Rust 的边界检查先捕获，
// 而是 buf_size 已经错了，写入的语义就不对了
```

### 防御方案

**1. saturating 操作：溢出时停在边界值**

```rust
let x: u8 = 250;
let y = x.saturating_add(10);  // 255，而非回绕到 4

// 常用场景：计数器、进度条
progress.saturating_add(step);
remaining.saturating_sub(consumed);
```

**2. wrapping 操作：显式声明"我就是想要回绕"**

```rust
// 哈希计算、CRC、加密——这些场景回绕是正确的语义
let hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
```

**3. checked 操作：检测溢出并处理**

```rust
let buf_size = header_len.checked_add(body_len)
    .ok_or(Error::BufferTooLarge)?;

// 或者用 ? 传播
let total = a.checked_add(b)?;  // 溢出时返回 None
```

**4. overflowing 操作：获取溢出标志**

```rust
let (result, did_overflow) = x.overflowing_add(y);
if did_overflow {
    log::warn!("integer overflow detected: {} + {}", x, y);
}
```

### Cargo 配置：在 release 中也检查溢出

```toml
[profile.release]
overflow-checks = true  # release 也检查溢出（约 5-10% 性能开销）
```

**经验：如果你的领域涉及金融、密码学、或者任何"数字正确性至关重要"的场景，`overflow-checks = true` 是必需品而非可选项。**

## 索引越界与 get 替代

### panic vs Option：两种访问风格

```rust
let v = vec![1, 2, 3];

// panic 风格：越界时 panic
let x = v[10];  // thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 10'

// Option 风格：越界时返回 None
let x = v.get(10);  // None
```

**什么时候用哪个？**

- `v[i]`：当你有逻辑保证 `i < v.len()`，越界意味着 bug
- `v.get(i)`：当 `i` 来自外部输入，越界是可预期的

### 常见坑：切片迭代中的索引

```rust
// 反模式：手动索引 + unwrap
for i in 0..items.len() {
    let item = items[i];       // OK 但多余
    let next = items[i + 1];   // 潜在越界！最后一个元素时会 panic
}

// 正确：用迭代器
for item in &items {
    // 安全，无需索引
}

// 需要相邻元素时
for window in items.windows(2) {
    let (prev, next) = (window[0], window[1]);
}

// 或者用 enumerate + get
for (i, item) in items.iter().enumerate() {
    let next = items.get(i + 1);  // Option，安全
}
```

### HashMap / BTreeMap 的 get 习惯

```rust
// 反模式：contains_key + 索引（两次查找）
if map.contains_key(&key) {
    let value = map[&key];  // 第二次查找
}

// 正确：get 一次
if let Some(value) = map.get(&key) {
    // 使用 value
}

// 需要 mutable 引用时
if let Some(value) = map.get_mut(&key) {
    *value += 1;
}

// 或者 entry API（一次查找，可插入默认值）
let count = map.entry(key).or_insert(0);
*count += 1;
```

## Deadlock 常见模式

Rust 的类型系统防止了数据竞争，但**不防止死锁**。Mutex 在 Rust 中和在其他语言中一样容易死锁。

### 模式 1：Mutex 嵌套——最经典的死锁

```rust
use std::sync::Mutex;

let a = Mutex::new(0);
let b = Mutex::new(0);

// 线程 1
let mut ga = a.lock().unwrap();
let mut gb = b.lock().unwrap();  // 如果线程 2 先拿了 b，这里就死锁

// 线程 2（在另一个线程中）
let mut gb = b.lock().unwrap();
let mut ga = a.lock().unwrap();  // 等待线程 1 释放 a → 死锁
```

**防御方案：永远按相同顺序加锁**

```rust
// 方案 1：文档约定锁顺序
// "所有代码必须先锁 A 再锁 B"

// 方案 2：用层级 Mutex（编译期强制顺序）
// 参见 parking_lot::ReentrantMutex 或 layeredlock crate

// 方案 3：缩小锁的范围，避免同时持有两把锁
{
    let ga = a.lock().unwrap();
    *ga += 1;
} // 释放 a
{
    let gb = b.lock().unwrap();
    *gb += 1;
} // 释放 b
```

### 模式 2：ReentrantMutex 的"伪死锁"

```rust
use parking_lot::ReentrantMutex;

let m = ReentrantMutex::new(0);

let guard1 = m.lock();
// 同一线程可以再次加锁——但这是否是你想要的？
let guard2 = m.lock();  // 不会死锁，但可能导致逻辑错误
```

`ReentrantMutex` 避免了同线程死锁，但引入了更隐蔽的 bug：你以为拿了锁就独占了数据，但同线程的其他代码可能已经改了它。**能用普通 Mutex 解决的，不要用 ReentrantMutex。**

### 模式 3：循环依赖中的 async Mutex

```rust
use tokio::sync::Mutex;

// async Mutex 的死锁更难调试，因为"持有锁"的时间可能跨越 .await 点
let mut guard = cache.lock().await;
let data = fetch_from_db(&key).await;  // 持有 cache 锁的同时等待网络！
guard.insert(key, data);               // 其他任务无法访问 cache
```

**防御：永远在 .await 之前释放锁**

```rust
let data = {
    let guard = cache.lock().await;
    guard.get(&key).cloned()  // 克隆数据
}; // 锁已释放

let data = match data {
    Some(d) => d,
    None => fetch_from_db(&key).await,  // 不持有锁
};

cache.lock().await.insert(key, data);  // 短暂加锁
```

### 死锁检测

```rust
// 在测试中启用 parking_lot 的死锁检测
// Cargo.toml
// [dependencies]
// parking_lot = { version = "0.12", features = ["deadlock_detection"] }

// 在 main 函数开头
#[cfg(test)]
fn check_deadlocks() {
    use parking_lot::deadlock;
    let deadlocks = deadlock::check_deadlock();
    if !deadlocks.is_empty() {
        for (i, threads) in deadlocks.iter().enumerate() {
            eprintln!("Deadlock #{}:", i);
            for t in threads {
                eprintln!("  Thread {:?} holding lock at {:?}", t.thread_id(), t.backtrace());
            }
        }
        panic!("{} deadlocks detected", deadlocks.len());
    }
}
```

## clippy lint 驱动的防御性编码

Clippy 是防御性编程的最佳工具——让 lint 在 CI 中替你把关。

### 核心 lint 配置

```toml
# .clippy.toml 或 Cargo.toml [lints.clippy]
# 推荐的防御性 lint 集合
```

```rust
#![warn(
    clippy::unwrap_used,           // 禁止 unwrap，强制 expect 或 ?
    clippy::expect_used,           // 可选：也禁止 expect（更严格）
    clippy::indexing_slicing,      // 禁止 v[i]，强制 v.get(i)
    clippy::arithmetic_side_effects,  // 禁止裸算术，强制 checked/saturating
    clippy::panic,                 // 禁止显式 panic!
    clippy::todo,                  // 禁止 todo!（确保没有未完成代码）
    clippy::unimplemented,         // 禁止 unimplemented!
    clippy::unreachable,           // 禁止 unreachable!（用 unreachable_unchecked 显式标注）
)]

#![allow(
    clippy::expect_used,           // 在测试中允许 expect
)]
```

### 实战配置：分模块设置严格度

```rust
// lib.rs — 库代码严格
#![warn(clippy::unwrap_used, clippy::indexing_slicing)]

// 只在特定模块中放宽
#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]  // 测试中允许 unwrap

    #[test]
    fn test_something() {
        let v = vec![1, 2, 3];
        assert_eq!(v[0], 1);  // 测试中索引 OK
    }
}

// FFI 模块特殊处理
mod ffi {
    #![allow(clippy::panic)]  // FFI 边界的 panic 有时是合理的（防御 UB）

    pub unsafe extern "C" fn callback() {
        if !is_valid_state() {
            panic!("invalid state in FFI callback — potential UB");
        }
    }
}
```

### 常用防御性 lint 一览

| lint | 防御的 bug | 建议级别 |
|------|-----------|---------|
| `unwrap_used` | unwrap 导致的意外 panic | warn |
| `indexing_slicing` | 索引越界 panic | warn |
| `arithmetic_side_effects` | 整数溢出 | warn (领域相关) |
| `panic` | 显式 panic | warn |
| `todo` | 未完成代码上线 | deny |
| `string_slice` | UTF-8 边界错误 | warn |
| `or_fun_call` | `unwrap_or(expensive())` 性能问题 | warn |
| `if_then_some_else_none` | 手写 Option filter | warn |
| `semicolon_if_nothing_returned` | 混淆表达式/语句 | warn |

### CI 中强制 clippy

```yaml
# GitHub Actions
- name: Clippy
  run: cargo clippy --all-targets --all-features -- -D warnings
```

`-D warnings` 把所有 warn 级别的 lint 提升为 deny（编译失败），确保防御性规则在 CI 中被强制执行。

### 渐进式采用：不要一次性全开

在已有项目中开启防御性 lint 的策略：

```bash
# 第一步：只允许，不强制
cargo clippy -- -W clippy::unwrap_used

# 第二步：修复高频 lint，在 CI 中强制
# 逐个 lint 开启，每次只加一个

# 第三步：全面强制
cargo clippy --all-targets -- -D warnings
```

## 实战经验总结

1. **unwrap 默认拒绝**：用 `expect` 语义化、用 `?` 传播、用 `ok_or` 转换
2. **整数溢出是隐蔽的 release bug**：用 `saturating_*`/`checked_*`/`wrapping_*` 显式声明意图
3. **索引操作默认用 get**：只在逻辑保证安全时用 `[]`
4. **死锁不是类型系统能防的**：锁顺序约定 + 缩小锁范围 + 测试中检测
5. **async 中的锁要特别小心**：不要在持有锁时 .await
6. **clippy 是最好的防御性工具**：在 CI 中强制，分模块设严格度
7. **overflow-checks = true**：金融/密码/关键计算场景的必需配置
