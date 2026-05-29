---
title: "Rust 2026 经验谈 - 异步生态选型指南"
published: 2026-06-19
description: "Tokio vs async-std vs smol 选型对比、executor-less 库设计原则、glommio io_uring 实践、嵌入式异步 embassy、选型决策树。"
image: "/images/rust-2026/4.jpg"
tags: [Rust, Rust 2026, 生态选型, Tokio, async-std, embassy]
category: Rust
draft: false
lang: zh_CN
---

![异步 Rust 深度实践](/images/rust-2026/4.jpg)

Rust 的异步生态没有"唯一正确选择"。Tokio、async-std、smol、glommio、embassy 各有定位，选错了运行时比选错了算法更痛苦——因为运行时渗透到项目的每一个角落。本文给出 2026 年的选型对比和决策框架。

## Tokio vs async-std vs smol

### Tokio：事实标准

Tokio 是 Rust 异步生态中占有率最高的运行时，绝大多数 crate 优先支持 Tokio。

**核心特性**：
- multi-thread 工作窃取调度器
- 丰富的 I/O 驱动（TCP/UDP/Unix/pipe/signals）
- 完善的工具链（tokio-console、tracing 集成）
- 任务预算（task budgeting）防止活锁
- 成熟的生态：hyper、tonic、tower、reqwest 均基于 Tokio

**适用场景**：网络服务、微服务、gRPC/HTTP 后端、CLI 工具

**弱点**：
- 二进制体积大（启用 full features 后 2MB+）
- 编译时间长
- 对嵌入式不友好

```toml
# 典型 Tokio 依赖
[dependencies]
tokio = { version = "1", features = ["rt-multi-thread", "macros", "net", "time", "io-util", "signal"] }
```

### async-std：标准库风格的异步

async-std 的设计哲学是"异步版 std"——API 与标准库一一对应，学习成本最低。

**核心特性**：
- 与 std 一致的 API 命名（`async_std::fs::read_to_string` 对应 `std::fs::read_to_string`）
- 默认多线程调度器
- 基于 smol 的执行器（async-std 1.6+ 后内部用 smol 的 epoll 驱动）

**适用场景**：教学、原型、与 std 风格高度一致的项目

**弱点**：
- 社区活跃度下降，新功能跟进慢
- 生态不如 Tokio 丰富（无内置 HTTP/gRPC）
- 部分性能指标落后 Tokio（调度器优化较少）

```toml
[dependencies]
async-std = { version = "1", features = ["attributes"] }
```

### smol：轻量级异步

smol 是 async-std 核心作者 Stjepan Glavina 的轻量级运行时，代码量极小（核心 < 3000 行）。

**核心特性**：
- 极小的代码体积和编译时间
- 基于 epoll/kqueue/io_uring 的异步 I/O
- `smol::block_on` 无需全局运行时
- 灵活的 executor 模型

**适用场景**：库作者（不想强依赖 Tokio）、轻量工具、测试

**弱点**：
- 生态最弱——几乎没有基于 smol 的 HTTP/gRPC 库
- 文档和教程较少
- 社区规模小

```toml
[dependencies]
smol = "2"
```

### 定量对比

| 维度 | Tokio | async-std | smol |
|------|-------|-----------|------|
| Stars (GitHub) | ~26k | ~3.6k | ~3k |
| 发布频率 | 频繁（每月） | 低频（季度） | 低频 |
| 二进制体积 | 大 | 中 | 小 |
| 编译时间 | 长 | 中 | 短 |
| HTTP 生态 | hyper/axum/reqwest | surf (已归档) | 无 |
| gRPC | tonic | 无 | 无 |
| 数据库 | sqlx/tokio-postgres | 无 | 无 |
| 调度器 | 工作窃取 | 工作窃取 | 工作窃取 |
| io_uring | 通过 tokio-uring | 无 | 无 |
| 嵌入式 | 不支持 | 不支持 | 不支持 |

**结论**：新项目默认选 Tokio，除非你有非常明确的理由选其他。

## Executor-less 库设计原则

### 问题：库强依赖运行时

```rust
// 反模式：库直接依赖 tokio
// Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }

// 库代码
pub async fn fetch_data() -> String {
    tokio::time::sleep(Duration::from_secs(1)).await; // 绑定了 tokio
    String::from("data")
}
```

如果使用者用 async-std 或 smol，`tokio::time::sleep` 不会工作——Tokio 的定时器需要 Tokio 运行时。

### 原则一：generic over executor

用 `futures` crate 提供的运行时无关原语：

```rust
// 正确：不依赖特定运行时
use futures::future::FutureExt;
use std::time::Duration;

// 用 trait 来抽象时间
// 注意：trait 中的 async fn 需要 Rust 1.75+（async fn in trait 已稳定）
pub trait Sleep {
    async fn sleep(duration: Duration);
}

// 库代码只依赖 trait
pub async fn fetch_data<S: Sleep>() -> String {
    S::sleep(Duration::from_secs(1)).await;
    String::from("data")
}
```

更实用的方式：直接用 `futures` 的组合子，避免 I/O 依赖：

```rust
// 纯计算 + futures 组合子：运行时无关
use futures::stream::StreamExt;

pub fn process_stream<S>(stream: S) -> impl futures::Stream<Item = Result<Data, Error>>
where
    S: futures::Stream<Item = RawData>,
{
    stream.filter_map(|item| async move {
        match process(item) {
            Ok(data) => Some(Ok(data)),
            Err(e) => Some(Err(e)),
        }
    })
}
```

### 原则二：用 feature flag 提供多运行时支持

```toml
[features]
default = ["tokio-runtime"]
tokio-runtime = ["dep:tokio"]
async-std-runtime = ["dep:async-std"]

[dependencies]
tokio = { version = "1", optional = true }
async-std = { version = "1", optional = true }
futures = "0.3"
```

```rust
// src/io.rs
#[cfg(feature = "tokio-runtime")]
pub use tokio::net::TcpStream;

#[cfg(feature = "async-std-runtime")]
pub use async_std::net::TcpStream;
```

### 原则三：只在"叶节点"依赖运行时

将运行时依赖推到应用的入口（main），而不是库的内部：

```
应用 main.rs (tokio)
  └── 你的库 (运行时无关)
        └── futures (运行时无关)
  └── 其他库 (tokio-specific I/O)
```

**经验**：如果你的库被 3 个以上项目使用，就应该做到运行时无关。内部项目可以强依赖 Tokio 节省开发时间。

## glommio：io_uring 实践

### 为什么选 glommio

glommio 是 DataDog 开发的基于 io_uring 的线程每核（thread-per-core）运行时，专为高 I/O 吞吐设计。

**适用场景**：
- 高吞吐文件 I/O（数据库存储引擎）
- 高吞吐网络 I/O（代理、CDN）
- Linux 5.6+ 环境
- 无需跨核心共享状态

### 基本用法

```rust
use glommio::prelude::*;
use glommio::io::DmaFile;

fn main() {
    let executor = LocalExecutor::default();

    executor.run(async {
        // 打开文件（通过 io_uring）
        let file = DmaFile::open("large_file.dat")
            .await
            .expect("打开文件失败");

        // 直接 I/O 读取（绕过页缓存）
        let buffer = file.read_at_aligned(0, 4096)
            .await
            .expect("读取失败");

        println!("读取 {} 字节", buffer.len());

        file.close().await.expect("关闭文件失败");
    });
}
```

### 性能特征

| 场景 | Tokio (epoll) | glommio (io_uring) |
|------|---------------|---------------------|
| 随机读 4K (单核) | ~120k IOPS | ~350k IOPS |
| 顺序读 4K (单核) | ~800 MB/s | ~2.1 GB/s |
| 文件写入 4K (单核) | ~100k IOPS | ~300k IOPS |

注：性能高度依赖于内核版本、NVMe 设备和 io_uring 配置。以上数据基于 Linux 6.1 + Samsung 980 Pro。

### glommio 的限制

1. **仅 Linux**：io_uring 是 Linux 专属
2. **线程每核模型**：不能跨核心共享 Glommio 的 task，需要通过 shard + channel 通信
3. **生态小**：没有 HTTP 框架、ORM、gRPC 库
4. **调试困难**：无 tokio-console 类似工具
5. **API 稳定性**：glommio 还在 0.x，API 可能变更

### 集成模式：Tokio + glommio

可以在 Tokio 应用中用 glommio 处理 I/O 密集部分：

```rust
use tokio::task;

async fn hybrid_approach() {
    // 网络处理：Tokio（生态丰富）
    let network_result = tokio::spawn(async {
        // HTTP 请求、gRPC 调用等
        reqwest::get("https://api.example.com/data").await
    });

    // 文件 I/O：glommio（高性能）
    let io_result = task::spawn_blocking(|| {
        let executor = glommio::LocalExecutor::default();
        executor.run(async {
            // glommio 的文件操作
            heavy_file_io().await
        })
    });

    let (net, io) = tokio::join!(network_result, io_result);
}
```

## 嵌入式异步：embassy

### 为什么嵌入式需要异步

传统嵌入式用中断 + 状态机，代码可读性差且难以组合。embassy 将 Rust async/await 带入 `no_std` 环境，用协作式调度替代抢占式调度，效率更高。

### 核心架构

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_stm32::peripherals::PA5;
use embassy_time::Timer;
use embedded_hal_async::digital::Wait;
use embassy_stm32::gpio::{Level, Output};

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_stm32::init(Default::default());

    let mut led = Output::new(p.PA5, Level::High, embassy_stm32::gpio::Speed::Low);

    loop {
        led.set_high();
        Timer::after_secs(1).await;
        led.set_low();
        Timer::after_secs(1).await;
    }
}
```

### embassy 的优势

| 维度 | RTOS (FreeRTOS) | embassy |
|------|-----------------|---------|
| 调度 | 抢占式（需要栈/任务） | 协作式（Future 状态机） |
| 内存 | 每任务独立栈 (256B~4KB) | 共享栈 + 状态机 (小) |
| 组合性 | 中断回调，难组合 | async/await，自然组合 |
| 类型安全 | C API，无类型安全 | Rust 类型系统 |
| 优先级 | 硬件优先级中断 | 可配置优先级 task |

### embassy 的生态

- **embassy-stm32**：STM32 全系列 HAL
- **embassy-nrf**：Nordic nRF52/nRF53 HAL
- **embassy-rp**：Raspberry Pi Pico (RP2040/RP2350) HAL
- **embassy-usb**：USB 设备栈
- **embassy-net**：TCP/IP 栈（基于 smoltcp）

### 注意事项

1. **embassy 不用 Tokio**——它有自己的执行器（`embassy-executor`），专为 `no_std` 设计
2. **Flash 和 RAM 开销**：embassy 的 Future 状态机比手写状态机大，注意检查 `.map` 文件
3. **调试手段有限**——无 tokio-console，依赖 `defmt` 日志和 probe-rs

## 选型决策树

```
是否嵌入式？
├── 是 → embassy（唯一选项）
└── 否
    ├── 是否需要 io_uring 级性能？
    │   ├── 是 + 仅 Linux + thread-per-core 可接受 → glommio
    │   └── 否
    │       └── 主要考量是什么？
    │           ├── 生态/社区/招聘 → Tokio
    │           ├── 代码体积/编译时间 → smol
    │           ├── std 风格 API → async-std
    │           └── 不确定 → Tokio
    └── 库作者？
        ├── 是 → executor-less 设计（futures + feature flags）
        └── 否 → 跟随应用选型
```

### 具体建议

1. **Web 后端（HTTP/gRPC）**：Tokio + axum/tonic，无悬念
2. **数据库存储引擎**：glommio（如果 Linux + 高 IOPS）或 Tokio
3. **CLI 工具**：Tokio（生态最全）或 smol（编译快）
4. **库开发**：executor-less + feature flags
5. **嵌入式**：embassy
6. **教学/原型**：async-std（API 与 std 一致，学习成本最低）
7. **高性能计算**：Tokio + rayon 异步+同步混合

## 迁移经验

### 从 async-std 迁移到 Tokio

```rust
// async-std
async_std::task::spawn(async { ... });
async_std::fs::read_to_string("file.txt").await?;
async_std::net::TcpStream::connect(addr).await?;

// Tokio 等价
tokio::spawn(async { ... });
tokio::fs::read_to_string("file.txt").await?;
tokio::net::TcpStream::connect(addr).await?;
```

主要差异：
- `async_std::task::spawn` 不要求 `Send`（local task），`tokio::spawn` 要求 `Send`
- `async_std::main` 默认多线程，`tokio::main` 需要显式 `flavor = "multi_thread"`
- 定时器 API 略有不同

### 从 Tokio 迁移到 smol

不推荐。smol 的生态远不如 Tokio，除非你的项目非常简单。迁移代价主要是替换所有 `tokio::*` 调用，且很多 Tokio 生态的 crate（hyper、tonic）无法在 smol 上使用。
