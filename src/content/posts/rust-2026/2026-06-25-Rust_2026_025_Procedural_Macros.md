---
title: "Rust 2026 经验谈 - 过程宏三件套"
published: 2026-06-25
description: "derive/attribute/function 三种过程宏详解、proc-macro2+quote+syn 工作链、derive 宏设计模式、属性宏实战、函数宏实战、调试技巧。"
image: "/images/rust-2026/6.jpg"
tags: [Rust, Rust 2026, 过程宏, proc-macro, syn, quote]
category: Rust
draft: false
lang: zh_CN
---

![元编程与宏](/images/rust-2026/6.jpg)

过程宏是 Rust 元编程的最高形式——它能读写 Rust 语法树、生成任意代码、提供自定义 DSL。三种过程宏（derive、attribute、function）各有适用场景，而 `syn` + `quote` + `proc-macro2` 工作链是编写过程宏的标配。本文从实现模板到设计模式，系统总结过程宏的实战经验。

## derive / attribute / function 三种过程宏

### 类型概览

| 类型 | 签名 | 用法 | 典型场景 |
|------|------|------|----------|
| derive | `fn(TokenStream) -> TokenStream` | `#[derive(Trait)]` | 自动实现 trait |
| attribute | `fn(TokenStream, TokenStream) -> TokenStream` | `#[my_attr(...)]` | 修改/增强项 |
| function | `fn(TokenStream) -> TokenStream` | `my_macro!(...)` | DSL、编译期计算 |

### 项目结构

过程宏必须在独立的 crate 中定义，且 `lib.rs` 的 crate type 为 `proc-macro`：

```
my_project/
├── Cargo.toml
├── src/
│   └── main.rs          # 使用宏
└── my_derive/
    ├── Cargo.toml
    └── src/
        └── lib.rs       # 定义宏
```

```toml
# my_derive/Cargo.toml
[package]
name = "my_derive"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
syn = "2"
quote = "1"
proc-macro2 = "1"
```

```toml
# my_project/Cargo.toml
[dependencies]
my_derive = { path = "../my_derive" }
```

## proc-macro2 + quote + syn 工作链深入

### 三个 crate 的职责

| crate | 职责 | 为什么需要 |
|-------|------|-----------|
| `proc-macro` | 编译器提供的 API | 只能在 proc-macro crate 中使用 |
| `proc-macro2` | `proc-macro` 的稳定封装 | 允许在非 proc-macro crate 中测试 |
| `syn` | 将 TokenStream 解析为 AST | 手动解析 TokenStream 极其痛苦 |
| `quote` | 将 Rust 代码模板转为 TokenStream | 比手动拼接 token 更安全 |

### syn：语法树解析

```rust
use syn::{parse_macro_input, DeriveInput, Data, Fields, Field};

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    // parse_macro_input：将 TokenStream 解析为 DeriveInput
    // 如果解析失败，自动报错
    let input = parse_macro_input!(input as DeriveInput);

    // DeriveInput 的结构：
    // struct DeriveInput {
    //     attrs: Vec<Attribute>,     // #[...] 属性
    //     vis: Visibility,           // pub / pub(crate) / ...
    //     ident: Ident,              // 结构体/枚举名
    //     generics: Generics,        // 泛型参数
    //     data: Data,                // 具体数据：struct 或 enum
    // }

    let name = &input.ident;
    let generics = &input.generics;

    // 提取字段
    let fields: Vec<&Field> = match &input.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => fields.named.iter().collect(),
                Fields::Unnamed(fields) => fields.unnamed.iter().collect(),
                Fields::Unit => vec![],
            }
        }
        Data::Enum(_) => panic!("MyTrait 不支持枚举"),
        Data::Union(_) => panic!("MyTrait 不支持联合体"),
    };

    // ... 生成代码
    todo!()
}
```

### quote：代码生成

```rust
use quote::quote;
use proc_macro2::TokenStream;

fn generate_impl(name: &syn::Ident, fields: &[&syn::Field]) -> TokenStream {
    // quote! 宏中：
    // #var —— 插入变量（实现 ToTokens 的类型）
    // #(#var => expr),* —— 重复展开（类似 macro_rules!）

    let field_names: Vec<&syn::Ident> = fields
        .iter()
        .filter_map(|f| f.ident.as_ref())
        .collect();

    quote! {
        impl #name {
            pub fn field_count() -> usize {
                #(#field_names;)*  // 为每个字段生成一个语句
                #field_names.len() // 不对——这是错的
            }
        }
    }
}
```

**正确版本**：

```rust
fn generate_impl(name: &syn::Ident, field_names: &[&syn::Ident]) -> TokenStream {
    let count = field_names.len();

    quote! {
        impl #name {
            pub fn field_count() -> usize {
                #count
            }

            pub fn field_names() -> &'static [&'static str] {
                &[#(stringify!(#field_names)),*]
            }
        }
    }
}
```

### proc-macro2：脱离 proc-macro 上下文测试

```rust
// 在 tests/test_derive.rs 中（非 proc-macro crate）
use proc_macro2::TokenStream;
use quote::quote;
use syn::{parse_quote, DeriveInput};

#[test]
fn test_derive_expansion() {
    // 用 proc_macro2::TokenStream 代替 proc_macro::TokenStream
    let input: DeriveInput = parse_quote! {
        struct Foo {
            x: i32,
            y: String,
        }
    };

    // 调用你的生成逻辑（需要把逻辑抽到非 proc-macro 函数中）
    let output = my_derive_logic(&input);

    // 检查生成结果
    let expected = quote! {
        impl Foo {
            pub fn field_count() -> usize {
                2
            }
        }
    };
    assert_eq!(output.to_string(), expected.to_string());
}
```

**关键**：过程宏的逻辑应该分离到另一个 crate（如 `my_derive_impl`），`my_derive` 只做薄封装（`parse_macro_input` + 调用 impl + 返回）。这样 impl crate 可以用 `proc-macro2` 做单元测试。

## 常见 derive 宏设计模式

### 模式一：简单字段遍历

最基础的 derive 宏——遍历结构体字段，为每个字段生成代码：

```rust
use proc_macro::TokenStream;
use quote::{quote, format_ident};
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Builder)]
pub fn derive_builder(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic!("Builder 只支持具名字段的结构体"),
        },
        _ => panic!("Builder 只支持结构体"),
    };

    // 生成 Builder 结构体
    let builder_name = format_ident!("{}Builder", name);
    let field_names: Vec<_> = fields.iter().map(|f| &f.ident).collect();
    let field_types: Vec<_> = fields.iter().map(|f| &f.ty).collect();
    let option_types: Vec<_> = field_types.iter().map(|ty| quote!(Option<#ty>)).collect();

    let expanded = quote! {
        pub struct #builder_name {
            #( #field_names: #option_types, )*
        }

        impl #name {
            pub fn builder() -> #builder_name {
                #builder_name {
                    #( #field_names: None, )*
                }
            }
        }

        impl #builder_name {
            #(
                pub fn #field_names(mut self, val: #field_types) -> Self {
                    self.#field_names = Some(val);
                    self
                }
            )*

            pub fn build(self) -> Result<#name, Box<dyn std::error::Error>> {
                Ok(#name {
                    #( #field_names: self.#field_names.ok_or_else(|| {
                        format!("field {} is required", stringify!(#field_names))
                    })?, )*
                })
            }
        }
    };

    TokenStream::from(expanded)
}
```

### 模式二：带泛型的 derive

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Generics};

#[proc_macro_derive(Summarize)]
pub fn derive_summarize(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;

    // 处理泛型：需要 (impl_generics, type_generics, where_clause)
    let (impl_generics, type_generics, where_clause) = generics.split_for_impl();

    let fields = match &input.data {
        syn::Data::Struct(data) => match &data.fields {
            syn::Fields::Named(fields) => &fields.named,
            _ => panic!("Summarize 只支持具名字段"),
        },
        _ => panic!("Summarize 只支持结构体"),
    };

    let field_names: Vec<_> = fields.iter().map(|f| &f.ident).collect();

    let expanded = quote! {
        impl #impl_generics #name #type_generics #where_clause {
            pub fn summarize(&self) -> String {
                format!(
                    "{}: {}",
                    stringify!(#name),
                    [#(stringify!(#field_names)),*].join(", ")
                )
            }
        }
    };

    TokenStream::from(expanded)
}
```

**关键**：`generics.split_for_impl()` 生成三元组：
- `impl_generics`：`<T: Clone>`（impl 后的泛型声明）
- `type_generics`：`<T>`（类型名后的泛型参数）
- `where_clause`：`where T: Clone`（where 子句）

### 模式三：读取字段属性

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields, Meta, Expr, ExprLit};

#[proc_macro_derive(Serialize, attributes(serde))]
pub fn derive_serialize(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic!("只支持具名字段"),
        },
        _ => panic!("只支持结构体"),
    };

    // 读取每个字段的属性，如 #[serde(rename = "foo")]
    let serialize_fields: Vec<_> = fields.iter().map(|field| {
        let ident = field.ident.as_ref().unwrap();
        let mut rename = quote!(stringify!(#ident));

        for attr in &field.attrs {
            if attr.path().is_ident("serde") {
                // 解析 #[serde(rename = "foo")] 格式
                if let Some(nested) = attr.meta.require_list().ok() {
                    for meta in nested.parse_args::<Vec<Meta>>().unwrap_or_default() {
                        if let Meta::NameValue(nv) = meta {
                            if nv.path.is_ident("rename") {
                                if let Expr::Lit(expr_lit) = &nv.value {
                                    rename = quote!(#expr_lit);
                                }
                            }
                        }
                    }
                }
            }
        }

        quote! {
            map.insert(#rename.to_owned(), self.#ident.to_string());
        }
    }).collect();

    let expanded = quote! {
        impl #name {
            pub fn serialize(&self) -> std::collections::HashMap<String, String> {
                let mut map = std::collections::HashMap::new();
                #(#serialize_fields)*
                map
            }
        }
    };

    TokenStream::from(expanded)
}
```

**注意**：`#[proc_macro_derive(Serialize, attributes(serde))]` 中的 `attributes(serde)` 声明了辅助属性，否则编译器会报"unknown attribute"错误。

## 属性宏实战

### 路由注册

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, FnArg, Type};

#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
    // attr：属性参数，如 "/api/users"
    // item：被装饰的函数

    let path = parse_macro_input!(attr as syn::LitStr);
    let handler = parse_macro_input!(item as ItemFn);

    let fn_name = &handler.sig.ident;
    let fn_vis = &handler.vis;

    // 提取参数类型
    let param_types: Vec<_> = handler.sig.inputs.iter()
        .filter_map(|arg| {
            if let FnArg::Typed(pat_type) = arg {
                Some(pat_type.ty.as_ref())
            } else {
                None
            }
        })
        .collect();

    let expanded = quote! {
        #handler

        #fn_vis const ROUTE: (&'static str, fn(#(#param_types),*) -> _) = (
            #path,
            #fn_name,
        );
    };

    TokenStream::from(expanded)
}
```

使用：

```rust
#[route("/api/users")]
fn get_users(db: &Db) -> Vec<User> {
    db.query("SELECT * FROM users")
}

// 展开后：
fn get_users(db: &Db) -> Vec<User> { ... }
const ROUTE: (&'static str, fn(&Db) -> _) = ("/api/users", get_users);
```

### ORM 映射

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields, Attribute, Meta};

#[proc_macro_attribute]
pub fn table(attr: TokenStream, item: TokenStream) -> TokenStream {
    let table_name = parse_macro_input!(attr as syn::LitStr);
    let input = parse_macro_input!(item as DeriveInput);
    let name = &input.ident;

    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic!("只支持具名字段"),
        },
        _ => panic!("只支持结构体"),
    };

    let column_names: Vec<_> = fields.iter().map(|f| {
        let ident = f.ident.as_ref().unwrap();
        // 检查 #[column(name = "xxx")] 属性
        for attr in &f.attrs {
            if attr.path().is_ident("column") {
                // 解析自定义列名
                // ...
            }
        }
        quote!(stringify!(#ident))
    }).collect();

    let field_names: Vec<_> = fields.iter().map(|f| f.ident.as_ref().unwrap()).collect();

    let expanded = quote! {
        #input

        impl #name {
            pub fn table_name() -> &'static str {
                #table_name
            }

            pub fn columns() -> &'static [&'static str] {
                &[#(#column_names),*]
            }

            pub fn insert_sql(&self) -> String {
                format!(
                    "INSERT INTO {} ({}) VALUES ({})",
                    Self::table_name(),
                    Self::columns().join(", "),
                    [#(self.#field_names.to_string()),*].join(", "),
                )
            }
        }
    };

    TokenStream::from(expanded)
}
```

## 函数宏实战

### SQL 检查

函数式过程宏可以在编译期检查 SQL 语法：

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::parse::{Parse, ParseStream};
use syn::{Ident, LitStr, Token, braced};

struct SqlQuery {
    query: LitStr,
}

impl Parse for SqlQuery {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let query: LitStr = input.parse()?;
        // 编译期 SQL 语法检查
        let sql = query.value();
        if sql.is_empty() {
            return Err(syn::Error::new(query.span(), "SQL 查询不能为空"));
        }
        // 简单检查：必须以 SELECT/INSERT/UPDATE/DELETE 开头
        let upper = sql.trim_start().to_uppercase();
        if !upper.starts_with("SELECT")
            && !upper.starts_with("INSERT")
            && !upper.starts_with("UPDATE")
            && !upper.starts_with("DELETE")
        {
            return Err(syn::Error::new(
                query.span(),
                "SQL 查询必须以 SELECT/INSERT/UPDATE/DELETE 开头",
            ));
        }
        Ok(SqlQuery { query })
    }
}

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let SqlQuery { query } = syn::parse_macro_input!(input as SqlQuery);
    quote!(#query).into()
}
```

使用：

```rust
let q = sql!("SELECT * FROM users WHERE id = $1");
// 编译期检查 SQL 语法

// let bad = sql!("INVALID SQL");  // 编译错误！
```

### 配置解析

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::parse::{Parse, ParseStream};
use syn::{Ident, LitStr, Token};

struct ConfigEntry {
    key: Ident,
    _eq: Token![=],
    value: LitStr,
}

impl Parse for ConfigEntry {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(ConfigEntry {
            key: input.parse()?,
            _eq: input.parse()?,
            value: input.parse()?,
        })
    }
}

struct Config {
    entries: Vec<ConfigEntry>,
}

impl Parse for Config {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut entries = vec![];
        while !input.is_empty() {
            entries.push(input.parse()?);
            let _comma: Option<Token![,]> = input.parse().ok();
        }
        Ok(Config { entries })
    }
}

#[proc_macro]
pub fn config(input: TokenStream) -> TokenStream {
    let Config { entries } = syn::parse_macro_input!(input as Config);

    let keys: Vec<_> = entries.iter().map(|e| &e.key).collect();
    let values: Vec<_> = entries.iter().map(|e| &e.value).collect();

    let expanded = quote! {
        {
            let mut cfg = std::collections::HashMap::new();
            #(
                cfg.insert(stringify!(#keys).to_owned(), #values.to_owned());
            )*
            cfg
        }
    };

    expanded.into()
}
```

使用：

```rust
let cfg = config! {
    host = "localhost",
    port = "8080",
    db = "myapp",
};
```

## 过程宏调试技巧

### 技巧一：cargo expand

与声明宏相同，`cargo expand` 是首选调试工具：

```bash
cargo expand
```

### 技巧二：eprintln! 调试

过程宏在编译期运行，`eprintln!` 输出到 stderr：

```rust
#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    eprintln!("INPUT: {}", input);
    let output = /* ... */;
    eprintln!("OUTPUT: {}", output);
    output
}
```

编译时在终端看到展开结果。

### 技巧三：span_error 提供精确错误

```rust
use syn::spanned::Spanned;
use quote::quote;

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    match &input.data {
        syn::Data::Union(_) => {
            // 错误指向 union 关键字
            return syn::Error::new(
                input.span(),
                "MyTrait 不支持 union"
            ).to_compile_error().into();
        }
        _ => {}
    }

    // ...
}
```

### 技巧四：分离逻辑到普通 crate

```
my_derive/         # proc-macro crate（薄封装）
my_derive_impl/    # 普通 crate（逻辑实现，可测试）
my_project/        # 使用宏
```

```rust
// my_derive/src/lib.rs
#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    my_derive_impl::derive_impl(input.into()).into()
}

// my_derive_impl/src/lib.rs
use proc_macro2::TokenStream;

pub fn derive_impl(input: TokenStream) -> TokenStream {
    let input: syn::DeriveInput = match syn::parse2(input) {
        Ok(i) => i,
        Err(e) => return e.to_compile_error(),
    };
    // 逻辑实现...
}
```

这样 `my_derive_impl` 可以有完整的 `#[test]`。

### 技巧五：用 prettyplease 格式化展开结果

```bash
cargo install cargo-expand
cargo expand | python -c "import sys; print(sys.stdin.read())" > expanded.rs
rustfmt expanded.rs
```

或用 `prettyplease` crate 程序化格式化：

```rust
let code = prettyplease::unparse(&syn::parse_file(&expanded).unwrap());
```

### 技巧六：处理递归类型

```rust
// 避免无限递归：检查类型是否是自身
fn contains_self_type(ty: &syn::Type, self_name: &syn::Ident) -> bool {
    match ty {
        syn::Type::Path(type_path) => {
            type_path.path.segments.iter()
                .any(|seg| seg.ident == *self_name)
        }
        syn::Type::Reference(ref_type) => {
            contains_self_type(&ref_type.elem, self_name)
        }
        _ => false,
    }
}
```

## 实战经验总结

### 1. 过程宏的逻辑必须可测试

过程宏在编译期运行，出错时只有 panic 或编译错误——没有 debug 工具。把逻辑抽到 `impl` crate，用 `proc-macro2` + `syn::parse2` 做单元测试是必须的。

### 2. 错误处理用 `syn::Error`，不要 panic

`panic!` 在过程宏中会变成 `compiler error: proc macro panicked`，没有位置信息。`syn::Error::new(span, msg)` 会指向具体代码位置。

### 3. 不要过度依赖 `unimplemented!`

过程宏的展开可能在编译期被缓存。如果宏内部 `panic!` 或 `todo!()`，后续所有用到该宏的编译都会失败，且错误信息不明确。

### 4. helper attributes 必须声明

```rust
// 正确：声明 helper attribute
#[proc_macro_derive(MyTrait, attributes(my_helper))]
pub fn my_trait(input: TokenStream) -> TokenStream { ... }

// 错误：未声明，编译器会报 "unknown attribute"
#[proc_macro_derive(MyTrait)]
pub fn my_trait(input: TokenStream) -> TokenStream { ... }
```

### 5. 过程宏的性能影响编译速度

过程宏在编译期运行，复杂的宏（如 `serde`、`tokio-macros`）会显著增加编译时间。优化方式：
- 减少不必要的 `syn` 解析（用 `parse_quote!` 快速构造）
- 缓存计算结果（过程宏的输入相同时，编译器会缓存输出）
- 用 `fn` 宏替代 `derive` 宏（当不需要属性时，`fn` 宏通常更简单）
