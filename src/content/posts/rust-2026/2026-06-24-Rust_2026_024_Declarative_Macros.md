---
title: "Rust 2026 经验谈 - 声明宏（macro_rules!）实战"
published: 2026-06-24
description: "tt muncher 模式、push-down accumulation 模式、重复模式技巧、hygiene 与 span、调试宏展开、声明宏的限制与升级时机。"
image: "/images/rust-2026/6.jpg"
tags: [Rust, Rust 2026, 宏, macro_rules, 元编程]
category: Rust
draft: false
lang: zh_CN
---

![元编程与宏](/images/rust-2026/6.jpg)

声明宏（`macro_rules!`）是 Rust 最常用的元编程工具——比过程宏轻量、编译快、无需额外 crate。但声明宏的递归展开机制和匹配规则有独特的思维模型，初学者容易陷入"能写但写不对"的困境。本文从实战模式出发，系统总结声明宏的核心技巧与踩坑经验。

## tt muncher 模式（递归展开技巧）

### 基本原理

"tt muncher"是声明宏最核心的模式——用递归逐个"吃掉"token，每次处理一个，剩余的递归处理。

```rust
macro_rules! compute_hash {
    // 基础情形：没有更多 token（$(,)? 处理递归产生的尾逗号）
    (@hash $acc:expr $(,)?) => {
        $acc
    };
    // 递归情形：吃掉一对 key:value，更新累加值
    (@hash $acc:expr, $key:tt => $value:expr $(, $rest:tt => $rest_value:expr)*) => {
        compute_hash!(@hash $acc ^ ($key as u64).wrapping_mul($value as u64), $($rest => $rest_value)*)
    };
    // 入口：初始化累加值
    ($($key:tt => $value:expr),* $(,)?) => {
        compute_hash!(@hash 0u64, $($key => $value),*)
    };
}

let h = compute_hash!(1 => 100, 2 => 200, 3 => 300);
// 展开过程：
// compute_hash!(@hash 0, 1 => 100, 2 => 200, 3 => 300)
// compute_hash!(@hash 0 ^ 1*100, 2 => 200, 3 => 300)
// compute_hash!(@hash (0 ^ 1*100) ^ 2*200, 3 => 300)
// compute_hash!(@hash ((0 ^ 1*100) ^ 2*200) ^ 3*300)
// => 最终表达式
```

### 内部规则标记（@prefix）

`@hash` 是内部规则的前缀标记，防止外部直接调用内部规则。这是 tt muncher 的标准约定：

- `@` 开头的 arm 是内部规则，不暴露给用户
- 无 `@` 前缀的 arm 是公开入口
- 内部规则通常用 `@` + 名称 + 累加器参数

### 实战：构建 HashMap

```rust
macro_rules! hashmap {
    (@single $key:expr => $value:expr) => {
        ($key, $value)
    };
    (@multiple $map:expr, $key:expr => $value:expr $(, $rest_k:expr => $rest_v:expr)*) => {
        {
            $map.insert($key, $value);
            hashmap!(@multiple $map, $($rest_k => $rest_v),*)
        }
    };
    (@multiple $map:expr $(,)?) => {
        $map
    };
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = std::collections::HashMap::new();
            hashmap!(@multiple map, $($key => $value),*)
        }
    };
}

let m = hashmap! {
    "a" => 1,
    "b" => 2,
    "c" => 3,
};
assert_eq!(m["a"], 1);
```

### 踩坑：递归深度限制

Rust 声明宏的递归深度默认限制为 64（`#![recursion_limit = "128"]` 可调整）。如果你的 tt muncher 处理 100 个元素，会触发递归溢出。

**解决方案**：用"二分递归"减少深度：

```rust
macro_rules! tuple_len {
    () => { 0 };
    ($first:tt $(, $rest:tt)*) => { 1 + tuple_len!($($rest),*) };
}

// 100 个元素需要 100 层递归！
// 改用分治：
macro_rules! tuple_len_fast {
    () => { 0 };
    ($a:tt, $b:tt $(, $rest:tt)*) => { 2 + tuple_len_fast!($($rest),*) };
    ($a:tt) => { 1 };
}
// 现在 100 个元素只需 50 层递归
```

## push-down accumulation 模式

### 原理

push-down accumulation 在递归的每一步"推入"（push）结果到输出中，而非在递归返回时"拉回"（pull）。这避免了递归深度的表达式嵌套问题。

### 示例：将标识符列表转为字符串列表

```rust
macro_rules! idents_to_strings {
    // 入口：启动递归，初始化累加器
    ($($id:ident),* $(,)?) => {
        idents_to_strings!(@acc [], $($id),*)
    };
    // 递归：吃掉一个 ident，push 到累加器
    (@acc [$($acc:expr),*], $id:ident $(, $rest:ident)*) => {
        idents_to_strings!(@acc [$($acc,)* stringify!($id)], $($rest),*)
    };
    // 基础：没有更多 ident，输出累加器
    (@acc [$($acc:expr),*],) => {
        [$($acc),*]
    };
    // 基础：只有一个 ident（无尾逗号）
    (@acc [$($acc:expr),*], $id:ident) => {
        [$($acc,)* stringify!($id)]
    };
}

let names = idents_to_strings!(foo, bar, baz);
assert_eq!(names, ["foo", "bar", "baz"]);
```

**与 tt muncher 的区别**：

| 模式 | 累加方式 | 表达式嵌套 | 递归深度 |
|------|----------|-----------|----------|
| tt muncher | 在递归参数中更新 | 可能很深 | N |
| push-down | 在方括号中累积 | 扁平 | N |
| 分治 + push-down | 分治累积 | 扁平 | log N |

### 实战：生成结构体的字段访问器

```rust
macro_rules! make_getters {
    (@acc [$($acc:item)*], $field:ident : $ty:ty $(, $rest:ident : $rest_ty:ty)*) => {
        make_getters!(@acc [
            $($acc)*
            pub fn $field(&self) -> &$ty {
                &self.$field
            }
        ], $($rest : $rest_ty),*)
    };
    (@acc [$($acc:item)*],) => {
        $($acc)*
    };
    (@acc [$($acc:item)*], $field:ident : $ty:ty) => {
        $($acc)*
        pub fn $field(&self) -> &$ty {
            &self.$field
        }
    };
    ($($field:ident : $ty:ty),* $(,)?) => {
        make_getters!(@acc [], $($field : $ty),*)
    };
}

struct Point {
    x: f64,
    y: f64,
    z: f64,
}

impl Point {
    make_getters!(x: f64, y: f64, z: f64);
}

let p = Point { x: 1.0, y: 2.0, z: 3.0 };
assert_eq!(p.x(), &1.0);
```

## 重复模式技巧

### 基本语法

```rust
macro_rules! repeat_demo {
    // $()* ——重复零次或多次
    // $()+ ——重复一次或多次
    // $()? ——重复零次或一次
    // 分隔符：,$()* ——用逗号分隔

    // 零或多次，逗号分隔，可选尾逗号
    ($($elem:expr),* $(,)?) => {
        vec![$($elem),*]
    };
}

let v = repeat_demo!(1, 2, 3);
let v2 = repeat_demo!(1, 2, 3,);  // 尾逗号也行
let v3 = repeat_demo!();           // 空也行
```

### 常见重复模式

```rust
// 模式 1：key-value 对
// $(key => value),*
macro_rules! config {
    ($($key:ident => $value:expr),* $(,)?) => {
        {
            let mut cfg = std::collections::HashMap::new();
            $(cfg.insert(stringify!($key).to_owned(), $value.to_string());)*
            cfg
        }
    };
}

// 模式 2：类型列表
// $(T: Trait),*
macro_rules! impl_display {
    ($($ty:ty),* $(,)?) => {
        $(impl std::fmt::Display for $ty {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self)
            }
        })*
    };
}

// 注意：上述 impl_display 实际上会为已有 Display 的类型再次 impl，产生冲突。
// 实际中更常见的是为自定义类型批量 impl：

// 模式 3：嵌套重复——用不同变量名
macro_rules! matrix {
    ($([$($elem:expr),* $(,)?]),* $(,)?) => {
        vec![$(vec![$($elem),*]),*]
    };
}

let m = matrix! {
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
};
```

### 踩坑：重复变量不能跨 arm 使用

```rust
macro_rules! bad_repeat {
    ($($a:expr),* ; $($b:expr),*) => {
        // 不能在这里把 $a 和 $b 交错使用
        // ($($a, $b),*)  // 错误！$a 和 $b 是不同的重复组
        // 只能各自展开
        ($($a),*, $($b),*)
    };
}
```

如果需要交错，要求输入时就配对：

```rust
macro_rules! paired {
    ($($a:expr, $b:expr);* $(;)?) => {
        vec![$(($a, $b)),*]
    };
}

let pairs = paired!(1, "a"; 2, "b"; 3, "c");
```

### 踸见片段分类符（fragment specifier）

| 分类符 | 匹配内容 | 示例 |
|--------|----------|------|
| `expr` | 表达式 | `1 + 2`, `foo()`, `vec![]` |
| `ident` | 标识符 | `foo`, `MyStruct` |
| `ty` | 类型 | `i32`, `Vec<String>` |
| `path` | 路径 | `std::io::Result`, `foo::bar` |
| `stmt` | 语句 | `let x = 1;`, `x += 1` |
| `block` | 块 | `{ ... }` |
| `pat` | 模式 | `Some(x)`, `_` |
| `meta` | 元属性 | `#[inline]`, `#[derive(Clone)]` |
| `tt` | 单个 token tree | 任意 token 或分隔组 |
| `item` | 项 | `fn foo() {}`, `struct Bar;` |
| `lifetime` | 生命周期 | `'a`, `'static` |
| `literal` | 字面量 | `42`, `"hello"` |

**选型原则**：用最具体的分类符。`tt` 最灵活但也最危险——它匹配任意 token，可能匹配到你不期望的东西。

## hygiene 与 span 概念

### Hygiene：宏展开的"卫生"性

Rust 声明宏是**半卫生的**（semi-hygienic）——宏内定义的名字不会与宏外冲突，但宏外定义的名字可以通过路径访问。

```rust
macro_rules! hygienic_example {
    ($val:expr) => {
        // 宏内定义的 x 不会与外部 x 冲突
        let x = $val + 1;
        x  // 引用的是宏内的 x
    };
}

fn test() {
    let x = 100;
    let result = hygienic_example!(5);
    // result == 6，不是 101
    // 宏内的 x 和外部的 x 是不同的"卫生"域
}
```

### 跨 hygiene 的方式

有时你确实需要在宏中引用外部变量——用路径：

```rust
macro_rules! access_external {
    ($val:expr) => {
        // 直接引用外部变量 x——这在 Rust 中是允许的
        // 因为 x 不是宏内定义的，不存在冲突
        x + $val
    };
}

fn test() {
    let x = 10;
    let result = access_external!(5);
    assert_eq!(result, 15);
}
```

**踩坑**：hygiene 的半卫生性意味着某些情况下的行为可能出人意料：

```rust
macro_rules! confusing {
    ($val:expr) => {
        let mut sum = 0;
        // 这里的 $val 在宏调用者的 hygiene 域中
        // 如果 $val 引用了宏内变量，会编译失败
        sum += $val;
        sum
    };
}

fn test() {
    let result = confusing!(42);
    assert_eq!(result, 42);
    // 但如果写 confusing!(sum) 会编译失败
    // 因为 sum 在宏的 hygiene 域中，调用者看不到
}
```

### Span：错误信息的来源位置

Span 决定了宏展开后错误信息指向的源码位置。Rust 声明宏的 span 行为：

- `$val:expr` 的错误指向调用者的代码（好）
- 宏内部代码的错误指向宏定义（可能混淆）

```rust
macro_rules! bad_error {
    ($val:expr) => {
        $val + "string"  // 如果 $val 是 i32，错误指向这里
    };
}

fn test() {
    let x: i32 = 42;
    bad_error!(x);
    // 错误信息：mismatched types
    // 但可能指向宏内部而非调用点，令人困惑
}
```

## 调试宏展开

### cargo expand

最常用的宏调试工具：

```bash
# 安装
cargo install cargo-expand

# 展开当前 crate 的所有宏
cargo expand

# 展开特定模块
cargo expand my_module

# 展开特定函数
cargo expand my_module::my_function
```

**输出**：展开后的 Rust 代码，可以看到宏实际生成了什么。

### rustfmt 配合

展开后的代码可能格式混乱，用 rustfmt 格式化：

```bash
cargo expand | rustfmt
```

### trace_macros!（Nightly）

```rust
#![feature(trace_macros)]

trace_macros!(true);  // 开启宏展开追踪
// my_macro!(some, input);
trace_macros!(false); // 关闭追踪
// 编译时会打印宏的每次匹配尝试
// 注意：trace_macros! 仅在 Nightly 可用，且需要放在函数体内
```

### 编译期打印（log_syntax）

Nightly 有 `log_syntax!` 宏，可以在编译期打印 token：

```rust
#![feature(log_syntax)]

macro_rules! debug_macro {
    ($($tt:tt)*) => {
        log_syntax!($($tt)*);
    };
}
```

**stable 替代方案**：用 `const` 断言：

```rust
macro_rules! debug_type {
    ($ty:ty) => {
        const _: () = {
            fn _debug() -> $ty { loop {} }
            // 编译错误会显示 $ty 的类型
        };
    };
}
```

### 渐进调试法

当宏展开出错时，逐步简化宏来定位问题：

```rust
// 第一步：简化到最小
macro_rules! my_macro {
    ($($x:expr),*) => {
        // 先不展开，只输出数量
        [$(1),*]  // 看重复是否正确
    };
}

// 第二步：逐个添加展开逻辑
macro_rules! my_macro {
    ($($x:expr),*) => {
        [$($x),*]  // 添加实际逻辑
    };
}
```

## 声明宏的限制与何时升级到过程宏

### 声明宏的硬限制

| 限制 | 说明 |
|------|------|
| 不能解析任意语法 | 只能匹配预定义的 token 模式 |
| 不能生成 trait impl 的分支 | 不能根据字段类型决定 impl |
| 不能做字符串操作 | 不能把 `"hello_world"` 转成 `HelloWorld` |
| 不能读取外部信息 | 不能读文件、环境变量、类型信息 |
| 不能递归太深 | 默认 64 层限制 |
| 错误信息差 | 宏内部错误指向宏定义，不指向调用点 |
| 不能 inspect 类型 | 不知道 $val 的类型是什么 |

### 常见"撞墙"场景

```rust
// 场景 1：需要把字符串转标识符
// "create_user" → create_user
// 声明宏做不到！必须用过程宏

// 场景 2：需要根据字段类型生成不同的代码
// struct Foo { x: i32, y: Option<String> }
// 为 i32 字段生成一种方法，为 Option<String> 生成另一种
// 声明宏看不到类型信息！

// 场景 3：需要自定义错误信息
// 声明宏的错误信息是 "no rules expected this token"
// 过程宏可以发出 "field 'x' must have type 'i32'"
```

### 升级时机判断

| 场景 | 声明宏 | 过程宏 |
|------|--------|--------|
| 简单重复展开 | 推荐 | 杀鸡用牛刀 |
| DSL / 配置语法 | 推荐 | 可选 |
| derive 实现 | 做不到 | 推荐 |
| 自定义属性 | 做不到 | 推荐 |
| 字符串变换 | 做不到 | 推荐 |
| 类型感知代码生成 | 做不到 | 推荐 |
| 复杂错误信息 | 差 | 推荐 |

**经验法则**：如果能用声明宏写，就用声明宏——编译更快、调试更容易、代码更可读。只在声明宏"撞墙"时升级到过程宏。

### 一个声明宏升级到过程宏的实例

```rust
// 声明宏版本：有限制——不支持泛型，不支持属性
macro_rules! builder {
    (
        $(#[$meta:meta])*
        $vis:vis struct $name:ident {
            $($field:ident : $ty:ty),* $(,)?
        }
    ) => {
        $(#[$meta])*
        $vis struct $name {
            $($field: $ty),*
        }

        impl $name {
            $(pub fn $field(mut self, val: $ty) -> Self {
                self.$field = val;
                self
            })*
        }
    };
}

// 问题：
// 1. 不能处理泛型 struct Foo<T> { ... }
// 2. 不能跳过某些字段（如 PhantomData）
// 3. 不能添加 Default bound
// 4. 错误信息无法定制

// → 升级到 derive 过程宏：#[derive(Builder)]
```

## 实战经验总结

### 1. 用 `@internal` 前缀区分公开和内部规则

这是声明宏的约定——`@` 开头的 arm 是内部实现细节，不应被外部调用。

### 2. 总是加 `$(,)?` 处理尾逗号

```rust
macro_rules! my_vec {
    ($($elem:expr),* $(,)?) => {
        vec![$($elem),*]
    };
}
// 否则 my_vec!(1, 2, 3,) 会报错
```

### 3. 用 `tt` 做延迟匹配

当你不确定输入的具体结构时，先用 `tt` 捕获，在递归中逐步解析：

```rust
macro_rules! lazy_parse {
    // 先捕获，后续递归再解析
    (@parse $key:tt = $value:tt $(, $rest:tt)*) => {
        // ...
    };
    ($($tt:tt)+) => {
        lazy_parse!(@parse $($tt)+)
    };
}
```

### 4. 宏的文档写在哪里

```rust
/// 为类型实现 Builder 模式
///
/// # 示例
/// ```
/// builder! {
///     struct User {
///         name: String,
///         age: u32,
///     }
/// }
/// ```
macro_rules! builder {
    // ...
}
```

宏的文档注释写在 `macro_rules!` 之前，与函数/结构体的文档约定一致。

### 5. 测试宏就是测试展开结果

```rust
#[test]
fn test_my_macro() {
    let result = my_macro!(1, 2, 3);
    assert_eq!(result, expected);
    // 如果展开出错，编译直接失败——这是好事
}
```
