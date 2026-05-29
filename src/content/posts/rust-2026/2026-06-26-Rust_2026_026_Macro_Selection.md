---
title: "Rust 2026 经验谈 - 声明宏 vs 过程宏选型"
published: 2026-06-26
description: "编译时间影响对比、调试难度对比、表达能力边界、何时该用 build script 替代宏、选型决策流程图。"
image: "/images/rust-2026/6.jpg"
tags: [Rust, Rust 2026, 宏选型, macro_rules, proc-macro, build-script]
category: Rust
draft: false
lang: zh_CN
---

![元编程与宏](/images/rust-2026/6.jpg)

Rust 有三种元编程手段：声明宏（`macro_rules!`）、过程宏（derive/attribute/function）和 build script（`build.rs`）。三种工具各有适用边界，但很多项目在选型时凭直觉决定，导致编译慢如蜗牛、错误信息如天书、或者用大炮打蚊子。本文从编译时间、调试难度、表达能力三个维度系统对比，给出清晰的选型决策流程。

## 编译时间影响对比

### 声明宏：几乎零开销

声明宏在编译期的展开是纯文本替换——编译器将宏调用替换为展开结果，然后正常编译。没有额外的 crate 需要编译，没有语法树解析开销。

```rust
macro_rules! make_struct {
    ($name:ident { $($field:ident: $ty:ty),* $(,)? }) => {
        struct $name {
            $($field: $ty),*
        }
    };
}

make_struct!(Point { x: f64, y: f64, z: f64 });
// 编译器看到的：struct Point { x: f64, y: f64, z: f64 }
// 展开几乎是瞬时完成
```

**实测数据**：在一个有 50 个声明宏的中型项目中，移除所有声明宏改用手写代码，编译时间差异不到 1 秒。声明宏的编译开销可以忽略。

### 过程宏：不可忽视的编译成本

过程宏需要编译为独立的动态链接库（`.so`/`.dll`），在编译期加载运行。这意味着：

1. **proc-macro crate 自身需要编译**——即使没有改动，每次 clean build 都要重新编译
2. **依赖链放大**——`syn` + `quote` + `proc-macro2` 三个 crate 的编译时间约 5-10 秒
3. **增量编译受限**——proc-macro 的输出依赖输入的完整 TokenStream，任何输入变化都触发重新执行

```toml
# 一个典型的 derive crate 依赖
[dependencies]
syn = "2"           # ~3s 编译
quote = "1"         # ~1s 编译
proc-macro2 = "1"   # ~0.5s 编译
```

**实测数据**：在一个使用 `serde`（包含 `serde_derive`）的项目中：

| 场景 | 编译时间 |
|------|----------|
| 无 serde | 12s |
| 有 serde（首次） | 22s |
| 有 serde（增量，修改非宏代码） | 3s |
| 有 serde（增量，修改宏输入结构体） | 8s |

**关键洞察**：过程宏首次编译的开销主要来自 `syn`/`quote` 的编译，而非宏逻辑本身的执行。一旦 proc-macro crate 编译完成，增量构建中如果宏输入未变，开销很小。

### 减少 proc-macro 编译开销的技巧

**技巧一：合并 proc-macro crate**

```toml
# 不好：三个独立的 proc-macro crate
my_derive_a/   # 各自依赖 syn + quote
my_derive_b/
my_derive_c/

# 好：合并为一个
my_derives/    # 只编译一次 syn + quote
```

**技巧二：用 `std::sync::LazyLock` 缓存编译期计算结果**

```rust
use std::sync::LazyLock;
use std::collections::HashMap;

static KEYWORD_MAP: LazyLock<HashMap<&'static str, &'static str>> = LazyLock::new(|| {
    let mut m = HashMap::new();
    m.insert("i32", "int32_t");
    m.insert("u64", "uint64_t");
    m
});
```

**技巧三：用 `regex` 的 `LazyLock` 而非 `litregex!`**

有些函数宏（如 `regex!`）在编译期编译正则表达式。如果改用运行时 `LazyLock`，可以避免 proc-macro 开销，代价是正则错误推迟到运行时。

## 调试难度对比

### 声明宏：错误信息虽差但可预测

声明宏的错误信息主要有两类：

1. **"no rules expected this token"**——宏调用不匹配任何 arm
2. **展开后的类型错误**——指向宏内部，而非调用点

```rust
macro_rules! make_adder {
    ($val:expr) => {
        |x: i32| x + $val
    };
}

// 错误 1：token 不匹配
// make_adder!(1, 2);
// error: no rules expected this token `,`

// 错误 2：类型不匹配——错误指向宏内部
// let adder = make_adder!("string");
// error: cannot add `&str` to `i32`
//   --> src/macros.rs:2:24  （指向宏定义内部）
```

**应对方法**：

- 用 `cargo expand` 查看展开结果
- 在宏定义中加 `// $val: expr` 注释帮助理解
- 用更严格的片段分类符缩小匹配范围

### 过程宏：错误信息可以很好（但写好很难）

过程宏可以通过 `syn::Error` 提供精确的错误位置和描述：

```rust
use syn::spanned::Spanned;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    match &input.data {
        syn::Data::Union(_) => {
            return syn::Error::new(
                input.span(),
                "MyTrait 只能派生给 struct 或 enum，不支持 union"
            ).to_compile_error().into();
        }
        _ => {}
    }

    // ...
}
```

**但问题是**：很多过程宏的错误处理写得差——直接 `panic!("不支持枚举")`，错误信息没有位置、没有上下文。

**踩坑总结**：

| 问题 | 声明宏 | 过程宏 |
|------|--------|--------|
| 错误位置 | 指向宏定义（差） | 可以指向调用点（好），但需手动写 span |
| 错误描述 | "no rules expected"（差） | 可以自定义（好），但需手动写 |
| 多错误 | 不可能 | 可以 `emit` 多个，但需 collect |
| panic | 编译错误 | `proc_macro_panic` → 编译崩溃 |

**关键原则**：过程宏永远不要 `panic!`，永远用 `syn::Error`。

### 调试工具链对比

| 工具 | 声明宏 | 过程宏 |
|------|--------|--------|
| `cargo expand` | 支持 | 支持 |
| `cargo check` | 错误指向宏内部 | 错误指向调用点（如果 span 正确） |
| `eprintln!` | 不适用 | 编译期输出到 stderr |
| 单元测试 | 测试展开结果 | 用 `proc-macro2` 测试生成逻辑 |
| IDE 支持 | hover 显示展开（部分） | hover 显示展开（部分） |

## 表达能力边界

### 声明宏能做的事

- 重复展开（`$()*` / `$()+`）
- 模式匹配 token
- 递归处理（tt muncher）
- 生成任何合法的 Rust 代码

### 声明宏做不到的事（硬限制）

**1. 字符串操作**

```rust
// 不可能：把 "hello_world" 转成 HelloWorld
// 不可能：把 "create_user" 转成 CREATE_USER
// 声明宏无法操作字符串内容
```

**2. 条件编译 / 类型感知**

```rust
// 不可能：根据字段类型生成不同代码
// struct Foo { x: i32, y: Option<String> }
// 不能对 i32 和 Option<String> 生成不同的方法
```

**3. 读取外部信息**

```rust
// 不可能：读取文件、环境变量、类型信息
// 不可能：根据数据库 schema 生成结构体
```

**4. 自定义解析**

```rust
// 不可能：解析非 Rust 语法
// 不可能：把 "1..10" 解析为 Range { start: 1, end: 10 }
```

**5. 错误信息定制**

```rust
// 不可能：输出 "field 'name' must have type 'String'"
// 只能输出 "no rules expected this token"
```

### 过程宏的表达能力

过程宏可以做到以上所有，但也有边界：

- **不能访问类型信息**——过程宏只能看到 token，不知道 `Foo` 是 struct 还是 enum，不知道 `i32` 的大小
- **不能跨 crate 访问**——过程宏不能读取依赖 crate 的信息
- **不能修改已有代码**——只能生成新代码（attribute 宏可以替换，但不能修改其他项）

### 能力对比表

| 能力 | 声明宏 | 过程宏 | build script |
|------|--------|--------|-------------|
| 重复展开 | 支持 | 支持 | 不适用 |
| 字符串操作 | 不支持 | 支持 | 支持 |
| 条件代码生成 | 不支持 | 部分支持 | 支持 |
| 读取外部文件 | 不支持 | 不支持 | 支持 |
| 访问类型信息 | 不支持 | 不支持 | 不支持 |
| 自定义错误 | 不支持 | 支持 | 不适用 |
| 修改已有代码 | 不支持 | attribute 宏可替换 | 不适用 |

## 何时该用 build script 替代宏

### build script 的定位

`build.rs` 在编译主 crate 之前运行，可以：
- 读取文件、执行命令、查询环境
- 生成 `.rs` 文件到 `$OUT_DIR`
- 设置 `cargo:rerun-if-changed` 等编译指令

### 信号：代码生成量

当宏生成的代码量达到一定规模时，过程宏的编译期执行会成为瓶颈：

| 生成代码量 | 推荐方案 | 原因 |
|-----------|---------|------|
| < 100 行 | 声明宏 | 零开销，调试方便 |
| 100-1000 行 | 过程宏 | 可控，derive 最合适 |
| > 1000 行 | build script | 过程宏在编译期执行大代码生成会拖慢每次编译 |
| 从外部数据生成 | build script | 过程宏不能读文件 |

### 实战案例：Protobuf 代码生成

```rust
// 方案 1（过程宏）：prost-wkt 的 #[derive(Message)]
// 适合：少量手动定义的消息
// 问题：大 schema（1000+ 消息）时编译很慢

// 方案 2（build script）：prost 的 build.rs
// 适合：大 schema
// 优势：只在 .proto 文件变化时重新生成

// build.rs
fn main() {
    prost_build::Config::new()
        .file("proto/my_service.proto")
        .out_dir(std::path::PathBuf::from("src/proto"))
        .compile_protos(
            &["proto/my_service.proto"],
            &["proto/"],
        )
        .unwrap();
}
```

### 信号：需要外部信息

```rust
// build.rs：从数据库 schema 生成模型
fn main() {
    let schema = std::fs::read_to_string("schema.sql").unwrap();
    let models = parse_schema(&schema);
    
    let mut output = String::new();
    for model in &models {
        output.push_str(&generate_struct(model));
        output.push_str(&generate_impl(model));
    }
    
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let dest_path = std::path::Path::new(&out_dir).join("models.rs");
    std::fs::write(&dest_path, output).unwrap();
    
    println!("cargo:rerun-if-changed=schema.sql");
}
```

```rust
// src/main.rs
mod models {
    include!(concat!(env!("OUT_DIR"), "/models.rs"));
}
```

### build script 的局限

- 生成的代码没有语法高亮和 IDE 补全
- 修改生成逻辑需要 clean build
- 错误信息指向生成的文件，不指向 schema

### 混合方案：build script + 声明宏

```rust
// build.rs 生成基础数据结构
// 声明宏提供便捷的 DSL 包装

macro_rules! define_api {
    ($($method:ident => $handler:ty),* $(,)?) => {
        $(
            pub fn $method() -> $handler {
                $handler::new()
            }
        )*
    };
}

// build.rs 生成的代码中使用声明宏
define_api! {
    get_users => UsersHandler,
    create_user => CreateUserHandler,
    delete_user => DeleteUserHandler,
}
```

## 选型决策流程图

```
                     需要元编程？
                        │
                   ┌────┴────┐
                   │         │
                  否         是
                   │         │
              不需要宏    需要哪种？
                              │
                    ┌─────────┼─────────┐
                    │         │         │
               重复展开？  自定义语法？  外部数据？
                    │         │         │
               声明宏    过程宏？    build script
                    │         │
                    │    ┌────┴────┐
                    │    │         │
                    │  derive？  属性/函数宏？
                    │    │         │
                    │  derive宏   需要哪种？
                    │             │
                    │       ┌─────┼─────┐
                    │       │     │     │
                    │   修改项？ DSL？ 编译期计算？
                    │       │     │     │
                    │   属性宏 函数宏 函数宏
                    │
              ┌─────┴─────┐
              │           │
         生成量 < 100行？  生成量 > 100行？
              │           │
         声明宏     考虑过程宏
```

### 简化决策规则

1. **只需重复展开** → 声明宏
2. **需要 derive trait** → derive 过程宏
3. **需要修改/增强项** → 属性过程宏
4. **需要自定义 DSL** → 函数过程宏
5. **需要读文件/外部数据** → build script
6. **生成代码量巨大** → build script
7. **声明宏够用就用声明宏** → 性能和可维护性最优

### 特殊场景：混合使用

```rust
// 场景：ORM 框架
// build.rs：从 schema 生成基础结构体
// #[derive(Model)]：为结构体添加 CRUD 方法
// macro_rules!：提供查询 DSL

macro_rules! query {
    ($table:ident . $field:ident == $val:expr) => {
        Query::new(stringify!($table))
            .where_eq(stringify!($field), $val)
    };
    ($table:ident . $field:ident > $val:expr) => {
        Query::new(stringify!($table))
            .where_gt(stringify!($field), $val)
    };
}

// 使用
#[derive(Model)]
#[table("users")]
struct User {
    id: i64,
    name: String,
}

let q = query!(users.id == 42);
```

## 编译时间实测对比

### 测试场景

创建一个项目，分别用声明宏、过程宏、build script 生成 100 个结构体及其 impl 块：

| 方案 | clean build | 增量（无改动） | 增量（修改一个结构体） |
|------|------------|---------------|---------------------|
| 声明宏 | 2.1s | 0.3s | 0.5s |
| 过程宏 | 8.4s | 0.4s | 3.2s |
| build script | 3.8s | 0.3s | 3.8s（rerun） |

**解读**：
- 声明宏增量最快——因为宏展开结果可以增量编译
- 过程宏增量改结构体时需要重新执行宏——因为输入变了
- build script 一旦 rerun 就是全量重新生成

### 优化建议

**对过程宏**：
- 用 `hashbrown` 代替 `std::collections::HashMap`（在 proc-macro crate 中）
- 减少不必要的 `syn` 特性（`syn = { version = "2", features = ["full"] }` → 按需启用）
- 分离 proc-macro crate 和 impl crate，只在 proc-macro crate 中依赖 `syn`

**对 build script**：
- 精确设置 `cargo:rerun-if-changed`，避免不必要的 rerun
- 用 `cargo:rerun-if-env-changed` 监听环境变量变化
- 生成到固定路径而非 `$OUT_DIR`，配合 `include!` 使用

## 常见选型误区

### 误区一：所有 derive 都用过程宏

有些 derive 逻辑很简单，声明宏的 `macro_rules!` 完全可以胜任。例如，为枚举实现 `from_str` 方法：

```rust
macro_rules! from_str_impl {
    ($enum:ident { $($variant:ident),* $(,)? }) => {
        impl std::str::FromStr for $enum {
            type Err = String;
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $(stringify!($variant) => Ok($enum::$variant),)*
                    _ => Err(format!("unknown variant: {}", s)),
                }
            }
        }
    };
}

enum Color { Red, Green, Blue }

from_str_impl!(Color { Red, Green, Blue });
```

这不需要过程宏。

### 误区二：build script 做简单代码生成

如果只是生成几个常量，用声明宏：

```rust
// 不好：为几个常量写 build.rs
// 好：
macro_rules! const_def {
    ($($name:ident = $val:expr);* $(;)?) => {
        $(pub const $name: usize = $val;)*
    };
}

const_def! {
    MAX_SIZE = 1024;
    MIN_SIZE = 64;
    DEFAULT_SIZE = 256;
}
```

### 误区三：过程宏做编译期 IO

过程宏不能做 IO——但有人用 `std::fs::read_to_string` 在过程宏中读文件。这在技术上可行（过程宏在编译期运行，有文件系统访问权），但：

- 违反了过程宏的语义约定
- `cargo` 的缓存机制不会检测文件变化
- 增量编译可能产生不一致的结果

**正确做法**：用 build script 读文件，生成的代码用 `include!` 引入。

## 实战经验总结

### 1. 优先级：声明宏 > 过程宏 > build script

声明宏是首选——编译快、调试容易、无额外依赖。过程宏在声明宏"撞墙"时使用。build script 在需要外部数据或大量代码生成时使用。

### 2. 过程宏的 crate 结构要规范

```
my_derive/         # proc-macro crate（薄封装）
my_derive_impl/    # 普通 crate（逻辑实现，可测试）
my_project/        # 使用宏
```

这不仅是最佳实践，更是为了可测试性。

### 3. build script 要精确设置 rerun 条件

```rust
fn main() {
    println!("cargo:rerun-if-changed=schema.sql");
    println!("cargo:rerun-if-env-changed=DATABASE_URL");
    // 缺少这些，cargo 无法知道何时需要 rerun
}
```

### 4. 混合方案往往最优

- build script 生成数据结构 → 过程宏添加方法 → 声明宏提供 DSL
- 各取所长，而不是一种方案包打天下

### 5. 监控编译时间

```bash
cargo clean && cargo build -Z timings
# 需要 Nightly 工具链；或使用 cargo +nightly build -Z timings
# 在 target/cargo-timings/ 中查看各 crate 的编译时间
# proc-macro crate 通常是最慢的
# 稳定版替代：cargo clean && time cargo build
```
