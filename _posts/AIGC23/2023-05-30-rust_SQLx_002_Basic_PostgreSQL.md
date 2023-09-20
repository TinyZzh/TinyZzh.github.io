---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - SQLx模块PostgreSQL入门
date: 2023-05-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, SQLx]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

SQLx是一个Rust语言的异步SQL数据库连接库，支持PostgreSQL、MySQL和SQLite数据库。它提供了简单的API和异步执行查询的能力，使得Rust程序员可以轻松地与数据库交互。本教程将以PostgreSQL数据库为例，介绍SQLx的基础和进阶用法。

## 基础用法

### 安装SQLx

首先，我们需要在Rust项目中添加SQLx依赖。在Cargo.toml文件中添加以下内容：

```toml
[dependencies]
sqlx = "0.6"
sqlx-core = "0.6"
sqlx-postgres = "0.6"
```

其中，sqlx是SQLx的主要依赖，sqlx-core是SQLx的核心依赖，sqlx-postgres是SQLx连接PostgreSQL数据库的依赖。

### 连接数据库

在使用SQLx进行数据库操作之前，我们需要先连接到数据库。在这里，我们使用PostgreSQL数据库作为示例。首先，我们需要在环境变量中设置数据库连接字符串：

```bash
export DATABASE_URL=postgres://username:password@localhost:5432/database_name
```

其中，username和password分别是数据库的用户名和密码，localhost是数据库所在的主机名或IP地址，5432是PostgreSQL默认的端口号，database_name是数据库的名称。

然后，在Rust代码中使用connect方法连接到数据库：

```rust
use sqlx::postgres::PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;

    // ...
}
```

我们使用PgPool连接到PostgreSQL数据库，其中DATABASE_URL是环境变量中设置的数据库连接字符串。

### 执行查询

连接到数据库之后，我们可以使用SQLx执行SQL查询。SQLx提供了两种方式执行查询：一种是使用query方法返回一个结果集，另一种是使用execute方法执行一个SQL语句。

#### 使用query方法

使用query方法可以执行一个查询语句，并返回一个结果集。在这里，我们查询PostgreSQL中的users表：

```rust
use sqlx::postgres::PgQueryAs;

#[derive(Debug, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
}

async fn get_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    let users = sqlx::query_as::<_, User>("SELECT id, name FROM users")
        .fetch_all(pool)
        .await?;

    Ok(users)
}
```

我们使用query_as方法执行查询语句，并将结果集映射为User结构体。fetch_all方法将结果集转换为Vec<User>类型，并返回查询结果。

#### 使用execute方法

使用execute方法可以执行一个SQL语句，并返回受影响的行数。在这里，我们向PostgreSQL中的users表插入一条记录：

```rust
async fn add_user(pool: &PgPool, name: &str) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("INSERT INTO users (name) VALUES ($1)")
        .bind(name)
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}
```

我们使用query方法执行SQL语句，并使用bind方法绑定参数。execute方法执行SQL语句，并返回受影响的行数。

### 事务处理

在数据库操作中，事务处理是非常重要的。SQLx提供了transaction方法，可以在事务中执行多个SQL操作。

```rust
async fn transfer_money(pool: &PgPool, from: i32, to: i32, amount: i32) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    let from_balance: i32 = sqlx::query_scalar("SELECT balance FROM accounts WHERE id = $1")
        .bind(from)
        .fetch_one(&mut tx)
        .await?;

    if from_balance < amount {
        return Err(sqlx::Error::RowNotFound);
    }

    sqlx::query("UPDATE accounts SET balance = balance - $1 WHERE id = $2")
        .bind(amount)
        .bind(from)
        .execute(&mut tx)
        .await?;

    sqlx::query("UPDATE accounts SET balance = balance + $1 WHERE id = $2")
        .bind(amount)
        .bind(to)
        .execute(&mut tx)
        .await?;

    tx.commit().await?;

    Ok(())
}
```

我们使用begin方法开始一个事务，并在事务中执行多个SQL操作。如果所有操作都执行成功，我们使用commit方法提交事务。如果发生错误，我们使用rollback方法回滚事务。

### 使用连接池

在实际应用中，我们需要处理多个数据库连接。SQLx提供了连接池来管理多个数据库连接。在这里，我们使用PgPool连接池：

```rust
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;

    // ...
}
```

我们使用PgPoolOptions创建一个连接池，并在连接池中设置最大连接数。然后，我们使用connect方法连接到数据库。

### 使用SQLx宏

SQLx提供了一组宏，可以在编译时检查SQL语句的正确性和类型安全性。在这里，我们使用sqlx::query!宏执行查询语句：

```rust
use sqlx::postgres::PgRow;
use sqlx::query;

async fn get_user(pool: &PgPool, id: i32) -> Result<Option<PgRow>, sqlx::Error> {
    let user = query!("SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(pool)
        .await?;

    Ok(user)
}
```

我们使用query!宏执行查询语句，并使用$1占位符绑定参数。fetch_optional方法返回一个Option<PgRow>类型的结果集。

## 进阶用法

### 自定义类型映射

SQLx默认支持一些常见的Rust类型和PostgreSQL数据类型的映射。但是，在某些情况下，我们需要自定义类型映射。在这里，我们自定义一个Json类型映射：

```rust
use serde::{Deserialize, Serialize};
use sqlx::postgres::{PgTypeInfo, PgValue, types::PgTypeMetadata};
use sqlx::{Decode, Encode, Type};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Json<T>(pub T);

impl<'r, T> Type<'r> for Json<T>
where
    T: Serialize + Deserialize<'r>,
{
    fn type_info() -> PgTypeInfo<'r> {
        PgTypeInfo::with_name("jsonb")
    }

    fn compatible(ty: &PgTypeMetadata<'_>) -> bool {
        ty.name() == "json" || ty.name() == "jsonb"
    }
}

impl<'q, 'r, T> Encode<'q, 'r> for Json<T>
where
    T: Serialize,
{
    fn encode(&self, buf: &mut Vec<u8>) -> sqlx::encode::Result<()> {
        let json = serde_json::to_string(&self.0)?;
        PgValue::from(json).encode(buf)
    }
}

impl<'r, T> Decode<'r> for Json<T>
where
    T: Deserialize<'r>,
{
    fn decode(value: PgValue<'r>) -> Result<Self, sqlx::Error> {
        let json = value.try_get::<&str>()?;
        let value = serde_json::from_str(json)?;
        Ok(Json(value))
    }
}
```

我们定义了一个Json结构体，它包装了一个T类型的值。然后，我们实现了Type、Encode和Decode trait，将Json类型映射为PostgreSQL的jsonb类型。

### 使用SQLx的连接池管理器

在实际应用中，我们需要使用连接池管理器来管理多个数据库连接。SQLx提供了连接池管理器，可以方便地管理连接池和连接。在这里，我们使用r2d2连接池管理器：

```rust
use std::thread;
use sqlx::postgres::PgConnection;
use sqlx::pool::{Pool, PoolConnection};
use r2d2_postgres::{postgres::NoTls, PostgresConnectionManager};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let manager = PostgresConnectionManager::new(
        "host=localhost user=postgres".parse().unwrap(),
        NoTls,
    );
    let pool = r2d2::Pool::new(manager).unwrap();

    // ...
}
```

我们使用PostgresConnectionManager创建一个连接管理器，并在连接管理器中设置最大连接数。然后，我们使用Pool构建一个连接池，并在连接池中设置最大连接数。

## 总结

本教程介绍了SQLx的基础和进阶用法。我们学习了如何连接到PostgreSQL数据库，如何执行SQL查询和操作，如何处理事务，如何使用连接池和宏，以及如何自定义类型映射和使用连接池管理器。SQLx是一个强大的异步SQL数据库连接库，可以帮助Rust程序员轻松地与数据库交互。

