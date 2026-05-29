---
title: "Rust 2026 经验谈 - 类型状态模式与零成本抽象"
published: 2026-06-07
description: "深入 PhantomData 驱动的类型状态模式、newtype 模式深挖、Deref/DerefMut 争议与正确用法、Borrow/BorrowMut trait，以及类型级编程入门。"
image: "/images/rust-2026/2.jpg"
tags: [Rust, Rust 2026, 类型状态, 零成本抽象, newtype]
category: Rust
draft: false
lang: zh_CN
---

![类型系统与所有权深化](/images/rust-2026/2.jpg)

Rust 的类型系统不仅能保证内存安全，还能在编译期编码程序的逻辑约束——"非法状态不可表示"。类型状态模式（Type State Pattern）是这一理念的极致体现：用类型参数标记对象的状态，让非法状态转换变成编译错误而非运行时 panic。本文将从实战角度剖析类型状态模式、newtype 模式、Deref 争议，以及类型级编程的基础。

## PhantomData 驱动的类型状态模式

`PhantomData<T>` 是 Rust 类型系统的"幽灵"——它在运行时占零空间，但在编译时参与类型检查。这使得我们可以用类型参数编码状态，而不增加运行时开销。

### Builder 状态机

经典的 Builder 模式在运行时检查必需字段是否已设置。类型状态 Builder 把这个检查移到编译期：

```rust
use std::marker::PhantomData;

struct Unset;
struct Set;

struct HttpRequestBuilder<Method, Body> {
    url: String,
    method: Option<String>,
    headers: Vec<(String, String)>,
    body: Option<String>,
    _marker: PhantomData<(Method, Body)>,
}

impl HttpRequestBuilder<Unset, Unset> {
    fn new(url: impl Into<String>) -> Self {
        HttpRequestBuilder {
            url: url.into(),
            method: None,
            headers: Vec::new(),
            body: None,
            _marker: PhantomData,
        }
    }

    fn method(self, method: &str) -> HttpRequestBuilder<Set, Unset> {
        HttpRequestBuilder {
            url: self.url,
            method: Some(method.to_string()),
            headers: self.headers,
            body: self.body,
            _marker: PhantomData,
        }
    }
}

impl<Body> HttpRequestBuilder<Set, Body> {
    fn header(mut self, key: &str, value: &str) -> Self {
        self.headers.push((key.to_string(), value.to_string()));
        self
    }

    fn body(self, body: impl Into<String>) -> HttpRequestBuilder<Set, Set> {
        HttpRequestBuilder {
            url: self.url,
            method: self.method,
            headers: self.headers,
            body: Some(body.into()),
            _marker: PhantomData,
        }
    }
}

impl HttpRequestBuilder<Set, Set> {
    fn build(self) -> HttpRequest {
        HttpRequest {
            url: self.url,
            method: self.method.unwrap(),
            headers: self.headers,
            body: self.body.unwrap(),
        }
    }
}

struct HttpRequest {
    url: String,
    method: String,
    headers: Vec<(String, String)>,
    body: String,
}
```

**使用效果**：

```rust
// ✅ 正确用法
let req = HttpRequestBuilder::new("https://api.example.com")
    .method("POST")
    .header("Content-Type", "application/json")
    .body(r#"{"key":"value"}"#)
    .build();

// ❌ 编译错误：method 未设置，无法调用 build
// HttpRequestBuilder::new("https://api.example.com")
//     .build();
// error: no method named `build` found for HttpRequestBuilder<Unset, Unset>
```

**踩坑**：类型状态 Builder 的最大缺点是**无法在条件逻辑中构建**——因为 if/else 的两个分支可能产生不同状态类型，Rust 要求变量类型在所有分支中一致：

```rust
let builder = HttpRequestBuilder::new("https://api.example.com");
let builder = if use_post {
    builder.method("POST")
} else {
    builder.method("GET")
};
// ✅ 这能工作，因为两个分支都返回 HttpRequestBuilder<Set, Unset>
```

但如果条件在设置不同数量的字段时，就会出问题。解决方案是使用"延后验证"或 enum 包装：

```rust
enum BuilderState {
    Partial(HttpRequestBuilder<Unset, Unset>),
    WithMethod(HttpRequestBuilder<Set, Unset>),
    Complete(HttpRequestBuilder<Set, Set>),
}
```

但这样一来你又回到了运行时检查。**经验法则**：类型状态模式最适合线性的、无分支的构建流程。如果构建过程有复杂条件逻辑，回到运行时验证更实际。

### 连接状态机

网络连接的状态转换是类型状态模式的另一个经典场景：

```rust
use std::marker::PhantomData;

struct Disconnected;
struct Connected;
struct Authenticated;

struct Connection<State> {
    stream: Option<std::net::TcpStream>,
    _state: PhantomData<State>,
}

impl Connection<Disconnected> {
    fn connect(addr: &str) -> Result<Connection<Connected>, std::io::Error> {
        let stream = std::net::TcpStream::connect(addr)?;
        Ok(Connection {
            stream: Some(stream),
            _state: PhantomData,
        })
    }
}

impl Connection<Connected> {
    fn authenticate(self, token: &str) -> Result<Connection<Authenticated>, AuthError> {
        // 发送认证请求...
        Ok(Connection {
            stream: self.stream,
            _state: PhantomData,
        })
    }
}

impl Connection<Authenticated> {
    fn send_data(&mut self, data: &[u8]) -> Result<(), std::io::Error> {
        use std::io::Write;
        self.stream.as_mut().unwrap().write_all(data)
    }
}

struct AuthError;
```

**为什么这比运行时状态好**：你不可能在未连接时调用 `authenticate`，也不可能未认证时调用 `send_data`——这些非法操作在编译期就被排除了。对比运行时方案：

```rust
// 运行时方案：可能 panic 或返回 Err
enum ConnState { Disconnected, Connected, Authenticated }

struct Connection {
    state: ConnState,
    stream: Option<std::net::TcpStream>,
}

impl Connection {
    fn send_data(&mut self, data: &[u8]) -> Result<(), Error> {
        match self.state {
            ConnState::Authenticated => { /* ... */ },
            _ => return Err(Error::NotAuthenticated),  // 运行时检查
        }
    }
}
```

## newtype 模式深挖

newtype 模式（`struct Wrapper(Inner)`）是 Rust 中最基本的零成本抽象。它创建一个新类型，在运行时和 `Inner` 完全相同，但在类型系统中是独立的。

### Deref vs 显式方法

newtype 的关键设计决策是：是否为 wrapper 实现 `Deref`？

```rust
struct Meters(f64);
struct Feet(f64);

// 方案 A：显式方法（推荐）
impl Meters {
    fn value(&self) -> f64 { self.0 }
    fn from_meters(v: f64) -> Self { Self(v) }
}

impl Feet {
    fn value(&self) -> f64 { self.0 }
    fn from_feet(v: f64) -> Self { Self(v) }
}

// 方案 B：Deref（不推荐用于语义不同的类型）
// impl std::ops::Deref for Meters {
//     type Target = f64;
//     fn deref(&self) -> &f64 { &self.0 }
// }
```

**为什么不推荐 `Deref`**：实现了 `Deref` 后，`Meters` 可以直接调用 `f64` 的所有方法——`meters.sin()`, `meters.is_nan()` 等。这些方法在 `Meters` 语义下无意义。更危险的是，`Deref` 允许隐式转换：

```rust
fn compute(v: f64) -> f64 { v * 2.0 }

let m = Meters(3.0);
compute(*m);  // 隐式解引用，丧失类型安全
```

**显式方法的好处**：
1. **API 面受控**：只有你选择暴露的方法可用
2. **零成本**：单字段 newtype 在内存中与内部类型完全相同，方法调用内联后无额外开销
3. **类型安全**：`Meters` 和 `Feet` 不会被意外混用

### 性能零成本证明

newtype 的零成本不是信仰，而是可以验证的事实：

```rust
#[repr(transparent)]
struct Meters(f64);

// repr(transparent) 保证 Meters 的内存布局和 f64 完全相同
// 这意味着：
// 1. size_of::<Meters>() == size_of::<f64>()
// 2. align_of::<Meters>() == align_of::<f64>()
// 3. ABI 兼容：可以作为 C FFI 参数传递
```

**验证**：

```rust
use std::mem::{size_of, align_of};

assert_eq!(size_of::<Meters>(), size_of::<f64>());    // 8 == 8
assert_eq!(align_of::<Meters>(), align_of::<f64>());  // 8 == 8
```

`#[repr(transparent)]` 是 FFI 场景下的最佳实践——它向编译器保证 newtype 和内部类型的 ABI 完全兼容。

## Deref / DerefMut 争议与正确用法

`Deref` 多态是 Rust 社区公认的**反模式**。Rust 设计者明确表示 `Deref` 是为智能指针设计的，不应作为通用多态工具。

### Deref 多态的问题

```rust
struct MyString(String);

impl std::ops::Deref for MyString {
    type Target = String;
    fn deref(&self) -> &String { &self.0 }
}

impl std::ops::DerefMut for MyString {
    fn deref_mut(&mut self) -> &mut String { &mut self.0 }
}

fn takes_str(s: &str) { /* ... */ }

let ms = MyString(String::from("hello"));
takes_str(&ms);  // 隐式 Deref 链：MyString → String → str
```

看起来很方便，但隐患是：

1. **方法解析歧义**：如果 `MyString` 和 `String` 有同名方法，`Deref` 多态可能导致调用错误的方法
2. **隐式行为难以追踪**：`&ms` 到底是 `&MyString` 还是 `&String` 还是 `&str`？在代码审查中不可见
3. **违反最小惊讶原则**：使用者可能不知道 `MyString` 实现了 `Deref`，隐式转换造成困惑

### Deref 的正确用法

`Deref` 的**唯二正当用途**是智能指针：

```rust
// 正当：Box<T> 实现了 Deref<Target = T>
// Box 是"拥有所有权的指针"，Deref 让它像普通引用一样使用

// 正当：Rc<T> / Arc<T> 实现了 Deref<Target = T>
// 共享指针的 Deref 是其核心语义

// 不正当：MyVec 实现了 Deref<Target = Vec<T>>
// MyVec 不是指针，它是一个不同的容器
```

**经验法则**：问自己"这个类型是否在语义上是指向 `Target` 的指针？"。如果是（如 `Box`、`Rc`、`Arc`、`RefGuard`），实现 `Deref`。如果不是，用显式方法或 `From`/`Into`。

## Borrow / BorrowMut trait 使用场景

`std::borrow::Borrow` trait 与 `Deref` 类似但语义不同。`Borrow` 解决的问题是："如何从拥有所有权的类型中借用一个等价的类型？"

```rust
trait Borrow<Borrowed> {
    fn borrow(&self) -> &Borrowed;
}
```

### 经典案例：HashMap 查询

```rust
use std::collections::HashMap;
use std::borrow::Borrow;

struct PersonId(u64);

// 假设我们用 PersonId 作为 key
let mut map: HashMap<PersonId, String> = HashMap::new();
map.insert(PersonId(1), "Alice".to_string());

// 问题：查询时必须有 PersonId，不能直接用 u64
// ❌ map.get(&1u64)  // 类型不匹配

// 方案：实现 Borrow
impl Borrow<u64> for PersonId {
    fn borrow(&self) -> &u64 { &self.0 }
}

// 实现 Hash 和 Eq for u64 的比较
impl PartialEq<u64> for PersonId {
    fn eq(&self, other: &u64) -> bool { self.0 == *other }
}

// 现在可以用 u64 查询
// ✅ map.get(&1u64)  // 通过 Borrow 转换
```

**Borrow vs Deref 的关键区别**：
- `Deref` 提供**隐式**的 `&T` 到 `&U` 转换，且只能转换到**一个**目标类型
- `Borrow` 提供**显式**的借用语义，一个类型可以 `Borrow` 多个不同类型
- `Borrow` 的等价性保证（`Eq`/`Hash` 一致）是 HashMap 正确工作的前提

### Borrow 的等价性契约

实现 `Borrow` 时必须保证：`x.borrow() == y.borrow()` 当且仅当 `x == y`。违反这个契约会导致 HashMap 行为异常：

```rust
// ❌ 危险的 Borrow 实现
struct BadKey {
    id: u64,
    cached_hash: u64,  // 缓存的哈希值
}

impl Borrow<u64> for BadKey {
    fn borrow(&self) -> &u64 { &self.id }
}

// 如果 BadKey 的 Eq/Hash 基于 (id, cached_hash)，
// 但 Borrow 返回 &id，
// 则两个 BadKey 可能 id 相同但 (id, cached_hash) 不同，
// Borrow 的等价性契约被违反
```

## 类型级编程入门

Rust 的类型系统在不含 trait bound 求解时具有很强的表达能力，这使得我们可以做类型级计算——在编译期用类型编码自然数和算术。

### 用类型编码自然数

```rust
struct Zero;
struct Succ<N>(PhantomData<N>);

type One = Succ<Zero>;
type Two = Succ<One>;
type Three = Succ<Two>;
```

### 编译期长度标记的列表

```rust
use std::marker::PhantomData;

struct Nil;
struct Cons<H, T>(PhantomData<(H, T)>);

// 长度为 0 的列表
type EmptyList = Nil;

// 长度为 2 的列表 (i32, String)
type TwoList = Cons<i32, Cons<String, Nil>>;
```

**实际应用**：这种技术在嵌入式开发中用于编译期检查硬件寄存器配置、在密码学库中确保密钥长度正确、在 GPU 编程中保证 shader 接口匹配。日常业务开发中较少使用，但理解它有助于理解 Rust 类型系统的表达能力边界。

### trait bound 作为编译期断言

一个更实用的类型级编程技巧——用 trait bound 作为编译期约束：

```rust
trait IsTrue {}
impl IsTrue for () {}

struct Assert<Cond> {
    _marker: PhantomData<Cond>,
}

// 只有 Cond 实现了 IsTrue 才能构造 Assert
impl<Cond: IsTrue> Assert<Cond> {
    fn check() {}
}

// 用法：确保某个类型级计算结果为"真"
fn compile_time_assert() {
    Assert::<()>::check();  // ✅ () 实现了 IsTrue
}
```

这种模式在 `static_assertions` crate 中广泛使用，确保某些属性在编译期成立。

## 小结

类型状态模式和零成本抽象是 Rust 类型系统的两个杀手级特性。它们的核心思想是**把运行时检查变成编译时错误**——让非法状态不可表示，让性能保证可验证。

关键收获：
- **PhantomData** 是类型状态模式的引擎，零运行时开销，编译时参与类型检查
- **类型状态 Builder** 适合线性构建流程，复杂条件逻辑回到运行时验证更实际
- **newtype** 是零成本抽象的基础，`#[repr(transparent)]` 保证 ABI 兼容
- **Deref 只用于智能指针**，newtype 优先用显式方法暴露 API
- **Borrow 用于 HashMap 等需要多种借用形式的场景**，必须遵守等价性契约
- **类型级编程**在日常业务中少用，但在嵌入式、密码学等领域有实战价值
