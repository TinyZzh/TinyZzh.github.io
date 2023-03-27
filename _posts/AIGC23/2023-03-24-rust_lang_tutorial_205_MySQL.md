---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Rust语言MySQL实战
date: 2023-03-24 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, MySQL]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

MySQL是一个广泛使用的关系型数据库，Rust作为一门相对较新的系统级编程语言，具有C语言般的高性能、安全、并发等特性，因此与MySQL一起使用是一种非常有趣的选择。在本教程中，我们将手把手地展示如何在Rust中连接和使用MySQL数据库。

## 安装 `mysql` 模块

这里我们假设你已经安装了Rust编程语言工具链，在本教程中，我们将使用`mysql` crate来连接和使用MySQL数据库。要安装`mysql` crate，我们可以使用Rust语言包管理器`cargo`，只需在终端中输入以下命令：

```
cargo install mysql
```

安装成功后，我们可以开始尝试连接MySQL数据库了。

## 连接MySQL数据库

首先，我们需要安装和配置MySQL数据库，以便在Rust程序中进行连接。安装和配置MySQL在此处不做叙述。

在Rust程序中使用`mysql` crate库连接MySQL数据库，需要进行以下步骤：

1. 导入`mysql` crate
2. 使用`mysql::OptsBuilder`设置MySQL连接选项
3. 使用`mysql::Pool::new`创建MySQL连接池
4. 使用`pool.get_conn()`获取MySQL连接，并进行一些操作，例如插入、查询等
5. 使用`pool.disconnect()`断开MySQL连接

下面是连接MySQL数据库的示例代码：

```rust
use mysql::*;

fn main() {
    let opts = OptsBuilder::new()
        .ip_or_hostname(Some("localhost"))
        .user(Some("root"))
        .pass(Some("password"))
        .db_name(Some("test"))
        .tcp_port(3306);

    let pool = Pool::new(opts).unwrap();
    let mut conn = pool.get_conn().unwrap();

    let result = conn.query("SELECT * FROM users").unwrap();
    for row in result {
        let name: String = row.get("name").unwrap();
        let age: i32 = row.get("age").unwrap();
        println!("{} is {} years old", name, age);
    }

    pool.disconnect().unwrap();
}
```

以上代码创建了一个MySQL连接池，并从连接池中获取一个MySQL连接，查询了一个名为`users`的表，并将结果作为元素进行遍历。

## Rust使用MySQL的进阶用法

### 事务（Transaction）

为了保证MySQL数据库中的数据一致性，我们通常需要使用事务（Transaction）。在Rust中，可以使用MySQL的事务功能并结合`mysql::Transaction`来实现。

使用以下代码示例可以体验事务的实现：

```rust
use mysql::*;

fn main() {
    let opts = OptsBuilder::new()
        .ip_or_hostname(Some("localhost"))
        .user(Some("root"))
        .pass(Some("password"))
        .db_name(Some("test"))
        .tcp_port(3306);

    let pool = Pool::new(opts).unwrap();
    let mut conn = pool.get_conn().unwrap();

    // Start a transaction
    let mut transaction = conn.start_transaction(TxOpts::default()).unwrap();

    // Insert data into a table
    transaction .prep_exec("INSERT INTO users (name, age) VALUES (?, ?)", ("Alice", 23))
        .unwrap();
    transaction
        .prep_exec("INSERT INTO users (name, age) VALUES (?, ?)", ("Bob", 25))
        .unwrap();

    // Commit a transaction
    transaction.commit().unwrap();

    // Select data from a table let result = conn.query("SELECT * FROM users").unwrap();
    for row in result {
        let name: String = row.get("name").unwrap();
        let age: i32 = row.get("age").unwrap();
 println!("{} is {} years old", name, age);
    }

    pool.disconnect().unwrap();
}
```

以上代码创建了一个名为`users`的表，并在事务内分别插入了两个元素，数据被成功提交到了MySQL数据库，我们看到了名为`Alice`和`Bob`的条目。

### 异步IO

Rust语言具有异步IO处理的优势。在Rust中使用MySQL异步IO时，可以使用`tokio-mysql` crate来实现。`tokio-mysql` crate是一个基于Tokio实现的异步MySQL数据库客户端。

下面是使用`tokio-mysql` crate的示例代码：

```rust
use std::str::FromStr;

use tokio::runtime::Builder;
use tokio::time::Duration;
use tokio_mysql::{prelude::*, Error, Opts, Pool};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let opts = Opts::from_url("mysql://root:password@localhost:3306/test")?;
    let pool = Pool::new(opts);

    let pool = match pool {
        Ok(p) => p,
        Err(e) => return Err(e),
    };

    let mut conn = pool.get_conn().await?;

    conn.query_drop("CREATE TABLE IF NOT EXISTS students (
            id INT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            age INT NOT NULL
        )")
        .await?;

    let id = 1;
    let name = "Alice";
    let age = 23;

    conn.exec_drop(
            format!(
                "INSERT INTO students (id, name, age) VALUES ({}, \"{}\", {})",
                id, name, age
            )
            .as_str()
        )
        .await?;

    let mut conn2 = pool.get_conn().await?;
    let result = conn2
        .query_iter(
            String::from("SELECT * FROM students")
                .as_str(),
        )
        .await?;

    for row in result {
        let id: u32 = row.unwrap().take("id").unwrap().as_integer().unwrap().try_into().unwrap();
        let name: &str = row.unwrap().take("name").unwrap().as_sql_str();
        let age: u32 = row.unwrap().take("age").unwrap().as_integer().unwrap().try_into().unwrap();

        println!("{} is {} years old", name, age);
    }

    Ok(())
}
```

它创建了一个名为`students`的表，并插入了一个名为`Alice`年龄为`23`的元素，然后遍历该表并打印结果。

## Rust使用MySQL的最佳实践

### 连接池

在连接MySQL数据库时，使用连接池是非常重要的。连接池是一个预先创建的连接集合，由于预先初始化了这些连接，因此在保持连接上下文的情况下执行多个操作变得更加轻松。在Rust中使用`mysql::Pool`连接MySQL数据库是非常常见的。

```rust
let opts = OptsBuilder::new()
    .ip_or_hostname(Some("localhost"))
    .user(Some("root"))
    .pass(Some("password"))
    .db_name(Some("test"))
    .tcp_port(3306);

let pool = Pool::new(opts).unwrap();
```

### 避免SQL注入

避免SQL注入攻击是一个重要的安全问题。在Rust中使用`mysql` crate，可以使用`mysql::from_value`和`mysql::Value::from`方法来避免SQL注入攻击。

在Rust中，需要使用以下代码实现SQL语句中的参数绑定：

```rust
let name = "Alice";
let age = 23;

conn.prep_exec(
        "INSERT INTO students (name, age) VALUES (?, ?)",
        (name, age),
    )
    .unwrap();
```

在将参数传递给SQL查询时，需要使用`mysql::Value::from`方法将变量转换为`mysql::Value`类型，以防止SQL注入攻击。要从`mysql::Value`转换回常规变量，可以使用`mysql::from_value`方法。使用以下示例代码：

```rust
use mysql::*;

fn main() {
    let result: Vec<Row> = conn.query("SELECT * FROM students WHERE age >= ?", (age.into(),)).unwrap();
    for row in result {
        let age: i32 = from_value(row.get("age").unwrap());
        let name: String = from_value(row.get("name").unwrap());
        println!("{} is {} years old", name, age);
    }
}
```

### SQL执行和结果处理

在Rust中，可以使用`mysql::Conn::query`，`mysql::Conn::exec_iter`和`mysql::Conn::prep_exec`等方法来执行SQL语句。但是，这些方法返回的结果类型有很大不同。`query`方法返回包含所有结果集的`Vec<mysql::Row>`类型，而`exec_iter`方法返回`mysql::Row`类型的迭代器。最后，`prep_exec`方法是最常用的方法，它可以绑定参数，并类似于通过命令行客户端发送的查询，并返回`mysql::QueryResult`类型。如果要提取单个结果，可以使用`mysql::QueryResult`的方法`mysql::QueryResult::next`来获取。

使用以下代码示例说明不同方法的使用：

```rust
use mysql::*;

fn main() {
    let result: Vec<Row> = conn.query("SELECT * FROM students WHERE age >= ?", (age.into(),)).unwrap();
    for row in result {
        let age: i32 = from_value(row.get("age").unwrap());
        let name: String = from_value(row.get("name").unwrap());
        println!("{} is {} years old", name, age);
    }

    let mut iter = conn.exec_iter("SELECT age FROM students WHERE name = \"Alice\"").unwrap();
    while let Some(result) = iter.next() {
        let age: i32 = from_value(result.unwrap());
        println!("Alice is {} years old", age);
    }

    conn.prep_exec(
            "INSERT INTO students (name, age) VALUES (?, ?)",
            (name, age),
        )
        .unwrap();
}
```

## 结论

本教程介绍了如何在Rust中连接和使用MySQL数据库。我们学习了使用`mysql` crate连接MySQL数据库，并实现了一些常见用例，例如事务、异步IO等。此外，我们使用连接池、避免SQL注入技巧，并使用了不同的SQL执行和结果处理方法。如果你正在使用Rust编程语言，那么通过学习本教程，你将掌握基本和高级的连接和使用MySQL技巧。