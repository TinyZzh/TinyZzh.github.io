---
title: "Rust 2026 经验谈 - 错误处理在库与应用中的分层设计"
published: 2026-06-12
description: "库级 error type 设计原则（non-exhaustive 枚举、从低层错误抽象而非透传）、应用级错误聚合与展示、错误与 tracing 的协作、错误转换反模式。"
image: "/images/rust-2026/3.jpg"
tags: [Rust, Rust 2026, 错误处理, 架构设计, tracing]
category: Rust
draft: false
lang: zh_CN
---

![错误处理与健壮性](/images/rust-2026/3.jpg)

错误处理不是一个"选 thiserror 还是 anyhow"的技术选型问题，而是一个架构分层问题。库的错误类型、应用的错误聚合、错误与日志的协作——这三层各司其职，搞混任何一层都会让代码在迭代中快速腐化。本文从实战出发，讲清楚每一层该怎么做、常见的反模式是什么、以及 tracing span 如何让错误变得可追踪。

## 库级 error type 设计原则

库的错误类型是公共 API 的一部分——它和公开的函数签名一样重要，甚至更难改。

### 原则 1：non-exhaustive 枚举——给未来留退路

```rust
use thiserror::Error;

#[derive(Error, Debug)]
#[non_exhaustive]
pub enum DatabaseError {
    #[error("connection failed: {0}")]
    Connection(String),

    #[error("query execution failed: {0}")]
    Query(String),

    #[error("timeout after {0:?}")]
    Timeout(std::time::Duration),

    // 新变体可以随时添加，不会破坏下游的 match
}
```

`#[non_exhaustive]` 要求调用者必须写通配分支：

```rust
match db_err {
    DatabaseError::Connection(msg) => retry(msg),
    DatabaseError::Timeout(dur) => wait_and_retry(dur),
    _ => fallback(), // 必须处理未知变体
}
```

没有 `#[non_exhaustive]`，添加新变体是破坏性变更（semver incompatible）。有了它，库可以在 minor 版本中添加新的错误变体。

**经验：几乎所有公开的错误枚举都应该 `#[non_exhaustive]`。** 唯一的例外是你有 100% 的信心不会增加变体（这几乎不存在）。

### 原则 2：从低层错误抽象，而非透传

这是最常见的反模式——把底层错误类型直接暴露在你的 API 中：

```rust
// 反模式：透传底层错误类型
#[derive(Error, Debug)]
pub enum CacheError {
    #[error("redis error: {0}")]
    Redis(#[from] redis::RedisError),  // 调用者被迫依赖 redis crate

    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),   // 调用者被迫依赖 serde_json
}
```

问题：
1. **依赖泄露**：调用者为了 match 你的错误，必须依赖 redis 和 serde_json
2. **实现耦合**：换掉 Redis 用 Memcached，错误类型就变了——但这是实现细节，不该影响 API
3. **版本锁定**：底层库升级改了错误类型，你的 semver 就被迫大版本跳

**正确做法：抽象为自描述的错误**

```rust
#[derive(Error, Debug)]
#[non_exhaustive]
pub enum CacheError {
    #[error("backend connection failed: {details}")]
    ConnectionFailed {
        details: String,
        #[source]
        source: Box<dyn std::error::Error + Send + Sync>,
    },

    #[error("serialization failed for key `{key}`: {reason}")]
    SerializationFailed {
        key: String,
        reason: String,
    },

    #[error("key `{0}` not found")]
    NotFound(String),
}

impl CacheError {
    pub fn from_redis(err: redis::RedisError) -> Self {
        CacheError::ConnectionFailed {
            details: err.to_string(),
            source: err.into(),
        }
    }
}
```

现在：
- 调用者不需要知道底层是 Redis 还是 Memcached
- 你可以自由替换底层实现
- 错误仍然保留了 source chain 供调试

### 原则 3：错误变体按"调用者关心什么"划分，而非"底层发生了什么"

```rust
// 反模式：按底层事件划分
pub enum HttpError {
    DnsResolutionFailed,
    TcpConnectionRefused,
    TlsHandshakeFailed,
    HttpResponse500,
    HttpResponse429,
}

// 正确：按调用者需要的处理策略划分
pub enum HttpError {
    #[error("connection failed: {0}")]
    ConnectionFailed(String),      // 重试

    #[error("rate limited, retry after {0:?}")]
    RateLimited(std::time::Duration),  // 等待后重试

    #[error("server error: {0}")]
    ServerError(u16),              // 5xx，可能重试

    #[error("client error: {0}")]
    ClientError(u16),              // 4xx，不应重试
}
```

### 原则 4：error type 层级不要超过 3 层

```
底层库错误 (io::Error, serde_json::Error)
    ↓ From 转换
中间库错误 (DatabaseError, CacheError)
    ↓ From 转换
应用错误 (AppError)
```

超过 3 层的错误转换链会导致：
- `From` 实现爆炸（N×M 组合）
- 错误消息层层包装，原始信息被淹没
- 调试时需要展开多层 source chain

## 应用级错误聚合与展示

应用是错误的终点——没有下游需要 match 你的错误，只需要展示给人看。

### anyhow / eyre：应用级的统一错误类型

```rust
use anyhow::{Context, Result};

fn run_app() -> Result<()> {
    let config = load_config()
        .context("failed to load configuration")?;

    let db = connect_db(&config.db_url)
        .context("failed to connect to database")?;

    let cache = connect_cache(&config.cache_url)
        .context("failed to connect to cache")?;

    serve(db, cache)
        .context("server failed")?;

    Ok(())
}
```

`context()` 是应用级错误处理的核心——它给错误附加"当时在做什么"的语义信息。

### 不同展示方式的分层

同一个错误，CLI、HTTP API、日志需要不同的展示形式：

```rust
use anyhow::Error;

fn display_for_cli(err: &Error) -> ! {
    eprintln!("Error: {}", err);
    // 只显示最外层消息，不暴露内部细节
    std::process::exit(1)
}

fn display_for_http_api(err: &Error) -> HttpResponse {
    // 结构化 JSON，包含错误码
    let code = classify_error(err);
    HttpResponse::json(serde_json::json!({
        "error": {
            "code": code,
            "message": err.to_string(),
            // 生产环境不暴露 backtrace
        }
    })).with_status(code.http_status())
}

fn display_for_log(err: &Error) {
    // 完整的 error chain + backtrace
    tracing::error!(
        error = %err,
        error_chain = ?err.chain().map(|e| e.to_string()).collect::<Vec<_>>(),
        backtrace = ?err.backtrace(),
        "operation failed"
    );
}
```

**关键洞察：错误展示不是错误类型的事，而是展示层的事。** 不要为了"HTTP API 需要错误码"就把 HTTP 语义塞进库的错误类型里。

### 错误分类：给应用级错误加结构

```rust
#[derive(Debug, Clone, Copy)]
enum ErrorClass {
    Config,     // 配置错误，无法启动
    Network,    // 网络错误，可重试
    Database,   // 数据库错误，可能重试
    Logic,      // 业务逻辑错误，不可重试
    Internal,   // 内部错误，需要告警
}

impl ErrorClass {
    fn http_status(self) -> u16 {
        match self {
            ErrorClass::Config => 500,
            ErrorClass::Network => 503,
            ErrorClass::Database => 503,
            ErrorClass::Logic => 400,
            ErrorClass::Internal => 500,
        }
    }

    fn is_retryable(self) -> bool {
        matches!(self, ErrorClass::Network | ErrorClass::Database)
    }
}

fn classify_error(err: &anyhow::Error) -> ErrorClass {
    if err.is::<io::Error>() {
        ErrorClass::Network
    } else if err.is::<DatabaseError>() {
        ErrorClass::Database
    } else {
        ErrorClass::Internal
    }
}
```

## 错误与 tracing 的协作

错误和日志不是两套独立的系统——它们应该深度协作。tracing 的 span 机制让这成为可能。

### 在 span 中嵌入错误信息

```rust
use tracing::{instrument, error, info, Span};
use anyhow::{Context, Result};

#[instrument(skip(db), fields(db_id = %db.id()))]
async fn process_order(db: &Database, order: Order) -> Result<()> {
    info!("processing order");

    let inventory = db.get_inventory(&order.item_id)
        .await
        .context("failed to fetch inventory")?;

    if inventory.quantity < order.quantity {
        // 错误被当前 span 上下文化
        error!(
            available = inventory.quantity,
            requested = order.quantity,
            "insufficient inventory"
        );
        return Err(anyhow::anyhow!("insufficient inventory"));
    }

    db.decrement_inventory(&order.item_id, order.quantity)
        .await
        .context("failed to update inventory")?;

    Ok(())
}
```

当错误发生时，tracing 输出会包含 span 上下文：

```
ERROR process_order{db_id="prod-1"}: available=3 requested=5: insufficient inventory
```

### 用 error! 记录 Result 的完整 chain

```rust
fn report_error(err: &anyhow::Error) {
    // 使用 tracing 的 error! 宏，自动捕获当前 span
    tracing::error!(
        error.message = %err,                              // Display
        error.source_chain = ?err.chain()                  // Debug of full chain
            .map(|e| e.to_string())
            .collect::<Vec<_>>(),
        error.backtrace = ?err.backtrace(),                // Backtrace
        "operation failed"
    );
}
```

### 踩坑：span 与 error 的生命周期

```rust
// 错误：span 在错误返回后才记录
async fn bad_example() -> Result<()> {
    let span = tracing::info_span!("operation");
    let _enter = span.enter();

    let result = risky_operation().await; // _enter 在这里还存活
    // _enter drop → span 退出

    if let Err(e) = result {
        // 此时已经不在 span 中了！错误日志丢失上下文
        tracing::error!(error = %e, "failed");
    }
    result
}

// 正确：使用 instrument 或 in_span
async fn good_example() -> Result<()> {
    risky_operation()
        .instrument(tracing::info_span!("operation"))
        .await
        .map_err(|e| {
            // 错误仍在 span 内被记录
            tracing::error!(error = %e, "failed");
            e
        })
}
```

### tracing + anyhow 的最佳实践组合

```rust
use tracing::instrument;
use anyhow::{Context, Result};

#[instrument(err)]  // err 属性：自动记录返回的 Err
async fn fetch_user(id: u64) -> Result<User> {
    let resp = http_client
        .get(&format!("/users/{}", id))
        .send()
        .await
        .context("HTTP request failed")?;  // context 附加位置信息

    let user: User = resp.json().await
        .context("JSON deserialization failed")?;

    Ok(user)
}
```

`#[instrument(err)]` 会自动在函数返回 `Err` 时以 `ERROR` 级别记录错误消息。配合 `context()`，每个 `?` 都附加了"这一步在做什么"的信息。

## 错误转换的常见反模式

### 反模式 1：From 实现中丢弃信息

```rust
// 反模式：From 丢弃了原始错误
impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        AppError::Io(err.to_string())  // 丢失了 io::Error 的 source chain！
    }
}

// 正确：保留 source
impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        AppError::Io(err)  // io::Error 实现了 Error，source chain 完整
    }
}
```

### 反模式 2：过度嵌套的错误枚举

```rust
// 反模式：俄罗斯套娃
pub enum AppError {
    Db(DbError),
    Cache(CacheError),
    Auth(AuthError),
}

pub enum DbError {
    Pool(PoolError),
    Query(QueryError),
}

pub enum PoolError {
    Timeout(TimeoutError),
    Connection(ConnectionError),
}
// 调用者需要 match AppError::Db(DbError::Pool(PoolError::Timeout(...)))
```

**正确：扁平化 + context**

```rust
use anyhow::{anyhow, Context, Result};

fn do_thing() -> Result<()> {
    db_query()
        .context("database query failed")?;  // anyhow 自动保留 source chain
    Ok(())
}
```

### 反模式 3：在 From 中做格式化

```rust
// 反模式：From 中的格式化是死代码——直到实际转换时才执行
impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        AppError::Other(format!("I/O error occurred: {}", err))  // 不必要的分配
    }
}

// 正确：让 Display 做格式化
#[derive(Error, Debug)]
pub enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),  // thiserror 自动生成 Display，零运行时开销
}
```

### 反模式 4：对同一个错误类型实现多个 From

```rust
// 多个 From 实现可能冲突，导致 ? 推导歧义
impl From<io::Error> for AppError { ... }
impl From<io::Error> for OtherError { ... }
// 如果函数返回类型不明确，? 操作符会不知道该用哪个
```

如果你的错误类型同时出现在多个上下文中，用显式转换而非 From：

```rust
let result = operation()
    .map_err(|e| AppError::Io(e))?;  // 显式，而非 ? 隐式转换
```

## 实战经验总结

1. **库的错误类型是 API 契约**：non-exhaustive、抽象底层、按调用者关心的事划分
2. **不要透传底层错误类型**：抽象掉实现细节，用 Box<dyn Error> 或 String 保留信息
3. **应用用 anyhow + context**：每一步 `?` 都用 `context()` 附加语义
4. **展示与类型分离**：同一个错误，CLI/HTTP/日志有不同的展示策略
5. **tracing span 是错误的最佳上下文**：`#[instrument(err)]` + `context()` 是黄金组合
6. **From 实现要保留 source chain**：不要在 From 中 `to_string()` 丢弃原始错误
7. **错误层级不超过 3 层**：底层 → 中间库 → 应用，再多就开始失控
