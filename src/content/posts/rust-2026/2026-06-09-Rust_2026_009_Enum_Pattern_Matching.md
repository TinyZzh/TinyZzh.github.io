---
title: "Rust 2026 经验谈 - 枚举与模式匹配新范式"
published: 2026-06-09
description: "深入 exhaustive patterns、match ergonomics 演进、let-else 链式用法、pattern guard 限制与替代方案、irrefutable patterns 新规则，以及枚举领域建模。"
image: "/images/rust-2026/2.jpg"
tags: [Rust, Rust 2026, 枚举, 模式匹配, let-else]
category: Rust
draft: false
lang: zh_CN
---

![类型系统与所有权深化](/images/rust-2026/2.jpg)

Rust 的枚举和模式匹配是其最独特的语言特性，也是与其他系统级语言拉开差距的核心设计。但模式匹配的"ergonomics"（人体工程学）是一个持续演进的话题——RFC 2008 引入的 match ergonomics 改革、let-else 的稳定、Rust 1.88 的 let chains、以及 2024 Edition 对 irrefutable patterns 规则的收紧，都在改变我们写模式匹配的方式。本文将从实战角度梳理这些变化，并分享枚举作为领域建模利器的经验。

## exhaustive patterns 与 `_` 占位符策略

Rust 的 `match` 必须是穷尽的（exhaustive）：所有可能的值都必须被某个 arm 覆盖。`_` 通配符是"我不关心其他情况"的声明，但滥用 `_` 会掩盖未来新增变体带来的逻辑错误。

### `_` 的正确用法：开放式枚举

```rust
enum HttpError {
    BadRequest,
    Unauthorized,
    NotFound,
    InternalServerError,
    // 未来可能新增：RateLimited, ServiceUnavailable, ...
}

fn user_facing_message(err: &HttpError) -> &'static str {
    match err {
        HttpError::BadRequest => "请求格式错误",
        HttpError::Unauthorized => "未授权",
        HttpError::NotFound => "资源未找到",
        _ => "服务器错误",  // 所有服务端错误统一处理
    }
}
```

这里 `_` 是合理的，因为 `InternalServerError` 和未来新增的服务端错误变体都应该返回"服务器错误"。

### `_` 的危险用法：遗漏未来变体

```rust
#[derive(Debug)]
enum Command {
    Start,
    Stop,
    Restart,
}

fn execute(cmd: &Command) {
    match cmd {
        Command::Start => println!("starting"),
        Command::Stop => println!("stopping"),
        _ => {}  // ❌ 危险：未来新增 Command::Restart 时，静默忽略
    }
}
```

**更好的做法**：显式列出所有变体，让未来新增变体时编译器提醒你：

```rust
fn execute(cmd: &Command) {
    match cmd {
        Command::Start => println!("starting"),
        Command::Stop => println!("stopping"),
        Command::Restart => println!("restarting"),
    }
}
```

**经验法则**：
- **公共 API 中的 match**：永远显式列出变体，不用 `_`。这样当枚举新增变体时，所有 match 处都会编译报错，提醒你处理新情况。
- **内部实现中的 match**：如果逻辑上"其他情况统一处理"，用 `_` 并加注释说明意图。
- **`#[non_exhaustive]` 枚举**：来自其他 crate 的 `#[non_exhaustive]` 枚举必须用 `_`，因为未来版本可能新增变体。

### `#[non_exhaustive]` 的正确用法

```rust
// crate `http_lib`
#[non_exhaustive]
#[derive(Debug)]
pub enum StatusCode {
    Ok,
    NotFound,
    InternalError,
}

// crate `my_app`（依赖 http_lib）
fn handle_status(status: StatusCode) {
    match status {
        StatusCode::Ok => println!("success"),
        StatusCode::NotFound => println!("not found"),
        // ❌ 缺少 _：non_exhaustive 要求处理未知变体
        // StatusCode::InternalError => println!("error"),
        _ => println!("other status"),  // ✅ 必须有 _
    }
}
```

`#[non_exhaustive]` 是库作者的承诺："这个枚举未来可能新增变体，你的 match 必须有 `_`"。这是 Rust 在不破坏 SemVer 的前提下允许枚举演进的标准方式。

## match ergonomics 演进（RFC 2008）

RFC 2008（match-ergonomics）引入了自动引用和模式匹配的宽松规则，显著减少了 `ref` 和 `&` 的使用频率。

### 自动引用：从 `ref` 到隐式借用

```rust
enum Value {
    Number(i32),
    Text(String),
}

// RFC 2008 之前：需要显式 ref
fn describe_old(v: &Value) -> &str {
    match v {
        &Value::Number(ref n) if *n > 0 => "positive",
        &Value::Number(_) => "non-positive",
        &Value::Text(ref s) if s.len() > 10 => "long text",
        &Value::Text(_) => "short text",
    }
}

// RFC 2008 之后：自动引用
fn describe_new(v: &Value) -> &str {
    match v {
        Value::Number(n) if *n > 0 => "positive",
        Value::Number(_) => "non-positive",
        Value::Text(s) if s.len() > 10 => "long text",
        Value::Text(_) => "short text",
    }
}
```

**编译器做了什么**：当 match 的 scrutinee（被匹配的值）是引用时，编译器自动在模式中插入 `&`/`ref`，使模式和值的"引用层级"匹配。具体规则：

1. 如果 scrutinee 是 `&T`，模式中缺少 `&` 时自动插入
2. 模式中绑定的变量自动变成引用（`ref` 绑定）

### 踩坑：混用引用层级的模式

```rust
let v = Value::Number(42);

// ❌ 混用不同引用层级
match &v {
    Value::Number(n) => {  // n: &i32（自动 ref）
        println!("{}", n);
    }
}

// ✅ 显式标注更清晰
match &v {
    Value::Number(ref n) => {  // n: &i32（显式 ref）
        println!("{}", n);
    }
}
```

**经验**：在简单场景下享受 match ergonomics 的便利；在复杂 match 中（特别是嵌套枚举、多层引用），显式写 `ref` 和 `&` 更不容易出错，代码审查时也更清晰。

### match ergonomics 的边界情况

```rust
let pairs: Vec<(Option<i32>, Option<i32>)> = vec![(Some(1), None)];

// RFC 2008 的推导可能不符合直觉
for pair in &pairs {
    match pair {
        (Some(a), None) => {  // a: &i32（自动 ref）
            println!("{}", a);
        }
        _ => {}
    }
}
```

这里 `pair` 是 `&(Option<i32>, Option<i32>)`，模式 `(Some(a), None)` 通过 ergonomics 自动推导出 `a: &i32`。虽然方便，但如果 `a` 的类型不是你期望的，调试时可能困惑——尤其是当 `i32` 被替换为更复杂的类型时。

## let-else 链式用法与替代 Option 抽取

`let-else`（stabilized in 1.65）是 Rust 中最优雅的提前返回机制：

```rust
enum Config {
    Debug { level: u32, output: String },
    Release { optimizations: u32 },
}

fn process(config: &Config) -> Result<(), String> {
    let Config::Debug { level, output } = config else {
        return Err("expected debug config".to_string());
    };

    println!("Debug level {}: {}", level, output);
    Ok(())
}
```

### 链式 let-else：多步验证

```rust
struct Request {
    headers: std::collections::HashMap<String, String>,
    body: Option<String>,
}

fn handle(req: &Request) -> Result<String, String> {
    let Some(content_type) = req.headers.get("content-type") else {
        return Err("missing content-type".into());
    };

    let Some(body) = &req.body else {
        return Err("missing body".into());
    };

    if content_type != "application/json" {
        return Err(format!("unsupported content-type: {}", content_type));
    }

    Ok(body.clone())
}
```

**vs 传统的 Option 抽取**：

```rust
// 传统方式 1：嵌套 if-let（金字塔代码）
fn handle_old1(req: &Request) -> Result<String, String> {
    if let Some(content_type) = req.headers.get("content-type") {
        if let Some(body) = &req.body {
            if content_type == "application/json" {
                Ok(body.clone())
            } else {
                Err(format!("unsupported: {}", content_type))
            }
        } else {
            Err("missing body".into())
        }
    } else {
        Err("missing content-type".into())
    }
}

// 传统方式 2：and_then 链（函数式但可读性差）
fn handle_old2(req: &Request) -> Result<String, String> {
    req.headers.get("content-type")
        .ok_or_else(|| "missing content-type".to_string())
        .and_then(|ct| {
            if ct != "application/json" {
                return Err(format!("unsupported: {}", ct));
            }
            req.body.as_ref()
                .ok_or_else(|| "missing body".to_string())
                .cloned()
        })
}
```

let-else 版本明显更清晰：线性阅读、提前返回、无嵌套。

### let chains：Rust 1.88+ 的条件链

Rust 1.88 稳定了 let chains。它和 `let-else` 的用途不同：`let-else` 适合“失败就提前返回”，let chains 适合“多个条件都满足才进入分支”。

```rust
if request.is_authenticated()
    && let Some(user) = request.user()
    && let Role::Admin = user.role()
{
    audit_admin_action(user);
}
```

过去这段代码通常要写成嵌套 `if let` 或 `match`，现在可以保持条件的线性阅读。经验上，超过三段条件时仍建议抽成具名函数，否则链条会变成另一种横向金字塔。

### let-else 的限制

```rust
// ❌ let-else 的 else 块必须发散（diverge）
// 不能返回非 () 类型
let Some(x) = option else {
    42  // ❌ else 块必须发散：return、break、continue、panic 等
};

// ✅
let Some(x) = option else {
    return 42;  // return 使 else 块发散
};
```

## pattern guard 限制与替代方案

pattern guard 是 `match` arm 中的 `if` 条件。它有限制：**guard 中不能借用可变引用**（因为借用检查器无法保证 guard 的借用和 arm 体的借用不冲突）。

### guard 的限制

```rust
let mut v = vec![1, 2, 3];
let mut iter = v.iter_mut();

match iter.next() {
    Some(x) if *x > 1 => {
        // x 是 &mut i32
        *x += 10;  // ✅ arm 体中可变借用
    }
    _ => {}
}

// ❌ guard 中不能对可变引用做可变操作
// match iter.next() {
//     Some(x) if { *x += 1; *x > 2 } => {  // guard 中修改 x
//         // ...
//     }
//     _ => {}
// }
```

**为什么**：guard 可能失败，如果 guard 中修改了值但 guard 失败回退到下一个 arm，值已经被修改——这是不可回退的副作用。Rust 禁止 guard 中的可变借用来防止这种情况。

### 替代方案 1：嵌套 match + helper function

```rust
fn should_modify(x: &i32) -> bool {
    *x > 1  // 纯判断，无修改
}

match iter.next() {
    Some(x) if should_modify(x) => {
        *x += 10;
    }
    _ => {}
}
```

### 替代方案 2：在 arm 体中条件判断

```rust
match iter.next() {
    Some(x) => {
        if *x > 1 {
            *x += 10;
        }
    }
    None => {}
}
```

这牺牲了 pattern guard 的优雅，但避免了 guard 的限制。

### 替代方案 3：用 let-else 替代 guard

```rust
fn process(item: Option<&mut i32>) {
    let Some(x) = item else { return; };
    let guard = *x > 1;  // 在 let-else 之后做条件判断
    if guard {
        *x += 10;
    }
}
```

## irrefutable patterns 在 let 绑定中的新规则

irrefutable pattern（不可反驳模式）是"对任何值都匹配"的模式，如 `let x = ...` 中的 `x`。refutable pattern（可反驳模式）是"可能匹配失败"的模式，如 `let Some(x) = ...` 中的 `Some(x)`。

### 2024 Edition 的变更

2024 Edition 收紧了 `if let` 中 irrefutable pattern 的规则：

```rust
// Edition 2021：编译通过（但毫无意义）
if let x = some_value {
    // x 总是绑定成功，if 永远为 true
    // 这是 bug 还是 feature？通常是 bug
}

// Edition 2024：编译错误（硬拒绝）
// error: irrefutable `if let` pattern
// help: consider using `let` instead
```

**为什么收紧**：`if let` 的语义是"如果模式匹配成功，执行块"。irrefutable pattern 永远匹配成功，所以 `if let` 等价于 `let`，`if` 的条件判断形同虚设。这几乎总是 bug（比如写错了模式）。

### let 中的 refutable pattern

```rust
// ❌ let 中不能用 refutable pattern
// let Some(x) = option;  // 编译错误

// ✅ 方案 1：let-else
let Some(x) = option else {
    return;
};

// ✅ 方案 2：if let
if let Some(x) = option {
    // use x
}

// ✅ 方案 3：match
match option {
    Some(x) => { /* use x */ }
    None => { /* handle */ }
}
```

### 解构中的 irrefutable pattern

```rust
struct Point { x: f64, y: f64 }

// ✅ 结构体解构是 irrefutable 的
let Point { x, y } = point;

// ✅ 元组解构也是 irrefutable 的
let (a, b) = tuple;

// ✅ 切片模式在固定长度时是 irrefutable 的
let [first, second] = &[1, 2];  // 编译通过，但切片长度不匹配时 panic
```

**注意**：切片模式 `[a, b]` 对 `&[T]` 是 refutable 的（切片可能不是恰好两个元素），但对固定大小数组 `&[T; 2]` 是 irrefutable 的。

## 枚举作为领域建模利器

Rust 的枚举比其他语言的"枚举"强大得多——每个变体可以携带不同类型和数量的数据。这使它成为领域建模的杀手级工具。

### 案例 1：支付系统

```rust
enum PaymentMethod {
    CreditCard {
        number: String,
        expiry: (u8, u16),  // (月, 年)
        cvv: u8,
    },
    BankTransfer {
        routing: String,
        account: String,
    },
    Crypto {
        wallet_address: String,
        network: CryptoNetwork,
    },
    GiftCard {
        code: String,
        remaining_balance: u64,
    },
}

enum CryptoNetwork {
    Bitcoin,
    Ethereum,
    Solana,
}

impl PaymentMethod {
    fn processing_fee(&self) -> u64 {
        match self {
            Self::CreditCard { .. } => 299,    // $2.99
            Self::BankTransfer { .. } => 0,     // 免费
            Self::Crypto { network, .. } => match network {
                CryptoNetwork::Bitcoin => 500,
                CryptoNetwork::Ethereum => 300,
                CryptoNetwork::Solana => 10,
            },
            Self::GiftCard { .. } => 0,
        }
    }

    fn is_instant(&self) -> bool {
        matches!(self, Self::Crypto { .. } | Self::GiftCard { .. })
    }
}
```

**为什么比 OOP 的继承层次好**：
1. **穷尽性**：新增支付方式时，编译器强制你更新所有 match
2. **无 null / 无未定义行为**：每个变体都显式处理
3. **零开销**：枚举的大小 = 最大变体的大小 + 判别式（通常 1 字节）

### 案例 2：AST 节点

```rust
enum Expr {
    Literal(Literal),
    Binary { op: BinOp, left: Box<Expr>, right: Box<Expr> },
    Unary { op: UnaryOp, operand: Box<Expr> },
    Call { func: String, args: Vec<Expr> },
    If { cond: Box<Expr>, then: Box<Expr>, else_: Option<Box<Expr>> },
    Lambda { params: Vec<String>, body: Box<Expr> },
}

enum Literal {
    Int(i64),
    Float(f64),
    Bool(bool),
    Str(String),
}

enum BinOp { Add, Sub, Mul, Div, And, Or, Eq, Ne }
enum UnaryOp { Neg, Not }
```

**遍历的穷尽性保证**：

```rust
fn free_variables(expr: &Expr) -> Vec<String> {
    match expr {
        Expr::Literal(_) => Vec::new(),
        Expr::Binary { left, right, .. } => {
            let mut vars = free_variables(left);
            vars.extend(free_variables(right));
            vars.dedup();
            vars
        }
        Expr::Unary { operand, .. } => free_variables(operand),
        Expr::Call { args, .. } => {
            let mut vars = Vec::new();
            for arg in args {
                vars.extend(free_variables(arg));
            }
            vars.dedup();
            vars
        }
        Expr::If { cond, then, else_ } => {
            let mut vars = free_variables(cond);
            vars.extend(free_variables(then));
            if let Some(e) = else_ {
                vars.extend(free_variables(e));
            }
            vars.dedup();
            vars
        }
        Expr::Lambda { params, body } => {
            let mut vars = free_variables(body);
            vars.retain(|v| !params.contains(v));
            vars
        }
    }
}
```

如果未来在 `Expr` 中新增变体（如 `Match`、`Let`），`free_variables` 会在编译时报错——这是枚举穷尽性匹配对重构安全性的核心保证。

### 案例 3：状态机建模

```rust
enum OrderState {
    Created { timestamp: u64 },
    Paid { timestamp: u64, method: PaymentMethod },
    Shipped { timestamp: u64, tracking: String },
    Delivered { timestamp: u64 },
    Cancelled { reason: String },
}

impl OrderState {
    fn can_cancel(&self) -> bool {
        matches!(self, Self::Created { .. } | Self::Paid { .. })
    }

    fn can_ship(&self) -> bool {
        matches!(self, Self::Paid { .. })
    }
}
```

**vs 类型状态模式**：类型状态模式（上一篇文）在编译期保证状态转换合法性，但要求每个状态是独立类型。枚举状态机在运行时检查，但更灵活——可以序列化（`#[derive(Serialize)]`）、可以从数据库加载、可以在集合中混存不同状态。

**选择指南**：
- **编译期保证** + **无序列化需求** → 类型状态模式
- **运行时检查** + **需要序列化/存储** → 枚举状态机
- **两者兼需** → 枚举对外（序列化），类型状态对内（逻辑）

## `assert_matches!` 和 `debug_assert_matches!`（Rust 1.96.0 稳定化）

Rust 1.96.0 稳定了 `assert_matches!` 和 `debug_assert_matches!` 宏，为模式匹配断言提供了专用的、错误信息更友好的工具。

### 基本用法

```rust
use std::assert_matches;  // ⚠️ 不在 prelude 中，需手动 import

enum Shape { Circle(f64), Rectangle(f64, f64), Triangle(f64, f64, f64) }

let shape = Shape::Circle(3.0);

// 新宏：断言值匹配指定模式
assert_matches!(shape, Shape::Circle(_));
assert_matches!(shape, Shape::Circle(r) if r > 0.0);

// debug 版本：仅在 debug 构建中检查，release 中无开销
debug_assert_matches!(shape, Shape::Circle(_));
```

### 对比 `assert!(matches!(..))`

```rust
use std::assert_matches;

let result: Result<i32, &str> = Err("timeout");

// assert_matches!：错误信息包含实际值
assert_matches!(result, Ok(_));
// 输出：assertion `left matches right` failed
//        left: Err("timeout")
//        right: Ok(_)

// assert!(matches!(..))：错误信息不含实际值
assert!(matches!(result, Ok(_)));
// 输出：assertion failed: matches!(result, Ok(_))
//        （看不到 result 的实际值是什么）
```

**核心优势**：`assert_matches!` 在断言失败时打印左值的实际值和右值的模式，而 `assert!(matches!(..))` 只告诉你"断言失败"——调试时信息量的差距是显著的。

### 在测试中的推荐用法

```rust
use std::assert_matches;

#[test]
fn test_parse_success() {
    let result = parse("42");
    assert_matches!(result, Ok(42));
}

#[test]
fn test_parse_error() {
    let result = parse("abc");
    assert_matches!(result, Err(ParseError::InvalidNumber(_)));
}
```

## 新 Range 类型对模式匹配的影响（Rust 1.96.0）

Rust 1.96.0 稳定了 `core::range` 模块下的 `Range`、`RangeFrom`、`RangeTo`、`RangeToInclusive` 和 `Bound` 等类型。这些类型统一了 range 的 API 并提供了 `Range::new` 等构造方法，对模式匹配有直接影响：

```rust
use core::range::Range;

// core::range::Range 提供了显式构造方法
let r: Range<i32> = Range::new(0, 10);  // 等价于 0..10
let r2 = r;  // Copy，r 仍然可用

// 在结构体中用作字段——语义更明确
struct Window { rows: Range<usize>, cols: Range<usize> }
let w = Window { rows: 0..24, cols: 0..80 };
```

`core::range` 模块的稳定化使得 range 类型可以在 `core` 中直接使用，无需依赖 `std::ops`，这对 `no_std` 环境尤为重要。

## 小结

枚举和模式匹配是 Rust 中"让非法状态不可表示"的核心工具。2024 Edition 和近年来的稳定化让模式匹配更好用：

- **exhaustive matching** 是重构安全性的基石，`_` 要用得克制
- **match ergonomics** 让日常代码更简洁，复杂场景下显式标注更安全
- **let-else** 是提前返回的最佳范式，告别金字塔代码
- **pattern guard 限制** 有深层的安全原因，替代方案是嵌套 match 或 let-else
- **irrefutable patterns 新规则** 帮你发现无意义的 `if let`
- **枚举领域建模** 是 Rust 的杀手级优势，穷尽性匹配保证重构安全
