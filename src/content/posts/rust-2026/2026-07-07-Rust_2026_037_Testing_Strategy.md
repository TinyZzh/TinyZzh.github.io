---
title: "Rust 2026 经验谈 - 测试策略全景"
published: 2026-07-07
description: "单元/集成/doc test 组织与惯例、proptest 属性测试、rstest fixture 与参数化、mockall mock 框架、测试异步代码、criterion benchmark 实操、测试覆盖率 cargo-llvm-cov。"
image: "/images/rust-2026/8.jpg"
tags: [Rust, Rust 2026, 测试, proptest, criterion, coverage]
category: Rust
draft: false
lang: zh_CN
---

![生态与架构实战](/images/rust-2026/8.jpg)

测试是工程质量的底线。Rust 的测试体系在 2024-2026 年间已经形成了从单元测试到属性测试、从 mock 到 benchmark 的完整工具链。本文覆盖测试组织、属性测试、参数化、mock、异步测试、benchmark、覆盖率七大主题，给出实战中的踩坑经验。

## 单元/集成/Doc Test 组织与惯例

### 单元测试

Rust 的单元测试与代码放在同一文件，这是语言的惯用法：

```rust
// src/parser.rs
pub fn parse_header(input: &[u8]) -> Result<Header, ParseError> {
    if input.len() < 4 {
        return Err(ParseError::TooShort);
    }
    let magic = &input[0..4];
    if magic != b"ABCD" {
        return Err(ParseError::BadMagic);
    }
    Ok(Header { version: input[4] })
}

#[cfg(test)]
mod tests {
    use super::*;
    use core::assert_matches;

    #[test]
    fn parse_valid_header() {
        let input = b"ABCD\x01";
        let header = parse_header(input).unwrap();
        assert_eq!(header.version, 1);
    }

    #[test]
    fn parse_too_short() {
        let result = parse_header(b"AB");
        assert_matches!(result, Err(ParseError::TooShort));
    }

    #[test]
    fn parse_bad_magic() {
        let result = parse_header(b"XXXX\x01");
        assert_matches!(result, Err(ParseError::BadMagic));
    }
}
```

**惯用法要点**：
- 测试模块用 `#[cfg(test)]` + `mod tests`
- `use super::*` 导入被测代码
- 测试函数用 `#[test]` 标注
- 私有函数也可以测试（同一模块内）
- Rust 1.96+ 可用 `assert_matches!` 替代 `assert!(matches!(..))`，需 `use core::assert_matches`

### 集成测试

集成测试放在 `tests/` 目录，每个文件是独立的 crate：

```
my-project/
├── src/
│   └── lib.rs
└── tests/
    ├── common/
    │   └── mod.rs      // 共享辅助（不是独立测试）
    ├── api.rs          // API 集成测试
    └── database.rs     // 数据库集成测试
```

```rust
// tests/api.rs
use my_project::Client;

#[tokio::test]
async fn test_create_and_get_user() {
    let client = Client::new("http://localhost:8080");
    let user = client.create_user("Alice").await.unwrap();
    let fetched = client.get_user(user.id).await.unwrap();
    assert_eq!(fetched.name, "Alice");
}
```

```rust
// tests/common/mod.rs
// 共享辅助代码，不会被 cargo test 当作测试运行
pub fn setup_test_db() -> PgPool {
    // ...
}

pub fn create_test_app() -> TestApp {
    // ...
}
```

### Doc Test

文档中的代码示例也是测试：

```rust
/// 将字节切片解析为无符号整数。
///
/// # Examples
///
/// ```
/// use mylib::parse_u32;
///
/// let result = parse_u32(&[0x12, 0x34, 0x56, 0x78]);
/// assert_eq!(result, 0x12345678);
/// ```
///
/// 空切片返回 0：
///
/// ```
/// use mylib::parse_u32;
/// assert_eq!(parse_u32(&[]), 0);
/// ```
pub fn parse_u32(bytes: &[u8]) -> u32 { /* ... */ }

/// 内部函数，不运行 doc test：
///
/// ```ignore
/// // ignore：这段代码不编译（依赖外部状态）
/// let db = connect();
/// ```
fn internal() {}
```

**doc test 的 `no_run` 和 `compile_fail`**：

```rust
/// ```no_run
/// // 编译但不运行（如需要网络）
/// let server = mylib::Server::bind("0.0.0.0:8080").await.unwrap();
/// server.run().await.unwrap();
/// ```
///
/// ```compile_fail
/// // 期望编译失败——验证类型安全
/// let x: i32 = "hello"; // 类型不匹配
/// ```
fn documented() {}
```

### 踩坑：测试组织常见问题

```
问题 1：单元测试测了私有实现细节
  → 重构时测试全崩
  → 原则：单元测试测公开 API，只在必要时测关键内部逻辑

问题 2：集成测试没有共享 setup
  → 每个测试重复创建资源
  → 解决：tests/common/mod.rs 或 test fixtures crate

问题 3：doc test 依赖外部状态
  → CI 中 doc test 失败
  → 解决：用 no_run 或 ignore

问题 4：测试间有隐式顺序依赖
  → cargo test 并行运行导致间歇性失败
  → 解决：每个测试独立，或用 serial_test crate
```

## proptest 属性测试

`proptest` 不测"某个输入对不对"，而测"**所有**输入是否满足某个属性"：

```toml
[dev-dependencies]
proptest = "1.5"
```

### 基本用法

```rust
use proptest::prelude::*;

// 测试属性：sort 之后长度不变且有序
proptest! {
    #[test]
    fn sort_preserves_length_and_ordered(ref input in prop::collection::vec(any::<i32>(), 0..100)) {
        let mut sorted = input.clone();
        sorted.sort();

        // 长度不变
        assert_eq!(sorted.len(), input.len());

        // 有序
        for window in sorted.windows(2) {
            assert!(window[0] <= window[1]);
        }

        // 相同元素（排序是排列）
        let mut input_sorted = input.clone();
        input_sorted.sort();
        assert_eq!(sorted, input_sorted);
    }
}
```

### 自定义策略（Strategy）

```rust
use proptest::prelude::*;

// 自定义策略：合法的邮箱格式
fn email_strategy() -> impl Strategy<Value = String> {
    "[a-z]{3,10}".prop_flat_map(|local| {
        ("[a-z]{3,8}", "[a-z]{2,4}").prop_map(move |(domain, tld)| {
            format!("{}@{}.{}", local, domain, tld)
        })
    })
}

proptest! {
    #[test]
    fn test_parse_email(ref email in email_strategy()) {
        let result = parse_email(email);
        assert!(result.is_ok(), "Failed to parse valid email: {}", email);
    }
}

// 更简单的自定义策略
proptest! {
    #[test]
    fn test_non_empty_string(ref s in "[a-zA-Z0-9]{1,50}") {
        assert!(!s.is_empty());
        assert!(s.len() <= 50);
    }
}
```

### Shrink：失败用例的最小化

proptest 发现失败后，会自动**收缩**（shrink）输入，找到最小失败用例：

```rust
proptest! {
    #[test]
    fn test_addition_commutative(a in any::<i32>(), b in any::<i32>()) {
        // 如果这个测试失败，proptest 会尝试更小的 a 和 b
        assert_eq!(a + b, b + a);
    }
}
```

失败输出示例：

```
thread 'main' panicked at 'assertion failed: `(left == right)`
  left: `-1`,
 right: `1`

minimal failing input:
  a = -1
  b = 0
```

### 踩坑：proptest 与 async

```rust
// ❌ proptest! 宏不支持 async
proptest! {
    #[test]
    async fn bad_async_test(input in ".*") {  // 编译错误
        async_work(input).await;
    }
}

// ✓ 方案 1：用 proptest! + tokio::runtime
proptest! {
    #[test]
    fn test_async_with_proptest(input in ".*") {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            async_work(&input).await;
        });
    }
}

// ✓ 方案 2：用 tokio::test + 手动策略
#[tokio::test]
async fn test_async_property() {
    let strategy = proptest::strategy::Strategy::prop_map(
        "[a-zA-Z]{1,20}",
        |s| s
    );
    proptest::proptest!(|(input in "[a-zA-Z]{1,20}")| {
        let result = tokio::runtime::Handle::current().block_on(async_work(&input));
        assert!(result.is_ok());
    });
}
```

## rstest：Fixture 与参数化

```toml
[dev-dependencies]
rstest = "0.23"
```

### Fixture

```rust
use rstest::*;
use sqlx::PgPool;

// 定义 fixture
#[fixture]
async fn test_pool() -> PgPool {
    let pool = PgPool::connect("postgres://test:test@localhost/test_db")
        .await
        .unwrap();
    // 运行 migration
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();
    pool
}

// 使用 fixture
#[rstest]
#[tokio::test]
async fn test_create_user(#[future] test_pool: PgPool) {
    let pool = test_pool.await;
    let user = create_user(&pool, "Alice").await.unwrap();
    assert_eq!(user.name, "Alice");
}

// 多个 fixture 组合
#[fixture]
fn config() -> Config {
    Config::load("test.toml").unwrap()
}

#[rstest]
#[tokio::test]
async fn test_with_fixtures(
    #[future] test_pool: PgPool,
    config: Config,
) {
    let pool = test_pool.await;
    let service = Service::new(pool, config);
    // ...
}
```

### 参数化测试

```rust
use rstest::*;

// 简单参数化
#[rstest]
#[case(0, 0, 0)]
#[case(1, 2, 3)]
#[case(-1, 1, 0)]
#[case(100, -50, 50)]
fn test_addition(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
    assert_eq!(a + b, expected);
}

// 带描述的参数化
#[rstest]
#[case::empty("", 0)]
#[case::single("a", 1)]
#[case::unicode("你好世界", 4)]  // 4 个 Unicode 标量值
fn test_char_count(#[case] input: &str, #[case] expected: usize) {
    assert_eq!(input.chars().count(), expected);
}

// 值列表参数化
#[rstest]
#[values(i32::MIN, -1, 0, 1, i32::MAX)]
fn test_abs_non_negative(x: i32) {
    assert!(x.abs() >= 0);
}
```

## mockall：Mock 框架

```toml
[dev-dependencies]
mockall = "0.13"
```

### 基本 Mock

```rust
use mockall::{automock, mock, predicate::*};

// 方式 1：automock 自动为 trait 生成 mock
#[automock]
trait Database {
    fn get_user(&self, id: u64) -> Result<User, Error>;
    fn save_user(&self, user: &User) -> Result<(), Error>;
}

#[test]
fn test_service_with_mock_db() {
    let mut mock_db = MockDatabase::new();

    // 设置期望
    mock_db
        .expect_get_user()
        .with(eq(42))
        .times(1)
        .returning(|id| Ok(User { id, name: "Alice".into() }));

    let service = Service::new(mock_db);
    let user = service.get_user(42).unwrap();
    assert_eq!(user.name, "Alice");
}

// 方式 2：手动定义 mock（更灵活）
mock! {
    ExternalApi {}
    impl ExternalApiTrait for ExternalApi {
        fn fetch_data(&self, key: &str) -> Result<Vec<u8>, Error>;
        async fn send_notification(&self, msg: &str) -> Result<(), Error>;
    }
}

#[tokio::test]
async fn test_async_mock() {
    let mut mock_api = MockExternalApi::new();

    mock_api
        .expect_send_notification()
        .with(eq("hello"))
        .times(1)
        .returning(|_| Ok(()));

    let service = Service::with_api(mock_api);
    service.notify("hello").await.unwrap();
}
```

### Mock 的序列与上下文

```rust
use mockall::{automock, Sequence};
use mockall::predicate::*;

#[automock]
trait Repository {
    fn insert(&self, item: &Item) -> Result<(), Error>;
    fn commit(&self) -> Result<(), Error>;
}

#[test]
fn test_transaction_ordering() {
    let mut mock_repo = MockRepository::new();
    let mut seq = Sequence::new();

    // 保证调用顺序：先 insert，再 commit
    mock_repo
        .expect_insert()
        .in_sequence(&mut seq)
        .returning(|_| Ok(()));

    mock_repo
        .expect_commit()
        .in_sequence(&mut seq)
        .returning(|| Ok(()));

    let service = Service::new(mock_repo);
    service.save_transaction(&item).unwrap();
}
```

### 踩坑：mock 与所有权

```rust
// ❌ returning 闭包的签名必须匹配 trait 方法
// 如果 trait 返回 owned 类型，闭包不能返回引用
mock_db.expect_get_user()
    .returning(|id| {
        // ❌ 不能返回临时值的引用
        Ok(User { id, name: String::from("Alice") }) // ✓ 返回 owned
    });

// ❌ expect 设置次数不匹配 → 测试 panic
mock_db.expect_get_user().times(2); // 期望调用 2 次
// 但实际只调用了 1 次 → panic: mockall: Expectation called fewer than 2 times
```

## 测试异步代码

### tokio::test 基本用法

```rust
#[tokio::test]
async fn test_async_function() {
    let result = fetch_data("http://example.com").await;
    assert!(result.is_ok());
}

// 指定 runtime 配置
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn test_with_multi_thread() {
    // 需要 multi_thread 的场景（如 spawn + block_in_place）
    let handle = tokio::spawn(async { 42 });
    assert_eq!(handle.await.unwrap(), 42);
}
```

### 手动 Poll 测试

某些场景需要直接操作 Future 的 poll：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll, RawWaker, RawWakerVTable, Waker};

fn dummy_waker() -> Waker {
    fn no_op(_: *const ()) {}
    fn clone(_: *const ()) -> RawWaker {
        RawWaker::new(std::ptr::null(), &VTABLE)
    }
    static VTABLE: RawWakerVTable = RawWakerVTable::new(clone, no_op, no_op, no_op);
    unsafe { Waker::from_raw(RawWaker::new(std::ptr::null(), &VTABLE)) }
}

#[test]
fn test_future_poll_manually() {
    let mut future = some_future();
    let waker = dummy_waker();
    let mut cx = Context::from_waker(&waker);

    // 第一次 poll
    let pinned = unsafe { Pin::new_unchecked(&mut future) };
    match pinned.poll(&mut cx) {
        Poll::Ready(val) => assert_eq!(val, 42),
        Poll::Pending => { /* 继续推进 */ }
    }
}
```

实际中更常见的是用 `futures::poll!` 宏：

```rust
use futures::poll!;
use std::task::Poll;

#[test]
fn test_poll_macro() {
    let mut future = Box::pin(some_future());
    let waker = futures::task::noop_waker_ref();
    let mut cx = std::task::Context::from_waker(waker);

    match poll!(future.as_mut(), cx) {
        Poll::Ready(val) => assert_eq!(val, 42),
        Poll::Pending => {}
    }
}
```

### 踩坑：时间相关异步测试

```rust
use tokio::time::{sleep, Duration, pause, advance};

// ❌ 真实等待——测试极慢
#[tokio::test]
async fn bad_slow_test() {
    sleep(Duration::from_secs(5)).await;
    // 等 5 秒！
}

// ✓ 使用 tokio 时间模拟
#[tokio::test(start_paused = true)]
async fn good_fast_test() {
    // start_paused = true 自动暂停时间
    let handle = tokio::spawn(async {
        sleep(Duration::from_secs(5)).await;
        42
    });

    // 手动推进时间
    tokio::time::advance(Duration::from_secs(5)).await;

    let result = handle.await.unwrap();
    assert_eq!(result, 42);
}
```

## criterion Benchmark 实操

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

### 基本 Benchmark

```rust
// benches/my_benchmark.rs
use criterion::{criterion_group, criterion_main, Criterion, BenchmarkId, Throughput};
use std::time::Duration;

fn bench_parse(c: &mut Criterion) {
    let input = "some complex input string";

    c.bench_function("parse_header", |b| {
        b.iter(|| parse_header(black_box(input.as_bytes())))
    });
}

criterion_group! {
    name = benches;
    config = Criterion::default().measurement_time(Duration::from_secs(10));
    targets = bench_parse
}
criterion_main!(benches);
```

### 参数化 Benchmark

```rust
fn bench_sort_by_size(c: &mut Criterion) {
    let mut group = c.benchmark_group("sort");

    for size in [10, 100, 1_000, 10_000, 100_000] {
        group.throughput(Throughput::Elements(size as u64));

        group.bench_with_input(BenchmarkId::from_parameter(size), &size, |b, &size| {
            b.iter_batched(
                || {
                    // 每次迭代前生成随机输入
                    let mut rng = rand::thread_rng();
                    (0..size).map(|_| rng.gen::<u64>()).collect::<Vec<_>>()
                },
                |mut data| {
                    data.sort();
                    data
                },
                criterion::BatchSize::SmallInput,
            )
        });
    }

    group.finish();
}
```

### 比较两种实现

```rust
fn bench_hash_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("hash");

    let data: Vec<u8> = (0..1024).map(|i| i as u8).collect();

    group.bench_function("sha256", |b| {
        b.iter(|| sha256_hash(black_box(&data)))
    });

    group.bench_function("blake3", |b| {
        b.iter(|| blake3_hash(black_box(&data)))
    });

    group.finish();
}
```

### Throughput 设置

```rust
fn bench_io_throughput(c: &mut Criterion) {
    let mut group = c.benchmark_group("file_read");

    for size in [1024, 8192, 65536, 1_048_576] {
        group.throughput(Throughput::Bytes(size as u64));

        group.bench_with_input(BenchmarkId::from_parameter(size), &size, |b, &size| {
            let data = vec![0u8; size];
            b.iter(|| {
                let mut buf = vec![0u8; size];
                buf.copy_from_slice(black_box(&data));
                buf
            })
        });
    }

    group.finish();
}
```

### 踩坑：benchmark 中的优化逃逸

```rust
use std::hint::black_box;

// ❌ 编译器可能优化掉整个计算
fn bad_bench(c: &mut Criterion) {
    c.bench_function("compute", |b| {
        b.iter(|| {
            let x = 1 + 1; // 编译器直接常量折叠，什么都测不到
            x
        })
    });
}

// ✓ 用 black_box 阻止优化
fn good_bench(c: &mut Criterion) {
    c.bench_function("compute", |b| {
        b.iter(|| {
            let x = 1 + 1;
            black_box(x) // 强制编译器认为 x 被使用了
        })
    });
}
```

## 测试覆盖率：cargo-llvm-cov

### 安装与基本用法

```bash
# 安装
cargo install cargo-llvm-cov

# 运行覆盖率分析
cargo llvm-cov

# 生成 HTML 报告
cargo llvm-cov --html

# 只看特定 crate
cargo llvm-cov --package my-crate

# 忽略特定文件
cargo llvm-cov --ignore-filename-regex "tests/|benches/"
```

### CI 集成

```yaml
# .github/workflows/coverage.yml
name: Coverage
on: [push, pull_request]
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: llvm-tools-preview
      - uses: taiki-e/install-action@cargo-llvm-cov
      - name: Generate coverage
        run: cargo llvm-cov --lcov --output-path lcov.info
      - uses: codecov/codecov-action@v4
        with:
          files: lcov.info
```

### 踸踩坑

```bash
# 问题 1：nightly 才能生成覆盖率
# 解决：cargo llvm-cov 自动处理，但需要 llvm-tools-preview
rustup component add llvm-tools-preview

# 问题 2：doc test 覆盖率噪声
# 解决：只跑 lib 和 tests
cargo llvm-cov --no-report -- --lib --tests

# 问题 3：多 crate workspace 的覆盖率合并
# 解决：在 workspace 根目录运行
cargo llvm-cov --workspace
```

### 覆盖率目标

```
总体目标：
  核心逻辑（parser、协议实现）：≥ 90%
  业务逻辑（handler、service）：≥ 80%
  集成测试路径：≥ 60%
  不追求 100%——getter/setter、trivial 代码可以忽略

实践建议：
  1. 覆盖率是手段不是目的——不要为覆盖率写无用测试
  2. 优先覆盖错误分支（happy path 往往自然覆盖）
  3. 用 #[cfg(test)] 的辅助函数减少测试样板
  4. 定期在 CI 中跟踪覆盖率趋势，而不是追求绝对值
```
