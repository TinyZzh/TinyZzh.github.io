---
title: "Rust 2026 经验谈 - Unsafe 代码审查清单"
published: 2026-07-02
description: "Safety doc 规范、Miri 检测 UB、loom 并发测试、unsafe 审查 checklist、geiger 统计 unsafe 使用量，系统保障 unsafe 代码安全。"
image: "/images/rust-2026/7.jpg"
tags: [Rust, Rust 2026, unsafe, Miri, loom, 内存安全]
category: Rust
draft: false
lang: zh_CN
---

![Unsafe Rust 与底层交互](/images/rust-2026/7.jpg)

unsafe 是 Rust 的"信任边界"——编译器放弃检查，由开发者担保安全性。但担保不是口号，需要系统化的审查和验证。本文从文档规范、工具检测、审查清单三个维度，建立 unsafe 代码的质量保障体系。

## Safety doc comment 规范

### 标准 Safety 段落

Rust API Guidelines 要求每个 unsafe 函数和 unsafe trait 实现都包含 `# Safety` 段落，说明调用者必须满足的前置条件：

```rust
/// 将字节切片重新解释为 T 的引用。
///
/// # Safety
///
/// 调用者必须保证：
/// - `bytes` 的长度恰好等于 `size_of::<T>()`
/// - `bytes` 的对齐满足 `align_of::<T>()`
/// - `bytes` 指向的内存包含 `T` 的有效位模式
/// - 在此引用存活期间，没有其他可变引用指向同一内存
pub unsafe fn transmute_ref<T>(bytes: &[u8]) -> &T {
    // Edition 2024: unsafe fn 函数体需显式 unsafe {}
    unsafe { &*(bytes.as_ptr() as *const T) }
}
```

### unsafe impl 的 Safety

```rust
/// 自定义的线程安全引用计数指针。
///
/// # Safety
///
/// 实现 `Send` 是安全的，因为：
/// - 内部计数使用 `AtomicUsize`，线程安全
/// - 数据通过 `UnsafeCell` 访问，但所有访问都通过原子计数守卫
/// - 不存在 `&mut` 引用的线程间传递
unsafe impl<T: Sync> Send for MyRc<T> {}

/// # Safety
///
/// 实现 `Sync` 是安全的，因为：
/// - `MyRc` 本身是只读的（引用计数是原子的）
/// - 内部数据 `T: Sync` 保证并发共享引用安全
unsafe impl<T: Sync> Sync for MyRc<T> {}
```

### unsafe 块的 SAFETY 注释

Rust 2024 Edition 推荐在 unsafe 块内加 `// SAFETY:` 注释，解释为何这个 unsafe 操作是安全的：

```rust
fn read_config(path: &Path) -> Result<Config> {
    let file = std::fs::File::open(path)?;
    let mut reader = std::io::BufReader::new(file);

    let version = unsafe {
        // SAFETY:
        // - buf 是 4 字节的栈上数组，对齐为 1
        // - reader.read_exact 确保写入 4 字节
        // - u32 的小端字节解释总是有效的
        let mut buf = [0u8; 4];
        reader.read_exact(&mut buf)?;
        u32::from_le_bytes(buf)
    };

    Ok(Config { version })
}
```

### unsafe fn 调用处的注释

```rust
fn process(data: &mut [u8]) {
    let ptr = data.as_mut_ptr();
    let len = data.len();

    unsafe {
        // SAFETY:
        // - ptr 来自 &mut [u8]，保证非空且对齐
        // - len 是 data 的原始长度，不越界
        // - 我们拥有 &mut [u8]，没有其他引用
        core::ptr::write_bytes(ptr, 0, len);
    }
}
```

### 踩坑：Safety 注释不是安全证明

Safety 注释是给审查者看的，不是编译器验证的。错误的注释比没有注释更危险：

```rust
unsafe fn bad_assumption(ptr: *const u8, len: usize) -> &[u8] {
    // SAFETY: ptr 是有效的，len 也是对的
    // ↑ 这个注释没有任何证明力！
    std::slice::from_raw_parts(ptr, len)
}

// 好的 Safety 注释应该引用具体的保证来源：
unsafe fn good_assumption(ptr: *const u8, len: usize, capacity: usize) -> &[u8] {
    // SAFETY:
    // 调用者（process_buffer）保证：
    // - ptr 来自 Vec::as_ptr，对齐为 1，非空
    // - len <= capacity（在 process_buffer 中已检查）
    // - 数据在 'a 期间有效（Vec 的生命周期约束）
    std::slice::from_raw_parts(ptr, len)
}
```

## Miri 检测 UB

### 安装与运行

Miri 是 Rust 的 UB 检测器，基于形式化方法解释 Rust 程序：

```bash
# 安装
rustup +nightly component add miri

# 运行测试
cargo +nightly miri test

# 运行特定测试
cargo +nightly miri test test_ffi_boundary

# 带参数运行
cargo +nightly miri run
```

### Miri 检测的 UB 类型

**1. 越界内存访问**

```rust
fn test_oob() {
    let v = vec![1, 2, 3];
    let val = unsafe { *v.as_ptr().add(3) };  // Miri: pointer being out-of-bounds
}
```

**2. 使用未初始化内存**

```rust
fn test_uninit() {
    let x: i32 = unsafe {
        // Miri: using uninitialized data
        let mut v: i32 = std::mem::MaybeUninit::uninit().assume_init();
        v
    };
}
```

**3. 违反别名规则（Stacked Borrows）**

```rust
fn test_aliasing() {
    let mut x = 42;
    let raw = &mut x as *mut i32;
    let ref1 = &x;
    unsafe {
        // Miri: trying to reborrow for Unique, but parent tag <...> is Disabled
        // 因为 ref1 仍然存活，通过 raw 写入违反别名规则
        *raw = 13;
    }
    println!("{}", ref1);  // ref1 仍存活
}
```

**4. 无效指针解引用**

```rust
fn test_invalid_ptr() {
    let ptr: *const i32 = 0xdeadbeef as *const i32;
    unsafe {
        // Miri: pointer to 0xdeadbeef is not a valid pointer
        let _val = *ptr;
    }
}
```

**5. 整数溢出（debug 模式）**

```rust
fn test_overflow() {
    let x: u8 = 255;
    let y = x + 1;  // Miri: attempt to compute `u8::MAX + 1_u8`, which would overflow
}
```

**6. 数据竞争（-Zmiri-track-raw-pointers）**

```rust
use std::thread;

fn test_data_race() {
    let mut x = 0;
    let raw = &mut x as *mut i32;

    let t = thread::spawn(move || {
        unsafe { *raw = 1; }
    });

    // Miri: data race detected between a Read and Write
    println!("{}", x);
    t.join().unwrap();
}
```

### Miri 的 Tree Borrows 模式

```bash
# 使用 Tree Borrows（更宽松的别名模型）
cargo +nightly miri test -Zmiri-tree-borrows

# 对比 Stacked Borrows（默认，更严格）
cargo +nightly miri test
```

Tree Borrows 是 Stacked Borrows 的替代模型，允许更多模式（如某些 `io_uring` 用法）。

### Miri 的局限

```rust
// Miri 不支持：
// 1. FFI 调用（C 函数）——除非用 miri::foreign_function_hook
// 2. 系统调用（大部分被模拟，但不完全）
// 3. 内联汇编
// 4. 某些平台相关的操作

// 变通：用 -Zmiri-seed 控制随机性
// cargo +nightly miri test -Zmiri-seed=42

// 变通：跳过不支持的测试
#[cfg(not(miri))]
fn test_with_ffi() {
    // Miri 不支持 FFI，跳过
}
```

### 实战：CI 中集成 Miri

```yaml
# .github/workflows/miri.yml
name: Miri

on: [push, pull_request]

jobs:
  miri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
        with:
          components: miri
      - name: Miri test
        run: cargo miri test
```

## loom 并发测试

### 为什么需要 loom

Miri 能检测数据竞争，但对于并发算法的正确性（如：锁是否真的互斥？CAS 循环是否终止？）需要更系统的验证。loom 是 Rust 的并发模型检查器，枚举所有可能的线程交错：

```toml
[dev-dependencies]
loom = "0.7"
```

### 基本用法：测试原子计数器

```rust
#[cfg(test)]
mod tests {
    use loom::sync::atomic::{AtomicUsize, Ordering};
    use loom::thread;

    #[test]
    fn test_atomic_counter() {
        loom::model(|| {
            let counter = AtomicUsize::new(0);

            let t1 = thread::spawn(|| {
                counter.fetch_add(1, Ordering::SeqCst);
            });

            let t2 = thread::spawn(|| {
                counter.fetch_add(1, Ordering::SeqCst);
            });

            t1.join().unwrap();
            t2.join().unwrap();

            let val = counter.load(Ordering::SeqCst);
            assert!(val == 1 || val == 2);
            // fetch_add 不会丢失，最终值一定是 2
            // 但上面的断言允许中间状态
        });
    }
}
```

### 测试 Mutex 实现

```rust
#[cfg(test)]
mod tests {
    use loom::sync::Arc;
    use loom::thread;

    struct SimpleLock {
        locked: loom::sync::atomic::AtomicBool,
        data: loom::sync::atomic::AtomicUsize,
    }

    impl SimpleLock {
        fn new() -> Self {
            Self {
                locked: loom::sync::atomic::AtomicBool::new(false),
                data: loom::sync::atomic::AtomicUsize::new(0),
            }
        }

        fn lock(&self) {
            while self.locked.compare_exchange(
                false, true,
                loom::sync::atomic::Ordering::Acquire,
                loom::sync::atomic::Ordering::Relaxed,
            ).is_err() {
                loom::thread::yield_now();
            }
        }

        fn unlock(&self) {
            self.locked.store(false, loom::sync::atomic::Ordering::Release);
        }
    }

    #[test]
    fn test_simple_lock_mutual_exclusion() {
        loom::model(|| {
            let lock = Arc::new(SimpleLock::new());
            let lock1 = lock.clone();
            let lock2 = lock.clone();

            let t1 = thread::spawn(move || {
                lock1.lock();
                let v = lock1.data.load(loom::sync::atomic::Ordering::Relaxed);
                lock1.data.store(v + 1, loom::sync::atomic::Ordering::Relaxed);
                lock1.unlock();
            });

            let t2 = thread::spawn(move || {
                lock2.lock();
                let v = lock2.data.load(loom::sync::atomic::Ordering::Relaxed);
                lock2.data.store(v + 1, loom::sync::atomic::Ordering::Relaxed);
                lock2.unlock();
            });

            t1.join().unwrap();
            t2.join().unwrap();

            let val = lock.data.load(loom::sync::atomic::Ordering::Relaxed);
            assert_eq!(val, 2);
        });
    }
}
```

### loom 与真实代码的双模测试

```rust
// 使用条件编译切换 loom 和真实实现
#[cfg(test)]
mod concurrency_tests {
    #[cfg(not(loom))]
    use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
    #[cfg(loom)]
    use loom::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

    #[cfg(not(loom))]
    use std::sync::Arc;
    #[cfg(loom)]
    use loom::sync::Arc;

    #[cfg(not(loom))]
    use std::thread;
    #[cfg(loom)]
    use loom::thread;

    #[test]
    fn test_concurrent_access() {
        #[cfg(loom)]
        loom::model(|| {
            self::test_body();
        });

        #[cfg(not(loom))]
        self::test_body();
    }

    fn test_body() {
        // 测试逻辑，使用上面的条件编译类型
    }
}
```

运行：

```bash
# 普通 cargo test（用 std）
cargo test

# loom 模型检查
RUSTFLAGS="--cfg loom" cargo test
```

### loom 的局限

- 只支持 `loom::sync` 中的类型（Atomic、Arc、Mutex 等）
- 不支持 `parking_lot`、`crossbeam` 等第三方并发原语
- 状态爆炸：线程越多、操作越多，枚举的交错数指数增长
- 需要手动将代码中的 `std::sync` 替换为 `loom::sync`

## unsafe 代码审查 checklist

### Checklist 总览

| 检查项 | 类别 | 严重性 |
|--------|------|--------|
| 指针有效性 | 内存 | 关键 |
| 别名规则 | 内存 | 关键 |
| 生命周期 | 内存 | 关键 |
| 初始化 | 内存 | 关键 |
| 整数溢出 | 算术 | 高 |
| 并发安全 | 并发 | 关键 |
| FFI 边界 | 跨语言 | 高 |
| panic 安全 | 控制 | 高 |
| 未定义行为 | 综合 | 关键 |

### 1. 指针有效性

```rust
unsafe fn process_ptr(ptr: *const u8, len: usize) {
    // Edition 2024: unsafe fn 函数体需显式 unsafe {}
    // ✓ 检查空指针
    if ptr.is_null() {
        return;
    }

    // ✓ 检查对齐（如果需要）
    assert_eq!((ptr as usize) % std::mem::align_of::<u8>(), 0);

    // ✓ 检查是否在有效分配范围内
    // （无法直接检查——需要从调用者保证）

    // ✓ 检查 len 是否合理
    if len > isize::MAX as usize {
        panic!("len too large");
    }

    unsafe {
        let slice = std::slice::from_raw_parts(ptr, len);
    }
}
```

**审查问题**：
- 指针是否可能为 null？是否检查了？
- 指针是否指向有效内存？保证来源是什么？
- 对齐要求是否满足？
- 偏移后是否仍在分配范围内？
- 是否有 `offset_from` 的前提条件？

### 2. 别名规则（Stacked Borrows / Tree Borrows）

```rust
// ❌ 违反别名规则
fn bad_aliasing(v: &mut Vec<i32>) -> &i32 {
    let ptr = v.as_ptr();  // 共享引用
    v.push(42);            // 可变引用——使 ptr 失效！
    unsafe { &*ptr }       // UB：使用已失效的指针
}

// ✓ 正确：在可变操作之前获取指针
fn good_aliasing(v: &mut Vec<i32>) -> i32 {
    v.push(42);
    let val = *v.last().unwrap();
    val
}
```

**审查问题**：
- 是否同时持有 `&T` 和 `&mut T`？
- 原始指针是否在可变引用活跃期间使用？
- `UnsafeCell` 是否正确使用？
- 引用和原始指针之间的 reborrow 链是否合法？

### 3. 生命周期

```rust
// ❌ 返回悬垂引用
fn dangling_ref<'a>(v: &mut Vec<i32>) -> &'a i32 {
    let ptr = v.as_ptr();
    // v 可能在 'a 结束前被 Drop
    unsafe { &*ptr }
}

// ✓ 使用索引代替引用
fn safe_access(v: &Vec<i32>, idx: usize) -> Option<i32> {
    v.get(idx).copied()
}
```

**审查问题**：
- 返回的引用/指针的生命周期是否被正确约束？
- 是否有栈上变量的引用逃逸到更长的生命周期？
- `transmute` 是否延长了生命周期？
- `Box::into_raw` / `Box::from_raw` 的生命周期是否配对？

### 4. 初始化

```rust
// ❌ 未初始化读取
fn bad_uninit() -> i32 {
    let mut x: i32;
    // x 未初始化就被使用
    unsafe { std::ptr::read(&x) }  // UB
}

// ✓ 使用 MaybeUninit
fn good_uninit() -> i32 {
    let mut x = std::mem::MaybeUninit::<i32>::uninit();
    unsafe {
        x.as_mut_ptr().write(42);  // 先写入
        x.assume_init()            // 再读取
    }
}

// ✓ 逐字段初始化结构体
fn init_struct() -> MyStruct {
    let mut s = std::mem::MaybeUninit::<MyStruct>::uninit();
    unsafe {
        let ptr = s.as_mut_ptr();
        std::ptr::addr_of_mut!((*ptr).field1).write(1);
        std::ptr::addr_of_mut!((*ptr).field2).write(2);
        std::ptr::addr_of_mut!((*ptr).field3).write(3);
        s.assume_init()
    }
}
```

**审查问题**：
- 是否有 `MaybeUninit::assume_init()` 在未初始化时调用？
- 结构体是否所有字段都已初始化？
- `read` / `write` 的顺序是否正确？
- 是否有 `mem::zeroed()` 对不合法类型的误用（如 `bool` 的 2、`char` 的非标量值）？

### 5. 并发安全

```rust
// ❌ 数据竞争
use std::sync::atomic::AtomicBool;
use std::cell::UnsafeCell;

struct BadOnce<T> {
    initialized: AtomicBool,
    value: UnsafeCell<T>,
}

impl<T> BadOnce<T> {
    fn get(&self) -> &T {
        if self.initialized.load(std::sync::atomic::Ordering::Relaxed) {
            unsafe { &*self.value.get() }
        } else {
            // 多个线程可能同时进入这里
            // 写入 value 的数据竞争！
            unsafe {
                std::ptr::write(self.value.get(), /* init */);
            }
            self.initialized.store(true, std::sync::atomic::Ordering::Relaxed);
            unsafe { &*self.value.get() }
        }
    }
}

// ✓ 使用正确的同步
struct GoodOnce<T> {
    initialized: AtomicBool,
    value: UnsafeCell<MaybeUninit<T>>,
}

impl<T> GoodOnce<T> {
    fn get(&self, init: impl FnOnce() -> T) -> &T {
        if self.initialized.load(std::sync::atomic::Ordering::Acquire) {
            unsafe { (*self.value.get()).assume_init_ref() }
        } else {
            let val = init();
            unsafe {
                std::ptr::write(self.value.get(), MaybeUninit::new(val));
            }
            self.initialized.store(true, std::sync::atomic::Ordering::Release);
            unsafe { (*self.value.get()).assume_init_ref() }
        }
    }
}
// 注意：上面的 GoodOnce 仍有一个问题——多线程同时初始化
// 生产代码应使用 std::sync::OnceLock
```

**审查问题**：
- `UnsafeCell` 的访问是否通过正确的同步原语守卫？
- Atomic 操作的 Ordering 是否足够强？
- 是否存在 TOCTOU（Time-of-check to time-of-use）竞争？
- `Send` / `Sync` 实现是否正确？

### 6. 整数溢出与未定义行为

```rust
// ❌ 潜在溢出
fn compute_offset(base: usize, offset: usize) -> *const u8 {
    // 如果 base + offset 溢出 usize，结果错误
    (base + offset) as *const u8
}

// ✓ 检查溢出
fn safe_offset(base: usize, offset: usize) -> Option<*const u8> {
    base.checked_add(offset).map(|addr| addr as *const u8)
}
```

### 7. FFI 边界

```rust
// ✓ FFI 边界的标准处理
#[unsafe(no_mangle)]
pub extern "C" fn my_lib_process(data: *const u8, len: usize) -> i32 {
    // 1. 验证输入
    if data.is_null() && len > 0 {
        return -1;
    }

    // 2. catch_unwind 防止 panic 跨边界
    let result = std::panic::catch_unwind(|| {
        let slice = if data.is_null() || len == 0 {
            &[]
        } else {
            unsafe { std::slice::from_raw_parts(data, len) }
        };
        internal_process(slice)
    });

    match result {
        Ok(Ok(())) => 0,
        Ok(Err(e)) => e as i32,
        Err(_) => -999,
    }
}
```

## geiger crate 统计 unsafe 使用量

### 安装与运行

```bash
cargo install cargo-geiger

# 统计当前 crate 和所有依赖的 unsafe 使用
cargo geiger

# 只统计依赖
cargo geiger --dependencies-only

# 指定特征
cargo geiger --features "full"
```

### 输出解读

```
Unsound (unsafe) packages:
  ┌───────────────────────────────┬────────────┬────────────┬────────────┬────────────┐
  │ Package                       │ Unsafe     │ Unsafe     │ Unsafe     │ Unsafe     │
  │                               │ extern     │ impl       │ trait      │ fn         │
  ├───────────────────────────────┼────────────┼────────────┼────────────┼────────────┤
  │ my-crate 0.1.0                │ 2          │ 3          │ 1          │ 5          │
  │ parking_lot_core 0.9.0        │ 0          │ 12         │ 0          │ 18         │
  │ smallvec 1.11.0               │ 0          │ 2          │ 0          │ 4          │
  └───────────────────────────────┴────────────┴────────────┴────────────┴────────────┘
```

各列含义：
- **Unsafe extern**：`extern "C"` 声明数量
- **Unsafe impl**：`unsafe impl` 数量
- **Unsafe trait**：`unsafe trait` 数量
- **Unsafe fn**：`unsafe fn` 数量

### 在 CI 中使用

```yaml
# .github/workflows/unsafe-audit.yml
name: Unsafe Audit

on: [push, pull_request]

jobs:
  geiger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install geiger
        run: cargo install cargo-geiger
      - name: Count unsafe
        run: |
          cargo geiger --dependencies-only 2>&1 | tee geiger-report.txt
          # 检查新增依赖的 unsafe 量
```

### 踸见发现

```bash
# 几乎所有 crate 都有 unsafe——问题不是"有没有"，而是"是否合理"
# 标准库本身就有大量 unsafe（指针操作、OS 调用等）

# 关注点：
# 1. 自己 crate 中 unsafe 的数量是否可接受？
# 2. 依赖中 unsafe 的数量是否意外地多？
# 3. 新增依赖是否引入了大量 unsafe？
```

## unsafe 审查流程

### 代码审查时的标准流程

```
1. 定位所有 unsafe 块和 unsafe fn
   └─ cargo geiger（自己的 crate）
   └─ grep -r "unsafe" src/

2. 对每个 unsafe 实例，检查：
   ├─ 是否有 # Safety 文档？
   ├─ Safety 的前置条件是否可验证？
   ├─ 调用处是否有 SAFETY 注释？
   ├─ 是否可通过 safe API 消除？
   └─ 是否有 Miri 测试覆盖？

3. 运行 Miri
   └─ cargo +nightly miri test

4. 运行 loom（如果有并发 unsafe）
   └─ RUSTFLAGS="--cfg loom" cargo test

5. 审查依赖的 unsafe
   └─ cargo geiger --dependencies-only
   └─ 审查关键依赖的 unsafe 代码
```

### unsafe 消除优先级

```rust
// 优先级 1：可以用 safe API 替代
// unsafe { std::ptr::copy(src, dst, len); }
// → src[..len].copy_to_slice(&mut dst[..len]);

// 优先级 2：缩小 unsafe 块范围
// unsafe {
//     let a = *ptr1;
//     let b = *ptr2;
//     let c = a + b;  // 加法不需要 unsafe！
// }
// →
// let (a, b) = unsafe { (*ptr1, *ptr2) };
// let c = a + b;

// 优先级 3：用封装层隔离
pub fn safe_wrapper(data: &[u8]) -> Result<u32> {
    if data.len() < 4 {
        return Err(Error::TooShort);
    }
    Ok(unsafe { read_u32_le(data.as_ptr()) })
}

unsafe fn read_u32_le(ptr: *const u8) -> u32 {
    // Safety: 调用者保证 ptr 有效且至少 4 字节
    // Edition 2024: unsafe fn 函数体需显式 unsafe {}
    unsafe {
        u32::from_le_bytes([
            *ptr,
            *ptr.add(1),
            *ptr.add(2),
            *ptr.add(3),
        ])
    }
}
```
