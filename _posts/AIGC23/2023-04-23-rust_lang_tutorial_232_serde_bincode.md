---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 二进制自压缩序列化bincode模块
date: 2023-04-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, bincode]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Bincode是一个用于Rust语言的二进制编码库，用于将Rust结构体序列化为二进制格式，或者将二进制格式反序列化为Rust结构体。它支持大多数Rust原生类型和自定义类型，并且可以高效地处理大型数据结构。Bincode还支持压缩和解压缩，以减小序列化后的数据大小。

## 基础用法

### 序列化和反序列化一个简单的结构体

```rust
use bincode::{serialize, deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
    };

    // Serialize
    let encoded: Vec<u8> = serialize(&person).unwrap();

    // Deserialize
    let decoded: Person = deserialize(&encoded[..]).unwrap();

    assert_eq!(person, decoded);
}
```

在这个示例中，我们定义了一个`Person`结构体，它有一个`name`字段和一个`age`字段。我们将其序列化为一个字节数组，然后将其反序列化回`Person`结构体，并将其与原始结构体进行比较。

### 序列化和反序列化一个嵌套结构体

```rust
use bincode::{serialize, deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Address {
    street: String,
    city: String,
    zip: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
    address: Address,
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
        address: Address {
            street: "123 Main St".to_string(),
            city: "Anytown".to_string(),
            zip: "12345".to_string(),
        },
    };

    // Serialize
    let encoded: Vec<u8> = serialize(&person).unwrap();

    // Deserialize
    let decoded: Person = deserialize(&encoded[..]).unwrap();

    assert_eq!(person, decoded);
}
```

这个示例中，我们定义了一个`Person`结构体，它包含一个嵌套的`Address`结构体。我们将其序列化为一个字节数组，然后将其反序列化回`Person`结构体，并将其与原始结构体进行比较。

### 序列化和反序列化一个向量

```rust
use bincode::{serialize, deserialize};

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Serialize
    let encoded: Vec<u8> = serialize(&numbers).unwrap();

    // Deserialize
    let decoded: Vec<i32> = deserialize(&encoded[..]).unwrap();

    assert_eq!(numbers, decoded);
}
```

在这个示例中，我们定义了一个包含整数的向量。我们将其序列化为一个字节数组，然后将其反序列化回一个整数向量，并将其与原始向量进行比较。

### 序列化和反序列化一个哈希表

```rust
use std::collections::HashMap;
use bincode::{serialize, deserialize};

fn main() {
    let mut map = HashMap::new();
    map.insert("Alice", 25);
    map.insert("Bob", 30);
    map.insert("Charlie", 35);

    // Serialize
    let encoded: Vec<u8> = serialize(&map).unwrap();

    // Deserialize
    let decoded: HashMap<&str, i32> = deserialize(&encoded[..]).unwrap();

    assert_eq!(map, decoded);
}
```

在这个示例中，我们定义了一个包含键值对的哈希表。我们将其序列化为一个字节数组，然后将其反序列化回一个哈希表，并将其与原始哈希表进行比较。

### 序列化和反序列化一个枚举

```rust
use bincode::{serialize, deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    let color = Color::Green;

    // Serialize
    let encoded: Vec<u8> = serialize(&color).unwrap();

    // Deserialize
    let decoded: Color = deserialize(&encoded[..]).unwrap();

    assert_eq!(color, decoded);
}
```

在这个示例中，我们定义了一个枚举类型`Color`，它有三个可能的值。我们将其序列化为一个字节数组，然后将其反序列化回一个`Color`枚举，并将其与原始枚举进行比较。

### 序列化和反序列化一个字符串

```rust
use bincode::{serialize, deserialize};

fn main() {
    let message = "Hello, world!".to_string();

    // Serialize
    let encoded: Vec<u8> = serialize(&message).unwrap();

    // Deserialize
    let decoded: String = deserialize(&encoded[..]).unwrap();

    assert_eq!(message, decoded);
}
```

在这个示例中，我们定义了一个字符串。我们将其序列化为一个字节数组，然后将其反序列化回一个字符串，并将其与原始字符串进行比较。

### 压缩和解压缩序列化后的数据

```rust
use bincode::{serialize, deserialize, config};
use flate2::{Compression, read::DeflateEncoder, write::DeflateDecoder};

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Serialize
    let encoded: Vec<u8> = serialize(&numbers).unwrap();

    // Compress
    let mut compressed = Vec::new();
    let mut encoder = DeflateEncoder::new(&encoded[..], Compression::default());
    encoder.read_to_end(&mut compressed).unwrap();

    // Decompress
    let mut decompressed = Vec::new();
    let mut decoder = DeflateDecoder::new(&compressed[..]);
    decoder.read_to_end(&mut decompressed).unwrap();

    // Deserialize
    let decoded: Vec<i32> = deserialize(&decompressed[..]).unwrap();

    assert_eq!(numbers, decoded);
}
```

在这个示例中，我们定义了一个包含整数的向量。我们将其序列化为一个字节数组，然后将其压缩为另一个字节数组。我们将压缩后的字节数组解压缩为另一个字节数组，然后将其反序列化回一个整数向量，并将其与原始向量进行比较。

### 使用自定义配置序列化和反序列化

```rust
use bincode::{serialize_with, deserialize_from, config};
use std::io::{Cursor, Write};

#[derive(Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
    };

    // Serialize
    let mut buffer = Cursor::new(Vec::new());
    serialize_with(&mut buffer, &person, config().big_endian()).unwrap();
    let encoded = buffer.into_inner();

    // Deserialize
    let mut cursor = Cursor::new(encoded);
    let decoded: Person = deserialize_from(&mut cursor, config().big_endian()).unwrap();

    assert_eq!(person, decoded);
}
```

在这个示例中，我们定义了一个`Person`结构体，它有一个`name`字段和一个`age`字段。我们将其序列化为一个字节数组，并使用自定义配置将其编码为大端字节序。我们将编码后的字节数组反序列化回`Person`结构体，并使用相同的自定义配置来解码它。

## 进阶用法

### 自定义序列化和反序列化

```rust
use bincode::{serialize, deserialize, Error, ErrorKind};
use std::io::{Cursor, Write, Read};

#[derive(Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
}

impl Person {
    fn serialize<W: Write>(&self, writer: &mut W) -> Result<(), Error> {
        let name_bytes = self.name.as_bytes();
        if name_bytes.len() > 255 {
            return Err(Error::new(ErrorKind::Custom("name too long".to_string())));
        }
        writer.write_all(&(name_bytes.len() as u8).to_le_bytes())?;
        writer.write_all(name_bytes)?;
        writer.write_all(&self.age.to_le_bytes())?;
        Ok(())
    }

    fn deserialize<R: Read>(reader: &mut R) -> Result<Self, Error> {
        let mut name_len_bytes = [0; 1];
        reader.read_exact(&mut name_len_bytes)?;
        let name_len = name_len_bytes[0] as usize;
        let mut name_bytes = vec![0; name_len];
        reader.read_exact(&mut name_bytes)?;
        let name = String::from_utf8(name_bytes)?;
        let mut age_bytes = [0; 1];
        reader.read_exact(&mut age_bytes)?;
        let age = age_bytes[0];
        Ok(Person { name, age })
    }
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
    };

    // Serialize
    let mut buffer = Cursor::new(Vec::new());
    person.serialize(&mut buffer).unwrap();
    let encoded = buffer.into_inner();

    // Deserialize
    let mut cursor = Cursor::new(encoded);
    let decoded: Person = Person::deserialize(&mut cursor).unwrap();

    assert_eq!(person, decoded);
}
```

在这个示例中，我们定义了一个`Person`结构体，并实现了自定义的序列化和反序列化方法。在序列化方法中，我们将名称长度编码为一个字节，然后将名称和年龄编码为字节数组。在反序列化方法中，我们首先读取名称长度字节，然后读取名称和年龄字节，并将它们解码为一个`Person`结构体。

### 自定义大小端序列化和反序列化

```rust
use bincode::{serialize, deserialize, Error, ErrorKind};
use std::io::{Cursor, Write, Read};

#[derive(Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
}

impl Person {
    fn serialize<W: Write>(&self, writer: &mut W, big_endian: bool) -> Result<(), Error> {
        let name_bytes = self.name.as_bytes();
        if name_bytes.len() > 255 {
            return Err(Error::new(ErrorKind::Custom("name too long".to_string())));
        }
        let mut name_len_bytes = [0; 1];
        name_len_bytes[0] = name_bytes.len() as u8;
        if big_endian {
            writer.write_all(&name_len_bytes[..].reverse())?;
        } else {
            writer.write_all(&name_len_bytes[..])?;
        }
        writer.write_all(name_bytes)?;
        writer.write_all(&self.age.to_le_bytes())?;
        Ok(())
    }

    fn deserialize<R: Read>(reader: &mut R, big_endian: bool) -> Result<Self, Error> {
        let mut name_len_bytes = [0; 1];
        reader.read_exact(&mut name_len_bytes)?;
        let name_len = if big_endian {
            u8::from_be_bytes(name_len_bytes)
        } else {
            u8::from_le_bytes(name_len_bytes)
        } as usize;
        let mut name_bytes = vec![0; name_len];
        reader.read_exact(&mut name_bytes)?;
        let name = String::from_utf8(name_bytes)?;
        let mut age_bytes = [0; 1];
        reader.read_exact(&mut age_bytes)?;
        let age = age_bytes[0];
        Ok(Person { name, age })
    }
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
    };

    // Serialize
    let mut buffer = Cursor::new(Vec::new());
    person.serialize(&mut buffer, true).unwrap();
    let encoded = buffer.into_inner();

    // Deserialize
    let mut cursor = Cursor::new(encoded);
    let decoded: Person = Person::deserialize(&mut cursor, true).unwrap();

    assert_eq!(person, decoded);
}
```

在这个示例中，我们定义了一个`Person`结构体，并实现了自定义的大小端序列化和反序列化方法。在序列化方法中，我们将名称长度编码为一个字节，并根据`big_endian`参数决定字节序。在反序列化方法中，我们首先读取名称长度字节，并根据`big_endian`参数解码字节序。然后，我们读取名称和年龄字节，并将它们解码为一个`Person`结构体。

### 序列化和反序列化一个动态数组

```rust
use bincode::{serialize, deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let people = vec![
        Person {
            name: "Alice".to_string(),
            age: 25,
        },
        Person {
            name: "Bob".to_string(),
            age: 30,
        },
        Person {
            name: "Charlie".to_string(),
            age: 35,
        },
    ];

    // Serialize
    let encoded: Vec<u8> = serialize(&people).unwrap();

    // Deserialize
    let decoded: Vec<Person> = deserialize(&encoded[..]).unwrap();

    assert_eq!(people, decoded);
}
```

在这个示例中，我们定义了一个包含`Person`结构体的动态数组。我们将其序列化为一个字节数组，然后将其反序列化回一个`Person`结构体的动态数组，并将其与原始数组进行比较。

### 序列化和反序列化一个结构体的子集

```rust
use bincode::{serialize, deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Person {
    name: String,
    age: u8,
    address: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct PersonSubset {
    name: String,
    age: u8,
}

fn main() {
    let person = Person {
        name: "Alice".to_string(),
        age: 25,
        address: "123 Main St".to_string(),
    };

    // Serialize subset
    let encoded: Vec<u8> = serialize(&PersonSubset {
        name: person.name.clone(),
        age: person.age,
    })
    .unwrap();

    // Deserialize subset
    let decoded: PersonSubset = deserialize(&encoded[..]).unwrap();

    assert_eq!(
        decoded,
        PersonSubset {
            name: "Alice".to_string(),
            age: 25
        }
    );

    // Deserialize full struct from subset bytes
    let decoded_full: Person = deserialize(&encoded[..]).unwrap();
    assert_eq!(
        decoded_full,
        Person {
            name: "Alice".to_string(),
            age: 25,
            address: "".to_string()
        }
    );

    // Serialize full struct to subset bytes
    let encoded_subset: Vec<u8> = serialize(&PersonSubset {
        name: person.name.clone(),
        age: person.age,
    })
    .unwrap();
    assert_eq!(encoded, encoded_subset);
}
```

在这个示例中，我们定义了一个`Person`结构体，它有一个`name`字段、一个`age`字段和一个`address`字段。我们将其序列化为一个字节数组，然后将其反序列化回一个`PersonSubset`结构体的字节数组，该结构体只包含`name`和`age`字段。我们还演示了如何从子集字节数组反序列化回完整的结构体，以及如何将完整的结构体序列化为子集字节数组。

### 使用自定义配置

在某些情况下，您可能需要使用自定义配置来序列化和反序列化数据。例如，您可能需要使用大端字节序而不是默认的小端字节序。您可以使用`bincode::config()`函数创建一个默认配置，然后使用`bincode::serialize_with()`和`bincode::deserialize_from()`函数序列化和反序列化数据。例如：

```rust
use bincode::{serialize_with, deserialize_from, config};
use std::io::{Cursor, Write};

let person = Person {
    name: "Alice".to_string(),
    age: 25,
};

// Serialize with big endian byte order
let mut buffer = Cursor::new(Vec::new());
serialize_with(&mut buffer, &person, config().big_endian()).unwrap();
let encoded = buffer.into_inner();

// Deserialize with big endian byte order
let mut cursor = Cursor::new(encoded);
let decoded: Person = deserialize_from(&mut cursor, config().big_endian()).unwrap();
```

### 优化序列化和反序列化性能

为了优化序列化和反序列化性能，可以使用`bincode::config`模块中的`DefaultOptions`和`Options`结构体，调整序列化和反序列化的选项。以下是一个优化性能的示例：

```rust
use bincode::{serialize_with_options, deserialize_with_options, DefaultOptions};

// 优化性能
let mut options = DefaultOptions::new();
options.limit = bincode::Bounded(1024); // 限制序列化和反序列化的最大字节数
let data = vec![0; 1024 * 1024 * 1024]; // 1GB数据

// 序列化大数据量
let encoded: Vec<u8> = serialize_with_options(&data, options).unwrap();

// 反序列化大数据量
let decoded: Vec<u8> = deserialize_with_options(&encoded[..], options).unwrap();
```

### 处理序列化和反序列化错误

在序列化和反序列化过程中，可能会出现错误。为了处理这些错误，可以使用`Result`类型和`bincode::Error`枚举类型。以下是一个处理错误的示例：

```rust
use bincode::{serialize, deserialize, Error};

// 处理错误
let num = "abc";
let encoded: Result<Vec<u8>, Error> = serialize(&num);
match encoded {
    Ok(v) => println!("Encoded: {:?}", v),
    Err(e) => println!("Error: {:?}", e),
}

let encoded = vec![1, 2, 3];
let decoded: Result<String, Error> = deserialize(&encoded[..]);
match decoded {
    Ok(v) => println!("Decoded: {:?}", v),
    Err(e) => println!("Error: {:?}", e),
}
```

## 总结

Bincode是Rust语言中的一个二进制编码库，可以将Rust的数据结构序列化为二进制格式，以便于存储和传输。使用Bincode可以方便地将数据序列化为二进制格式，也可以反序列化二进制数据为Rust数据结构。Bincode支持大部分Rust的数据类型，包括基本类型、结构体、枚举、数组、元组等。在序列化和反序列化过程中，Bincode会自动进行类型检查和字节对齐，保证数据的正确性和兼容性。同时，Bincode还支持自定义序列化和反序列化方法，以满足特殊需求。为了优化序列化和反序列化性能，可以使用`bincode::config`模块中的`DefaultOptions`和`Options`结构体，调整序列化和反序列化的选项。在序列化和反序列化过程中，可能会出现错误，可以使用`Result`类型和`bincode::Error`枚举类型来处理这些错误。