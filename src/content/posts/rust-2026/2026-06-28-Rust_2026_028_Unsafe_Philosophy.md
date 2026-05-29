---
title: "Rust 2026 经验谈 - Unsafe 的哲学与边界"
published: 2026-06-28
description: "unsafe 语义四件详解、unsafe 边界最小化原则、模块级 unsafe、unsafe 与安全抽象的关系、Soundness 概念。"
image: "/images/rust-2026/7.jpg"
tags: [Rust, Rust 2026, unsafe, 安全抽象, soundness]
category: Rust
draft: false
lang: zh_CN
---

![Unsafe Rust 与底层交互](/images/rust-2026/7.jpg)

`unsafe` 是 Rust 最被误解的关键字——它不是"禁用安全检查"，而是"我手动保证安全不变量，请编译器信任我"。unsafe 的哲学核心是：**unsafe 是安全的基石，安全的边界由 unsafe 划定**。本文深入 unsafe 的语义四件、边界最小化原则、模块级 unsafe 变更，以及 Soundness 概念。

## unsafe 语义四件详解

`unsafe {}` 块解锁四项额外能力，其余一切安全规则不变：

### 第一件：解引用原始指针

```rust
let mut x = 42;
let ptr: *mut i32 = &mut x as *mut i32;

// 安全代码中不能解引用原始指针
// let val = *ptr;  // error: dereference of raw pointer requires unsafe

// unsafe 块中可以
unsafe {
    *ptr = 99;
    let val = *ptr;
    assert_eq!(val, 99);
}
```

**为什么需要 unsafe**：原始指针可能空、悬垂、未对齐、指向无效数据——编译器无法验证。

**正确姿势**：在 unsafe 块中用注释说明为什么这次解引用是安全的：

```rust
unsafe {
    // SAFETY: ptr 来自 Box::into_raw，保证非空、对齐、有效
    // 且在此次解引用期间没有其他引用访问 *ptr
    *ptr = 99;
}
```

### 第二件：调用 unsafe 函数

```rust
unsafe fn dangerous_operation(ptr: *const i32) -> i32 {
    // Edition 2024: unsafe fn 函数体不再是隐式 unsafe 上下文
    // 解引用原始指针需要显式 unsafe {} 块
    unsafe { *ptr }
}

// unsafe 函数只能在 unsafe 块中调用
unsafe {
    let val = dangerous_operation(&42 as *const i32);
    assert_eq!(val, 42);
}
```

**unsafe fn 的含义**：该函数的安全调用需要满足某些前置条件，编译器不会帮你检查，调用者必须自行保证。

**常见的 unsafe 函数**：

| 函数 | 安全前置条件 |
|------|-------------|
| `std::ptr::read(ptr)` | `ptr` 非空、对齐、指向有效已初始化数据 |
| `std::ptr::write(ptr, val)` | `ptr` 非空、对齐、指向可写有效内存 |
| `std::slice::from_raw_parts(ptr, len)` | `ptr` 到 `ptr + len` 是有效、非重叠、已初始化的 |
| `String::from_utf8_unchecked(bytes)` | `bytes` 是合法 UTF-8 |
| `Vec::from_raw_parts(ptr, len, cap)` | `ptr` 来自同分配器的 `Vec`，len/cap 有效 |

### 第三件：访问或修改可变静态变量

```rust
static mut COUNTER: usize = 0;

// 安全代码中不能访问 mut static
// COUNTER += 1;  // error: access to mutable static requires unsafe

unsafe {
    COUNTER += 1;
    let val = COUNTER;
}
```

**为什么需要 unsafe**：`static mut` 没有同步机制，多线程同时访问是数据竞争——UB。

**现代替代方案**：

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

static COUNTER: AtomicUsize = AtomicUsize::new(0);

// 不需要 unsafe！
COUNTER.fetch_add(1, Ordering::Relaxed);
let val = COUNTER.load(Ordering::Relaxed);
```

**规则**：新代码几乎不应该使用 `static mut`，用 `Atomic*` 或 `OnceLock`/`Mutex` 替代。

### 第四件：实现 unsafe trait

```rust
unsafe trait TrustedLen: Iterator {
    // 实现 unsafe trait 意味着实现者保证：
    // .size_hint() 返回精确长度
}

// unsafe trait 只能在 unsafe impl 中实现
unsafe impl TrustedLen for std::ops::Range<usize> {
    // Range<usize> 的 size_hint 是精确的
}
```

**为什么需要 unsafe**：unsafe trait 的正确性是安全代码的推理基础——如果有人错误实现，安全代码可能触发 UB。

**常见的 unsafe trait**：

| trait | 安全要求 |
|-------|---------|
| `Send` | 值可以安全转移到其他线程 |
| `Sync` | 值可以安全被多线程共享引用 |
| `GlobalAlloc` | 分配器满足语义要求（对齐、非重叠等） |
| `TrustedLen` | `size_hint()` 精确 |

### unsafe 块**不**做的事

常见误解：`unsafe` 会"关闭借用检查器"——**不会**。

```rust
let mut x = 1;
let r = &x;
unsafe {
    // x = 2;  // 仍然错误！违反借用规则
    // 借用检查在 unsafe 块中完全有效
}
```

unsafe 块只解锁上述四项能力，所有其他安全规则（借用检查、类型检查、生命周期检查）仍然生效。

## unsafe 边界最小化原则

### 核心原则：unsafe 块越小越好

```rust
// 不好：大块 unsafe，无法审计
unsafe fn process(data: *const u8, len: usize) -> Vec<u8> {
    // Edition 2024: unsafe fn 函数体需显式 unsafe {}
    let slice = unsafe {
        // SAFETY: 调用者保证 data 指向 len 个有效已初始化字节
        std::slice::from_raw_parts(data, len)
    };
    let mut result = Vec::with_capacity(len);
    for &byte in slice {
        result.push(byte.wrapping_add(1));
    }
    result
}

// 好：unsafe 块仅包裹必要的操作，其余在安全代码中
fn process(data: *const u8, len: usize) -> Vec<u8> {
    let slice = unsafe {
        // SAFETY: 调用者保证 data 指向 len 个有效已初始化字节
        std::slice::from_raw_parts(data, len)
    };
    // 后续操作全是安全代码
    let mut result = Vec::with_capacity(len);
    for &byte in slice {
        result.push(byte.wrapping_add(1));
    }
    result
}
```

### 最小化策略一：安全封装函数

将 unsafe 操作封装在安全函数中，函数签名隐藏了 unsafe 细节：

```rust
mod raw_buffer {
    pub struct RawBuffer {
        ptr: *mut u8,
        len: usize,
        cap: usize,
    }

    impl RawBuffer {
        pub fn new(cap: usize) -> Self {
            let layout = std::alloc::Layout::array::<u8>(cap).unwrap();
            let ptr = unsafe {
                // SAFETY: layout.size() > 0（cap > 0），全局分配器有效
                std::alloc::alloc(layout)
            };
            if ptr.is_null() {
                std::alloc::handle_alloc_error(layout);
            }
            RawBuffer { ptr, len: 0, cap }
        }

        pub fn push(&mut self, byte: u8) {
            if self.len < self.cap {
                unsafe {
                    // SAFETY: len < cap，ptr 指向 cap 字节有效内存
                    std::ptr::write(self.ptr.add(self.len), byte);
                }
                self.len += 1;
            }
        }

        pub fn as_slice(&self) -> &[u8] {
            unsafe {
                // SAFETY: ptr 指向 len 个已初始化字节
                std::slice::from_raw_parts(self.ptr, self.len)
            }
        }
    }

    impl Drop for RawBuffer {
        fn drop(&mut self) {
            let layout = std::alloc::Layout::array::<u8>(self.cap).unwrap();
            unsafe {
                // SAFETY: ptr 来自 alloc，layout 匹配
                std::alloc::dealloc(self.ptr, layout);
            }
        }
    }
}
```

外部代码只看到 `RawBuffer::new()`、`push()`、`as_slice()`——全是安全的。

### 最小化策略二：SAFETY 注释

每个 unsafe 块都应该有 SAFETY 注释，说明为什么这次操作是安全的：

```rust
unsafe {
    // SAFETY:
    // - self.ptr 来自 Box::into_raw，保证非空且对齐
    // - self.len <= self.cap 保证不越界
    // - &mut self 保证独占访问，无数据竞争
    std::ptr::write(self.ptr.add(self.len), byte);
}
```

**Clippy 强制**：`#![warn(clippy::undocumented_unsafe_blocks)]` 会在缺少 SAFETY 注释时警告。

### 最小化策略三：不暴露原始指针

```rust
// 不好：暴露原始指针，调用者可能误用
pub struct Container {
    pub data: *mut u8,  // 公开的！
    pub len: usize,
}

// 好：原始指针是私有的，只暴露安全接口
pub struct Container {
    data: *mut u8,  // 私有
    len: usize,
    cap: usize,
}

impl Container {
    pub fn get(&self, index: usize) -> Option<&u8> {
        if index < self.len {
            unsafe {
                // SAFETY: index < len，data 指向 len 个有效字节
                Some(&*self.data.add(index))
            }
        } else {
            None
        }
    }
}
```

## 模块级 unsafe（Edition 2024 变更）

### Edition 2024 之前的 `unsafe impl`

在 Edition 2021 及之前，`unsafe impl` 可以出现在任何地方：

```rust
// Edition 2021：合法
struct MyType;

unsafe impl Send for MyType {}  // 直接写，不需要外围 unsafe 块
unsafe impl Sync for MyType {}
```

问题：`unsafe impl` 散落在代码各处，不易审计。

### Edition 2024 的变更

Edition 2024 允许 `unsafe` 块包含 `impl` 项，在 `unsafe` 块内可以省略 `unsafe` 关键字（RFC 3329）：

```rust
// Edition 2024：unsafe 块中可以直接写 impl
struct MyType;

// 传统写法（仍然合法）
// unsafe impl Send for MyType {}
// unsafe impl Sync for MyType {}

// 新写法一：在 unsafe 块中，省略 impl 前的 unsafe
unsafe {
    impl Send for MyType {}
    impl Sync for MyType {}
}

// 新写法二：在 unsafe fn 中也可以
unsafe fn assert_send_sync() {
    // Edition 2024: 这里可以写 impl Send/Sync
    // 但函数体中的 unsafe 操作仍需显式 unsafe {} 块
}
```

**意义**：将 unsafe 操作集中到可见的区域，方便审计。

### `unsafe` 关键字的新位置

Edition 2024 中，`unsafe` 可以出现在更多位置，明确标记"这里需要 unsafe 证明"：

```rust
// unsafe trait 声明
unsafe trait TrustedAlloc {}

// unsafe impl 必须在 unsafe 上下文中
unsafe {
    impl TrustedAlloc for std::alloc::Global {}
}

// unsafe fn 声明
unsafe fn raw_read(ptr: *const u8) -> u8 {
    // Edition 2024: unsafe fn 函数体需显式 unsafe {}
    unsafe { *ptr }
}

// 方法中的 unsafe
impl MyType {
    // 方法声明中的 unsafe
    unsafe fn access_raw(&self, ptr: *const u8) -> u8 {
        // Edition 2024: unsafe fn 函数体需显式 unsafe {}
        unsafe { *ptr }
    }
}
```

## unsafe 与安全抽象的关系

### 核心论点：unsafe 是安全的基石

Rust 的安全保证**不是凭空而来**的——它建立在大量精心审查的 unsafe 代码之上：

- `Vec<T>` 的内部用了原始指针和手动内存管理
- `Arc<T>` 的引用计数用了 `AtomicUsize` 和 `unsafe impl Send/Sync`
- `Mutex<T>` 的内部用了操作系统的 futex/pthread
- `thread::spawn` 的内部用了 libc 的 `pthread_create`
- `Box<T>` 的析构用了 `alloc::dealloc`

**没有这些 unsafe 的"地基"，就没有安全的"大厦"**。

### 安全抽象的定义

一个**安全抽象（safe abstraction）**是指：
1. 内部使用 unsafe 代码实现
2. 对外只暴露安全接口
3. 只要调用者只使用安全接口，就不可能触发 UB

```rust
pub struct MyVec<T> {
    ptr: *mut T,
    len: usize,
    cap: usize,
}

// 对外接口全是安全的
impl<T> MyVec<T> {
    pub fn new() -> Self { /* 内部用 unsafe */ }
    pub fn push(&mut self, val: T) { /* 内部用 unsafe */ }
    pub fn get(&self, i: usize) -> Option<&T> { /* 内部用 unsafe */ }
    pub fn len(&self) -> usize { self.len }
}

// 只要不通过外部手段获取 self.ptr，就不可能造成 UB
```

### 安全抽象的验证

如何验证一个安全抽象是正确的？

**1. 代码审查**：每行 unsafe 都必须有 SAFETY 注释

**2. Miri 测试**：Miri 是 Rust 的 UB 检测器

```bash
cargo +nightly miri test
# Miri 会检测：
# - 未初始化内存读取
# - 悬垂指针解引用
# - 数据竞争
# - 无效的引用创建
# - 越界访问
```

**3. 形式化验证**：对于关键代码，用工具如 Prusti 或 Kani 进行验证

```bash
cargo kani
# Kani 对 Rust 代码进行有界模型检查
# 验证断言在所有可能的执行路径上成立
```

### 踩坑：安全抽象的常见漏洞

**漏洞一：忘记处理 panic 安全性**

```rust
impl<T> MyVec<T> {
    pub fn push(&mut self, val: T) {
        if self.len == self.cap {
            self.grow();  // 如果 grow() panic，self 可能处于不一致状态
        }
        unsafe {
            std::ptr::write(self.ptr.add(self.len), val);
        }
        self.len += 1;
    }
}
```

如果 `grow()` panic，`self.len` 还没更新，但 `self.cap` 可能已经变了。后续操作可能基于不一致的状态。

**修复**：在修改 `self.cap` 之前完成所有可能 panic 的操作，或者用 `ManuallyDrop` 保护。

**漏洞二：忘记 Drop**

```rust
impl<T> MyVec<T> {
    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }
        self.len -= 1;
        unsafe {
            // 如果 T 的 Drop panic，ptr 指向的数据已经被"取出"
            // 但 MyVec 的 drop 不会再 drop 这个元素——泄漏！
            Some(std::ptr::read(self.ptr.add(self.len)))
        }
    }
}
```

**漏洞三：错误的 Send/Sync 推导**

```rust
use std::cell::Cell;

struct MyWrapper<T> {
    inner: Cell<T>,
}

// Cell<T> 不是 Sync——因为 Cell 允许内部可变性
// 如果我们错误地实现 Sync：
// unsafe impl<T> Sync for MyWrapper<T> {}  // 错误！
// 多线程可以同时通过 &MyWrapper 修改 Cell——数据竞争
```

## Soundness 概念

### 定义

**Soundness（健全性）**：一个 Rust 库是 sound 的，当且仅当：
- 使用该库的安全 API，不可能在不使用 unsafe 的情况下触发未定义行为

换句话说：如果安全代码出问题了，一定是库的 unsafe 代码有 bug，而不是调用者的错。

### Soundness 的形式化

```
对于所有可能的调用者 C：
  如果 C 只使用库 L 的安全 API，且 C 本身不使用 unsafe：
  那么 C 的执行不会触发 UB
```

等价表述：**Sound 库的 unsafe 代码对安全调用者是不可见的**。

### 常见的 Unsound 模式

**模式一：通过安全 API 泄漏原始指针**

```rust
pub struct BuggyVec<T> {
    data: *mut T,
    len: usize,
    cap: usize,
}

impl<T> BuggyVec<T> {
    // Unsound！安全的 get_ptr 方法暴露了原始指针
    pub fn get_ptr(&self) -> *mut T {
        self.data  // 安全代码可以拿到原始指针
    }
}

// 调用者（安全代码）可以造成 UB：
let mut v = BuggyVec::new();
v.push(1);
let ptr = v.get_ptr();  // 安全代码拿到指针
v.push(2);              // 可能 reallocate，ptr 悬垂
unsafe { *ptr = 99; }   // UB！但调用者只用了安全 API
```

**模式二：错误的生命周期逃逸**

```rust
pub fn buggy_as_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    unsafe {
        // Unsound！返回的引用没有绑定到任何所有者
        // 调用者可以任意延长生命周期
        std::slice::from_raw_parts(ptr, len)
    }
}
```

**模式三：错误的 Send/Sync 实现**

```rust
use std::rc::Rc;

struct Bad<T> {
    inner: Rc<T>,
}

// Unsound！Rc<T> 不是 Sync
unsafe impl<T> Sync for Bad<T> {}
// 多线程共享 &Bad<T>，等于多线程共享 &Rc<T>——数据竞争
```

### 如何证明 Soundness

**1. 模块边界是 Soundness 的边界**

```rust
mod my_module {
    // 私有字段 + 安全公开接口 = soundness 封装
    pub struct SafeWrapper {
        ptr: *mut u8,  // 私有！外部不能直接访问
        len: usize,
    }

    impl SafeWrapper {
        pub fn new(data: Vec<u8>) -> Self { /* ... */ }
        pub fn as_slice(&self) -> &[u8] { /* ... */ }
    }
    // 只要内部 unsafe 正确，外部安全代码不可能触发 UB
}
```

**2. Rust 的隐私规则保证 Soundness**

私有字段外部不可访问 → 外部无法绕过安全抽象 → Soundness 成立

**3. Miri 是 Soundness 的实验验证**

```bash
# 用 Miri 运行测试，检测 UB
cargo +nightly miri test

# 用 Miri 运行特定测试
cargo +nightly miri test -- test_my_vec
```

Miri 能检测大多数（非全部）UB，是验证 unsafe 代码的必备工具。

## unsafe 实战经验总结

### 1. 每行 unsafe 都要 SAFETY 注释

```rust
unsafe {
    // SAFETY: self.ptr 来自 self.vec.as_mut_ptr()，
    // self.index < self.vec.len()（由 new 的断言保证），
    // 且 &mut self 保证独占访问
    std::ptr::write(self.ptr.add(self.index), value);
}
```

### 2. unsafe 块不超过 5 行

如果 unsafe 块超过 5 行，说明你在 unsafe 中做了太多"安全"操作。把安全操作移到 unsafe 块外面：

```rust
// 不好
unsafe {
    let slice = std::slice::from_raw_parts(ptr, len);
    let result = slice.iter().map(|&x| x + 1).collect::<Vec<_>>();
    // map 和 collect 不需要 unsafe
}

// 好
let slice = unsafe {
    // SAFETY: ...
    std::slice::from_raw_parts(ptr, len)
};
let result = slice.iter().map(|&x| x + 1).collect::<Vec<_>>();
```

### 3. 用 Miri 测试所有 unsafe 代码

```toml
[dev-dependencies]
# 无需添加，Miri 是工具而非依赖
```

```bash
rustup +nightly component add miri
cargo +nightly miri test
```

### 4. 优先用 `static` + `Atomic` 代替 `static mut`

```rust
// 不好
static mut FLAG: bool = false;

// 好
use std::sync::atomic::{AtomicBool, Ordering};
static FLAG: AtomicBool = AtomicBool::new(false);
```

### 5. 优先用安全抽象代替裸 unsafe

```rust
// 不好：到处用 unsafe
unsafe { std::ptr::write(ptr1, val1); }
unsafe { std::ptr::write(ptr2, val2); }

// 好：封装为安全函数
fn write_pair(buf: &mut [u8], offset: usize, val1: u8, val2: u8) {
    buf[offset] = val1;
    buf[offset + 1] = val2;
}
```
