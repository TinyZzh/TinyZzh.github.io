---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解Tokio的AsyncRead和AsyncWrite
date: 2023-04-30 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, tokio]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 语言是一门高性能、安全、并发的编程语言，越来越受到开发者的关注和喜爱。而 Tokio 是 Rust 语言中一个非常流行的异步运行时，它提供了一系列的异步 I/O 操作，其中包括 AsyncRead 和 AsyncWrite 模块。这两个模块是非常重要的，它们可以让我们在异步编程中更加方便地读写数据。本教程将围绕这两个模块，提供基础和进阶用法的示例，帮助读者更好地理解和使用它们。

## 基础用法

### 从文件中读取数据

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::open("test.txt").await?;
    let mut buffer = [0; 10];
    let n = file.read(&mut buffer).await?;
    println!("The bytes read: {:?}", &buffer[..n]);
    Ok(())
}
```

这个示例演示了如何使用 AsyncRead 模块从文件中读取数据。首先，我们使用`File::open`函数打开文件，然后使用`read`方法从文件中读取数据。在这个示例中，我们读取了 10 个字节的数据，并将其存储在一个长度为 10 的缓冲区中。最后，我们打印出读取的字节。

### 从 TCP 连接中读取数据

```rust
use tokio::net::TcpStream;
use tokio::io::{self, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:8080").await?;
    let mut buffer = [0; 10];
    let n = stream.read(&mut buffer).await?;
    println!("The bytes read: {:?}", &buffer[..n]);
    Ok(())
}
```

这个示例演示了如何使用 AsyncRead 模块从 TCP 连接中读取数据。首先，我们使用`TcpStream::connect`函数连接到一个 TCP 服务器，然后使用`read`方法从连接中读取数据。在这个示例中，我们读取了 10 个字节的数据，并将其存储在一个长度为 10 的缓冲区中。最后，我们打印出读取的字节。

### 向文件中写入数据

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncWriteExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::create("test.txt").await?;
    let buffer = b"Hello, world!";
    file.write_all(buffer).await?;
    Ok(())
}
```

这个示例演示了如何使用 AsyncWrite 模块向文件中写入数据。首先，我们使用`File::create`函数创建一个新的文件，然后使用`write_all`方法将数据写入文件中。在这个示例中，我们向文件中写入了一个字符串"Hello, world!"。

### 向 TCP 连接中写入数据

```rust
use tokio::net::TcpStream;
use tokio::io::{self, AsyncWriteExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:8080").await?;
    let buffer = b"Hello, world!";
    stream.write_all(buffer).await?;
    Ok(())
}
```

这个示例演示了如何使用 AsyncWrite 模块向 TCP 连接中写入数据。首先，我们使用`TcpStream::connect`函数连接到一个 TCP 服务器，然后使用`write_all`方法将数据写入连接中。在这个示例中，我们向连接中写入了一个字符串"Hello, world!"。

### 读取文件中的全部数据

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::open("test.txt").await?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await?;
    println!("The bytes read: {:?}", buffer);
    Ok(())
}
```

这个示例演示了如何使用 AsyncRead 模块读取文件中的全部数据。首先，我们使用`File::open`函数打开文件，然后使用`read_to_end`方法读取文件中的全部数据。在这个示例中，我们将读取到的数据存储在一个动态数组中，并打印出读取的字节。

### 复制文件

```rust
use tokio::fs::{self, File};
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut source_file = File::open("source.txt").await?;
    let mut dest_file = File::create("dest.txt").await?;
    let mut buffer = [0; 1024];
    loop {
        let n = source_file.read(&mut buffer).await?;
        if n == 0 {
            break;
        }
        dest_file.write_all(&buffer[..n]).await?;
    }
    Ok(())
}
```

这个示例演示了如何使用 AsyncRead 和 AsyncWrite 模块复制文件。首先，我们使用`File::open`函数打开源文件，使用`File::create`函数创建目标文件。然后，我们使用一个循环，每次读取 1024 字节的数据，并将其写入目标文件中，直到源文件读取完毕。在这个示例中，我们使用了`read`和`write_all`方法。

### 使用 BufReader 和 BufWriter

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader, BufWriter};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::open("test.txt").await?;
    let mut reader = BufReader::new(file);
    let mut writer = BufWriter::new(io::stdout());
    let mut line = String::new();
    loop {
        let n = reader.read_line(&mut line).await?;
        if n == 0 {
            break;
        }
        writer.write_all(line.as_bytes()).await?;
        line.clear();
    }
    Ok(())
}
```

这个示例演示了如何使用 BufReader 和 BufWriter 来进行异步读写。首先，我们使用`File::open`函数打开文件，然后使用`BufReader::new`函数将文件包装成一个缓冲读取器，使用`BufWriter::new`函数将标准输出包装成一个缓冲写入器。然后，我们使用一个循环，每次读取一行数据，并将其写入标准输出中。在这个示例中，我们使用了`read_line`和`write_all`方法。

### 使用 split 和 join

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::open("test.txt").await?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await?;
    let mut parts = buffer.split(|&b| b == b'\n');
    let mut tasks = Vec::new();
    while let Some(part) = parts.next() {
        let task = tokio::spawn(async move {
            let mut file = File::create("output.txt").await?;
            file.write_all(part).await?;
            Ok(())
        });
        tasks.push(task);
    }
    for task in tasks {
        task.await?;
    }
    Ok(())
}
```

这个示例演示了如何使用 split 和 join 来进行异步读写。首先，我们使用`File::open`函数打开文件，然后使用`read_to_end`方法读取文件中的全部数据，并将其存储在一个动态数组中。然后，我们使用`split`方法将数据按照换行符分割成多个部分。接着，我们使用一个循环，每次将一个部分异步地写入一个新的文件中，并使用`tokio::spawn`函数创建一个异步任务。最后，我们使用`join`函数等待所有的异步任务完成。在这个示例中，我们使用了`write_all`方法。

### 使用 timeout

```rust
use tokio::net::TcpStream;
use tokio::io::{self, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:8080").await?;
    let mut buffer = [0; 10];
    let n = tokio::time::timeout(std::time::Duration::from_secs(5), stream.read(&mut buffer)).await??;
    println!("The bytes read: {:?}", &buffer[..n]);
    Ok(())
}
```

这个示例演示了如何使用 timeout 来设置异步读取的超时时间。首先，我们使用`TcpStream::connect`函数连接到一个 TCP 服务器，然后使用`read`方法从连接中读取数据。在这个示例中，我们使用了`timeout`函数来设置读取的超时时间为 5 秒。如果在 5 秒内没有读取到数据，将返回一个错误。在这个示例中，我们使用了`time::timeout`函数。

## 总结

本教程围绕 Tokio 模块的 AsyncRead 和 AsyncWrite 模块，提供了基础和进阶用法的示例。通过学习这些示例，读者可以更好地理解和使用这两个模块，从而更加方便地进行异步读写操作。当然，这些示例只是冰山一角，读者可以通过进一步的学习和实践，掌握更多的异步编程技巧。
