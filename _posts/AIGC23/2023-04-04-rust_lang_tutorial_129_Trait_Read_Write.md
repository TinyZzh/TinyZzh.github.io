---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Read和Write特征
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Read, Write]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 是一种系统级编程语言，它的设计目标是提供安全、并发和高性能的编程体验。Rust 的特点在于其内存安全性和线程安全性，它采用了一些创新性的技术，如所有权系统和生命周期，来解决 C 和 C++中常见的内存安全问题和数据竞争问题。

在 Rust 中，读写文件是一项非常常见的任务。本教程将介绍如何在 Rust 中读写文件，包括基础用法和进阶用法。

## 基础用法

### 读取文件内容

使用`std::fs::File`和`std::io::Read`模块可以读取文件内容。首先，我们需要打开一个文件，然后读取其内容。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() {
    let mut file = File::open("file.txt").expect("file not found");
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("something went wrong reading the file");
    println!("The contents of the file are:\n{}", contents);
}
```

在这个例子中，我们首先打开了一个名为`file.txt`的文件，并将其存储在`file`变量中。接下来，我们创建了一个空字符串`contents`，并使用`read_to_string`方法将文件的内容读取到其中。最后，我们打印出了读取到的内容。

### 写入文件内容

使用`std::fs::File`和`std::io::Write`模块可以写入文件内容。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() {
    let mut file = File::create("file.txt").expect("file not found");
    file.write_all(b"Hello, world!").expect("something went wrong writing the file");
}
```

在这个例子中，我们首先创建了一个名为`file.txt`的文件，并将其存储在`file`变量中。接下来，我们使用`write_all`方法将字符串`Hello, world!`写入到文件中。

### 逐行读取文件内容

使用`std::fs::File`和`std::io::BufRead`模块可以逐行读取文件内容。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::{BufRead, BufReader};

fn main() {
    let file = File::open("file.txt").expect("file not found");
    let reader = BufReader::new(file);
    for line in reader.lines() {
        println!("{}", line.expect("unable to read line"));
    }
}
```

在这个例子中，我们首先打开了一个名为`file.txt`的文件，并将其存储在`file`变量中。接下来，我们创建了一个`BufReader`，并使用`lines`方法逐行读取文件内容。最后，我们打印出了每一行的内容。

### 追加文件内容

使用`std::fs::OpenOptions`和`std::io::Write`模块可以追加文件内容。以下是一个简单的示例：

```rust
use std::fs::{File, OpenOptions};
use std::io::prelude::*;

fn main() {
    let mut file = OpenOptions::new()
        .write(true)
        .append(true)
        .open("file.txt")
        .expect("file not found");
    file.write_all(b"Hello, world!").expect("something went wrong writing the file");
}
```

在这个例子中，我们首先打开了一个名为`file.txt`的文件，并将其存储在`file`变量中。接下来，我们使用`OpenOptions`创建了一个选项，使得我们可以写入文件并追加内容。最后，我们使用`write_all`方法将字符串`Hello, world!`写入到文件中。

### 读取二进制文件内容

使用`std::fs::File`和`std::io::Read`模块可以读取二进制文件内容。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() {
    let mut file = File::open("file.bin").expect("file not found");
    let mut buffer = [0; 5];
    file.read_exact(&mut buffer).expect("something went wrong reading the file");
    println!("{:?}", buffer);
}
```

在这个例子中，我们首先打开了一个名为`file.bin`的二进制文件，并将其存储在`file`变量中。接下来，我们创建了一个长度为 5 的空字节数组`buffer`，并使用`read_exact`方法将文件的前 5 个字节读取到其中。最后，我们打印出了读取到的字节数组。

### 写入二进制文件内容

使用`std::fs::File`和`std::io::Write`模块可以写入二进制文件内容。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() {
    let mut file = File::create("file.bin").expect("file not found");
    file.write_all(&[0x48, 0x65, 0x6c, 0x6c, 0x6f]).expect("something went wrong writing the file");
}
```

在这个例子中，我们首先创建了一个名为`file.bin`的二进制文件，并将其存储在`file`变量中。接下来，我们使用`write_all`方法将字节数组`[0x48, 0x65, 0x6c, 0x6c, 0x6f]`写入到文件中。

### 读取 CSV 文件内容

使用`csv`和`std::fs::File`模块可以读取 CSV 文件内容。以下是一个简单的示例：

```rust
use std::error::Error;
use std::fs::File;
use std::io::prelude::*;
use csv::ReaderBuilder;

fn main() -> Result<(), Box<dyn Error>> {
    let file = File::open("file.csv")?;
    let mut reader = ReaderBuilder::new().has_headers(false).from_reader(file);
    for record in reader.records() {
        let record = record?;
        println!("{:?}", record);
    }
    Ok(())
}
```

在这个例子中，我们首先打开了一个名为`file.csv`的 CSV 文件，并将其存储在`file`变量中。接下来，我们使用`ReaderBuilder`创建了一个 CSV 读取器，并使用`records`方法逐行读取文件内容。最后，我们打印出了每一行的内容。

### 写入 CSV 文件内容

使用`csv`和`std::fs::File`模块可以写入 CSV 文件内容。以下是一个简单的示例：

```rust
use std::error::Error;
use std::fs::File;
use std::io::prelude::*;
use csv::WriterBuilder;

fn main() -> Result<(), Box<dyn Error>> {
    let mut file = File::create("file.csv")?;
    let mut writer = WriterBuilder::new().has_headers(false).from_writer(file);
    writer.write_record(&["1", "2", "3"])?;
    writer.write_record(&["4", "5", "6"])?;
    writer.flush()?;
    Ok(())
}
```

在这个例子中，我们首先创建了一个名为`file.csv`的 CSV 文件，并将其存储在`file`变量中。接下来，我们使用`WriterBuilder`创建了一个 CSV 写入器，并使用`write_record`方法将两行数据写入到文件中。最后，我们使用`flush`方法将缓冲区中的数据刷新到文件中。

## 进阶用法

### 读取大文件内容

当处理大文件时，我们需要使用流式读取器来避免将整个文件读入内存中。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::{BufReader, Read};

fn main() {
    let file = File::open("file.txt").expect("file not found");
    let mut reader = BufReader::new(file);
    let mut buffer = [0; 1024];
    loop {
        let bytes_read = reader.read(&mut buffer).expect("unable to read file");
        if bytes_read == 0 {
            break;
        }
        println!("{:?}", &buffer[..bytes_read]);
    }
}
```

在这个例子中，我们使用`BufReader`创建了一个缓冲读取器，并使用`read`方法逐块读取文件内容。我们使用一个长度为 1024 的字节数组`buffer`来存储每一块读取到的内容，并在读取完整个文件后打印出它们。

### 写入大文件内容

当处理大文件时，我们需要使用流式写入器来避免将整个文件写入内存中。以下是一个简单的示例：

```rust
use std::fs::File;
use std::io::{BufWriter, Write};

fn main() {
    let file = File::create("file.txt").expect("file not found");
    let mut writer = BufWriter::new(file);
    let buffer = [0x48, 0x65, 0x6c, 0x6c, 0x6f];
    for _ in 0..1000000 {
        writer.write_all(&buffer).expect("something went wrong writing the file");
    }
    writer.flush().expect("something went wrong writing the file");
}
```

在这个例子中，我们使用`BufWriter`创建了一个缓冲写入器，并使用`write_all`方法逐块写入文件内容。我们使用一个长度为 5 的字节数组`buffer`来存储每一块写入的内容，并重复写入 1,000,000 次。最后，我们使用`flush`方法将缓冲区中的数据刷新到文件中。

### 读取压缩文件内容

使用`flate2`、`tar`和`std::fs::File`模块可以读取压缩文件内容。以下是一个简单的示例：

```rust
use std::error::Error;
use std::fs::File;
use flate2::read::GzDecoder;
use tar::Archive;

fn main() -> Result<(), Box<dyn Error>> {
    let file = File::open("file.tar.gz")?;
    let decoder = GzDecoder::new(file)?;
    let mut archive = Archive::new(decoder);
    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;
        let mut contents = String::new();
        entry.read_to_string(&mut contents)?;
        println!("{}:\n{}", path.display(), contents);
    }
    Ok(())
}
```

在这个例子中，我们首先打开了一个名为`file.tar.gz`的压缩文件，并将其存储在`file`变量中。接下来，我们使用`GzDecoder`创建了一个 Gzip 解码器，并使用`Archive`创建了一个 tar 归档器。我们使用`entries`方法逐个读取归档文件中的条目，并使用`read_to_string`方法读取每个条目的内容。最后，我们打印出了每个条目的路径和内容。

### 写入压缩文件内容

使用`flate2`、`tar`和`std::fs::File`模块可以写入压缩文件内容。以下是一个简单的示例：

```rust
use std::error::Error;
use std::fs::File;
use flate2::write::GzEncoder;
use flate2::Compression;
use tar::Builder;

fn main() -> Result<(), Box<dyn Error>> {
    let file = File::create("file.tar.gz")?;
    let encoder = GzEncoder::new(file, Compression::default());
    let mut builder = Builder::new(encoder);
    builder.append_path("file.txt")?.unwrap().write_all(b"Hello, world!")?;
    builder.finish()?;
    Ok(())
}
```

在这个例子中，我们首先创建了一个名为`file.tar.gz`的压缩文件，并将其存储在`file`变量中。接下来，我们使用`GzEncoder`创建了一个 Gzip 编码器，并使用`Builder`创建了一个 tar 构建器。我们使用`append_path`方法添加一个名为`file.txt`的文件，并使用`write_all`方法将字符串`Hello, world!`写入到文件中。最后，我们使用`finish`方法将构建器中的所有内容写入到文件中。

## 最佳实践

在使用 Rust 读写文件时，我们应该遵循以下最佳实践：

- 使用`File`模块和`Read`/`Write`模块来读写文件。
- 使用`BufReader`和`BufWriter`来缓冲读写操作以提高性能。
- 当处理大文件时，使用流式读写器来避免将整个文件读写入内存中。
- 当处理压缩文件时，使用`flate2`和`tar`模块来读写文件。
- 在读写文件时，始终检查错误，并使用`expect`或`?`来处理错误。
- 在读写文件时，始终使用`match`或`if let`来处理可能的错误情况。
- 在写入文件时，始终使用`flush`方法将缓冲区中的数据刷新到文件中。
- 在读取文件时，始终使用`read_exact`方法来确保已读取到所需的字节数。
- 在读取 CSV 文件时，使用`csv`模块来处理 CSV 格式。
- 在读写文件时，始终使用 UTF-8 编码。

## 结论

在本教程中，我们介绍了如何在 Rust 中读写文件，包括基础用法和进阶用法。我们提供了多个示例代码，涵盖了读取文件、写入文件、逐行读取文件、追加文件内容、读取二进制文件内容、写入二进制文件内容、读取 CSV 文件内容、写入 CSV 文件内容、读取压缩文件内容和写入压缩文件内容等常见任务。我们还提供了一些最佳实践，以帮助您在实践中更好地使用 Rust 读写文件。
