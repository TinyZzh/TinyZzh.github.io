---
title: "Rust 2026 经验谈 - 项目工程化实践"
published: 2026-06-03
description: "深入 Cargo workspace、feature 组织策略、build script 模式、交叉编译实践和 cargo xtask 模式，掌握 Rust 项目工程化的核心知识。"
image: "/images/rust-2026/1.jpg"
tags: [Rust, Rust 2026, 工程化, Cargo, Workspace]
category: Rust
draft: false
lang: zh_CN
---

![重新认识 Rust](/images/rust-2026/1.jpg)

Rust 项目在规模增长时面临的工程化挑战和其他语言有共性也有个性。共性在于模块化、依赖管理、构建配置；个性在于 Cargo 的独到设计（workspace、feature、build script）以及 Rust 的交叉编译生态。本文将分享我在中大型 Rust 项目中积累的工程化实践经验，重点回答"为什么这样做"而非仅仅"怎么做"。

## Cargo Workspace 深度用法

### 为什么需要 Workspace

单 crate 项目超过 5 万行时，编译时间会成为痛点。Workspace 的核心价值不是"组织多个 crate"（你用多个 repo 也行），而是**共享一个 `Cargo.lock` 和一个编译缓存**。

```toml
# Cargo.toml (workspace 根)
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
    "crates/sdk",
]

# 所有成员共享一个 Cargo.lock，保证版本一致性
# 增量编译在 workspace 级别共享，改 core 不需要重编译 api 的依赖
```

### 虚拟 Workspace（Virtual Workspace）

虚拟 workspace 没有自己的 `[package]` 段，仅作为组织容器：

```toml
# Cargo.toml
[workspace]
members = ["crates/*"]
resolver = "3"
```

**何时用虚拟 workspace**：当你没有"主 crate"时。例如一个库的 workspace，所有成员都是库 crate，没有 binary 入口。

**何时用非虚拟 workspace**：当项目有一个主 binary（如 CLI 工具），且主 binary 依赖 workspace 中的其他 crate 时，把主 binary 作为 workspace 根是自然的选择：

```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2024"

[workspace]
members = ["crates/*"]
```

### Workspace 继承（Inheritable Fields）

Rust 1.64+ 支持在 workspace 根定义共享字段，成员 crate 通过 `workspace = true` 继承。这是我最喜欢的工程化特性之一：

```toml
# 根 Cargo.toml
[workspace]
members = ["crates/*"]

[workspace.package]
version = "0.5.0"
edition = "2024"
license = "MIT OR Apache-2.0"
repository = "https://github.com/example/my-project"
rust-version = "1.96.0"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
anyhow = "1.0"
```

```toml
# crates/api/Cargo.toml
[package]
name = "my-api"
version.workspace = true
edition.workspace = true
license.workspace = true
repository.workspace = true

[dependencies]
serde.workspace = true
tokio.workspace = true
my-core = { path = "../core" }  # workspace 内路径依赖
```

**踩坑**：`workspace.dependencies` 中声明的依赖版本是**所有成员的统一约束**。如果某个成员需要不同 feature（如 `serde` 不带 `derive`），你需要在该成员的 `[dependencies]` 中单独声明，不能用 `workspace = true`。解决方法是在 workspace 级声明多个变体：

```toml
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
serde-noderive = { version = "1.0", package = "serde" }  # 同一 crate，不同 feature
```

不过这种变体命名容易混乱，建议只在确实需要时使用。

### Workspace 依赖图验证

在 workspace 中，依赖方向很重要。`core` 不应依赖 `api`，`api` 不应依赖 `cli`。建议在 CI 中用 `cargo-depgraph` 检查依赖方向：

```bash
cargo depgraph --workspace-only | dot -Tpng > deps.png
```

## Feature 组织策略

### Feature 的本质

Feature 是 Cargo 的条件编译机制——它们在 `Cargo.toml` 中声明，对应 `cfg` 属性，编译时决定哪些代码参与编译。理解 feature 的关键在于：**feature 是加法式的（additive）**。一个 feature 只能"添加"代码，不能"移除"代码。

### Feature 组合

```toml
[features]
default = ["json", "tokio-runtime"]
json = ["serde_json"]
yaml = ["serde_yaml"]
tokio-runtime = ["tokio"]
async-std-runtime = ["async-std"]

# 组合 feature
full = ["json", "yaml", "tokio-runtime"]
```

```rust
#[cfg(feature = "json")]
pub mod json {
    pub fn serialize<T: serde::Serialize>(val: &T) -> String {
        serde_json::to_string(val).unwrap()
    }
}

#[cfg(feature = "yaml")]
pub mod yaml {
    pub fn serialize<T: serde::Serialize>(val: &T) -> String {
        serde_yaml::to_string(val).unwrap()
    }
}
```

**经验谈**：避免 feature 之间的隐式依赖。如果一个 feature `full` 依赖 `json`，显式声明：

```toml
[features]
full = ["json", "yaml"]  # full 隐式启用 json 和 yaml
```

### 互斥 Feature（Anti-pattern 与替代方案）

Cargo 的 feature 是加法式的，**没有原生的互斥 feature 机制**。你无法声明"tokio-runtime 和 async-std-runtime 不能同时启用"。这是故意的设计：互斥 feature 会破坏 Cargo 的统一解析能力——同一个依赖在不同 feature 下可能需要不同版本。

**替代方案 1**：用 runtime-agnostic 设计，让调用者选择：

```rust
use std::future::Future;

pub trait Runtime {
    fn spawn<F: Future + Send + 'static>(fut: F);
}

#[cfg(feature = "tokio-runtime")]
impl Runtime for TokioRuntime {
    fn spawn<F: Future + Send + 'static>(fut: F) {
        tokio::spawn(fut);
    }
}
```

**替代方案 2**：在 CI 中检查互斥 feature 组合：

```yaml
- name: Check mutually exclusive features
  run: |
    cargo check --features tokio-runtime,async-std-runtime 2>&1 && exit 1 || true
```

这种"编译时允许但你知道它不应该"的策略不优雅，但在实践中够用。

### Feature 的命名约定

- 使用小写短横线命名：`serde-json` 而非 `serde_json`
- feature 名应反映"启用了什么能力"，而非"用了什么依赖"：`json` 比 `serde_json` 更好
- `default` feature 应包含最常用的组合，而非空集

## Build Script 常见模式

`build.rs` 是 Cargo 在编译主 crate 之前运行的脚本，输出指令给 Cargo。常见模式：

### 模式 1：代码生成

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated.rs");

    let code = generate_lookup_table();

    fs::write(&dest_path, code).unwrap();

    // 告诉 Cargo 仅在 build.rs 本身变更时重新运行
    println!("cargo:rerun-if-changed=build.rs");
}

fn generate_lookup_table() -> String {
    let mut code = String::from("static LOOKUP: &[u8] = &[\n");
    for i in 0..256u32 {
        let crc = compute_crc32_byte(i);
        code.push_str(&format!("    0x{:08X},\n", crc));
    }
    code.push_str("];\n");
    code
}

fn compute_crc32_byte(byte: u32) -> u32 {
    let mut crc = byte;
    for _ in 0..8 {
        if crc & 1 != 0 {
            crc = (crc >> 1) ^ 0xEDB88320;
        } else {
            crc >>= 1;
        }
    }
    crc
}
```

主 crate 中使用：

```rust
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

fn crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &byte in data {
        let index = ((crc ^ byte as u32) & 0xFF) as usize;
        crc = (crc >> 8) ^ LOOKUP[index];
    }
    crc ^ 0xFFFFFFFF
}
```

### 模式 2：链接外部 C 库

```rust
// build.rs
fn main() {
    // 告诉 Cargo 链接 libssl
    println!("cargo:rustc-link-lib=ssl");

    // 添加搜索路径
    println!("cargo:rustc-link-search=/usr/local/ssl/lib");

    // 条件链接
    if cfg!(target_os = "windows") {
        println!("cargo:rustc-link-lib=ws2_32");
    }

    println!("cargo:rerun-if-changed=build.rs");
}
```

### 模式 3：使用 build-dependencies

更推荐用 `cc` crate 和 `bindgen` crate 来编译和绑定 C 代码，而非手写 build script：

```toml
# Cargo.toml
[build-dependencies]
cc = "1.0"
bindgen = "0.70"
```

```rust
// build.rs
fn main() {
    // 编译 C 代码
    cc::Build::new()
        .file("src/c/impl.c")
        .include("src/c")
        .compile("myimpl");

    // 生成 Rust 绑定
    let bindings = bindgen::Builder::default()
        .header("src/c/wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");

    println!("cargo:rerun-if-changed=src/c/");
}
```

**踩坑**：`build-dependencies` 和 `[dependencies]` 是完全独立的依赖图。build script 运行在宿主平台（host），而非目标平台（target）。交叉编译时 `bindgen` 需要在宿主运行，这通常是自动的，但 `cc` 编译的 C 代码需要用目标平台的工具链——这需要配置 `CC` / `CXX` 环境变量。

### rerun-if-changed 的陷阱

默认情况下，Cargo 在**任何文件变更时**都重新运行 build script。`println!("cargo:rerun-if-changed=PATH")` 告诉 Cargo 仅在指定文件变更时重新运行。

**常见错误**：忘记加 `rerun-if-changed`，导致 build script 每次编译都重新运行，拖慢增量编译。正确做法是在 build script 开头就声明依赖的输入文件。

## 交叉编译实践

### cross 工具链

`cross` 是 Rust 社区最流行的交叉编译工具，它用 Docker 容器提供目标平台的完整工具链：

```bash
cargo install cross

# 交叉编译到 ARM Linux
cross build --target aarch64-unknown-linux-gnu

# 交叉运行测试（容器中自动 qemu 模拟）
cross test --target aarch64-unknown-linux-gnu
```

`cross` 的工作原理：为每个目标平台维护一个 Docker 镜像，包含目标平台的 sysroot、linker、C 库等。编译时在容器内运行 `cargo build`，输出目标平台的二进制。

**自定义 cross 配置**：

```toml
# Cross.toml
[target.aarch64-unknown-linux-gnu]
image = "my-custom-cross:aarch64"
pre-build = [
    "dpkg --add-architecture arm64",
    "apt-get update && apt-get install -y libssl-dev:arm64",
]
```

### x86 → ARM 交叉编译清单

1. 安装目标平台 std：`rustup target add aarch64-unknown-linux-gnu`
2. 配置 linker：在 `.cargo/config.toml` 中指定

```toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

3. 处理 C 依赖：确保 `cc` crate 能找到正确的交叉编译器
4. 测试：用 `cross test` 或在实际 ARM 设备上测试

**经验谈**：交叉编译最容易出问题的环节是 C 依赖。如果你的纯 Rust 项目没有任何 C 依赖（包括间接依赖），交叉编译几乎是无痛的。一旦引入 C 依赖（如 openssl、sqlite3），就需要配置 sysroot 和交叉编译器。这也是为什么 Rust 社区持续推动"纯 Rust 替代"（如 `rustls` 替代 `openssl`、`rusqlite` 捆绑 sqlite）。

## cargo xtask 模式：替代 Makefile

在 Rust 项目中，常见需要执行各种杂项任务：代码生成、lint、format、部署、集成测试等。其他语言用 Makefile 或 Just，Rust 社区推荐 **xtask 模式**。

### xtask 的核心思想

在 workspace 中添加一个 `xtask` crate，它是一个 binary，用 `cargo xtask <subcommand>` 执行：

```toml
# Cargo.toml (workspace 根)
[workspace]
members = ["crates/*", "xtask"]
```

```rust
// xtask/src/main.rs
fn main() {
    let subcmd = std::env::args().nth(1).unwrap_or_default();
    match subcmd.as_str() {
        "lint" => run_lint(),
        "dist" => run_dist(),
        "codegen" => run_codegen(),
        _ => {
            eprintln!("Usage: cargo xtask <lint|dist|codegen>");
            std::process::exit(1);
        }
    }
}

fn run_lint() {
    xshell::cmd!("cargo fmt --check").run().expect("fmt failed");
    xshell::cmd!("cargo clippy --workspace -- -D warnings").run().expect("clippy failed");
    xshell::cmd!("cargo test --workspace").run().expect("test failed");
}

fn run_dist() {
    xshell::cmd!("cargo build --release --target x86_64-unknown-linux-gnu").run().unwrap();
    xshell::cmd!("cargo build --release --target aarch64-unknown-linux-gnu").run().unwrap();
    // 打包分发...
}
```

配合 `xshell` crate（轻量的 shell 命令执行库）或直接用 `std::process::Command`。

**为什么用 xtask 而非 Makefile**：

1. **类型安全**：xtask 是 Rust 代码，参数解析、错误处理都享受 Rust 的类型系统
2. **跨平台**：不依赖 make、bash 等 Unix 工具
3. **与 Cargo 一体**：用 `cargo xtask` 调用，不需要额外工具
4. **可测试**：xtask 本身是 Rust 项目，可以写测试
5. **共享 workspace 依赖**：xtask 可以依赖 workspace 中的其他 crate

**踩坑**：需要让 Cargo 识别 `xtask` 子命令。方法是创建一个 Cargo alias：

```toml
# .cargo/config.toml
[alias]
xtask = "run --package xtask --"
```

这样 `cargo xtask lint` 实际执行 `cargo run --package xtask -- lint`。

## 项目结构模板

经过多个项目的实践，我推荐的 Rust 项目结构：

```
my-project/
├── Cargo.toml              # workspace 根
├── Cross.toml              # 交叉编译配置
├── rust-toolchain.toml     # 工具链锁定
├── .cargo/
│   └── config.toml         # alias、linker 配置
├── .config/
│   └── nextest.toml        # nextest 配置
├── crates/
│   ├── core/               # 核心库（无 I/O、无 async）
│   ├── api/                # API 层
│   ├── cli/                # CLI 入口
│   └── sdk/                # SDK
├── xtask/                  # 任务脚本
├── tests/                  # 集成测试
└── docs/                   # 项目文档
```

核心原则：**`core` 不依赖任何 runtime**（不依赖 tokio、不依赖 std::fs），这样它可以在 `no_std` 环境和测试中灵活使用。
