---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Serde序列化/反序列化模块入门指北
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, deref]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Serde是一个用于序列化和反序列化Rust数据结构的库。它支持JSON、BSON、YAML等多种格式，并且可以自定义序列化和反序列化方式。Serde的特点是代码简洁、易于使用、性能高效。它是Rust生态中最受欢迎的序列化库之一。

## 基础用法

### 安装

在Rust项目中使用Serde，需要在`Cargo.toml`文件中添加如下依赖：

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
```

其中`features = ["derive"]`表示使用Serde的派生宏，可以自动生成序列化和反序列化代码。

### 序列化

使用Serde进行序列化，需要先将数据结构实现`serde::Serialize` trait。例如，我们定义一个`Animal`结构体，包含名称和年龄两个字段：

```rust
#[derive(Serialize)]
struct Animal {
    name: String,
    age: u32,
}
```

然后，我们可以使用`serde_json`库将`Animal`结构体序列化为JSON字符串：

```rust
use serde_json;

let animal = Animal {
    name: "Tom".to_owned(),
    age: 3,
};
let json = serde_json::to_string(&animal).unwrap();
println!("{}", json); // {"name":"Tom","age":3}
```

### 反序列化

使用Serde进行反序列化，需要先将数据结构实现`serde::Deserialize` trait。例如，我们定义一个`Animal`结构体，包含名称和年龄两个字段：

```rust
#[derive(Deserialize)]
struct Animal {
    name: String,
    age: u32,
}
```

然后，我们可以使用`serde_json`库将JSON字符串反序列化为`Animal`结构体：

```rust
use serde_json;

let json = r#"{"name":"Tom","age":3}"#;
let animal: Animal = serde_json::from_str(json).unwrap();
println!("{:?}", animal); // Animal { name: "Tom", age: 3 }
```

## 进阶用法

### 自定义序列化和反序列化

如果默认的序列化和反序列化方式无法满足需求，可以自定义序列化和反序列化方式。例如，我们定义一个`Animal`结构体，包含名称和年龄两个字段，但是希望在序列化时，将名称转换为大写字母，反序列化时，将名称转换为小写字母：

```rust
use serde::{Serialize, Deserialize, Serializer, Deserializer};

#[derive(Serialize, Deserialize)]
struct Animal {
    #[serde(serialize_with = "serialize_name", deserialize_with = "deserialize_name")]
    name: String,
    age: u32,
}

fn serialize_name<S>(name: &String, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&name.to_uppercase())
}

fn deserialize_name<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let name = String::deserialize(deserializer)?;
    Ok(name.to_lowercase())
}
```

在`Animal`结构体中，我们使用`#[serde(serialize_with = "serialize_name", deserialize_with = "deserialize_name")]`指定了自定义的序列化和反序列化方法。`serialize_name`函数将名称转换为大写字母，`deserialize_name`函数将名称转换为小写字母。

### 序列化和反序列化枚举

Serde支持序列化和反序列化枚举类型。例如，我们定义一个`Animal`枚举，包含狗和猫两种类型：

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
enum Animal {
    Dog { name: String, age: u32 },
    Cat { name: String, age: u32 },
}
```

在序列化和反序列化枚举类型时，需要使用`#[serde(tag = "type")]`指定枚举类型的标签，例如：

```rust
use serde_json;

let dog = Animal::Dog { name: "Tom".to_owned(), age: 3 };
let json = serde_json::to_string(&dog).unwrap();
println!("{}", json); // {"type":"Dog","name":"Tom","age":3}

let json = r#"{"type":"Dog","name":"Tom","age":3}"#;
let dog: Animal = serde_json::from_str(json).unwrap();
println!("{:?}", dog); // Dog { name: "Tom", age: 3 }
```

### 序列化和反序列化结构体中的Option

Serde支持序列化和反序列化结构体中的`Option`类型。例如，我们定义一个`Animal`结构体，包含名称和年龄两个字段，其中名称可以为空：

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Animal {
    name: Option<String>,
    age: u32,
}
```

在序列化和反序列化结构体中的`Option`类型时，需要使用`#[serde(skip_serializing_if = "Option::is_none")]`指定当`Option`值为`None`时，不进行序列化。例如：

```rust
use serde_json;

let animal = Animal { name: Some("Tom".to_owned()), age: 3 };
let json = serde_json::to_string(&animal).unwrap();
println!("{}", json); // {"name":"Tom","age":3}

let animal = Animal { name: None, age: 3 };
let json = serde_json::to_string(&animal).unwrap();
println!("{}", json); // {"age":3}

let json = r#"{"age":3}"#;
let animal: Animal = serde_json::from_str(json).unwrap();
println!("{:?}", animal); // Animal { name: None, age: 3 }
```

### 序列化和反序列化结构体中的Vec

Serde支持序列化和反序列化结构体中的`Vec`类型。例如，我们定义一个`Zoo`结构体，包含多个`Animal`：

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Zoo {
    animals: Vec<Animal>,
}
```

在序列化和反序列化结构体中的`Vec`类型时，Serde会自动处理序列化和反序列化。例如：

```rust
use serde_json;

let zoo = Zoo { animals: vec![
    Animal { name: "Tom".to_owned(), age: 3 },
    Animal { name: "Jerry".to_owned(), age: 2 },
] };
let json = serde_json::to_string(&zoo).unwrap();
println!("{}", json); // {"animals":[{"name":"Tom","age":3},{"name":"Jerry","age":2}]}

let json = r#"{"animals":[{"name":"Tom","age":3},{"name":"Jerry","age":2}]}"#;
let zoo: Zoo = serde_json::from_str(json).unwrap();
println!("{:?}", zoo); // Zoo { animals: [Animal { name: "Tom", age: 3 }, Animal { name: "Jerry", age: 2 }] }
```

### 序列化和反序列化结构体中的HashMap

Serde支持序列化和反序列化结构体中的`HashMap`类型。例如，我们定义一个`Zoo`结构体，包含多个`Animal`，使用`HashMap`存储：

```rust
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Zoo {
    animals: HashMap<String, Animal>,
}
```

在序列化和反序列化结构体中的`HashMap`类型时，Serde会自动处理序列化和反序列化。例如：

```rust
use serde_json;

let mut animals = HashMap::new();
animals.insert("Tom".to_owned(), Animal { name: "Tom".to_owned(), age: 3 });
animals.insert("Jerry".to_owned(), Animal { name: "Jerry".to_owned(), age: 2 });
let zoo = Zoo { animals };
let json = serde_json::to_string(&zoo).unwrap();
println!("{}", json); // {"animals":{"Jerry":{"name":"Jerry","age":2},"Tom":{"name":"Tom","age":3}}}

let json = r#"{"animals":{"Jerry":{"name":"Jerry","age":2},"Tom":{"name":"Tom","age":3}}}"#;
let zoo: Zoo = serde_json::from_str(json).unwrap();
println!("{:?}", zoo); // Zoo { animals: {"Tom": Animal { name: "Tom", age: 3 }, "Jerry": Animal { name: "Jerry", age: 2 }} }
```

## 总结

本教程介绍了如何使用Serde进行序列化和反序列化，并且介绍了如何自定义序列化和反序列化逻辑。使用Serde可以轻松地将Rust数据结构转换为任何格式，并且可以通过自定义序列化和反序列化逻辑实现更高级的功能。