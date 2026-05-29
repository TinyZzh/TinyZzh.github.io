---
title: "Rust 2026 经验谈 - 所有权模型经验谈"
published: 2026-06-05
description: "深入所有权心智模型、借用检查器常见对抗与和解方案、2024 Edition 生命周期省略规则调整、reborrowing 深层理解与函数签名设计经验。"
image: "/images/rust-2026/2.jpg"
tags: [Rust, Rust 2026, 所有权, 借用检查器, 生命周期]
category: Rust
draft: false
lang: zh_CN
---

![类型系统与所有权深化](/images/rust-2026/2.jpg)

所有权是 Rust 最核心也最独特的概念。无数开发者在学习 Rust 时，第一次和借用检查器"对抗"的经历几乎是一个成人礼。但所有权不是需要"对抗"的敌人——理解其底层心智模型后，你会发现它是一套极其优雅的资源管理方案。本文将分享我多年来积累的所有权直觉模型、与借用检查器和解的经验，以及 2024 Edition 生命周期省略规则的最新变化。

## 所有权心智模型：栈与堆的直觉

### 移动语义的直觉理解

Rust 中每个值都有唯一的所有者。当所有者离开作用域，值被自动释放。这听起来简单，但直觉上的困惑来自"移动"：为什么 `let y = x` 之后 `x` 就不能用了？

**关键区分**：移动的语义取决于类型的大小是否在编译期确定，以及类型是否实现了 `Copy`。

```rust
// Copy 类型：赋值 = 按位复制，原变量仍可用
let x: i32 = 42;
let y = x;     // i32 是 Copy，y 得到 x 的副本
println!("{}", x);  // ✅ x 仍可用

// 非 Copy 类型：赋值 = 移动所有权
let s1: String = String::from("hello");
let s2 = s1;    // String 不是 Copy，所有权从 s1 移动到 s2
// println!("{}", s1);  // ❌ s1 已被移动，不可用
println!("{}", s2);     // ✅ s2 持有所有权
```

**心智模型**：想象每个变量是一个"盒子"。对于 `Copy` 类型（如 `i32`、`bool`、`f64`），盒子很小且在栈上，复制成本可忽略，所以赋值时复制一份。对于非 `Copy` 类型（如 `String`、`Vec`），盒子本身在栈上，但里面只放了一个指向堆数据的指针；复制整个堆数据太昂贵，所以赋值时移动指针的所有权，原盒子标记为"已移动"。

```
栈                          堆
┌──────────┐               ┌───────────────┐
│ s1       │ ──移动──→     │ "hello"       │
│ (ptr,len)│               │               │
└──────────┘               └───────────────┘
     ↓ 移动后
┌──────────┐
│ s1       │  (已失效)
└──────────┘
┌──────────┐
│ s2       │ ──指向──→ 同一块堆内存
│ (ptr,len)│
└──────────┘
```

### 为什么 String 不实现 Copy

如果 `String` 是 `Copy`，那么 `let s2 = s1` 会隐式复制堆上的数据。这有两个问题：

1. **性能**：隐式的 `O(n)` 复制是性能陷阱，Rust 的哲学是显式优于隐式
2. **双重释放**：如果复制是浅拷贝（只复制指针），`s1` 和 `s2` 会在各自离开作用域时释放同一块堆内存——double free 是经典的未定义行为

所以 Rust 的选择是：非 trivial 复制的类型不实现 `Copy`，赋值时移动所有权，需要显式 `.clone()` 来复制。

## 借用检查器常见"对抗"场景与和解方案

### 场景 1：循环中修改集合

```rust
let mut list = vec![1, 2, 3];
for item in &list {
    if *item == 2 {
        list.push(4);  // ❌ 不能在不可变借用期间修改
    }
}
```

**和解方案**：

```rust
// 方案 1：先收集要操作的索引，再修改
let mut list = vec![1, 2, 3];
let indices: Vec<usize> = list.iter()
    .enumerate()
    .filter(|(_, &v)| v == 2)
    .map(|(i, _)| i)
    .collect();
for idx in indices {
    list[idx] = 4;  // 或 list.push(4)
}

// 方案 2：使用索引而非引用遍历
let mut list = vec![1, 2, 3];
let mut i = 0;
while i < list.len() {
    if list[i] == 2 {
        list.push(4);
    }
    i += 1;
}

// 方案 3：分离为两步
let mut list = vec![1, 2, 3];
let should_push = list.iter().any(|&v| v == 2);
if should_push {
    list.push(4);
}
```

**为什么借用检查器拒绝**：`&list` 创建了对 `list` 的不可变借用，遍历期间这个借用一直存活。`list.push(4)` 需要可变借用（`&mut list`）。Rust 的借用规则是"同一时间只能有一种借用"——要么多个 `&T`，要么一个 `&mut T`，不能混用。这不是编译器的刁难，而是真实的 soundness 保证：如果允许在遍历期间修改，迭代器可能失效（类似 C++ 的 iterator invalidation）。

### 场景 2：结构体字段的同时借用

```rust
struct Game {
    score: i32,
    players: Vec<String>,
}

impl Game {
    fn update(&mut self) {
        // 想同时读 score 和写 players
        let current_score = self.score;  // ❌ 借用整个 &mut self
        self.players.push(format!("Player {}", current_score));
    }
}
```

**和解方案**：借用结构体的不同字段是允许的，因为它们不重叠：

```rust
impl Game {
    fn update(&mut self) {
        let current_score = self.score;       // 借用 &self.score (Copy)
        self.players.push(format!("Player {}", current_score));  // 借用 &mut self.players
    }
}
```

这里 `self.score` 是 `i32`（`Copy` 类型），`let current_score = self.score` 是复制而非借用，所以 `self.players` 的可变借用不冲突。

更复杂的场景需要解构：

```rust
struct Game {
    score: i32,
    players: Vec<String>,
    config: Config,
}

impl Game {
    fn update(&mut self) {
        // 解构借用不同字段
        let Game { score, players, config: _ } = self;
        // 现在 score 是 &mut i32, players 是 &mut Vec<String>
        let current = *score;
        players.push(format!("Player {}", current));
    }
}
```

### 场景 3：在 if-else 分支中返回引用

```rust
fn get_item(items: &Vec<String>, idx: Option<usize>) -> &String {
    if let Some(i) = idx {
        &items[i]       // 返回对 items 中元素的引用
    } else {
        &items[0]       // 也返回对 items 中元素的引用
    }
    // ✅ 两个分支返回的引用的生命周期相同（都来自 items）
}
```

这个例子能编译，因为两个分支返回的引用来源相同。但稍微改一下：

```rust
fn get_item(items: &Vec<String>, fallback: &String, idx: Option<usize>) -> &String {
    if let Some(i) = idx {
        &items[i]
    } else {
        fallback       // 如果 idx 为 None，返回 fallback 的引用
    }
    // ❌ 编译器无法确定返回值的生命周期来自 items 还是 fallback
}
```

**和解方案**：显式标注生命周期，告诉编译器返回值的生命周期涵盖两个输入：

```rust
fn get_item<'a>(items: &'a Vec<String>, fallback: &'a String, idx: Option<usize>) -> &'a String {
    if let Some(i) = idx {
        &items[i]
    } else {
        fallback
    }
}
```

用 `'a` 统一两个输入的生命周期，告诉编译器"返回值的生命周期不超过两个输入中较短的那个"。

### 场景 4：self 方法中的临时值

```rust
struct Parser {
    input: String,
}

impl Parser {
    fn peek(&self) -> &str {
        // ❌ 返回对临时值的引用
        // self.input.split_whitespace().next().unwrap_or("")
        // 如果 split_whitespace() 的迭代器是临时的...
        
        // ✅ 正确：返回对 self.input 子串的引用
        self.input.split_whitespace().next().unwrap_or("")
    }
}
```

实际上这个例子能编译，因为 `str::split_whitespace` 返回的子串是 `self.input` 的视图（借用了 `self.input` 的数据）。但如果你尝试返回一个新分配的 `String` 的引用，就会失败：

```rust
impl Parser {
    fn peek(&self) -> &str {
        let result = self.input.trim();  // result: &str，借用 self.input
        result  // 直接返回 &str
    }
    
    fn peek_owned(&self) -> &str {
        let result = format!("prefix-{}", self.input);  // 新分配的 String
        &result  // ❌ result 是局部变量，函数返回后释放
    }
}
```

**和解方案**：如果必须返回拥有所有权的值，改变返回类型：

```rust
impl Parser {
    fn peek_owned(&self) -> String {
        format!("prefix-{}", self.input)
    }
}
```

## 生命周期省略规则 2024 调整详解

### 经典三条规则回顾

Rust 编译器在以下三条规则适用时，可以省略生命周期标注：

1. **输入规则**：每个引用类型的函数参数获得一个唯一的生命周期参数
2. **输出规则（一条输入）**：如果只有一个输入生命周期，输出生命周期默认等于它
3. **输出规则（方法）**：如果有多个输入生命周期但其中一个是 `&self` / `&mut self`，输出默认等于 `self` 的生命周期

### 2024 Edition 的变更

2024 Edition 对规则 2 做了重要调整：当返回类型是 `impl Trait` 时，如果函数有多个输入生命周期，不再自动将输出生命周期设为所有输入的交集。这意味着你需要显式标注。

```rust
// Edition 2021
fn first_or_second<'a, 'b>(a: &'a str, b: &'b str, use_first: bool) -> impl Iterator<Item = char> {
    if use_first { a.chars() } else { b.chars() }
    // 2021: 编译通过，返回类型隐式捕获 'a 和 'b
}

// Edition 2024
fn first_or_second<'a, 'b>(a: &'a str, b: &'b str, use_first: bool) -> impl Iterator<Item = char> + 'a + 'b {
    if use_first { a.chars() } else { b.chars() }
    // 2024: 必须显式 + 'a + 'b
}
```

**为什么这样改**？旧规则在某些场景下推导出的类型过于泛化，可能导致 unsoundness。具体来说，旧规则允许编译器推断返回的 `impl Trait` 活得比任何输入都久，这在逻辑上不可能——返回值不可能比它的输入活得更长。新规则更保守、更正确。

**实际影响**：如果你写了很多返回 `impl Trait` 的函数，迁移时需要逐个检查。好消息是编译器会给出清晰的错误提示，坏消息是它无法自动推断正确的 lifetime bound——你需要理解每个 lifetime 的语义。

## Reborrowing 深层理解

### 什么是 Reborrow

当你有一个 `&mut T`，你可以从它再创建一个 `&mut T`（或 `&T`），这就是 reborrow：

```rust
fn reborrow_example(data: &mut Vec<i32>) {
    // data 是 &mut Vec<i32>
    data.push(1);  // 通过 data 可变借用
    
    let inner: &mut Vec<i32> = &mut **data;  // reborrow
    inner.push(2);
    
    // inner 的可变借用结束，data 恢复可用
    data.push(3);  // ✅
}
```

### 为什么 &mut 可以 reborrow

这看似违反了"同一时间只能有一个 `&mut`"的规则，实则不然。reborrow 的语义是：**新的 `&mut` 借用原 `&mut` 的权限，在新的借用存活期间，原 `&mut` 被暂停使用**。

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let x = &mut v;      // x 获得 v 的可变借用
    
    let y = &mut *x;     // y reborrow x 的权限
    y.push(4);
    // x 在此期间不可用
    
    // y 离开作用域，x 恢复可用
    x.push(5);           // ✅
}
```

这是 Rust 借用检查器的精妙之处：它不仅跟踪"谁借用了什么"，还跟踪"借用的生命周期是否重叠"。reborrow 允许你在逻辑上传递可变借用权限，同时保证不会有并发的 `&mut` 访问。

### Reborrow 在函数调用中的隐式发生

```rust
fn push_val(v: &mut Vec<i32>, val: i32) {
    v.push(val);
}

fn main() {
    let mut v = vec![1, 2, 3];
    let r = &mut v;
    
    push_val(r, 4);     // r 被 reborrow 为函数参数
    push_val(r, 5);     // ✅ r 在上一个调用结束后恢复可用
    r.push(6);           // ✅
}
```

每次调用 `push_val(r, ...)` 时，`r` 被隐式 reborrow 为函数参数。函数返回后，reborrow 结束，`r` 恢复可用。这就是为什么你可以多次使用同一个 `&mut` 引用调用函数。

## 所有权与函数签名设计的经验

### 原则 1：优先用引用传递而非所有权转移

```rust
// ❌ 不必要地获取所有权
fn process(data: String) -> usize {
    data.len()
}

// ✅ 用引用，调用者保留所有权
fn process(data: &str) -> usize {
    data.len()
}
```

对于只需读取数据的函数，接受 `&T` 而非 `T`。这让调用者可以选择是借出还是移交所有权，灵活性更大。

### 原则 2：返回引用而非拥有所有权的值（当可能时）

```rust
struct Config {
    name: String,
    timeout: u64,
}

// ✅ 返回引用，零分配
impl Config {
    fn name(&self) -> &str {
        &self.name
    }
}

// ❌ 不必要的 clone
impl Config {
    fn name_cloned(&self) -> String {
        self.name.clone()
    }
}
```

### 原则 3：当需要返回与输入关联的数据时，用引用；当需要返回独立数据时，用所有权

```rust
// 返回输入的子串 → 引用
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// 返回新构造的数据 → 所有权
fn greeting(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

### 原则 4：对 `&self` vs `&mut self` 的选择要反映语义

`&self` 方法承诺"不修改"，`&mut self` 方法承诺"可能修改"。这不仅是编译器规则，更是 API 契约：

- 如果方法逻辑上不修改状态但标记为 `&mut self`，调用者无法在 `&self` 上下文中使用
- 如果方法逻辑上修改了状态但标记为 `&self`，这通常意味着内部可变性（`RefCell`、`Atomic` 等），需要额外的安全论证

```rust
struct Cache {
    data: std::cell::RefCell<Option<String>>,  // 内部可变性
}

impl Cache {
    // &self 但内部修改：RefCell 在运行时检查借用规则
    fn get(&self) -> String {
        self.data.borrow_mut().get_or_insert_with(|| {
            "computed".to_string()  // 占位：实际为耗时计算
        }).clone()
    }
}
```

### 原则 5：避免在 API 边界使用 `Cow<'a, T>` 除非必要

`Cow<'a, T>`（Clone on Write）是一个灵活的类型，可以是借用或拥有。但它的灵活性也是负担——调用者需要理解何时传递借用何时传递拥有。

```rust
use std::borrow::Cow;

// 过度使用 Cow：调用者困惑
fn process(data: Cow<'_, str>) { /* ... */ }

// 更清晰：两个函数
fn process_ref(data: &str) { /* ... */ }
fn process_owned(data: String) { /* ... */ }
```

**何时用 `Cow`**：当同一个函数在某些情况下需要返回借用、另一些情况下需要返回拥有时：

```rust
struct NameHolder {
    cached_name: Option<String>,
    /* other fields */
}

impl NameHolder {
    fn get_name(&self) -> Cow<'_, str> {
        match &self.cached_name {
            Some(name) => Cow::Borrowed(name),   // 缓存命中：借用
            None => Cow::Owned(self.compute_name()),  // 缓存未命中：拥有
        }
    }

    fn compute_name(&self) -> String {
        "default".to_string()
    }
}
```

## 小结

所有权模型的核心价值不是"让编译器管着你"，而是**让你在编译期就排除一整类运行时 bug**：use-after-free、double-free、iterator invalidation、data race。借用检查器的"对抗"实际上是在帮你发现这些问题。

理解所有权的最佳路径不是死记规则，而是建立正确的心智模型：
- **值有唯一的所有者**，所有者离开作用域时释放
- **`Copy` 类型赋值时复制，非 `Copy` 类型赋值时移动**
- **引用是借用的权限**，`&T` 允许读取，`&mut T` 允许读取和写入
- **同一时间要么多个 `&T`，要么一个 `&mut T`**，不能混用
- **reborrow 是权限的临时转移**，转移期间原引用暂停使用

当你发现自己和借用检查器"对抗"时，不要试图绕过它——重新思考数据结构和所有权设计，通常会发现更清晰的方案。
