---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Shell的操作与执行
date: 2023-03-18 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Shell]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_200_Shell.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

在Rust中执行Shell命令是一项非常常见的任务。它可以帮助我们在Rust程序中调用外部命令，以便完成一些特定的任务。在这篇教程中，我们将学习如何在Rust中执行Shell命令，并提供一些示例代码。

### 为什么要执行Shell命令？

在Rust中执行Shell命令有很多好处。以下是一些主要的优点：

- `调用外部命令`：Rust是一种系统级编程语言，它可以与操作系统进行交互。通过执行Shell命令，我们可以调用外部命令，这些命令可能不是Rust标准库中提供的。例如，我们可以使用Shell命令来调用操作系统的命令行工具，如curl、tar、grep等。

- `处理文件和目录`：在Rust中，我们可以使用标准库中的std::fs模块来处理文件和目录。但是，有时候我们需要调用一些外部命令来完成特定的任务，例如创建目录、复制文件等。这时候，执行Shell命令就非常有用。

- `处理系统级任务`：有些任务可能需要访问系统级资源，例如网络接口、进程、内存等。在这种情况下，执行Shell命令可能是唯一的选择。

### 执行Shell命令的方法

在Rust中执行Shell命令有多种方法。以下是一些常用的方法：
使用std::process::Command

std::process::Command是Rust标准库中提供的一个结构体，它可以用来执行Shell命令。以下是一个简单的示例：

```rust
use std::process::Command;

fn main() {
    let output = Command::new("ls")
        .arg("-l")
        .output()
        .expect("failed to execute process");

    println!("{}", String::from_utf8_lossy(&output.stdout));
}
```

在这个示例中，我们使用Command::new方法创建一个新的命令对象，并传递一个字符串来指定要执行的命令。然后，我们使用.arg方法添加命令行参数。最后，我们使用.output方法来执行命令，并返回一个std::process::Output对象。
使用std::process::Command的spawn方法

std::process::Command还提供了一个spawn方法，它可以在单独的进程中执行Shell命令。以下是一个简单的示例：
```rust
use std::process::Command;

fn main() {
    let mut child = Command::new("ls")
        .arg("-l")
        .spawn()
        .expect("failed to execute process");

    let status = child.wait().expect("failed to wait for child");

    println!("child exited with: {}", status);
}
```

在这个示例中，我们使用Command::new方法创建一个新的命令对象，并传递一个字符串来指定要执行的命令。然后，我们使用.arg方法添加命令行参数。最后，我们使用.spawn方法来执行命令，并返回一个std::process::Child对象。我们可以使用.wait方法来等待子进程退出，并返回一个std::process::ExitStatus对象。
使用std::process::Command的output方法

std::process::Command的output方法可以执行Shell命令，并返回命令的输出。以下是一个示例：
```rust
use std::process::Command;

fn main() {
    let output = Command::new("echo")
        .arg("hello world")
        .output()
        .expect("failed to execute process");

    println!("{}", String::from_utf8_lossy(&output.stdout));
}
```

在这个示例中，我们使用Command::new方法创建一个新的命令对象，并传递一个字符串来指定要执行的命令。然后，我们使用.arg方法添加命令行参数。最后，我们使用.output方法来执行命令，并返回一个std::process::Output对象。我们可以使用.stdout字段来获取命令的输出。

### Shell命令实战

以下是一些使用Shell命令在Rust中完成特定任务的示例代码：

### 创建目录mkdir

```rust
use std::process::Command;

fn main() {
    let _output = Command::new("mkdir")
        .arg("newdir")
        .output()
        .expect("failed to execute process");
}
```

在这个示例中，我们使用mkdir命令在当前目录中创建一个名为newdir的新目录。

### 复制文件cp

```rust
use std::process::Command;

fn main() {
    let _output = Command::new("cp")
        .arg("source.txt")
        .arg("destination.txt")
        .output()
        .expect("failed to execute process");
}
```

在这个示例中，我们使用cp命令将source.txt文件复制到destination.txt文件中。

### 下载文件curl

```rust
use std::process::Command;

fn main() {
    let _output = Command::new("curl")
        .arg("-O")
        .arg("https://localhost/file.txt")
        .output()
        .expect("failed to execute process");
}
```

在这个示例中，我们使用curl命令下载"https://localhost/file.txt"文件，并将其保存到当前目录中。

### 查找文件 find

```rust
use std::process::Command;

fn main() {
    let output = Command::new("find")
        .arg(".")
        .arg("-name")
        .arg("file.txt")
        .output()
        .expect("failed to execute process");

    println!("{}", String::from_utf8_lossy(&output.stdout));
}

```

在这个示例中，我们使用find命令在当前目录及其子目录中查找名为file.txt的文件。

### 压缩文件 tar

```rust
use std::process::Command;

fn main() {
    let _output = Command::new("tar")
        .arg("-czvf")
        .arg("archive.tar.gz")
        .arg("file.txt")
        .output()
        .expect("failed to execute process");
}
```

在这个示例中，我们使用tar命令将file.txt文件压缩成archive.tar.gz文件。

### 解压缩文件 tar

```rust
use std::process::Command;

fn main() {
    let _output = Command::new("tar")
        .arg("-xzvf")
        .arg("archive.tar.gz")
        .output()
        .expect("failed to execute process");
}
```

在这个示例中，我们使用tar命令解压archive.tar.gz文件。

## 安全注意事项

在执行Shell命令时，请务必小心。Shell命令可以执行任何操作，包括删除文件、格式化磁盘等。因此，您应该谨慎使用Shell命令，并仅在必要时使用它们。
此外，请注意Shell注入攻击。如果您正在使用用户提供的输入来构建Shell命令，请务必对输入进行验证和过滤，以防止Shell注入攻击。

## 结论

在Rust中执行Shell命令是一项非常有用的任务。在本教程中，我们介绍了如何使用std::process::Command结构体来执行Shell命令，并提供了一些示例代码。请记住，在执行Shell命令时，请务必小心，并仅在必要时使用它们。
