---
title: "Rust 2026 经验谈 - 可恢复 vs 不可恢复的抉择"
published: 2026-06-11
description: "深入 panic! vs Result 的设计哲学、panic hook 定制、catch_unwind 与 FFI 安全、abort vs unwind 策略选择，以及 panic 在测试中的独特作用。"
image: "/images/rust-2026/3.jpg"
tags: [Rust, Rust 2026, panic, Result, 错误处理]
category: Rust
draft: false
lang: zh_CN
---

![错误处理与健壮性](/images/rust-2026/3.jpg)

Rust 将错误分为两类：可恢复的（`Result`）和不可恢复的（`panic!`）。这个二分法不是语法糖，而是深层的设计哲学——它决定了你的 API 契约、二进制行为、甚至整个系统的可靠性边界。本文将从实战经验出发，讲清楚什么时候用哪个、怎么定制 panic 行为、FFI 边界怎么守，以及 abort vs unwind 的真实性能影响。

## panic! vs Result：不是"轻重"之分，是"契约"之分

新手常把 `panic!` 理解为"严重错误"、`Result` 理解为"轻微错误"。这个心智模型在简单场景下凑效，但在 API 设计层面会误入歧途。

真正的判断标准是：**调用者能否有意义地处理这个错误？**

- **能** → `Result`：调用者有恢复策略，比如重试、降级、换数据源
- **不能** → `panic!`：错误意味着程序不变量被破坏，继续执行只会产生更糟糕的结果

```rust
// 正确的 panic：索引越界意味着逻辑 bug，调用者没有合理的恢复策略
fn get_item(items: &[i32], index: usize) -> i32 {
    items[index] // 越界时 panic 是正确的
}

// 正确的 Result：网络超时是可预期的，调用者可以重试
async fn fetch_data(url: &str) -> Result<Vec<u8>, HttpError> {
    // ...
}
```

### 标准库中的真实案例

标准库本身就在践行这套哲学：

- `Vec::push` 不会返回 `Result`——内存耗尽时 panic，因为调用者通常无法优雅处理 OOM
- `str::parse` 返回 `Result`——解析失败是可预期的，调用者可以提示用户重新输入
- `Option::unwrap` panic——它是一个"我确信有值"的断言，如果不成立说明逻辑有 bug

### 库 vs 应用的不同立场

这是最容易踩坑的地方：**库的 panic 是对调用者的强制约束，而应用可以在任何地方选择 panic。**

```rust
// 库的 API：绝不应该因为"输入不合法"而 panic
// 错误做法
pub fn parse_config(text: &str) -> Config {
    let val: i32 = text.parse().unwrap(); // 配置错误应该是 Result！
    Config { val }
}

// 正确做法
pub fn parse_config(text: &str) -> Result<Config, ConfigError> {
    let val: i32 = text.parse().map_err(ConfigError::InvalidValue)?;
    Ok(Config { val })
}
```

**经验法则**：
1. **库代码**：只对"逻辑 bug"（不变量被破坏）panic，对所有"可预期的失败"返回 Result
2. **应用代码**：在 main 层决定哪些错误直接 panic（或 `process::exit`），哪些需要优雅处理
3. **测试代码**：panic 是正常且预期的行为，`assert!` 家族就是基于 panic 的

## panic hook 定制：让 panic 变成可观测的事件

默认的 panic 行为是打印到 stderr 然后 abort/unwind。在生产环境中，你需要更多：结构化日志、指标采集、自定义堆栈格式。

### 设置自定义 panic hook

```rust
use std::panic;

fn setup_panic_hook() {
    panic::set_hook(Box::new(|info| {
        // 1. 结构化日志
        let location = info.location().unwrap_or_else(|| panic::Location::caller());
        let payload = info.payload().downcast_ref::<&str>().unwrap_or(&"unknown");

        eprintln!("[PANIC] {}:{} - {}", location.file(), location.line(), payload);

        // 2. 指标采集（发送到 Prometheus / StatsD）
        // 注意：这里不能 spawn async task，只能用同步方式
        if let Ok(mut socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
            let _ = socket.send_to(
                b"panic.counter:1|c",
                "127.0.0.1:8125",
            );
        }

        // 3. 自定义堆栈（backtrace 已在标准库中稳定）
        #[cfg(feature = "backtrace")]
        {
            use std::backtrace::Backtrace;
            let bt = Backtrace::capture();
            eprintln!("Backtrace:\n{}", bt);
        }
    }));
}
```

### 踩坑：panic hook 中的陷阱

**陷阱 1：panic hook 中不能再 panic**

```rust
panic::set_hook(Box::new(|_| {
    panic!("in panic hook"); // 这会导致 abort（double panic）
}));
```

如果 panic hook 本身 panic，Rust 会直接 abort 进程，不再 unwind。所以 hook 中的代码必须极其防御性——用 `if let` 而非 `unwrap`，避免任何可能失败的操作。

**陷阱 2：hook 中不能做 async IO**

panic hook 是同步的，不能 `.await`。如果你需要异步通知（比如发 HTTP 请求到告警系统），只能用同步网络调用或写入队列由另一个线程处理。

**陷阱 3：`take_hook` 与链式 hook**

```rust
let original_hook = panic::take_hook(); // 取走默认 hook
panic::set_hook(Box::new(move |info| {
    // 先执行自定义逻辑
    send_to_monitoring(info);
    // 再调用默认行为（打印 + abort）
    original_hook(info);
}));
```

`take_hook` 允许你"包装"默认 hook 而非替换它。这在库中尤为重要——你不想覆盖应用已经设置的 hook。

## catch_unwind：边界与 FFI 安全

`std::panic::catch_unwind` 允许你捕获 unwind，类似于 try-catch。但它有严格的边界。

### 基本用法

```rust
use std::panic::catch_unwind;

let result = catch_unwind(|| {
    panic!("something went wrong");
});

match result {
    Ok(value) => println!("Got: {:?}", value),
    Err(_) => println!("Caught a panic!"),
}
```

### FFI 边界：为什么必须 catch_unwind

**Rust 的 panic 越过 FFI 边界是 UB（Undefined Behavior）。** 这是 Rust 最容易被忽视的安全规则之一。

```rust
// C 侧声明
unsafe extern "C" {
    fn c_callback(cb: unsafe extern "C" fn()) -> i32;
}

// 错误！如果 callback panic，unwind 会穿越 FFI 边界 → UB
unsafe extern "C" fn rust_callback() {
    panic!("oops"); // UB 如果被 C 代码调用！
}

// 正确：在 FFI 边界捕获 panic
unsafe extern "C" fn safe_rust_callback() {
    let _ = catch_unwind(|| {
        actual_rust_logic();
    });
    // panic 被吞掉，C 侧看到的是"正常返回"
    // 但你可能需要通知 C 侧出错
}

fn actual_rust_logic() {
    // 这里 panic 是安全的
}
```

### catch_unwind 的限制

**不是所有 panic 都能被 catch：**

1. **panic = abort 时**：如果配置了 `panic = "abort"`，`catch_unwind` 什么也捕获不了，程序直接终止
2. **double panic**：在 unwind 过程中再次 panic 会直接 abort
3. **非 PanicUnwindSafe 闭包**：捕获了可变引用的闭包默认不满足 `UnwindSafe`

```rust
let mut x = 0;
// 编译错误：&mut x 不满足 UnwindSafe
// let result = catch_unwind(|| { x += 1; });

// 解决：用 AssertUnwindSafe 包装
use std::panic::AssertUnwindSafe;
let result = catch_unwind(AssertUnwindSafe(|| {
    x += 1;
}));
```

`AssertUnwindSafe` 是一个 `unsafe` trait 的安全包装——你在向编译器承诺"即使 panic 了，x 的状态也不会被破坏性地使用"。在 FFI 边界这种场景下，这通常是合理的。

### `From<T> for AssertUnwindSafe<T>`（Rust 1.79.0 稳定化）

Rust 1.79.0 稳定了 `From<T> for AssertUnwindSafe<T>` impl，使得 `AssertUnwindSafe` 更易用——你不再需要手动包装闭包，可以直接用 `.into()` 或让类型推导自动转换：

```rust
use std::panic::{catch_unwind, AssertUnwindSafe};

let mut x = 0;

// 之前：需要手动包装
let result = catch_unwind(AssertUnwindSafe(|| {
    x += 1;
}));

// 现在（1.79.0+）：可以直接传入，From impl 自动转换
// 这在泛型上下文中尤其方便——AssertUnwindSafe 实现了 From<T>
let closure = || { x += 2; };
let result = catch_unwind(AssertUnwindSafe::from(closure));
```

**实际影响**：对于大多数 `catch_unwind` 用法，手动 `AssertUnwindSafe(|| ...)` 包装仍然是惯用法。但 `From` impl 在泛型代码中消除了手动包装的需要，且与 `LazyCell`/`LazyLock` 的初始化闭包配合时更自然。

### 线程边界：join 也能捕获 panic

```rust
use std::thread;

let handle = thread::spawn(|| {
    panic!("child thread panicked!");
});

let result = handle.join();
match result {
    Ok(val) => println!("Thread returned: {:?}", val),
    Err(e) => println!("Thread panicked: {:?}", e),
}
```

`thread::spawn` 返回的 `JoinHandle::join()` 会返回 `Result<T, Box<dyn Any>>`，Err 就是 panic 的 payload。这比 `catch_unwind` 更常用——在多线程场景下，子线程 panic 不应该直接杀掉整个进程。

## abort vs unwind：策略选择

Cargo profile 中可以配置 panic 策略：

```toml
[profile.dev]
panic = "unwind"  # 默认

[profile.release]
panic = "abort"   # 很多项目的选择
```

### unwind 机制简述

`panic = "unwind"` 时，panic 触发栈展开（stack unwinding）：
1. 当前函数的 drop 析构函数被调用
2. 逐帧向上展开
3. 直到被 `catch_unwind` 捕获或到达线程入口点

这意味着 **Drop 保证**：即使 panic，RAII 资源也会被正确释放。

### abort 机制

`panic = "abort"` 时，panic 直接终止进程，不展开栈，不调用 Drop。

### 实际影响对比

| 维度 | unwind | abort |
|------|--------|-------|
| 二进制大小 | 较大（需要展开表） | 较小（无展开表） |
| 编译时间 | 较慢 | 较快 |
| Drop 保证 | 有 | 无 |
| catch_unwind | 有效 | 无效（直接终止） |
| FFI 安全 | 需要显式 catch_unwind | 天然安全（不会 unwind 穿越） |

### 实测：二进制大小差异

```bash
# panic = "unwind"
$ cargo build --release && ls -lh target/release/myapp
-rwxr-xr-x  2.1M

# panic = "abort"
$ cargo build --release && ls -lh target/release/myapp
-rwxr-xr-x  1.7M
```

在嵌入式和 WASM 目标上差异更大，unwind 表可能占 20-30% 的二进制大小。

### 选型建议

**选 abort 的场景：**
- 嵌入式 / WASM / 长期运行的服务端进程（panic = 致命，直接重启）
- 不需要 catch_unwind
- 二进制大小敏感

**选 unwind 的场景：**
- 需要线程级 panic 隔离（spawn + join 捕获）
- FFI 边界需要 catch_unwind
- 测试中需要断言 panic（`#[should_panic]`）
- 库代码需要提供 Drop 保证

**混合策略**：可以在依赖层面混合——让 C 依赖用 abort，自己的代码用 unwind：

```toml
[profile.release]
panic = "unwind"

[profile.release.package.some-c-dep]
panic = "abort"  # 对特定依赖用 abort
```

不过实际上 per-package panic 策略的支持有限，最常见的是全局设置。

## panic 在测试中的特殊作用

测试框架深度依赖 panic 机制——`assert!`、`assert_eq!`、`assert_ne!` 都是 panic。

### should_panic 测试

```rust
#[test]
#[should_panic(expected = "index out of bounds")]
fn test_index_oob() {
    let v = vec![1, 2, 3];
    let _ = v[10];
}

#[test]
#[should_panic(expected = "capacity overflow")]
fn test_reserve_overflow() {
    let mut v = Vec::new();
    v.reserve(usize::MAX);
}
```

`expected` 参数做子串匹配——如果 panic 消息包含该字符串则测试通过。这是验证"正确地 panic"的唯一方式。

### 测试中的 unwrap 是合理的

```rust
#[test]
fn test_parse() {
    let config: Config = "valid input".parse().unwrap(); // 测试中 OK
    assert_eq!(config.port, 8080);
}
```

在测试中 `unwrap` 是惯用法，因为测试失败就应该 panic。但 `expect` 仍然更好——它提供上下文：

```rust
#[test]
fn test_parse() {
    let config: Config = "valid input"
        .parse()
        .expect("测试用的合法输入不应该解析失败");
    assert_eq!(config.port, 8080);
}
```

### 踩坑：panic = abort 下的测试

如果你在 Cargo.toml 中设置了 `panic = "abort"`，`#[should_panic]` 测试将无法工作——因为 abort 直接终止进程，测试框架无法捕获 panic。

解决方案：在测试 profile 中覆盖：

```toml
[profile.release]
panic = "abort"

[profile.test]
panic = "unwind"  # 测试必须用 unwind
```

## 实战经验总结

1. **API 设计第一准则**：调用者能否恢复？能 → Result，不能 → panic
2. **库不 panic（对可预期错误）**：这是最常违反的规则，尤其是 parse 和 config 相关的库
3. **FFI 边界永远 catch_unwind**：穿越 FFI 的 unwind 是 UB，没有例外
4. **panic hook 是生产必需品**：但 hook 中必须防御性编码，不能再 panic
5. **abort 是服务端的常见选择**：但要注意测试和 catch_unwind 的兼容性
6. **测试中 expect 优于 unwrap**：即使测试失败也该 panic，但消息要有上下文
7. **per-target panic 策略**：WASM 用 abort，桌面用 unwind，在 Cargo.toml 中按 target 配置
