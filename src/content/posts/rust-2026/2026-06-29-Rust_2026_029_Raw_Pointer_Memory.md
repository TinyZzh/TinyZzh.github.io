---
title: "Rust 2026 经验谈 - 原始指针与内存操作"
published: 2026-06-29
description: "*const/*mut 操作全览、ptr::read/write/swap/copy_nonoverlapping、NonNull、内存对齐与 Layout、MaybeUninit 正确用法、从 Vec 到裸内存缓冲区。"
image: "/images/rust-2026/7.jpg"
tags: [Rust, Rust 2026, 原始指针, MaybeUninit, 内存布局, alloc]
category: Rust
draft: false
lang: zh_CN
---

![Unsafe Rust 与底层交互](/images/rust-2026/7.jpg)

原始指针（`*const T` / `*mut T`）是 Rust 与硬件、操作系统、C 代码交互的桥梁——`Vec` 的内部用它管理堆内存，FFI 用它传递数据，内核开发中它是主要工具。但原始指针绕过了 Rust 的核心安全保证，使用不当就是 UB。本文系统梳理原始指针的操作全貌、内存操作 API、`NonNull`/`MaybeUninit`/`Layout` 的正确用法，以及从 `Vec` 到裸内存缓冲区的实战路径。

## *const / *mut 操作全览

### 创建原始指针

```rust
// 方式一：从引用转换（最安全）
let x = 42;
let ptr: *const i32 = &x as *const i32;        // const 指针
let mut y = 99;
let mptr: *mut i32 = &mut y as *mut i32;        // mut 指针

// 方式二：从 Box 转换（接管所有权）
let boxed = Box::new(42);
let ptr: *mut i32 = Box::into_raw(boxed);       // ptr 现在拥有内存
// 必须手动释放！
unsafe { drop(Box::from_raw(ptr)); }

// 方式三：从 Vec 转换
let mut v = vec![1, 2, 3];
let ptr: *mut i32 = v.as_mut_ptr();

// 方式四：整数转指针（最危险，通常只在内核/嵌入式）
let addr: usize = 0x1000;
let ptr: *const u8 = addr as *const u8;

// 方式五：空指针
let null: *const i32 = std::ptr::null();
let null_mut: *mut i32 = std::ptr::null_mut();
```

### 指针运算

```rust
let mut v = vec![10, 20, 30, 40, 50];
let base: *mut i32 = v.as_mut_ptr();

unsafe {
    // 偏移：ptr.add(n) → 指向 ptr + n * size_of::<T>() 的字节
    let second = base.add(1);
    assert_eq!(*second, 20);

    // 负偏移
    let first = second.sub(1);
    assert_eq!(*first, 10);

    // 偏移量计算
    let offset = second.offset_from(base);
    assert_eq!(offset, 1);
}

// 安全注意：
// - add/sub 的结果必须在同一分配对象的范围内
// - add/sub 可以越界 1 位（"one-past-the-end"），但不能解引用
// - offset_from 要求两个指针指向同一对象
```

### 指针比较

```rust
let v = vec![1, 2, 3];
let p1: *const i32 = v.as_ptr();
let p2: *const i32 = unsafe { p1.add(1) };

// 指针比较
assert!(p1 < p2);          // 同一分配对象内可以比较
assert_ne!(p1, p2);        // 不相等

// 判断空指针
assert!(!p1.is_null());
assert!(std::ptr::null::<i32>().is_null());

// 判断对齐
assert!(p1.is_aligned());
// p1.is_aligned_to(4)  // Nightly
```

### *const 和 *mut 的转换

```rust
let mut x = 42;
let cptr: *const i32 = &x as *const i32;
let mptr: *mut i32 = cptr as *mut i32;  // const → mut（合法但不推荐）

// 推荐方式
let mptr2: *mut i32 = &mut x as *mut i32;

// *mut → *const 隐式转换
fn takes_const(ptr: *const i32) { /* ... */ }
takes_const(mptr);  // *mut 隐式转为 *const
```

**踩坑**：`*const T` → `*mut T` 的 `as` 转换不改变底层内存的可变性语义。如果原始内存不可变，通过 `*mut` 写入是 UB。

## ptr::read / write / swap / copy_nonoverlapping

### ptr::read —— 读取而不移动所有权

```rust
use std::ptr;

let x = Box::new(42);
let ptr: *const i32 = &*x;

unsafe {
    // read：复制值，不运行 Drop，不使原位置失效
    let val = ptr::read(ptr);
    assert_eq!(val, 42);
    // x 仍然有效！因为 read 不执行 Drop
}

// 如果用 *ptr 读取，语义是"移动"——原位置不再有效
// unsafe { let val = *ptr; }  // val 被"移动"出 *ptr
// 此时 x 已经失效，drop(x) 会 double free
```

**用途**：实现 `Vec::pop`——从数组末尾读出值，不 Drop 原位置（因为 len 减 1 后不再管那个位置）。

### ptr::write —— 写入而不 Drop 旧值

```rust
let mut x = 42;
let ptr: *mut i32 = &mut x as *mut i32;

unsafe {
    // write：直接写入，不 Drop 旧值
    ptr::write(ptr, 99);
    assert_eq!(x, 99);
    // 如果用 *ptr = 99，语义是"赋值"——先 Drop 旧值，再写入
    // 对于 i32 无影响，但对于有 Drop 的类型很重要
}
```

**踩坑**：

```rust
let mut s = String::from("hello");
let ptr: *mut String = &mut s as *mut String;

unsafe {
    // 错误！ptr::write 不 Drop 旧值，"hello" 的内存泄漏
    // ptr::write(ptr, String::from("world"));

    // 正确：先 drop 旧值
    ptr::drop_in_place(ptr);
    ptr::write(ptr, String::from("world"));
}

// 或者用赋值（自动 drop 旧值）
// s = String::from("world");  // 安全代码，推荐
```

### ptr::swap —— 交换两个位置的值

```rust
let mut a = 1;
let mut b = 2;
let pa: *mut i32 = &mut a;
let pb: *mut i32 = &mut b;

unsafe {
    ptr::swap(pa, pb);
}
assert_eq!(a, 2);
assert_eq!(b, 1);
```

**注意**：`ptr::swap` 允许两个指针重叠。`ptr::swap_nonoverlapping` 更高效但要求两个指针不重叠且指向正确对齐的已初始化值。

### ptr::copy_nonoverlapping —— 内存拷贝（类似 memcpy）

```rust
let src = [1, 2, 3, 4, 5];
let mut dst = [0i32; 5];

unsafe {
    ptr::copy_nonoverlapping(
        src.as_ptr(),        // 源
        dst.as_mut_ptr(),    // 目标
        5,                   // 元素数量（不是字节数！）
    );
}
assert_eq!(dst, [1, 2, 3, 4, 5]);
```

**关键区别**：

| 函数 | 对应 C 函数 | 重叠 | 方向 |
|------|-----------|------|------|
| `ptr::copy` | `memmove` | 允许 | 自动选择 |
| `ptr::copy_nonoverlapping` | `memcpy` | 不允许 | 从前到后 |

```rust
// ptr::copy 允许重叠（内部用 memmove）
unsafe {
    ptr::copy(src.as_ptr(), dst.as_mut_ptr(), count);
}

// ptr::copy_nonoverlapping 不允许重叠（更快）
unsafe {
    ptr::copy_nonoverlapping(src.as_ptr(), dst.as_mut_ptr(), count);
}
```

**踩坑**：`copy`/`copy_nonoverlapping` 的第三个参数是**元素数量**，不是字节数。对于 `*const i32`，拷贝 5 个元素 = 20 字节。

## NonNull 语义与使用

### NonNull 的定义

`NonNull<T>` 是 `*mut T` 的非空封装——它保证指针不为 null，但仍然不保证指针有效（可能悬垂）。

```rust
use std::ptr::NonNull;

let mut x = 42;
// 从引用创建（保证非空）
let nn = NonNull::new(&mut x).unwrap();

// 从原始指针创建（需要检查非空）
let ptr: *mut i32 = &mut x as *mut i32;
let nn2 = NonNull::new(ptr).expect("ptr should not be null");

// null 指针会返回 None
let null = NonNull::<i32>::new(std::ptr::null_mut());
assert!(null.is_none());
```

### NonNull 的优势

1. **与 Option 的布局优化**：`Option<NonNull<T>>` 与 `*mut T` 大小相同（null 表示 None）
2. **非空语义**：明确传达"此指针不为 null"的不变量
3. **Covariance**：`NonNull<T>` 对 T 是协变的（与 `*mut T` 的不变性不同）

```rust
// Option<NonNull<T>> 的布局优化
use std::ptr::NonNull;
use std::mem::size_of;

assert_eq!(size_of::<Option<NonNull<i32>>>(), size_of::<*mut i32>());
// Option<NonNull<T>> 和 *mut T 一样大！null 用 None 表示

// 这对链表、树等指针密集结构很重要——省掉了额外的 Option 开销
```

### NonNull 的典型应用：链表节点

```rust
use std::ptr::NonNull;

struct Node<T> {
    data: T,
    next: Option<NonNull<Node<T>>>,
    prev: Option<NonNull<Node<T>>>,
}

impl<T> Node<T> {
    fn new(data: T) -> Self {
        Node {
            data,
            next: None,
            prev: None,
        }
    }
}

struct LinkedList<T> {
    head: Option<NonNull<Node<T>>>,
    tail: Option<NonNull<Node<T>>>,
    len: usize,
}

impl<T> LinkedList<T> {
    fn new() -> Self {
        LinkedList { head: None, tail: None, len: 0 }
    }

    fn push_front(&mut self, data: T) {
        let mut node = Box::new(Node::new(data));
        node.next = self.head;
        node.prev = None;

        let node_ptr = NonNull::new(Box::into_raw(node) as *mut Node<T>).unwrap();

        match self.head {
            Some(old_head) => unsafe {
                // SAFETY: old_head 来自 into_raw，保证有效
                (*old_head.as_ptr()).prev = Some(node_ptr);
            },
            None => self.tail = Some(node_ptr),
        }

        self.head = Some(node_ptr);
        self.len += 1;
    }
}
```

### NonNull 的安全注意

- `NonNull` 不保证指针指向有效内存——只保证不为 null
- `NonNull` 不保证对齐
- `NonNull::dangling()` 提供一个对齐但未初始化的非空指针

```rust
let dangling: NonNull<u8> = NonNull::dangling();
// dangling 非空、对齐到 1（u8 的对齐要求），但不指向有效数据
// 不能解引用！
```

## 内存对齐与 Layout

### alloc::Layout

`std::alloc::Layout` 描述内存块的大小和对齐要求：

```rust
use std::alloc::Layout;

// 为单个 i32 创建 Layout：size=4, align=4
let layout = Layout::new::<i32>();
assert_eq!(layout.size(), 4);
assert_eq!(layout.align(), 4);

// 为数组 [i32; 10] 创建 Layout：size=40, align=4
let arr_layout = Layout::array::<i32>(10).unwrap();
assert_eq!(arr_layout.size(), 40);
assert_eq!(arr_layout.align(), 4);

// 手动指定 size 和 align
let custom = Layout::from_size_align(24, 8).unwrap();
assert_eq!(custom.size(), 24);
assert_eq!(custom.align(), 8);
```

### 常见操作

```rust
use std::alloc::Layout;

// 1. 检查 Layout 是否合法
let ok = Layout::from_size_align(16, 4);
assert!(ok.is_ok());

let bad = Layout::from_size_align(3, 0);  // 对齐不能为 0
assert!(bad.is_err());

// 2. 扩展 Layout（追加另一块内存）
let base = Layout::new::<i32>();  // size=4, align=4
let extra = Layout::new::<u64>(); // size=8, align=8
let (combined, offset) = base.extend(extra);
// combined: size=16, align=8
// offset: extra 在 combined 中的偏移 = 8（4 padding + 4 i32）
assert_eq!(combined.size(), 16);
assert_eq!(combined.align(), 8);
assert_eq!(offset, 8);

// 3. 重复 Layout（注意：Layout::repeat 已弃用，推荐用 Layout::array）
// Layout::array::<T>(n) 创建 n 个 T 元素的数组布局
let repeated = Layout::array::<u32>(5).unwrap();
assert_eq!(repeated.size(), 20);
assert_eq!(repeated.align(), 4);

// 4. padding 计算
let pad = base.padding_needed_for(extra.align());
assert_eq!(pad, 4);  // i32 后需要 4 字节 padding 才能满足 u64 对齐
```

### 手动分配与释放

```rust
use std::alloc::{alloc, dealloc, Layout};

fn manual_alloc_example() {
    let layout = Layout::array::<u8>(1024).unwrap();

    let ptr = unsafe {
        // SAFETY: layout.size() > 0，全局分配器有效
        let ptr = alloc(layout);
        if ptr.is_null() {
            std::alloc::handle_alloc_error(layout);
        }
        ptr
    };

    // 使用分配的内存
    unsafe {
        std::ptr::write_bytes(ptr, 0, 1024);  // 零初始化
    }

    // 释放
    unsafe {
        // SAFETY: ptr 来自 alloc(layout)，layout 匹配
        dealloc(ptr, layout);
    }
}
```

**踩坑**：`alloc` 和 `dealloc` 的 Layout 必须匹配——用 `alloc(layout)` 分配的内存必须用 `dealloc(ptr, layout)` 释放，layout 不一致是 UB。

### 对齐的常见陷阱

```rust
// 陷阱 1：结构体的对齐不等于字段对齐的最大值
// 如果有 repr(align)，对齐可能更大
#[repr(C, align(16))]
struct Aligned {
    data: [u8; 10],  // 10 字节，但对齐到 16
}

assert_eq!(std::mem::size_of::<Aligned>(), 16);  // padding 到 16
assert_eq!(std::mem::align_of::<Aligned>(), 16);

// 陷阱 2：Vec 的缓冲区对齐
// Vec<T> 保证其缓冲区对齐到 align_of::<T>()
// 但如果你手动分配，必须确保对齐

// 陷阱 3：过度对齐的类型
#[repr(align(4096))]
struct PageAligned {
    data: [u8; 4096],
}
// 分配这种类型需要支持过度对齐的分配器
```

## MaybeUninit 正确用法

### 为什么需要 MaybeUninit

Rust 要求所有变量在使用前必须初始化——但有时你需要在初始化前分配内存：

```rust
// 错误：未初始化的引用
// let x: i32;
// println!("{}", x);  // error: possibly-uninitialized

// MaybeUninit<T>：表示"可能未初始化的 T"
use std::mem::MaybeUninit;

let mut x: MaybeUninit<i32> = MaybeUninit::uninit();
// x 的内存已分配，但值未初始化
// 不能读取 x.assume_init()——UB！

x.write(42);  // 现在初始化了
let val = unsafe { x.assume_init() };  // OK
assert_eq!(val, 42);
```

### 逐步初始化模式

这是 `MaybeUninit` 最常见的用法——逐步初始化数组：

```rust
use std::mem::MaybeUninit;

fn init_array<F, T, const N: usize>(mut init: F) -> [T; N]
where
    F: FnMut(usize) -> T,
{
    let mut arr: [MaybeUninit<T>; N] = unsafe { MaybeUninit::uninit().assume_init() };
    // 注意：[MaybeUninit<T>; N] 的 uninit 不是 [MaybeUninit::uninit(); N]
    // 我们需要数组的每个元素都是 uninit，但数组本身是"已初始化"的
    // 这里的 unsafe 是安全的，因为 MaybeUninit<T> 没有有效性要求

    let mut i = 0;
    while i < N {
        arr[i].write(init(i));
        i += 1;
    }

    unsafe { MaybeUninit::array_assume_init(arr) }
}

let squares: [i32; 5] = init_array(|i| (i as i32) * (i as i32));
assert_eq!(squares, [0, 1, 4, 9, 16]);
```

### MaybeUninit 的核心 API

| API | 语义 | 安全性 |
|-----|------|--------|
| `MaybeUninit::uninit()` | 创建未初始化值 | 安全 |
| `MaybeUninit::new(val)` | 创建已初始化值 | 安全 |
| `x.write(val)` | 写入值（初始化） | 安全 |
| `x.assume_init()` | 假设已初始化，取出值 | unsafe |
| `x.as_ptr()` | 获取内部指针 | 安全 |
| `x.as_mut_ptr()` | 获取内部可变指针 | 安全 |
| `MaybeUninit::array_assume_init(arr)` | 假设数组所有元素已初始化 | unsafe |

### 踩坑一：`[MaybeUninit::uninit(); N]` 不对

```rust
use std::mem::MaybeUninit;

// 错误！这会对每个元素调用 Clone，但 MaybeUninit<T> 不实现 Clone
// let arr: [MaybeUninit<i32>; 3] = [MaybeUninit::uninit(); 3];

// 正确方式一：用 unsafe（安全，因为 MaybeUninit 无有效性要求）
let arr: [MaybeUninit<i32>; 3] = unsafe { MaybeUninit::uninit().assume_init() };

// 正确方式二：用 const 泛型 + Default（如果 T: Default）
fn uninit_array<T, const N: usize>() -> [MaybeUninit<T>; N] {
    unsafe { MaybeUninit::uninit().assume_init() }
}
```

### 踩坑二：`assume_init` 后不要再读取

```rust
use std::mem::MaybeUninit;

let mut x: MaybeUninit<String> = MaybeUninit::uninit();
x.write(String::from("hello"));

let s: String = unsafe { x.assume_init() };
// 此时 x 中的 String 已经被"移动"出来
// 不能再调用 x.assume_init()——double free
```

### 踩坑三：部分初始化的数组

```rust
use std::mem::MaybeUninit;

// 场景：只初始化前几个元素
let mut arr: [MaybeUninit<i32>; 5] = unsafe { MaybeUninit::uninit().assume_init() };

arr[0].write(1);
arr[1].write(2);
// arr[2..5] 未初始化

// 不能调用 array_assume_init——需要先初始化所有元素
// unsafe { MaybeUninit::array_assume_init(arr) }  // UB！

// 正确：只取出已初始化的部分
unsafe {
    assert_eq!(arr[0].assume_init(), 1);
    assert_eq!(arr[1].assume_init(), 2);
}
```

### MaybeUninit 与 Vec 的配合

```rust
use std::mem::MaybeUninit;

struct MyVec<T> {
    data: *mut MaybeUninit<T>,
    len: usize,
    cap: usize,
}

impl<T> MyVec<T> {
    fn new() -> Self {
        MyVec {
            data: std::ptr::null_mut(),
            len: 0,
            cap: 0,
        }
    }

    fn push(&mut self, val: T) {
        if self.len == self.cap {
            self.grow();
        }
        unsafe {
            // SAFETY: len < cap，data 指向 cap 个 MaybeUninit<T>
            self.data.add(self.len).write(MaybeUninit::new(val));
        }
        self.len += 1;
    }

    fn get(&self, i: usize) -> Option<&T> {
        if i < self.len {
            unsafe {
                // SAFETY: i < len，元素已初始化
                Some(&*self.data.add(i).cast::<T>())
            }
        } else {
            None
        }
    }

    fn grow(&mut self) {
        let new_cap = if self.cap == 0 { 4 } else { self.cap * 2 };
        let new_layout = std::alloc::Layout::array::<MaybeUninit<T>>(new_cap).unwrap();

        let new_data = if self.cap == 0 {
            unsafe { std::alloc::alloc(new_layout) as *mut MaybeUninit<T> }
        } else {
            let old_layout = std::alloc::Layout::array::<MaybeUninit<T>>(self.cap).unwrap();
            unsafe {
                std::alloc::realloc(
                    self.data as *mut u8,
                    old_layout,
                    new_layout.size(),
                ) as *mut MaybeUninit<T>
            }
        };

        if new_data.is_null() {
            std::alloc::handle_alloc_error(new_layout);
        }

        self.data = new_data;
        self.cap = new_cap;
    }
}

impl<T> Drop for MyVec<T> {
    fn drop(&mut self) {
        if self.cap == 0 { return; }

        // Drop 已初始化的元素
        for i in 0..self.len {
            unsafe {
                // SAFETY: i < len，元素已初始化
                std::ptr::drop_in_place(self.data.add(i).cast::<T>());
            }
        }

        // 释放内存
        let layout = std::alloc::Layout::array::<MaybeUninit<T>>(self.cap).unwrap();
        unsafe {
            std::alloc::dealloc(self.data as *mut u8, layout);
        }
    }
}
```

## 从 Vec 到裸内存缓冲区

### 为什么需要裸内存

- **零拷贝 I/O**：直接从内核缓冲区读取
- **自定义分配器**：arena、pool、mmap
- **FFI 交互**：C 库的缓冲区管理
- **嵌入式**：无堆、固定地址

### 路径一：Vec → 原始指针

```rust
fn vec_to_raw() {
    let mut v: Vec<u8> = Vec::with_capacity(1024);

    // 获取指针和容量
    let ptr = v.as_mut_ptr();
    let cap = v.capacity();
    let len = v.len();

    // 忘记 Vec（防止 Drop）
    std::mem::forget(v);

    // 现在 ptr 指向的内存由我们手动管理
    unsafe {
        std::ptr::write_bytes(ptr, 0xAA, cap);  // 填充
    }

    // 重新构造 Vec
    let v2 = unsafe { Vec::from_raw_parts(ptr, len, cap) };
    // v2 析构时释放内存
}
```

### 路径二：裸分配 → Vec

```rust
use std::alloc::{alloc, dealloc, Layout};

fn raw_to_vec() {
    let layout = Layout::array::<u8>(1024).unwrap();
    let ptr = unsafe { alloc(layout) };
    if ptr.is_null() {
        panic!("allocation failed");
    }

    // 初始化内存
    unsafe {
        std::ptr::write_bytes(ptr, 0, 1024);
    }

    // 转为 Vec
    let v = unsafe { Vec::from_raw_parts(ptr as *mut u8, 0, 1024) };
    // v.capacity() == 1024, v.len() == 0

    // 用 Vec 的 API 操作
    v.into_iter();  // 或任何 Vec 操作
}
```

### 路径三：mmap（操作系统内存映射）

```rust
use std::ptr;

fn mmap_buffer(size: usize) -> (*mut u8, usize) {
    // 概念示例（实际需要 libc::mmap）
    let layout = Layout::from_size_align(size, 4096).unwrap();  // 页对齐
    let ptr = unsafe { alloc(layout) };
    if ptr.is_null() {
        panic!("mmap failed");
    }
    (ptr, size)
}

fn unmap_buffer(ptr: *mut u8, size: usize) {
    let layout = Layout::from_size_align(size, 4096).unwrap();
    unsafe {
        dealloc(ptr, layout);
    }
}
```

### 路径四：栈上固定大小缓冲区

```rust
use std::mem::MaybeUninit;

struct StackBuffer<T, const N: usize> {
    data: [MaybeUninit<T>; N],
    len: usize,
}

impl<T, const N: usize> StackBuffer<T, N> {
    fn new() -> Self {
        StackBuffer {
            data: unsafe { MaybeUninit::uninit().assume_init() },
            len: 0,
        }
    }

    fn push(&mut self, val: T) -> Result<(), T> {
        if self.len >= N {
            return Err(val);
        }
        self.data[self.len].write(val);
        self.len += 1;
        Ok(())
    }

    fn as_slice(&self) -> &[T] {
        unsafe {
            // SAFETY: data[..len] 已初始化
            std::slice::from_raw_parts(
                self.data.as_ptr() as *const T,
                self.len,
            )
        }
    }
}

impl<T, const N: usize> Drop for StackBuffer<T, N> {
    fn drop(&mut self) {
        for i in 0..self.len {
            unsafe {
                std::ptr::drop_in_place(self.data[i].as_mut_ptr());
            }
        }
    }
}

let mut buf: StackBuffer<u8, 64> = StackBuffer::new();
buf.push(1).unwrap();
buf.push(2).unwrap();
assert_eq!(buf.as_slice(), &[1, 2]);
```

## 实战经验总结

### 1. 优先用 `&T` / `&mut T` 代替原始指针

只有在以下场景才需要原始指针：
- FFI 调用
- 自定义容器（Vec、HashMap、链表）
- 零拷贝 I/O
- 嵌入式/内核

### 2. 原始指针和引用共存时的借用规则

```rust
let mut x = 42;
let ptr: *mut i32 = &mut x as *mut i32;

// 这段代码在安全层面是合法的，但注意：
// - ptr 的生命周期和 &mut x 相同
// - 如果 ptr 在 &mut x 作用域外使用——悬垂指针
// - 编译器不检查原始指针的生命周期！
```

### 3. 用 NonNull 代替 `*mut T` 当你保证非空

`NonNull<T>` 的布局优化（`Option<NonNull<T>>` = `*mut T`）在指针密集结构中节省大量内存。

### 4. MaybeUninit 是未初始化内存的唯一正确方式

```rust
// 不好：用 mem::zeroed()（可能违反有效性要求）
// let x: MaybeUninit<bool> = MaybeUninit::zeroed();
// bool 的 0 和 1 是合法的，但其他类型的 0 可能不合法

// 好：用 MaybeUninit::uninit()（不假设任何值）
let x: MaybeUninit<bool> = MaybeUninit::uninit();
```

### 5. 每次 unsafe 都用 Miri 验证

```bash
rustup +nightly component add miri
cargo +nightly miri test
# Miri 会捕获大多数原始指针相关的 UB
```
