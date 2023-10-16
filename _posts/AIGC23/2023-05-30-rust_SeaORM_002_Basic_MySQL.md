---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - SeaORM框架实践(基础篇)
date: 2023-05-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, SeaORM]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

SeaORM是一个基于Rust语言的ORM（对象关系映射）框架，它提供了一种简单的方式来操作SQL数据库。SeaORM的设计理念是将SQL查询和Rust代码结合在一起，从而提供更好的类型安全和代码可读性。

在本教程中，我们将介绍SeaORM的基本用法和进阶用法。我们将使用SQLite数据库来演示这些用法。

## 基础用法

在使用SeaORM之前，我们需要将其添加到我们的Rust项目中。cargo.toml添加依赖：

```toml
sea-orm = "0.11.3"
```

### 连接到数据库

在使用SeaORM之前，我们需要连接到一个数据库。我们可以使用`DatabaseConnection`结构体来完成这个任务。

```rust
use sea_orm::{DatabaseConnection, DatabaseConnectionInfo};

#[async_std::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_info = DatabaseConnectionInfo::from_env()?;
    let db_conn = DatabaseConnection::connect(&db_info).await?;
    // ...
    Ok(())
}
```

在上面的代码中，我们使用`DatabaseConnectionInfo::from_env()`方法从环境变量中获取数据库连接信息，并使用`DatabaseConnection::connect()`方法连接到数据库。

### 定义表

在SeaORM中，我们可以使用`sea_query::Table`结构体来定义表。我们可以定义表的名称、列名和列类型。

```rust
use sea_query::{ColumnDef, ColumnType, Table};

let users = Table::new("users")
    .add_column("id", ColumnType::Int(Some(11)).Unsigned(true).NotNull(true).AutoIncrement(true))
    .add_column("name", ColumnType::String(Some(256)).NotNull(true))
    .add_column("email", ColumnType::String(Some(256)).NotNull(true).Unique(true))
    .add_column("age", ColumnType::Int(Some(3)).Unsigned(true).NotNull(true))
    .set_primary_key(vec!["id"]);
```

在上面的代码中，我们定义了一个名为`users`的表，它有四个列：`id`、`name`、`email`和`age`。`id`列是自增的主键，`name`和`email`列是字符串类型，`age`列是整数类型。

### 插入数据

在SeaORM中，我们可以使用`InsertStatement`结构体来插入数据。我们可以使用`values()`方法来设置要插入的值。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection};

let user = User {
    name: "John Doe".to_owned(),
    email: "john.doe@example.com".to_owned(),
    age: 30,
};

let insert = Insert::single_into(User::table())
    .values(user.clone())
    .build();

let result = User::insert(insert).exec(&db_conn).await?;
```

在上面的代码中，我们使用`Insert::single_into()`方法和`values()`方法来设置要插入的值。我们使用`User::table()`方法来获取`User`实体的表格。最后，我们使用`User::insert()`方法和`exec()`方法来执行插入操作。

### 查询数据

在SeaORM中，我们可以使用`SelectStatement`结构体来查询数据。我们可以使用`from()`方法来设置要查询的表格，使用`column()`方法来设置要查询的列，使用`where_expr()`方法来设置查询条件。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection};

let query = Select::from_table(User::table())
    .column(User::all_columns)
    .where_expr(User::email.eq("john.doe@example.com"))
    .build();

let result = User::find_by_sql(query).one(&db_conn).await?;
```

在上面的代码中，我们使用`Select::from_table()`方法和`column()`方法来设置要查询的表格和列。我们使用`where_expr()`方法来设置查询条件。最后，我们使用`User::find_by_sql()`方法和`one()`方法来查询数据。

### 更新数据

在SeaORM中，我们可以使用`UpdateStatement`结构体来更新数据。我们可以使用`set()`方法来设置要更新的值，使用`where_expr()`方法来设置更新条件。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection};

let update = Update::table(User::table())
    .set(User::name, "Jane Doe")
    .where_expr(User::email.eq("john.doe@example.com"))
    .build();

let result = User::update(update).exec(&db_conn).await?;
```

在上面的代码中，我们使用`Update::table()`方法和`set()`方法来设置要更新的值。我们使用`where_expr()`方法来设置更新条件。最后，我们使用`User::update()`方法和`exec()`方法来执行更新操作。

### 删除数据

在SeaORM中，我们可以使用`DeleteStatement`结构体来删除数据。我们可以使用`where_expr()`方法来设置删除条件。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection};

let delete = Delete::from_table(User::table())
    .where_expr(User::email.eq("john.doe@example.com"))
    .build();

let result = User::delete(delete).exec(&db_conn).await?;
```

在上面的代码中，我们使用`Delete::from_table()`方法和`where_expr()`方法来设置删除条件。最后，我们使用`User::delete()`方法和`exec()`方法来执行删除操作。

## 进阶用法

### 关联表查询

在SeaORM中，我们可以使用`JoinType`枚举来设置关联类型。我们可以使用`JoinOn`结构体来设置关联条件。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection};

let query = Select::from_table(User::table())
    .inner_join(Post::table(), JoinOn::new(User::id, Post::user_id))
    .column((User::name, Post::title))
    .build();

let result = User::find_by_sql(query).all(&db_conn).await?;
```

在上面的代码中，我们使用`Select::from_table()`方法和`inner_join()`方法来设置关联表格。我们使用`JoinOn::new()`方法来设置关联条件。最后，我们使用`User::find_by_sql()`方法和`all()`方法来查询数据。

### 事务处理

在SeaORM中，我们可以使用`Transaction`结构体来处理事务。我们可以使用`begin()`方法来开始事务，使用`commit()`方法来提交事务，使用`rollback()`方法来回滚事务。

```rust
use sea_orm::{entity::*, query::*, DatabaseConnection, Transaction};

let tx = Transaction::new(&db_conn).await?;

let user = User {
    name: "John Doe".to_owned(),
    email: "john.doe@example.com".to_owned(),
    age: 30,
};

let insert = Insert::single_into(User::table())
    .values(user.clone())
    .build();

let result = User::insert(insert).exec(&tx).await?;

let update = Update::table(User::table())
    .set(User::name, "Jane Doe")
    .where_expr(User::email.eq("john.doe@example.com"))
    .build();

let result = User::update(update).exec(&tx).await?;

tx.commit().await?;
```

在上面的代码中，我们使用`Transaction::new()`方法来开始事务。我们使用`User::insert()`方法和`exec()`方法来插入数据，使用`User::update()`方法和`exec()`方法来更新数据。最后，我们使用`tx.commit()`方法来提交事务。

## 总结

在本教程中，我们介绍了SeaORM的基本用法和进阶用法。SeaORM提供了一种简单的方式来操作SQL数据库，它将SQL查询和Rust代码结合在一起，提供了更好的类型安全和代码可读性。通过本教程的学习，我们可以更好地理解SeaORM的使用方法，从而更好地使用它来开发Rust应用程序。
