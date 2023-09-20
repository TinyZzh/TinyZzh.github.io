---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - SeaORM框架实战(数据库DML篇)
date: 2023-05-30 00:00: +0800
categories: [Rust]
tags: [Rust, 从入门到精通, SeaORM]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

SeaORM是一个Rust语言的ORM框架，提供了简单易用的API，可以帮助我们轻松地操作数据库。SeaORM支持多种数据库，包括MySQL、PostgreSQL、SQLite等等。

在本教程中，我们将以Animal实体为例，介绍SeaORM的基本用法，包括创建表、增删改查等操作。

## 准备工作

在MySQL中创建一个名为`animals`的数据库，并在其中创建一个名为`animal`的表，用于存储动物的信息。表结构如下：

```sql
CREATE TABLE `animal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `species` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 定义 `Entity`

在SeaORM中，我们可以通过定义实体来操作数据库。实体通常对应着数据库中的一张表。在本例中，我们需要创建一个Animal实体，对应着animal表。

首先，我们需要在Cargo.toml中添加SeaORM和MySQL驱动程序的依赖：

```toml
[dependencies]
sea-orm = "0.11.3"
```

然后，在src目录下创建一个名为`animal.rs`的文件，定义Animal实体：

```rust
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "animal")]
pub struct Animal {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub age: i32,
    pub species: String,
}
```

这里我们使用了`derive`宏来自动生成Animal实体的代码。其中，`#[sea_orm(table_name = "animal")]`表示Animal实体对应的表名为`animal`；`#[sea_orm(primary_key)]`表示id字段为主键。

有了Animal实体之后，我们就可以使用SeaORM提供的API来操作数据库了。下面分别介绍如何进行增删改查操作。

### 增加记录

要增加一条记录，我们可以使用`Animal::insert()`方法。例如，要添加一只名为“Tom”的2岁猫，可以这样写：

```rust
use sea_orm::{Database, EntityTrait, FromQueryResult};

let database_url = "mysql://root:password@localhost:3306/animals";
let db = Database::connect(database_url).await.unwrap();

let animal = Animal {
    id: 0,
    name: "Tom".to_owned(),
    age: 2,
    species: "cat".to_owned(),
};

let inserted_animal = Animal::insert(&animal).exec(&db).await.unwrap();
```

这里我们首先连接到了名为`animals`的MySQL数据库，然后创建了一只名为“Tom”的2岁猫，使用`Animal::insert()`方法将其插入到数据库中，最后返回插入的记录。

### 删除记录

要删除一条记录，我们可以使用`Animal::delete()`方法。例如，要删除id为1的记录，可以这样写：

```rust
use sea_orm::{Database, EntityTrait, FromQueryResult};

let database_url = "mysql://root:password@localhost:3306/animals";
let db = Database::connect(database_url).await.unwrap();

let deleted_animal = Animal::delete()
    .filter(animal::Column::Id.eq(1))
    .exec(&db)
    .await
    .unwrap();
```

这里我们使用`Animal::delete()`方法删除了id为1的记录，使用`filter()`方法指定了要删除的记录，最后返回删除的记录。

### 更新记录

要更新一条记录，我们可以使用`Animal::update()`方法。例如，要将id为1的记录的年龄改为3岁，可以这样写：

```rust
use sea_orm::{Database, EntityTrait, FromQueryResult};

let database_url = "mysql://root:password@localhost:3306/animals";
let db = Database::connect(database_url).await.unwrap();

let updated_animal = Animal::update()
    .set(animal::Column::Age, 3)
    .filter(animal::Column::Id.eq(1))
    .exec(&db)
    .await
    .unwrap();
```

这里我们使用`Animal::update()`方法更新了id为1的记录，使用`set()`方法指定了要更新的字段，最后返回更新后的记录。

### 查询记录

要查询记录，我们可以使用`Animal::find()`方法。例如，要查询所有名字为“Tom”的动物，可以这样写：

```rust
use sea_orm::{Database, EntityTrait, FromQueryResult};

let database_url = "mysql://root:password@localhost:3306/animals";
let db = Database::connect(database_url).await.unwrap();

let animals = Animal::find()
    .filter(animal::Column::Name.eq("Tom"))
    .all(&db)
    .await
    .unwrap();
```

这里我们使用`Animal::find()`方法查询了所有名字为“Tom”的动物，使用`filter()`方法指定了查询条件，最后返回查询结果。

### 联表查询

除了基本的增删改查操作之外，SeaORM还支持联表查询。例如，我们可以查询每个物种的平均年龄：

```rust
use sea_orm::{Database, EntityTrait, FromQueryResult};

let database_url = "mysql://root:password@localhost:3306/animals";
let db = Database::connect(database_url).await.unwrap();

let avg_age_by_species = Animal::find()
    .group_by(animal::Column::Species)
    .select((animal::Column::Species, Avg(animal::Column::Age)))
    .all(&db)
    .await
    .unwrap();
```

这里我们使用`Animal::find()`方法查询了所有动物的信息，使用`group_by()`方法指定了分组条件，使用`select()`方法指定了要查询的字段和聚合函数，最后返回查询结果。

## 总结

本教程介绍了SeaORM的基本用法，包括创建实体、增删改查等操作。SeaORM提供了简单易用的API，可以帮助我们轻松地操作数据库。同时，SeaORM还支持多种数据库，包括MySQL、PostgreSQL、SQLite等等。

在实际开发中，我们可以根据需要选择不同的数据库和ORM框架。SeaORM是一个不错的选择，它提供了很多有用的功能，可以帮助我们更加高效地开发应用程序。