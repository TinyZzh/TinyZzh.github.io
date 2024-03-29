---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 使用prost库操作Protobuf
date: 2023-03-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, prost, protobuf]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Prost 是一个用于序列化和反序列化协议缓冲区数据的 Rust 语言库。它使用[Google Protocol Buffers](https://protobuf.dev/)语言来定义协议，并生成 Rust 代码以便使用该协议。 Prost 具有高性能的特点，并且支持许多 protobuf 功能，例如嵌套消息、默认值、枚举类型以及变长编码。

Prost 支持从 protobuf2 和 protobuf3 生成代码，而且可以与其他 Rust 语言库和框架无缝集成。

## 模块场景和基础用法

Prost 可以用于许多场景，包括网络通信、持久化、日志记录等。在这里，我们将通过一个简单的例子来介绍 Prost 的基础用法。

首先在`Cargo.toml`中引入 prost 模块，示例配置如下：

```toml
[dependencies]
prost = "0.11"
# Only necessary if using Protobuf well-known types:
prost-types = "0.11"
```

假设我们有一个动物园，里面有许多不同种类的动物。我们可以使用 Prost 来定义一个动物的协议，然后使用该协议来序列化和反序列化动物对象。

首先，我们需要定义动物的 protobuf 文件。在这里，我们定义了一个动物具有名称、年龄和类型。动物类型是一个枚举类型，它可以是狗、猫或鸟。

```protobuf
syntax = "proto3";

enum AnimalType {
    DOG = 0;
    CAT = 1;
    BIRD = 2;
}

message Animal {
    string name = 1;
    uint32 age = 2;
    AnimalType animal_type = 3;
}
```

接下来，我们需要使用 Prost 生成 Rust 代码。我们可以使用以下命令来执行此操作：

```bash
$ protoc --rust_out . animals.proto
```

这将生成一个名为`animals.rs`的文件，其中包含与 protobuf 定义相对应的 Rust 代码。

接下来，我们可以使用 Prost 来序列化和反序列化动物对象。以下是一个示例代码：

```rust
use prost::{Enumeration, Message};

#[derive(Clone, PartialEq, Message)]
pub struct Animal {
    #[prost(string, tag="1")]
    pub name: String,
    #[prost(uint32, tag="2")]
    pub age: u32,
    #[prost(enumeration="AnimalType", tag="3")]
    pub animal_type: i32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Enumeration)]
pub enum AnimalType {
    Dog = 0,
    Cat = 1,
    Bird = 2,
}

fn main() {
    let mut animal = Animal::default();
    animal.name = "Tom".to_string();
    animal.age = 3;
    animal.animal_type = AnimalType::Cat as i32;

    let mut buf = Vec::new();
    animal.encode(&mut buf).unwrap();

    let decoded_animal = Animal::decode(&buf[..]).unwrap();
    assert_eq!(animal, decoded_animal);
    println!("{:?}", animal);
}
//  输出结果：
//  Animal { name: "Tom", age: 3, animal_type: Cat }
```

在这个示例代码中，我们定义了一个名为`Animal`的结构体，并使用`prost`宏将其与 protobuf 定义相关联。我们还定义了一个名为`AnimalType`的枚举类型，它与 protobuf 定义中的枚举类型相对应。

在`main`函数中，我们创建了一个`Animal`对象，并将其序列化为字节数组。然后，我们将字节数组反序列化为另一个`Animal`对象，并使用`assert_eq`宏比较这两个对象是否相等。

## 高级特性

Prost 提供了许多高级特性，例如自定义类型、扩展字段、oneof 等。在这里，我们将介绍其中一些特性。

### 自定义类型

有时，我们可能需要在 protobuf 定义中使用自定义类型。例如，我们可能需要使用自定义类型来表示日期或时间。在这种情况下，我们可以使用`prost`宏的`bytes`属性来定义自定义类型。

以下是一个示例代码：

```protobuf
syntax = "proto3";

message Date {
    bytes value = 1 [(prost(bytes_type) = "chrono::NaiveDate")];
}

message Time {
    bytes value = 1 [(prost(bytes_type) = "chrono::NaiveTime")];
}
```

在这个示例代码中，我们定义了两个消息类型：`Date`和`Time`。它们都包含一个名为`value`的字节数组字段，并使用`prost`宏的`bytes_type`属性将其与`chrono`库中的`NaiveDate`和`NaiveTime`类型相关联。

### 自定义编解码

Prost 支持自定义编解码，可以使用 prost::Message trait 来实现自定义编解码。

```rust
impl Animal {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, prost::DecodeError> {
        Animal::decode(bytes)
    }

    pub fn to_bytes(&self) -> Result<Vec<u8>, prost::EncodeError> {
        let mut buf = Vec::new();
        self.encode(&mut buf)?;
        Ok(buf)
    }
}
fn main() {
    let mut animal = Animal::default();
    animal.name = "Tom".to_string();
    animal.age = 3;
    animal.animal_type = AnimalType::Cat as i32;

    let bytes = animal.to_bytes();
    println!("{:?}", Animal::from_bytes(&bytes.unwrap()));
}
//  输出结果:
// Ok(Animal { name: "Tom", age: 3, animal_type: Cat })
```

### 扩展字段

有时，我们可能需要向 protobuf 消息添加额外的字段，但是又不想破坏现有的消息格式。在这种情况下，我们可以使用扩展字段。

扩展字段是在 protobuf 定义中定义的，但是在生成的 Rust 代码中不会出现。它们可以用来存储任何类型的数据，并且可以与 protobuf 消息一起序列化和反序列化。

以下是一个示例代码：

```protobuf
syntax = "proto3";

message Animal {
    string name = 1;
    uint32 age = 2;
    AnimalType animal_type = 3;

    map<string, bytes> extensions = 1000;
}
```

在这个示例代码中，我们添加了一个名为`extensions`的字段，它是一个`map`类型，可以存储任何类型的数据。此字段的标签为 1000，这意味着它是一个扩展字段。

在 Rust 代码中，我们可以使用`prost::Message` trait 的`extensions`方法来访问扩展字段。以下是一个示例代码：

```rust
use prost::{Enumeration, Message};
use std::collections::HashMap;

#[derive(Clone, PartialEq, Message)]
pub struct Animal {
    #[prost(string, tag="1")]
    pub name: String,
    #[prost(uint32, tag="2")]
    pub age: u32,
    #[prost(enumeration="AnimalType", tag="3")]
    pub animal_type: i32,
    #[prost(map="string, bytes", tag="1000")]
    pub extensions: HashMap<String, Vec<u8>>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Enumeration)]
pub enum AnimalType {
    Dog = 0,
    Cat = 1,
    Bird = 2,
}

fn main() {
    let mut animal = Animal::default();
    animal.extensions.insert("color".to_string(), b"brown".to_vec());

    let mut buf = Vec::new();
    animal.encode(&mut buf).unwrap();

    let decoded_animal = Animal::decode(&buf[..]).unwrap();
    assert_eq!(animal.extensions, decoded_animal.extensions);
}
```

在这个示例代码中，我们创建了一个`Animal`对象，并向其添加了一个名为`color`的扩展字段。然后，我们将该对象序列化为字节数组，并将其反序列化为另一个`Animal`对象。最后，我们使用`assert_eq`宏比较这两个对象的扩展字段是否相等。

### Proto Oneof

有时，我们可能需要在 protobuf 消息中使用`oneof`语法，以表示字段中的多个可能类型。在这种情况下，我们可以使用`prost`宏的`oneof`属性来定义`oneof`字段。

以下是一个示例代码：

```protobuf
syntax = "proto3";

message Animal {
    string name = 1;
    uint32 age = 2;
    oneof animal_type {
        Dog dog = 3;
        Cat cat = 4;
        Bird bird = 5;
    }
}
message Dog {
    string breed = 1;
}
message Cat {
    bool has_tail = 1;
}
message Bird {
    uint32 wingspan = 1;
}
```

在这个示例代码中，我们定义了一个名为`Animal`的消息类型，它包含一个名为`animal_type`的`oneof`字段。`oneof`字段中包含三个可能的类型：`Dog`、`Cat`和`Bird`。每个类型都包含与其相关联的字段。

在 Rust 代码中，我们可以使用`prost::Oneof` trait 来访问`oneof`字段。以下是一个示例代码：

```rust
use prost::{Enumeration, Message, Oneof};
use std::collections::HashMap;
use core::option::Option;

#[derive(Clone, PartialEq, Message)]
pub struct Animal {
    #[prost(string, tag="1")]
    pub name: String,
    #[prost(uint32, tag="2")]
    pub age: u32,
    #[prost(oneof="AnimalType", tag="3,4,5")]
    pub animal_type: Option<AnimalType>,
}
#[derive(Clone, Debug, PartialEq, Enumeration)]
pub enum AnimalType {
    #[prost(message, tag = "3", name = "Dog")]
    Dog(Dog),
    #[prost(message, tag = "4", name = "Cat")]
    Cat(Cat),
    #[prost(message, tag = "5", name = "Bird")]
    Bird(Bird),
}
#[derive(Clone, PartialEq, Message)]
pub struct Dog {
    #[prost(string, tag="1")]
    pub breed: String
}
#[derive(Clone, PartialEq, Message)]
pub struct Cat {
    #[prost(bool, tag="1")]
    pub has_tail: bool
}
#[derive(Clone, PartialEq, Message)]
pub struct Bird {
    #[prost(uint32, tag="1")]
    pub wingspan: u32
}
fn main() {
    let mut animal = Animal::default();
    animal.name = "Tom".to_string();
    animal.age = 3;
    animal.animal_type = Some(AnimalType::Cat(Cat { has_tail: true }));

    let mut buf = Vec::new();
    animal.encode(&mut buf).unwrap();

    let decoded_animal = Animal::decode(&buf[..]).unwrap();
    assert_eq!(animal, decoded_animal);
}
```

在这个示例代码中，我们创建了一个`Animal`对象，并将其`cat`字段设置为一个包含`has_tail`字段的`Cat`对象。然后，我们将该对象序列化为字节数组，并将其反序列化为另一个`Animal`对象。最后，我们使用`assert_eq`宏比较这两个对象是否相等。

##

## prost 最佳实践

以下是一些使用 Prost 的最佳实践经验：

- 在 protobuf 定义中使用简单的数据类型。Prost 支持许多 protobuf 功能，例如嵌套消息、默认值、枚举类型以及变长编码。但是，使用这些功能可能会导致生成的 Rust 代码变得复杂。因此，为了使代码保持简单和易于维护，请尽可能使用简单的数据类型。
- 在 Rust 代码中使用结构体。Prost 生成的 Rust 代码可以是一个模块或一个 trait。但是，使用结构体可以使代码更易于使用和维护。因此，建议在 Rust 代码中使用结构体。
- 使用自定义类型时，请使用标准库或第三方库。Prost 支持许多自定义类型，包括日期、时间、UUID 等。但是，使用标准库或第三方库可能会使代码更加通用和可移植。因此，建议在使用自定义类型时使用标准库或第三方库。
- 在使用扩展字段时，请注意字段标签。扩展字段的标签必须大于 1000。因此，请确保您为扩展字段选择一个大于 1000 的标签。
- 在使用`oneof`语法时，请选择一个好的字段名称。`oneof`字段包含多个可能的类型，因此请为其选择一个好的字段名称。这将使代码更易于理解和维护。

## 总结

Prost 是一个高性能的 Rust 语言库，可用于序列化和反序列化协议缓冲区数据。它支持许多 protobuf 功能，并且可以与其他 Rust 语言库和框架无缝集成。在本教程中，我们介绍了 Prost 的基础用法和一些高级特性，并提供了一些最佳实践经验。我们希望这个教程能够帮助您更好地使用 Prost。
