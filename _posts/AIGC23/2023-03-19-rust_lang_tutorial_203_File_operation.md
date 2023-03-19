---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 文件读/写/操作
date: 2023-03-19 01:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, File]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_203_file_operation.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言是一种系统级、高性能的编程语言，其设计目标是确保安全和并发性。 Rust语言以C和C++为基础，但是对于安全性和并发性做出了很大的改进。

在Rust语言中，操作文件是非常重要的一个功能，本教程将介绍如何在Rust中高效地操作文件，并提供多个实际应用示例。

## 文件读取

Rust语言中操作文件的第一步就是文件读取，使用Rust内置的`std::fs::File`类型即可。使用`File`类型可以打开一个文件，并且从中读取数据。

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
  let mut f = File::open("file.txt")?;
  let mut contents = String::new();
  f.read_to_string(&mut contents)?;
  println!("{}", contents);
  Ok(())
}
```

上面的代码中调用`File::open()`函数打开文件，然后向其中读取数据。读取的数据存储在`contents`变量中，并使用`println!()`函数将其输出到控制台。

注意，`read_to_string()`函数是阻塞式的，因此当文件非常大时，应该使用每次读取一小块数据这种方式读取，而不是将整个文件读入内存。

## 文件追加写入

在Rust语言中，将数据写入文件的方法是使用`write_all()`函数。`write_all()`函数的作用是写入一个字节数组或字符串到文件中。但是使用此函数写入，是直接覆盖文件内容，即覆盖原有文件内容。如果要进行文件追加写入，应该使用Rust内置的`std::fs::OpenOptions`类型。

```rust
use std::fs::OpenOptions;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
  let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open("file.txt")?;
  file.write_all(b"Hello, world!")?;
  Ok(())
}
```

上面的代码中，使用`OpenOptions`打开文件，并使用`append()`函数将文件的打开方式设置为追加。使用`create()`函数则用于创建不存在的文件，如果文件存在，仍然可以正常打开。然后使用`write_all()`函数将数据写入文件中。

注意：文件追加写入是在原文件内容后追加，而不是从文件尾部开始写入。因此，如果在追加写入数据时需要将数据写入最后，应该先使用`seek()`函数将指针移动到文件尾部。

## 文件写入

要在Rust语言中进行文件写入，首先需要创建一个新文件或覆盖现有文件内容。这可以通过`std::fs::File`类型和`std::fs::OpenOptions`类型中的`create()`函数实现。另外，要将数据写入文件中，`write_all()`函数是不错的选择。

```rust
use std::fs::OpenOptions;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
  let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .open("file.txt")?;
  file.write_all(b"Hello, world!")?;
  Ok(())
}
```

上面的代码中使用`OpenOptions`打开文件，并使用`write()`函数将文件的打开方式设置为写入（即覆盖原有内容）。使用`create()`函数则用于创建不存在的文件，如果文件存在，仍然可以正常打开。然后使用`write_all()`函数将数据写入文件中。

## 文件复制

Rust语言中可以使用`std::fs::copy()`函数将一个文件复制到另一个文件中。

```rust
use std::fs;

fn main() -> std::io::Result<()>{
  fs::copy("file.txt", "file_copy.txt")?;
  Ok(())
}
```

上面的代码中，`Copy`函数将`file.txt`的所有内容复制到`file_copy.txt`文件中。如果文件已经存在，则原有文件内容将被覆盖。

## 文件元数据

在Rust语言中，`File`类型还提供了一些用于获取文件元数据的函数，如`metadata()`函数。此函数返回一个`std::fs::Metadata`类型的元数据结构体，该结构体包含了文件的大小、创建时间、修改时间、权限等信息。

```rust
use std::fs::metadata;
use std::time::SystemTime;

fn main() -> std::io::Result<()> {
  let metadata = metadata("file.txt")?;
  let created = metadata.created()?;
  let modified = metadata.modified()?;
  let size = metadata.len();
  let perms = metadata.permissions();

  println!("Created: {:?}", created);
  println!("Modified: {:?}", modified);
  println!("Size: {} bytes", size);
  println!("Permissions: {:?}", perms);
  Ok(())
}
```

上面的代码中，`metadata()`函数返回文件`file.txt`的元数据，并使用元数据中的`created()`函数和`modified()`函数获取创建时间和修改时间，使用`len()`函数来获取文件大小（字节数），使用`permissions()`函数获取文件的权限。

## 文件重命名和移动

在Rust语言中，使用`std::fs::rename()`函数可以将文件重命名或者移动到其他文件夹中。

```rust
use std::fs::rename;

fn main() -> std::io::Result<()> {
  rename("file.txt", "new_file.txt")?;
  Ok(())
}
```

上面的代码中，`rename()`函数将文件`file.txt`重命名为`new_file.txt`，如果`new_file.txt`文件已经存在，则重命名将失败。

此外，如果要移动文件到其他文件夹中，则可以在目标文件名中指定文件夹路径。例如，如果我们将文件移动到子文件夹`/path/to/subdir/`中，则可以在目标文件名中指定路径：`/path/to/subdir/new_file.txt`。

## 多种操作组合

在Rust语言中，可以将多种文件操作组合使用，例如读取文件，删除文件内容，然后将新数据写入文件中。

```rust
use std::fs::OpenOptions;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
  let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .open("file.txt")?;
  let mut contents = String::new();
  file.read_to_string(&mut contents)?;
  contents = contents.replace("Hello", "World");
  file.set_len(0)?; // 清空文件
  file.write_all(contents.as_bytes())?;
  Ok(())
}
```

上面的代码中，使用`OpenOptions`打开文件，并使用`read()`函数将文件的打开方式设置为读取，同时打开文件写入的功能。读取文件的内容，并使用`replace()`函数将文本中的“Hello”替换为“World”。然后使用`set_len()`函数将文件长度重置为0（即清空文件）。使用`write_all()`函数将新数据写入文件。

## 扩展阅读 - 读取带BOM头的文件

BOM (Byte Order Mark) 是一个Unicode字符，用于标识文件的编码格式（UTF-8, UTF-16LE, UTF-16BE, UTF-32LE, UTF-32BE…）。BOM通常是在文件开头的位置插入的，用于确定字符的顺序和字节顺序。

> 源于Unicode编码，目前被广泛使用于自定义字符集。例如：GB18030-2022

### 读取带BOM头的文件

```rust
pub trait BOMReader {
    fn has_bom(&self) -> bool;
    fn read_content(&mut self) -> Result<String, std::io::Error>;
}

pub struct FileBOMReader {
    file: std::fs::File,
    bom: Option<Vec<u8>>,
}

impl FileBOMReader {
    pub fn new(file: std::fs::File) -> Self {
        Self { file, bom: None }
    }

    fn read_bom(&mut self) -> Result<(), std::io::Error> {
        let mut bom_buf = [0u8; 3];
        let bytes_read = self.file.read(&mut bom_buf)?;
        if bytes_read >= 3 && bom_buf[..3] == [0xEF, 0xBB, 0xBF] {
            self.bom = Some(bom_buf[..3].to_vec());
        } else if bytes_read >= 2 && bom_buf[..2] == [0xFE, 0xFF] {
            self.bom = Some(bom_buf[..2].to_vec());
        } else if bytes_read >= 2 && bom_buf[..2] == [0xFF, 0xFE] {
            self.bom = Some(bom_buf[..2].to_vec());
        } else if bytes_read >= 4 && bom_buf[..4] == [0x00, 0x00, 0xFE, 0xFF] {
            self.bom = Some(bom_buf[..4].to_vec());
        } else if bytes_read >= 4 && bom_buf[..4] == [0xFF, 0xFE, 0x00, 0x00] {
            self.bom = Some(bom_buf[..4].to_vec());
        }
        Ok(())
    }
}

impl BOMReader for FileBOMReader {
    fn has_bom(&self) -> bool {
        self.bom.is_some()
    }

    fn read_content(&mut self) -> Result<String, std::io::Error> {
        if self.bom.is_none() {
            self.read_bom()?;
        }
        let mut buf = String::new();
        self.file.read_to_string(&mut buf)?;
        if self.has_bom() {
            match &self.bom {
                Some(bom) if bom.starts_with([0xEF, 0xBB, 0xBF].as_ref()) => {
                    buf.drain(..3);
                }
                Some(bom) if bom.starts_with([0xFF, 0xFE].as_ref()) => {
                    buf = buf.as_bytes().chunks_exact(2).map(|c| c[1]).collect();
                }
                Some(bom) if bom.starts_with([0xFE, 0xFF].as_ref()) => {
                    buf = buf.as_bytes().chunks_exact(2).map(|c| c[0]).collect();
                }
                Some(bom) if bom.starts_with([0x00, 0x00, 0xFE, 0xFF].as_ref()) => {
                    buf = buf.as_bytes().chunks_exact(2).skip(2).map(|c| c[1]).collect();
                }
                Some(bom) if bom.starts_with([0xFF, 0xFE, 0x00, 0x00].as_ref()) => {
                    buf = buf.as_bytes().chunks_exact(4).skip(1).flat_map(|c| &c[2..]).collect();
                }
                _ => {}
            }
        }
        Ok(buf)
    }
}
```

该trait定义了一个`BOMReader`并提供了一个`FileBOMReader`的实现，可检测和读取文件中的 BOM（Byte Order Mark）。BOM 通常用于标识文件的编码格式，因为某些编码格式的字符集在读取时可能有不同的字节序。

### 示例代码

```rust
use std::fs::File;
use std::io::{Read, Write};

fn main() {
    let mut file = File::create("test_utf8.txt").unwrap();
    let content = "Hello, World!\n";
    file.write_all(content.as_bytes()).unwrap();
    let mut reader = FileBOMReader::new(File::open("test_utf8.txt").unwrap());
    let result = reader.read_content().unwrap();
    assert_eq!(result, content);

    let mut file = File::create("test_utf16be.txt").unwrap();
    let bom = [0xFE, 0xFF];
    file.write_all(&bom).unwrap();
    let content = "Hello, World!\n";
    file.write_all(content.as_bytes()).unwrap();
    let mut reader = FileBOMReader::new(File::open("test_utf16be.txt").unwrap());
    let result = reader.read_content().unwrap();
    assert_eq!(result, content);

    let mut file = File::create("test_utf16le.txt").unwrap();
    let bom = [0xFF, 0xFE];
    file.write_all(&bom).unwrap();
    let content = "Hello, World!\n";
    file.write_all(content.as_bytes()).unwrap();
    let mut reader = FileBOMReader::new(File::open("test_utf16le.txt").unwrap());
    let result = reader.read_content().unwrap();
    assert_eq!(result, content);

    let mut file = File::create("test_utf32be.txt").unwrap();
    let bom = [0x00, 0x00, 0xFE, 0xFF];
    file.write_all(&bom).unwrap();
    let content = "Hello, World!\n";
 file.write_all(content.as_bytes()).unwrap();
    let mut reader = FileBOMReader::new(File::open("test_utf32be.txt").unwrap());
    let result = reader.read_content().unwrap();
    assert_eq!(result, content);

    let mut file = File::create("test_utf32le.txt").unwrap();
    let bom = [0xFF, 0xFE, 0x00, 0x00];
    file.write_all(&bom).unwrap();
    let content = "Hello, World!\n";
    file.write_all(content.as_bytes()).unwrap();
    let mut reader = FileBOMReader::new(File::open("test_utf32le.txt").unwrap());
    let result = reader.read_content().unwrap();
    assert_eq!(result, content);
}
```

通过编写这样的例子，我们可以测试我们的代码，确保它能正确地读取各种类型的文件。

### 使用`encoding_rs`读取带BOM头的文件

在Rust中，可以使用`std::fs::File`和`std::io::BufReader`模块读取文件，并使用`encoding_rs`模块解析BOM头以获取文件的编码信息。

```rust
use std::fs::File;
use std::io::BufReader;
use encoding_rs::Encoding;

fn main() {
    let filename = "example.txt";
    let file = File::open(filename).unwrap();
    let mut reader = BufReader::new(file);

    // 按照Utf8读取文件    let decoder = Encoding::utf8().new_decoder_with_bom_handling();
    let (result, _, _) = decoder.decode(&mut reader);
 match result {
        Some(s) => {
            println!("Content: {}", s);
        }
        None => {
            println!("Error decoding file");
        }
    }
}
```

这个示例使用了`Utf8`编码格式，但是在实现中使用了`new_decoder_with_bom_handling()`函数以自动检测和处理BOM头。

如果需要支持其他编码类型，则需要使用不同的编码器（比如`GBK`）和相应的 decoder。

```rust
// 按照GBK读取文件
let decoder = Encoding::GBK.new_decoder_with_bom_handling();
// 解码
let (result, _, _) = decoder.decode(&mut reader);
```

根据具体的编码类型来选择对应的编码器，就可以正常读取文件内容了。

## 总结

以上是在Rust语言中操作文件的实际应用示例，涵盖了文件读取、追加写入、重命名和移动、复制、写入、获取元数据等操作。这些操作非常基础，但往往也是程序开发中必不可少的操作。在以后的程序开发中，读者可以根据需求将这些操作进行各种组合，以实现更为复杂的文件操作需求。
