---
title: "Rust 2026 经验谈 - FFI 实战：Rust 调用 C"
published: 2026-06-30
description: "bindgen 自动生成绑定、repr(C) 布局保证与结构体对齐、回调函数跨语言、panic 跨 FFI 边界处理、字符串传递、常见坑。"
image: "/images/rust-2026/7.jpg"
tags: [Rust, Rust 2026, FFI, bindgen, repr(C), C互操作]
category: Rust
draft: false
lang: zh_CN
---

![Unsafe Rust 与底层交互](/images/rust-2026/7.jpg)

Rust 调用 C 库是系统编程的日常——无论是使用操作系统 API、遗留 C 代码、还是高性能 C 库。FFI（Foreign Function Interface）看似简单（`unsafe extern "C" {}` + `unsafe`），但实战中暗藏大量坑：布局不匹配、回调函数桥接、panic 跨边界、字符串传递、枚举表示……本文从 bindgen 到手动绑定，系统总结 Rust 调用 C 的实战经验。

## bindgen 自动生成绑定

### 基本用法

`bindgen` 从 C/C++ 头文件自动生成 Rust FFI 绑定，避免手写 `extern "C"` 声明：

```toml
# build-dependencies
[build-dependencies]
bindgen = "0.70"
```

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

```c
// wrapper.h
#include <sqlite3.h>
```

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

mod bindings {
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}

use bindings::*;

unsafe {
    let mut db: *mut sqlite3 = std::ptr::null_mut();
    let rc = sqlite3_open(b"test.db\0".as_ptr() as *const i8, &mut db);
    if rc != SQLITE_OK {
        panic!("Failed to open database");
    }
    sqlite3_close(db);
}
```

### bindgen 配置选项

```rust
let bindings = bindgen::Builder::default()
    .header("wrapper.h")
    // 只生成指定符号的绑定
    .allowlist_function("sqlite3_.*")
    .allowlist_type("sqlite3.*")
    .allowlist_var("SQLITE_.*")

    // 屏蔽不需要的符号
    .blocklist_type("__.*")           // 内部类型
    .blocklist_function(".*_internal") // 内部函数

    // 生成 Rust 文档注释
    .generate_comments(true)

    // 处理不透明类型
    .opaque_type("sqlite3")           // sqlite3 是不透明指针

    // 设置默认枚举大小
    .default_enum_style(bindgen::EnumVariation::Rust {
        non_exhaustive: true,
    })

    // 添加自定义属性
    .must_use_type("sqlite3.*")

    .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
    .generate()
    .expect("Unable to generate bindings");
```

### allowlist / blocklist 策略

**策略一：白名单（推荐）**

只生成你需要的符号，减少编译时间和冲突：

```rust
let bindings = bindgen::Builder::default()
    .header("wrapper.h")
    .allowlist_function("my_lib_init")
    .allowlist_function("my_lib_process")
    .allowlist_function("my_lib_cleanup")
    .allowlist_type("MyLibConfig")
    .allowlist_type("MyLibResult")
    .allowlist_var("MY_LIB_VERSION")
    .generate()
    .unwrap();
```

**策略二：黑名单 + 白名单组合**

先生成所有，再屏蔽问题符号：

```rust
let bindings = bindgen::Builder::default()
    .header("wrapper.h")
    .blocklist_type("_.*")           // 屏蔽下划线开头的内部类型
    .blocklist_function(".*_debug")  // 屏蔽调试函数
    .allowlist_type("PublicAPI")     // 确保 PublicAPI 被生成
    .generate()
    .unwrap();
```

### 不透明类型

当 C 库不暴露结构体定义时，用不透明类型：

```c
// C 头文件：只声明，不定义
typedef struct sqlite3 sqlite3;
```

```rust
// bindgen 生成：不透明类型
#[repr(C)]
pub struct sqlite3 {
    _private: [u8; 0],
}
// sqlite3 是不完整类型——只能通过指针使用
// 不能构造 sqlite3 值，不能访问字段
```

### 踩坑：bindgen 生成的类型可能不符合 Rust 惯例

```rust
// bindgen 生成：
pub type my_lib_error_code_t = u32;
pub const MY_LIB_OK: my_lib_error_code_t = 0;
pub const MY_LIB_ERR: my_lib_error_code_t = 1;

// 可能的问题：
// 1. 命名不符合 Rust 惯例（snake_case）
// 2. 枚举生成为常量而非 enum
// 3. 某些 C 特性（bitfields、flexible array member）不支持

// 变通：在 build.rs 中手动替换
let bindings = bindgen::Builder::default()
    .header("wrapper.h")
    .raw_line("use std::os::raw::c_int;")  // 手动添加行
    .generate()
    .unwrap();
```

## repr(C) 布局保证与结构体对齐

### repr(C) 的含义

`repr(C)` 保证 Rust 结构体使用 C 的布局规则：
- 字段按声明顺序排列
- 对齐到最大字段对齐
- 没有 Rust 特有的重排优化

```rust
// C 结构体
// struct Point {
//     int32_t x;
//     int32_t y;
//     int32_t z;
// };

// Rust 对应
#[repr(C)]
struct Point {
    x: i32,
    y: i32,
    z: i32,
}

// 不加 repr(C)，Rust 可能重排字段（虽然 i32 不会）
// 但对于不同类型字段，重排可能发生
```

### repr(C) vs repr(Rust)

```rust
#[repr(C)]
struct CLayout {
    a: u8,    // offset 0
    b: u32,   // offset 4（3 字节 padding）
    c: u8,    // offset 8
}  // size = 12, align = 4

#[repr(Rust)]  // 默认
struct RustLayout {
    a: u8,    // offset 0
    b: u32,   // offset 4
    c: u8,    // offset 8（或可能重排：a,c 在前，b 在后）
}  // size = 12（或可能 8）
```

### 结构体对齐的控制

```rust
// C: __attribute__((aligned(16)))
#[repr(C, align(16))]
struct AlignedBuffer {
    data: [u8; 64],
}
assert_eq!(std::mem::align_of::<AlignedBuffer>(), 16);

// C: #pragma pack(1)
#[repr(C, packed)]
struct PackedHeader {
    magic: u16,
    version: u8,
    size: u32,  // 未对齐！访问可能 UB
}
// 注意：packed 结构体中未对齐字段的引用是 UB
// 必须通过 copy 访问：
let header: PackedHeader = /* ... */;
// let size: &u32 = &header.size;  // UB！未对齐引用
let size: u32 = header.size;        // OK：copy 出来
```

### 联合体

```rust
// C union
// union Data {
//     int32_t as_int;
//     float as_float;
//     void* as_ptr;
// };

#[repr(C)]
union Data {
    as_int: i32,
    as_float: f32,
    as_ptr: *mut std::ffi::c_void,
}

// 访问联合体字段需要 unsafe
let mut d = Data { as_int: 42 };
unsafe {
    println!("as_int: {}", d.as_int);     // OK：最近写入的是 as_int
    // println!("as_float: {}", d.as_float);  // UB：未激活字段
}
```

### 踩坑：padding 中的垃圾数据

```rust
#[repr(C)]
struct Header {
    version: u8,   // 1 字节
    // 3 字节 padding
    length: u32,   // 4 字节
}

// 如果用 memcmp 比较两个 Header：
// padding 中的值未定义，memcmp 可能返回"不等"即使字段相同
// 变通：确保 padding 为零
let h1 = Header { version: 1, length: 100 };
let h2 = Header { version: 1, length: 100 };

unsafe {
    // 不能保证 ptr::eq 或 memcmp 正确
    // 用字段比较
    assert_eq!(h1.version, h2.version);
    assert_eq!(h1.length, h2.length);
}
```

## 回调函数跨语言

### C 函数指针 → Rust 函数

```c
// C 库
typedef void (*callback_t)(int event, void* user_data);
void register_callback(callback_t cb, void* user_data);
```

```rust
type Callback = extern "C" fn(event: i32, user_data: *mut std::ffi::c_void);

unsafe extern "C" {
    fn register_callback(cb: Callback, user_data: *mut std::ffi::c_void);
}

extern "C" fn my_callback(event: i32, user_data: *mut std::ffi::c_void) {
    // 注意：这个函数不能捕获环境！
    let ctx = unsafe { &mut *(user_data as *mut Context) };
    match event {
        1 => ctx.on_connect(),
        2 => ctx.on_disconnect(),
        _ => {}
    }
}

struct Context {
    connected: bool,
}

impl Context {
    fn on_connect(&mut self) { self.connected = true; }
    fn on_disconnect(&mut self) { self.connected = false; }
}

let mut ctx = Box::new(Context { connected: false });
unsafe {
    register_callback(my_callback, &mut *ctx as *mut Context as *mut std::ffi::c_void);
}
```

### C 函数指针 → Rust 闭包桥接

C 库的回调不能直接接收 Rust 闭包——闭包有捕获环境，不是函数指针。桥接模式：

```rust
use std::ffi::c_void;

type CCallback = extern "C" fn(i32, *mut c_void);

unsafe extern "C" {
    fn register_callback(cb: CCallback, user_data: *mut c_void);
}

// 桥接函数
extern "C" fn trampoline<F: FnMut(i32)>(event: i32, user_data: *mut c_void) {
    let closure = unsafe { &mut *(user_data as *mut F) };
    closure(event);
}

fn register_rust_callback<F: FnMut(i32) + 'static>(mut closure: F) {
    let boxed = Box::new(closure);
    let user_data = Box::into_raw(boxed) as *mut c_void;

    unsafe {
        // SAFETY: trampoline 与 CCallback 签名匹配
        // user_data 指向堆上的 F
        register_callback(trampoline::<F>, user_data);
    }

    // 注意：user_data 的内存何时释放？
    // 需要.unregister_callback() 或在库销毁时释放
}
```

**使用**：

```rust
let mut count = 0i32;
register_rust_callback(move |event| {
    count += 1;
    println!("Event {}: count = {}", event, count);
});
```

### 踩坑：闭包的生命周期

```rust
// 错误！闭包引用了栈上的变量
fn bad_callback() {
    let local = 42;
    register_rust_callback(move |_| {
        // local 被移动到闭包中——OK
        println!("{}", local);
    });
}

// 更危险的情况：
fn worse_callback() {
    let local = vec![1, 2, 3];
    let ptr = &local as *const Vec<i32>;
    register_rust_callback(move |_| {
        // 如果 local 没有被 move 到闭包中，ptr 可能悬垂
        // 用 move 捕获是安全的
    });
}
```

### 线程安全回调

如果 C 库在非 Rust 线程上调用回调，闭包必须是 `Send`：

```rust
fn register_thread_safe_callback<F: FnMut(i32) + Send + 'static>(closure: F) {
    let boxed = Box::new(closure);
    let user_data = Box::into_raw(boxed) as *mut c_void;
    // F: Send 保证闭包可以安全地在其他线程执行
    unsafe {
        register_callback(trampoline::<F>, user_data);
    }
}
```

## panic 跨 FFI 边界处理

### 核心规则：panic 不可跨越 FFI 边界

如果 Rust 代码 panic 后 unwind 到 C 栈帧——**未定义行为**。C 代码没有 Rust 的 unwind 机制，unwind 到 C 栈帧等于破坏 C 的栈。

### 解决方案：catch_unwind

```rust
use std::panic::catch_unwind;

extern "C" fn safe_callback(event: i32, user_data: *mut c_void) {
    let result = catch_unwind(|| {
        let ctx = unsafe { &mut *(user_data as *mut Context) };
        ctx.handle_event(event);  // 可能 panic
    });

    if result.is_err() {
        // panic 被捕获，不会越过 FFI 边界
        eprintln!("Rust callback panicked! Aborting to avoid UB.");
        std::process::abort();  // 或记录日志后忽略
    }
}
```

### 另一方案：panic = abort

```toml
# Cargo.toml
[profile.release]
panic = "abort"

# 所有 release 构建中 panic 直接终止，不可能 unwind
# 缺点：整个进程终止，不能优雅恢复
```

### extern "C-unwind"（Stable since Rust 1.84）

```rust
// extern "C-unwind" 允许 panic 跨 FFI 边界
// 如果 C 侧也支持 unwind（如 C++ 的 exception）
// Rust 1.84 起稳定

extern "C-unwind" fn may_panic() {
    panic!("oops");
}
// 如果 C 侧是 C++ 且用 try/catch，可以捕获
```

### 踩坑：不是所有 panic 都能被 catch_unwind 捕获

```rust
use std::panic::catch_unwind;

// catch_unwind 不能捕获：
// 1. panic = abort 时（直接终止）
// 2. std::process::exit()（不是 panic）
// 3. 某些 UB 触发前的 panic

let result = catch_unwind(|| {
    // 这会被捕获
    panic!("normal panic");
});
assert!(result.is_err());

let result2 = catch_unwind(|| {
    // 这不会被捕获（如果设了 panic=abort）
    // std::process::exit(1);
    todo!()
});
```

## 字符串传递

### CString vs CStr

| 类型 | 所有权 | 用途 |
|------|--------|------|
| `CString` | 拥有 | Rust → C（创建 C 字符串） |
| `CStr` | 借用 | C → Rust（引用 C 字符串） |

### Rust → C：CString

```rust
use std::ffi::CString;

let rust_str = "hello world";
let c_string = CString::new(rust_str).expect("CString::new failed");
// c_string 内部是 "hello world\0"

// 传递给 C
unsafe {
    c_function(c_string.as_ptr());
}
```

**踩坑一：内嵌 null 字节**

```rust
// CString::new 会拒绝包含 \0 的字符串
let bad = CString::new("hello\0world");
assert!(bad.is_err());

// 原因：C 字符串以 \0 结尾，内嵌 \0 会被 C 误认为字符串结束
```

**踩坑二：as_ptr 的生命周期**

```rust
// 错误！c_string 在表达式结束时 Drop，ptr 悬垂
// let ptr = CString::new("hello").unwrap().as_ptr();
// unsafe { c_function(ptr); }  // UB！ptr 已经失效

// 正确：保持 CString 存活
let c_string = CString::new("hello").unwrap();
let ptr = c_string.as_ptr();
unsafe { c_function(ptr); }
// c_string 在此之后才 Drop
```

### C → Rust：CStr

```rust
use std::ffi::CStr;

unsafe extern "C" {
    fn get_string() -> *const i8;
}

let ptr = unsafe { get_string() };
if !ptr.is_null() {
    let c_str = unsafe { CStr::from_ptr(ptr) };
    // c_str 是 &CStr，借用 C 的字符串

    // 转为 Rust &str（可能失败——不是 UTF-8）
    let rust_str: Result<&str, _> = c_str.to_str();
    if let Ok(s) = rust_str {
        println!("Got: {}", s);
    }

    // 转为 String（总是成功，但会替换非 UTF-8 字节）
    let owned = c_str.to_string_lossy().into_owned();
}
```

### 字节传递：无需 UTF-8

```rust
// 如果传递的是任意字节（非字符串），用 *const u8 + 长度
unsafe extern "C" {
    fn process_bytes(data: *const u8, len: usize);
}

let data = b"arbitrary bytes including \0 null";
unsafe {
    process_bytes(data.as_ptr(), data.len());
}
```

### 常见字符串传递模式

```rust
use std::ffi::{CString, CStr};

// 模式一：Rust 分配，Rust 释放
fn pass_to_c(s: &str) -> i32 {
    let c_str = CString::new(s).unwrap();
    unsafe { c_count_chars(c_str.as_ptr()) }
}

// 模式二：C 分配，C 释放
fn get_from_c() -> String {
    let ptr = unsafe { c_get_string() };
    let c_str = unsafe { CStr::from_ptr(ptr) };
    let result = c_str.to_string_lossy().into_owned();
    unsafe { c_free_string(ptr as *mut i8); }
    result
}

// 模式三：C 分配，Rust 释放（需要 C 用 malloc，Rust 用 libc::free）
fn take_ownership_from_c() -> String {
    let ptr = unsafe { c_get_malloc_string() };
    let c_str = unsafe { CStr::from_ptr(ptr) };
    let result = c_str.to_string_lossy().into_owned();
    unsafe { libc::free(ptr as *mut libc::c_void); }
    result
}

// 注意：c_count_chars, c_get_string, c_free_string, c_get_malloc_string
// 需要在 unsafe extern "C" {} 中声明（Edition 2024）
```

## 常见坑：枚举表示、零大小类型

### 坑一：C 枚举的大小不确定

C 的 `enum` 大小由编译器决定——可能是 1、2、4、8 字节。Rust 的 `enum` 默认用最小能容纳的整数。

```c
// C
enum Status { OK = 0, ERROR = 1, PENDING = 2 };
```

```rust
// 错误！Rust enum 可能是 1 字节，C enum 可能是 4 字节
#[repr(C)]
enum Status {
    Ok = 0,
    Error = 1,
    Pending = 2,
}

// 正确：显式指定大小
#[repr(C, i32)]  // 保证是 i32（4 字节）
enum Status {
    Ok = 0,
    Error = 1,
    Pending = 2,
}

// 或更安全：用常量 + 类型别名
type Status = u32;
const STATUS_OK: Status = 0;
const STATUS_ERROR: Status = 1;
const STATUS_PENDING: Status = 2;
```

**bindgen 的处理**：bindgen 默认将 C 枚举生成为常量，避免大小不匹配。

### 坑二：C 的 bitfield

```c
// C
struct Flags {
    unsigned int a : 1;
    unsigned int b : 3;
    unsigned int c : 4;
};
```

```rust
// bindgen 对 bitfield 的支持有限
// 生成的绑定可能无法正确访问 bitfield
// 变通：手动实现 getter/setter

#[repr(C)]
struct Flags {
    bits: u32,  // 整体存储
}

impl Flags {
    fn a(&self) -> u32 { self.bits & 0x1 }
    fn b(&self) -> u32 { (self.bits >> 1) & 0x7 }
    fn c(&self) -> u32 { (self.bits >> 4) & 0xF }

    fn set_a(&mut self, val: u32) { self.bits = (self.bits & !0x1) | (val & 0x1); }
    fn set_b(&mut self, val: u32) { self.bits = (self.bits & !(0x7 << 1)) | ((val & 0x7) << 1); }
    fn set_c(&mut self, val: u32) { self.bits = (self.bits & !(0xF << 4)) | ((val & 0xF) << 4); }
}
```

### 坑三：零大小类型（ZST）

Rust 的单元类型 `()` 是零大小类型（ZST），C 没有对应概念：

```rust
// Rust ZST
struct Empty;  // size = 0, align = 1

// 如果 C 期望 void* 但 Rust 传递 *const ()：
// *const () 是非空指针，但 C 可能对零大小分配有特殊处理
```

**规则**：FFI 中不要传递 ZST。如果 C 用 `void*` 表示"无数据"，用 `*mut c_void` 的 null 指针。

### 坑四：C 的 flexible array member

```c
// C99
struct Message {
    int type;
    int length;
    char data[];  // flexible array member
};
```

```rust
// Rust 不支持 flexible array member
// 变通：用原始指针 + 手动偏移

#[repr(C)]
struct MessageHeader {
    msg_type: i32,
    length: i32,
    // data 字段不直接表示
}

impl MessageHeader {
    fn data_ptr(&self) -> *const u8 {
        unsafe {
            (self as *const Self as *const u8).add(std::mem::size_of::<MessageHeader>())
        }
    }

    fn data_slice(&self) -> &[u8] {
        unsafe {
            std::slice::from_raw_parts(self.data_ptr(), self.length as usize)
        }
    }
}
```

### 坑五：long 的大小不固定

```rust
// C 的 long：Windows 4 字节，Linux 64-bit 8 字节
// 不要用 i64/i32 对应 C 的 long

// 正确：用 c_long
use std::os::raw::c_long;

#[repr(C)]
struct CStruct {
    value: c_long,  // 自动匹配平台
}
```

### 坑六：函数签名不匹配

```rust
// C：int process(const char* input, size_t len)
// 错误！
unsafe extern "C" {
    fn process(input: *const u8, len: u32) -> i32;  // len 类型不对！
}

// 正确
unsafe extern "C" {
    fn process(input: *const i8, len: usize) -> i32;
}
// *const i8 对应 const char*
// usize 对应 size_t
```

**C 类型到 Rust 类型的对应表**：

| C 类型 | Rust 类型 | 说明 |
|--------|-----------|------|
| `char` | `c_char` | 平台相关：i8 或 u8 |
| `short` | `c_short` | 平台相关 |
| `int` | `c_int` | 平台相关 |
| `long` | `c_long` | 平台相关 |
| `long long` | `c_longlong` | 通常是 i64 |
| `size_t` | `usize` | 指针大小的无符号整数 |
| `ssize_t` | `isize` | 指针大小的有符号整数 |
| `void*` | `*mut c_void` | 原始指针 |
| `const void*` | `*const c_void` | 原始指针 |
| `bool` | `bool`（C23 前：`c_int`） | C99 无 bool |

## 实战经验总结

### 1. 优先用 bindgen，手写绑定只用于简单场景

对于超过 10 个函数的 C 库，手写绑定的维护成本极高。

### 2. 所有 FFI 调用都在 unsafe 块中，且加 SAFETY 注释

```rust
unsafe {
    // SAFETY: db 来自 sqlite3_open，保证有效
    // sql 指向 null-terminated UTF-8 字符串
    let rc = sqlite3_exec(db, sql.as_ptr(), None, std::ptr::null_mut(), std::ptr::null_mut());
}
```

### 3. FFI 函数不 panic

```rust
extern "C" fn callback(data: *mut c_void) {
    let result = std::panic::catch_unwind(|| {
        // 可能 panic 的逻辑
    });
    if result.is_err() {
        std::process::abort();
    }
}
```

### 4. 用 cargo test + Miri 验证 FFI

```bash
cargo test
cargo +nightly miri test  # 检测 UB
```

### 5. CI 中用 C 的 sanitizers

```bash
# Address Sanitizer
RUSTFLAGS="-Z sanitizer=address" cargo +nightly test

# Memory Sanitizer
RUSTFLAGS="-Z sanitizer=memory" cargo +nightly test
```
