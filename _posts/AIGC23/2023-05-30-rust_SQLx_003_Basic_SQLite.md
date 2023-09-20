---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - SQLx模块SQLite入门
date: 2023-05-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, SQLx]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

SQLx是一个Rust语言的异步SQL数据库访问库，支持多种数据库，包括PostgreSQL、MySQL、SQLite等。本教程将以SQLite为例，介绍SQLx的基础用法和进阶用法。

## 基础用法

### 连接数据库

首先，需要在Rust项目中添加SQLx库的依赖：

```toml
[dependencies]
sqlx = "0.6"
sqlx-core = "0.6"
sqlx-derive = "0.6"
sqlx-macros = "0.6"
```

然后，可以使用以下代码连接SQLite数据库：

```rust
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let database_url = "sqlite:mydatabase.db";
    let options = SqliteConnectOptions::new()
        .filename(database_url);
    let pool = SqlitePool::connect_with(options).await?;
    Ok(())
}
```

这里使用了`SqlitePool`连接池，可以在多个线程中共享连接。`SqliteConnectOptions`用于配置连接选项，这里指定了SQLite数据库文件的路径。

### 创建表

下面的代码演示了如何使用SQLx创建一个名为`users`的表：

```rust
use sqlx::{query, SqlitePool};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    query("CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )").execute(&pool).await?;
    Ok(())
}
```

这里使用了`query`宏执行SQL语句，`execute`方法用于执行语句。可以看到，SQL语句与普通的SQL语句没有太大区别。

### 插入数据

下面的代码演示了如何使用SQLx向`users`表中插入一条数据：

```rust
use sqlx::{query, SqlitePool};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    query("INSERT INTO users (name, email) VALUES (?, ?)")
        .bind("Alice")
        .bind("alice@example.com")
        .execute(&pool)
        .await?;
    Ok(())
}
```

这里使用了`bind`方法绑定参数，可以避免SQL注入攻击。

### 查询数据

下面的代码演示了如何使用SQLx查询`users`表中所有数据：

```rust
use sqlx::{query_as, SqlitePool};

#[derive(Debug, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    email: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    let users = query_as::<_, User>("SELECT * FROM users")
        .fetch_all(&pool)
        .await?;
    println!("{:?}", users);
    Ok(())
}
```

这里使用了`query_as`宏查询数据，并使用`FromRow`特性将查询结果转换为`User`结构体。`fetch_all`方法用于获取所有查询结果。

### 更新数据

下面的代码演示了如何使用SQLx更新`users`表中的数据：

```rust
use sqlx::{query, SqlitePool};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    query("UPDATE users SET email = ? WHERE name = ?")
        .bind("alice@example.org")
        .bind("Alice")
        .execute(&pool)
        .await?;
    Ok(())
}
```

这里使用了`UPDATE`语句更新数据。

### 删除数据

下面的代码演示了如何使用SQLx删除`users`表中的数据：

```rust
use sqlx::{query, SqlitePool};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    query("DELETE FROM users WHERE name = ?")
        .bind("Alice")
        .execute(&pool)
        .await?;
    Ok(())
}
```

这里使用了`DELETE`语句删除数据。

## 进阶用法

### 事务

下面的代码演示了如何使用SQLx进行事务操作：

```rust
use sqlx::{query, SqlitePool, SqliteTransaction};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    let mut tx = pool.begin().await?;
    query("INSERT INTO users (name, email) VALUES (?, ?)")
        .bind("Alice")
        .bind("alice@example.com")
        .execute(&mut tx)
        .await?;
    query("INSERT INTO users (name, email) VALUES (?, ?)")
        .bind("Bob")
        .bind("bob@example.com")
        .execute(&mut tx)
        .await?;
    tx.commit().await?;
    Ok(())
}
```

这里使用了`begin`方法开启一个事务，可以在事务中执行多条SQL语句。如果所有语句执行成功，可以使用`commit`方法提交事务，否则可以使用`rollback`方法回滚事务。

### 批量插入

下面的代码演示了如何使用SQLx进行批量插入操作：

```rust
use sqlx::{query, SqlitePool};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:mydatabase.db").await?;
    let users = vec![
        ("Alice", "alice@example.com"),
        ("Bob", "bob@example.com"),
        ("Charlie", "charlie@example.com"),
    ];
    query("INSERT INTO users (name, email) VALUES (?, ?)")
        .bind_all(users)
        .execute(&pool)
        .await?;
    Ok(())
}
```

这里使用了`bind_all`方法绑定多个参数，可以将多个参数一次性绑定到SQL语句中，避免了多次执行SQL语句的开销。

## 总结

本教程介绍了SQLx的基础用法和进阶用法，包括连接数据库、创建表、插入数据、查询数据、更新数据、删除数据、事务和批量插入。SQLx是一个非常方便的异步SQL数据库访问库，可以大大提高开发效率。
