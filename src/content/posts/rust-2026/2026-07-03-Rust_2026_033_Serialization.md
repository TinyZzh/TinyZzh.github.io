---
title: "Rust 2026 经验谈 - 序列化与数据格式"
published: 2026-07-03
description: "serde 生态全览、零拷贝反序列化 rkyv、自定义 Serialize/Deserialize、serde 属性速查、Protocol Buffers 与 FlatBuffers 的 Rust 绑定。"
image: "/images/rust-2026/8.jpg"
tags: [Rust, Rust 2026, serde, 序列化, rkyv, Protocol Buffers]
category: Rust
draft: false
lang: zh_CN
---

![生态与架构实战](/images/rust-2026/8.jpg)

序列化是系统间通信的基础——配置文件、网络协议、持久化存储都离不开。Rust 的 serde 生态系统是事实标准，但"derive + serde_json"只是冰山一角。本文从生态系统全览、零拷贝反序列化、自定义实现、属性速查、跨语言格式五个层面，系统总结 Rust 序列化的实战经验。

## serde 生态系统全览

### 核心架构

serde 的核心是两个 trait：`Serialize` 和 `Deserialize`。大部分工作由 derive macro 完成：

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
    email: String,
    active: bool,
}
```

**关键设计**：serde 将"数据结构"和"格式"解耦——同一结构可以序列化到 JSON、YAML、TOML、Bincode 等任意格式。

### 格式生态

| 格式 | crate | 特点 | 适用场景 |
|------|-------|------|----------|
| JSON | `serde_json` | 通用、可读 | Web API、配置 |
| YAML | `serde_yaml` | 可读、支持注释 | 配置文件 |
| TOML | `toml` | 简洁、Rust 偏爱 | Cargo.toml、配置 |
| Bincode | `bincode` | 紧凑二进制 | Rust 进程间通信 |
| MessagePack | `rmp-serde` | 紧凑二进制、跨语言 | RPC、存储 |
| CBOR | `ciborium` | 二进制 JSON | IoT、嵌入式 |
| JSON5 | `json5` | JSON + 注释 + 尾逗号 | 配置文件 |

### JSON：serde_json

```rust
use serde_json::{json, Value, to_string, from_str};

// 从结构体序列化
let user = User { id: 1, name: "Alice".into(), email: "a@b.c".into(), active: true };
let json_str = serde_json::to_string(&user)?;
// {"id":1,"name":"Alice","email":"a@b.c","active":true}

// 漂亮输出
let pretty = serde_json::to_string_pretty(&user)?;

// 反序列化
let user2: User = serde_json::from_str(&json_str)?;

// 使用 json! 宏构建 Value
let v = json!({
    "id": 1,
    "name": "Alice",
    "tags": ["admin", "user"],
});

// 流式写入（避免分配中间 String）
let mut buf = Vec::new();
serde_json::to_writer(&mut buf, &user)?;

// 流式读取
let user3: User = serde_json::from_reader(std::io::Cursor::new(buf))?;
```

### YAML：serde_yaml

```rust
use serde_yaml;

let config = Config {
    database: DatabaseConfig {
        host: "localhost".into(),
        port: 5432,
    },
    max_connections: 100,
};

let yaml_str = serde_yaml::to_string(&config)?;
// database:
//   host: localhost
//   port: 5432
// max_connections: 100

let config2: Config = serde_yaml::from_str(&yaml_str)?;
```

**踩坑**：serde_yaml 0.9+ 有重大 API 变更，`Mapping` 类型从 BTreeMap 变为 IndexMap，注意版本兼容。

### TOML：toml

```rust
use toml;

let toml_str = r#"
[server]
host = "0.0.0.0"
port = 8080

[database]
url = "postgres://localhost/mydb"
"#;

let config: ServerConfig = toml::from_str(toml_str)?;
```

### Bincode：Rust 进程间通信

```rust
use bincode;

let data = User { id: 1, name: "Alice".into(), email: "a@b.c".into(), active: true };

// 序列化
let bytes = bincode::serialize(&data)?;
// 紧凑二进制，无字段名

// 反序列化
let user: User = bincode::deserialize(&bytes)?;

// 配置
let config = bincode::config::standard()
    .with_little_endian()
    .with_varint_encoding();  // 变长整数节省空间

let bytes = bincode::encode_to_vec(&data, config)?;
let user: User = bincode::decode_from_slice(&bytes, config)?.0;
```

**注意**：Bincode 不是自描述格式，反序列化依赖 Rust 类型信息。不同版本的 Rust 结构体可能不兼容。

### MessagePack：rmp-serde

```rust
use rmp_serde;

let data = User { id: 1, name: "Alice".into(), email: "a@b.c".into(), active: true };

let bytes = rmp_serde::to_vec(&data)?;
let user: User = rmp_serde::from_read_ref(&bytes)?;
```

## 零拷贝反序列化：rkyv

### 为什么需要零拷贝

传统反序列化需要分配内存、拷贝数据——对于大对象（GB 级游戏资产、数据库索引）这是巨大浪费。rkyv（archive）实现零拷贝反序列化：直接在序列化后的字节上引用，不分配不拷贝。

### 基本用法

```toml
[dependencies]
rkyv = { version = "0.8", features = ["validation"] }
```

```rust
use rkyv::{Archive, Deserialize, Serialize};

#[derive(Archive, Deserialize, Serialize, Debug, PartialEq)]
struct Player {
    id: u32,
    name: String,
    score: u64,
    items: Vec<String>,
}

let player = Player {
    id: 42,
    name: "Alice".into(),
    score: 9999,
    items: vec!["sword".into(), "shield".into()],
};

// 序列化
let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&player)?;

// 零拷贝反序列化——不分配！
let archived: &PlayerArchived = unsafe { rkyv::access::<PlayerArchived>(&bytes)? };

// archived 是 &PlayerArchived，字段访问直接在字节上
assert_eq!(archived.id, 42);
assert_eq!(*archived.name, "Alice");
assert_eq!(archived.score, 9999);

// 字符串访问
let name: &str = &archived.name;
assert_eq!(name, "Alice");

// Vec 访问
let items = &archived.items;
assert_eq!(items.len(), 2);
assert_eq!(&items[0], "sword");
```

### 安全验证

```rust
// unsafe { rkyv::access(...) } 不验证字节完整性
// 如果数据不可信（网络、磁盘），用验证版本：

let archived = rkyv::access::<PlayerArchived, rkyv::rancor::Error>(&bytes)?;

// 或用 check 前缀（更严格的验证）
let archived = rkyv::check::<PlayerArchived, rkyv::rancor::Error>(&bytes)?;
```

### 完整反序列化

```rust
// 从 archived 还原为可修改的 Rust 对象
let archived = rkyv::access::<PlayerArchived, rkyv::rancor::Error>(&bytes)?;
let mut player: Player = rkyv::deserialize::<Player, rkyv::rancor::Error>(archived)?;
player.score += 100;
```

### 性能对比

```
| 操作              | serde_json    | bincode       | rkyv          |
|-------------------|---------------|---------------|---------------|
| 序列化 10K 对象   | ~2ms          | ~0.5ms        | ~0.8ms        |
| 反序列化 10K 对象 | ~3ms          | ~0.8ms        | ~0.001ms      |
| 内存分配          | 大量          | 少量          | 零            |
```

rkyv 反序列化速度是传统方案的 100-1000 倍，因为它不做任何分配和拷贝。

### rkyv 的局限

- **Archived 类型不同**：`PlayerArchived` vs `Player`，字段类型也可能不同（`String` → ` ArchivedString`）
- **不支持动态分发**：不能在运行时决定反序列化为什么类型
- **序列化格式不稳定**：不同版本的 rkyv 或不同结构体布局可能不兼容
- **需要 unsafe**：`access` 是 unsafe 的（除非用验证版本）

### 踩坑：Archived 类型的字段不是原始类型

```rust
#[derive(Archive, Serialize, Deserialize)]
struct Config {
    version: u32,
    name: String,      // Archived: ArchivedString
    values: Vec<i64>,  // Archived: ArchivedVec<i64>
}

let archived = unsafe { rkyv::access::<ConfigArchived>(&bytes)? };

// archived.name 不是 String，是 ArchivedString
// 但实现了 PartialEq<str> 和 Deref<Target = str>
let name: &str = &archived.name;  // OK：Deref 到 &str

// archived.values 不是 Vec<i64>，是 ArchivedVec<i64>
for val in archived.values.iter() {
    println!("{}", val);  // val 是 i64 的引用
}
```

## 自定义 Serialize/Deserialize 实现

### 何时手写 vs derive

**优先用 derive + 属性**——只有在以下情况才手写：
- 需要序列化的格式与结构体字段不完全对应
- 需要自定义字段映射逻辑（如版本兼容）
- 需要特殊处理某些类型（如 `Duration`）

### 手写 Serialize

```rust
use serde::ser::{Serialize, Serializer, SerializeStruct};
use std::time::Duration;

impl Serialize for Duration {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut state = serializer.serialize_struct("Duration", 2)?;
        state.serialize_field("secs", &self.as_secs())?;
        state.serialize_field("nanos", &self.subsec_nanos())?;
        state.end()
    }
}
```

### 手写 Deserialize

```rust
use serde::de::{Deserialize, Deserializer, Visitor, SeqAccess, MapAccess};
use std::time::Duration;

impl<'de> Deserialize<'de> for Duration {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct DurationVisitor;

        impl<'de> Visitor<'de> for DurationVisitor {
            type Value = Duration;

            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                write!(f, "a Duration as {{secs: u64, nanos: u32}}")
            }

            fn visit_map<V: MapAccess<'de>>(self, mut map: V) -> Result<Duration, V::Error> {
                let mut secs = None;
                let mut nanos = None;
                while let Some(key) = map.next_key::<String>()? {
                    match key.as_str() {
                        "secs" => secs = Some(map.next_value()?),
                        "nanos" => nanos = Some(map.next_value()?),
                        _ => { let _ = map.next_value::<serde::de::IgnoredAny>()?; }
                    }
                }
                Ok(Duration::new(secs.unwrap_or(0), nanos.unwrap_or(0)))
            }
        }

        deserializer.deserialize_struct("Duration", &["secs", "nanos"], DurationVisitor)
    }
}
```

### 更实用的手写示例：版本兼容反序列化

```rust
#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
struct ConfigV2 {
    host: String,
    port: u16,
    timeout_secs: u64,  // V2 新增
}

// 手写 V1 → V2 兼容
impl<'de> Deserialize<'de> for ConfigV2 {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        struct ConfigV1 {
            host: String,
            port: u16,
            #[serde(default)]
            timeout_secs: u64,
        }

        let v1 = ConfigV1::deserialize(deserializer)?;
        Ok(ConfigV2 {
            host: v1.host,
            port: v1.port,
            timeout_secs: v1.timeout_secs,
        })
    }
}
```

### 用 serde(with) 桥接第三方类型

```rust
mod duration_millis {
    use serde::{Serializer, Deserializer};
    use std::time::Duration;

    pub fn serialize<S: Serializer>(dur: &Duration, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_u64(dur.as_millis() as u64)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        let millis = u64::deserialize(d)?;
        Ok(Duration::from_millis(millis))
    }
}

#[derive(Serialize, Deserialize)]
struct Task {
    name: String,
    #[serde(with = "duration_millis")]
    timeout: Duration,  // 序列化为毫秒数而非 {secs, nanos}
}
```

## serde 属性速查

### rename：重命名

```rust
#[derive(Serialize, Deserialize)]
struct User {
    #[serde(rename = "userId")]
    id: u64,
    #[serde(rename = "userName")]
    name: String,
}

// JSON: {"userId": 1, "userName": "Alice"}
```

### rename_all：批量重命名

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiResponse {
    user_id: u64,      // → userId
    user_name: String,  // → userName
    is_active: bool,    // → isActive
}

// 其他选项：snake_case, kebab-case, PascalCase,
// SCREAMING_SNAKE_CASE, SCREAMING-KEBAB-CASE
```

### flatten：嵌入/展平

```rust
#[derive(Serialize, Deserialize)]
struct Pagination {
    page: u32,
    per_page: u32,
}

#[derive(Serialize, Deserialize)]
struct UsersResponse {
    #[serde(flatten)]
    pagination: Pagination,
    users: Vec<User>,
}

// JSON: {"page": 1, "per_page": 20, "users": [...]}
// Pagination 的字段被展平到外层
```

**踩坑**：flatten 与 deny_unknown_fields 不兼容——flatten 使用 `__other` 捕获额外字段，deny_unknown_fields 会拒绝它。

### deny_unknown_fields：严格模式

```rust
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config {
    host: String,
    port: u16,
}

// JSON: {"host": "localhost", "port": 8080, "debug": true}
// ↑ 反序列化失败：unknown field `debug`
// 不加 deny_unknown_fields 则静默忽略额外字段
```

### skip / skip_serializing / skip_deserializing

```rust
#[derive(Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    #[serde(skip)]
    password_hash: String,          // 序列化和反序列化都跳过
    #[serde(skip_serializing_if = "Vec::is_empty")]
    tags: Vec<String>,              // 为空时不序列化
    #[serde(default)]
    role: String,                   // 反序列化时缺省用 Default
}
```

### default

```rust
#[derive(Deserialize)]
struct Config {
    host: String,
    #[serde(default = "default_port")]
    port: u16,
    #[serde(default)]
    verbose: bool,  // Default::default() → false
}

fn default_port() -> u16 { 8080 }
```

### 其他常用属性

```rust
#[derive(Serialize, Deserialize)]
#[serde(bound = "")]  // 取消泛型约束
struct Container<T: Clone> {
    #[serde(bound = "T: Serialize + Deserialize<'de>")]
    value: T,
}

#[derive(Serialize, Deserialize)]
enum Status {
    #[serde(rename = "OK")]
    Ok,
    #[serde(rename = "ERROR")]
    Error,
    #[serde(other)]
    Unknown,  // 反序列化时，非 OK/ERROR 都映射到 Unknown
}

// try_from / try_into：通过中间类型转换
#[derive(Serialize, Deserialize)]
#[serde(try_from = "u8", into = "u8")]
struct Priority(u8);
```

## 与 Protocol Buffers / FlatBuffers 的 Rust 绑定

### Protocol Buffers：prost

```toml
[dependencies]
prost = "0.13"
prost-types = "0.13"

[build-dependencies]
prost-build = "0.13"
```

```protobuf
// proto/user.proto
syntax = "proto3";
package myapp;

message User {
    uint64 id = 1;
    string name = 2;
    string email = 3;
    bool active = 4;
}

message ListUsersRequest {
    int32 page = 1;
    int32 per_page = 2;
}

message ListUsersResponse {
    repeated User users = 1;
    int32 total = 2;
}
```

```rust
// build.rs
fn main() {
    prost_build::Config::new()
        .compile_protos(&["proto/user.proto"], &["proto/"])
        .unwrap();
}
```

```rust
// src/main.rs
mod pb {
    include!(concat!(env!("OUT_DIR"), "/myapp.rs"));
}

use pb::{User, ListUsersRequest, ListUsersResponse};

let user = User {
    id: 42,
    name: "Alice".into(),
    email: "alice@example.com".into(),
    active: true,
};

// 序列化
let bytes = user.encode_to_vec();

// 反序列化
let user2 = User::decode(bytes.as_slice())?;

// 零拷贝解码（prost 不直接支持，需要 bytes crate）
let buf = bytes::Bytes::from(bytes);
let user3 = User::decode(buf)?;
```

### prost vs protobuf (rust-protobuf)

| 特性 | prost | rust-protobuf |
|------|-------|---------------|
| 代码风格 | Rust 惯例 | 更接近 Java/C++ 风格 |
| 零拷贝 | 部分 | 不支持 |
| gRPC 集成 | tonic（优秀） | 不推荐 |
| 映射类型 | HashMap | 自定义 Map |
| 社区活跃度 | 高（Google 维护） | 低 |

**推荐**：新项目用 prost + tonic。

### FlatBuffers：flatbuffers

```toml
[dependencies]
flatbuffers = "25"
```

```flatbuffers
// schema/user.fbs
table User {
    id: ulong;
    name: string;
    email: string;
    active: bool = true;
}

table ListUsersResponse {
    users: [User];
    total: int;
}

root_type ListUsersResponse;
```

```bash
# 生成 Rust 代码
flatc --rust -o src/generated schema/user.fbs
```

```rust
mod generated;
use generated::{user::User, list_users_response::ListUsersResponse};

// 构建 FlatBuffer
let mut builder = flatbuffers::FlatBufferBuilder::with_capacity(1024);
let name = builder.create_string("Alice");
let email = builder.create_string("alice@example.com");

let user = User::create(&mut builder, &UserArgs {
    id: 42,
    name: Some(name),
    email: Some(email),
    active: true,
});

let users = builder.create_vector(&[user]);
let response = ListUsersResponse::create(&mut builder, &ListUsersResponseArgs {
    users: Some(users),
    total: 1,
});
builder.finish(response, None);

let buf = builder.finished_data();

// 零拷贝读取
let response = ListUsersResponse::root(buf);
assert_eq!(response.users().unwrap().len(), 1);
let user = response.users().unwrap().get(0);
assert_eq!(user.id(), 42);
assert_eq!(user.name().unwrap(), "Alice");
```

### 三种格式选型

| 场景 | 推荐格式 | 原因 |
|------|----------|------|
| Web API | JSON (serde_json) | 通用、调试方便 |
| Rust 进程间通信 | Bincode / rkyv | 紧凑、快速 |
| 跨语言 RPC | Protocol Buffers (prost) | 代码生成、向后兼容 |
| 游戏/实时系统 | FlatBuffers | 零拷贝、无分配 |
| 配置文件 | TOML / YAML | 可读、注释 |
| 嵌入式/IoT | MessagePack / CBOR | 紧凑 |

### 踩坑：serde 与 Protocol Buffers 的冲突

```rust
// prost 生成的类型不实现 serde 的 Serialize/Deserialize
// 如果需要同时用 prost 和 serde_json：

// 方案 1：用 prost-serde（社区 crate）
// 方案 2：手动转换
fn user_to_json(user: &pb::User) -> serde_json::Value {
    json!({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "active": user.active,
    })
}
```

### 踩坑：大文件反序列化的内存问题

```rust
// 反序列化大 JSON 文件会一次性分配内存
// 使用 serde_json 的流式 API：

use serde_json::Deserializer;

let file = std::fs::File::open("large.json")?;
let reader = std::io::BufReader::new(file);
let stream = Deserializer::from_reader(reader).into_iter::<Item>();

for result in stream {
    let item: Item = result?;
    process(item);
}
```
