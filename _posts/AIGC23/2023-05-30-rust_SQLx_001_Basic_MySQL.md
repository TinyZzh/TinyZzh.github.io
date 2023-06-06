---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - SQLx模块MySQL入门
date: 2023-05-29 00:00: +0800
categories: [Rust]
tags: [Rust, 从入门到精通, MQTT]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

SQLx是一个Rust语言的异步SQL执行库，它支持多种数据库，包括MySQL、PostgreSQL、SQLite等。本教程将以MySQL数据库为例，介绍SQLx在Rust语言中的基础用法和进阶用法。

## 基础用法

要使用SQLx，需要在`Cargo.toml`文件中添加以下依赖：

```toml
[dependencies]
sqlx = { version = "0.6", features = ["mysql", "runtime-tokio-rustls"] }
tokio = { version = "1", features = ["full"] }
```

### 连接数据库

在使用SQLx之前，需要先连接数据库。SQLx提供了两种方式连接MySQL数据库：使用URL连接和使用配置文件连接。

#### URL连接

使用URL连接时，需要在代码中指定连接字符串，例如：

```rust
use sqlx::mysql::MySqlPoolOptions;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect("mysql://username:password@hostname:port/database")
        .await?;
    // ...
    Ok(())
}
```

其中，`username`和`password`是数据库用户名和密码，`hostname`是数据库主机名，`port`是数据库端口号，`database`是要连接的数据库名。

#### 配置文件连接

使用配置文件连接时，需要在项目根目录下创建一个名为`.env`的文件，并在其中指定连接信息，例如：

```
DATABASE_URL=mysql://username:password@hostname:port/database
```

然后在代码中使用`dotenv`库加载`.env`文件，并使用`sqlx::MySqlPool::connect_dotenv()`方法连接数据库，例如：

```rust
use sqlx::mysql::MySqlPoolOptions;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    dotenv::dotenv().ok();
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect_dotenv()
        .await?;
    // ...
    Ok(())
}
```

### 查询数据

连接成功后，就可以使用SQLx执行SQL查询语句了。SQLx提供了两种方式执行SQL查询语句：使用`query()`方法和使用`query_as()`方法。

#### 使用query()方法

使用`query()`方法执行SQL查询语句时，需要手动指定返回结果的类型，例如：

```rust
use sqlx::{MySqlPool, Row};

#[derive(Debug)]
struct User {
    id: i32,
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let mut rows = sqlx::query("SELECT id, name FROM users")
        .map(|row: sqlx::mysql::MySqlRow| {
            User {
                id: row.get(0),
                name: row.get(1),
            }
        })
        .fetch_all(&mut conn)
        .await?;

    for row in rows.iter() {
        println!("{:?}", row);
    }

    Ok(())
}
```

#### 使用query_as()方法

使用`query_as()`方法执行SQL查询语句时，可以自动将返回结果转换为指定类型的结构体，例如：

```rust
use sqlx::{MySqlPool, FromRow};

#[derive(Debug, FromRow)]
struct User {
    id: i32,
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let mut rows = sqlx::query_as::<_, User>("SELECT id, name FROM users")
        .fetch_all(&mut conn)
        .await?;

    for row in rows.iter() {
        println!("{:?}", row);
    }

    Ok(())
}
```

### 插入数据

使用SQLx插入数据时，可以使用`execute()`方法或`execute_with()`方法。

#### 使用execute()方法

使用`execute()`方法插入数据时，需要手动指定插入的数据，例如：

```rust
use sqlx::{MySqlPool, Row};

#[derive(Debug)]
struct User {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let user = User {
        name: "John".to_string(),
    };

    let result = sqlx::query("INSERT INTO users (name) VALUES (?)")
        .bind(user.name)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

#### 使用execute_with()方法

使用`execute_with()`方法插入数据时，可以使用结构体自动映射的特性，例如：

```rust
use sqlx::{MySqlPool, FromRow};

#[derive(Debug, FromRow)]
struct User {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let user = User {
        name: "John".to_string(),
    };

    let result = sqlx::query_with::<_, User>("INSERT INTO users (name) VALUES (?)", user)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

### 更新数据

使用SQLx更新数据时，可以使用`execute()`方法或`execute_with()`方法。

#### 使用execute()方法

使用`execute()`方法更新数据时，需要手动指定更新的条件和更新的数据，例如：

```rust
use sqlx::{MySqlPool, Row};

#[derive(Debug)]
struct User {
    id: i32,
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let user = User {
        id: 1,
        name: "John".to_string(),
    };

    let result = sqlx::query("UPDATE users SET name = ? WHERE id = ?")
        .bind(user.name)
        .bind(user.id)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

#### 使用execute_with()方法

使用`execute_with()`方法更新数据时，可以使用结构体自动映射的特性，例如：

```rust
use sqlx::{MySqlPool, FromRow};

#[derive(Debug, FromRow)]
struct User {
    id: i32,
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let user = User {
        id: 1,
        name: "John".to_string(),
    };

    let result = sqlx::query_with::<_, User>("UPDATE users SET name = :name WHERE id = :id", user)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

### 删除数据

使用SQLx删除数据时，可以使用`execute()`方法或`execute_with()`方法。

#### 使用execute()方法

使用`execute()`方法删除数据时，需要手动指定删除的条件，例如：

```rust
use sqlx::{MySqlPool, Row};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let result = sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(1)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

#### 使用execute_with()方法

使用`execute_with()`方法删除数据时，可以使用结构体自动映射的特性，例如：

```rust
use sqlx::{MySqlPool, FromRow};

#[derive(Debug, FromRow)]
struct User {
    id: i32,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let user = User {
        id: 1,
    };

    let result = sqlx::query_with::<_, User>("DELETE FROM users WHERE id = :id", user)
        .execute(&mut conn)
        .await?;

    println!("{:?}", result);

    Ok(())
}
```

## 进阶用法

### 事务

使用SQLx执行事务时，可以使用`begin()`方法开始事务，使用`commit()`方法提交事务，使用`rollback()`方法回滚事务。

```rust
use sqlx::{MySqlPool, Transaction};

#[derive(Debug)]
struct User {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let mut tx = conn.begin().await?;

    let user = User {
        name: "John".to_string(),
    };

    let result = sqlx::query("INSERT INTO users (name) VALUES (?)")
        .bind(user.name)
        .execute(&mut tx)
        .await?;

    println!("{:?}", result);

    tx.commit().await?;

    Ok(())
}
```

### 连接池

使用SQLx连接池时，可以使用`PoolOptions::new()`方法创建连接池，并使用`acquire()`方法获取连接。

```rust
use sqlx::{MySqlPool, PoolOptions};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = MySqlPool::connect("mysql://username:password@hostname:port/database").await?;
    let mut conn = pool.acquire().await?;

    let pool = MySqlPool::builder()
        .max_size(5)
        .build("mysql://username:password@hostname:port/database")
        .await?;

    let mut conn = pool.acquire().await?;

    // ...

    Ok(())
}
```

## 总结

本教程介绍了SQLx在Rust语言中的基础用法和进阶用法，包括连接数据库、查询数据、插入数据、更新数据、删除数据、事务和连接池等。SQLx是一个简单易用的异步SQL执行库，可以帮助Rust开发者快速地与多种数据库进行交互。
