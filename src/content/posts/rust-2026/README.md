# Rust 2026 经验分享式总结教程规划

> 基于 Rust Edition 2024 / Stable 1.96.0，以实战经验为主线，系统性总结现代 Rust 开发全貌。

## 系列定位

- **风格**：经验分享式，非教科书式，注重"为什么"而非仅"怎么做"
- **目标读者**：有其他语言基础的开发者，或曾经学过 Rust 但需要更新知识的回归者
- **核心原则**：以 Rust 2024 Edition 为基准，覆盖语言最新特性与生态演进。基于 Rust 1.96.0 (2026-05-28 发布)，覆盖最新稳定特性

---

## 篇章规划（共 8 大篇章，40 篇文章）

### 第一篇：重新认识 Rust（4 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 001 | Rust 2024 Edition 变更全景 | edition 迁移机制、2024 edition 断代变更（`gen` 关键字、lifetime elision 规则调整、`unsafe` 外部函数要求、`match` 穿透语义变更）、cargo fix --edition |
| 002 | 工具链生态 2026 全景 | rustup 多工具链管理、cargo 新子命令（cargo-semver-checks、cargo-audit、cargo-machete）、rust-analyzer 配置最佳实践、IDE 生态（RustRover vs VS Code）|
| 003 | 项目工程化实践 | Cargo workspace 深度用法、feature 组织策略、build script 常见模式、交叉编译实践、cargo xtask 模式 |
| 004 | 从零到发布：CI/CD 全链路 | GitHub Actions + cargo、semantic versioning 自动化、crates.io 发布流程、文档部署（docs.rs 定制）|

### 第二篇：类型系统与所有权深化（5 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 005 | 所有权模型经验谈 | 所有权心智模型、借用检查器常见"对抗"与和解、生命周期省略规则 2024 调整、reborrowing 深层理解 |
| 006 | 生命周期实战模式 | 显式生命周期标注场景、生命周期子类型与协变/逆变、GAT（generic associated types）中的 lifetime、生命周期与异步代码的交互 |
| 007 | 类型状态模式与零成本抽象 | PhantomData 驱动的类型状态、newtype 模式深挖、Deref/DerefMut 争议与正确用法、Borrow/BorrowMut trait |
| 008 | trait 系统进阶 | trait object vs impl Trait 性能抉择、trait upcasting（stabilized）、async trait（原生 `async fn` in trait）、associated type defaults、trait alias（nightly）|
| 009 | 枚举与模式匹配新范式 | exhaustive patterns、match ergonomics 演进、let-else 链式、pattern guard 限制与替代方案、irrefutable patterns 在 let 绑定中的新规则 |

### 第三篇：错误处理与健壮性（4 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 010 | 错误处理体系 2026 | thiserror 2.0 + anyhow 1.0 最佳实践、Error source chain、`?` 操作符类型推导细节、Provider API（`std::any::demand`）|
| 011 | 可恢复 vs 不可恢复的抉择 | panic! vs Result 的设计哲学、panic hook 定制、catch_unwind 边界、abort vs unwind 策略选择 |
| 012 | 错误处理在库与应用中的分层设计 | 库级 error type 设计原则（non-exhaustive、从低层错误抽象）、应用级错误聚合与用户友好展示、错误与日志的协作 |
| 013 | 常见 bug 模式与防御性编程 | unwrap 滥用、整数溢出、索引越界、deadlock 常见模式、clippy lint 驱动的防御性编码 |

### 第四篇：异步 Rust 深度实践（6 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 014 | async/await 底层机制 | Future trait 详解、pinning 心智模型（structural pin vs unstructural pin）、poll 语义、编译器生成的状态机 |
| 015 | Tokio 2026 实战 | Tokio 1.x 运行时配置（multi-thread vs current-thread）、spawn 策略、task budgeting、tokio::select! 模式 |
| 016 | 异步流与迭代 | Stream trait（futures-util）、async generator（gen blocks nightly）、async fn 返回 Stream、背压控制模式 |
| 017 | 异步 + FFI：桥接同步与异步世界 | block_in_place、spawn_blocking、criterion 异步 benchmark、与 C 库的异步交互模式 |
| 018 | 异步常见陷阱与调试 | Send 约束不满足的根因分析、lifetime 跨 await 点、Cancel safety、异步代码中的 Mutex（tokio::sync vs std）|
| 019 | 异步生态选型指南 | Tokio vs async-std vs smol 选型、executor-less 库设计（generic over executor）、glommio (io_uring) 实践 |

### 第五篇：并发与同步（4 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 020 | Send/Sync 深度理解 | 自动 trait 机制、手动 impl Send/Sync 的场景与安全论证、Cell/RefCell 为何不 Send、跨线程安全传递的模式 |
| 021 | 无锁并发模式 | Atomic 类型全览、Memory Ordering 实战（Relaxed/Acquire/Release/SeqCst）、compare_exchange 循环、SeqLock 模式 |
| 022 | 通道与消息传递 | mpsc/mpmc channel 选型（std vs crossbeam vs flume）、channel 背压、select 模式、与 Go channel 的对比 |
| 023 | 共享状态并发实战 | Mutex<RwLock<T>> 选型策略、parking_lot 性能优势、lock ordering 防死锁、Arc 内部机制与优化 |

### 第六篇：元编程与宏（4 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 024 | 声明宏（macro_rules!）实战 | tt muncher 模式、push-down accumulation、重复模式技巧、hygiene 与 span、调试宏展开 |
| 025 | 过程宏三件套 | derive / attribute / function 三种过程宏实现、proc-macro2 + quote + syn 工作链、常见 derive 宏设计模式 |
| 026 | 声明宏 vs 过程宏选型 | 编译时间影响、调试难度对比、表达能力边界、何时该用 build script 替代宏 |
| 027 | const generics 与编译期计算 | const generics 现状与限制、const fn 能力边界、典型应用（数组操作、类型级自然数）、与 C++ constexpr 对比 |

### 第七篇：Unsafe Rust 与底层交互（5 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 028 | Unsafe 的哲学与边界 | unsafe 语义四件（deref raw ptr、call unsafe fn、mut static、impl unsafe trait）、unsafe 边界最小化原则、模块级 unsafe（2024 edition）|
| 029 | 原始指针与内存操作 | *const / *mut 操作、ptr::read/write/swap/copy、NonNull、内存对齐与 layout、MaybeUninit 正确用法 |
| 030 | FFI 实战：Rust 调用 C | bindgen 自动生成、repr(C) 布局保证、回调函数跨语言、panic 跨 FFI 边界处理 |
| 031 | FFI 实战：C 调用 Rust | cbindgen 导出头文件、#[unsafe(no_mangle)] + extern "C"、导出 opaque 类型、C API 设计模式 |
| 032 | Unsafe 代码审查清单 | Safety doc comment 规范、Miri 检测 UB、loom 并发测试、unsafe 代码审查 checklist |

### 第八篇：生态与架构实战（8 篇）

| 编号 | 标题 | 关键内容 |
|------|------|----------|
| 033 | 序列化与数据格式 | serde 生态系统（serde_json/serde_yaml/toml/bincode）、零拷贝反序列化（rkyv）、自定义 Serialize/Deserialize |
| 034 | 网络编程：从 TCP 到 HTTP | tokio net 基础、hyper 底层 HTTP、tower middleware 生态、axum 0.8 实战（extractor、state、middleware）|
| 035 | 数据库与 ORM 选型 | SQLx vs SeaORM vs Diesel 选型对比、连接池管理、migration 策略、嵌入式数据库（SQLite/Redb）|
| 036 | 可观测性三件套 | tracing 框架（span/event/subscriber）、metrics 集成、opentelemetry-rust 接入、结构化日志 |
| 037 | 测试策略全景 | 单元/集成/doc test、proptest 属性测试、rstest fixture、mockall、测试异步代码、criterion benchmark |
| 038 | 性能优化实战 | flamegraph 生成、perf/DTrace 采样、堆分析（dhat）、零拷贝技术、SIMD（std::simd nightly）、分支预测与 cache 友好设计 |
| 039 | 嵌入式 Rust 概览 | no_std 世界、cortex-m 生态、embassy 异步框架、defmt 日志、probe-rs 工具链 |
| 040 | Rust 2026 展望 | stabilize 预览（return type notation、effects、gen blocks）、crates.io 趋势、Rust 在行业中的落地案例 |

---

## 文章元数据约定

```yaml
---
title: "Rust 2026 经验谈 - {章节标题}"
published: 2026-06-XX
description: ""
image: ""
tags: [Rust, Rust 2026, {章节特定标签}]
category: Rust
draft: false
lang: zh_CN
---
```

## 文件命名约定

```
2026-06-XX-Rust_2026_{编号}_{标题slug}.md
```

存放于 `src/content/posts/rust-2026/` 子目录。

## 写作约定

1. 每篇 3000-5000 字，注重实战经验与踩坑总结
2. 代码示例基于 Rust stable 1.96.0 / Edition 2024，nightly 特性需标注
3. 引用 RFC 编号和 stabilize 版本号
4. 对比旧版行为时明确标注 edition 差异
5. 每篇末尾附"延伸阅读"链接（RFC、blog、crate 文档）
