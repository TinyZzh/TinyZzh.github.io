---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Hello World!
date: 2023-03-12 12:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust是一种系统级编程语言，由Mozilla开发，旨在提供安全性、并发性和性能。它具有内存安全和无数据竞争的特性，可以用于编写高性能的服务器端应用、操作系统、游戏等。

本教程将一步一步的讲解Windows 10 操作系统下，使用Visual Studio Code编辑器搭建Rust语言开发环境。

> 初学者可以使用 官方提供的在线编辑器[Play Rust Online](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021) 学习

## 搭建Rust开发环境

首先，打开Rust官网[下载地址](<https://www.rust-lang.org/learn/get-started>)见如下截图，选择对应的32位或64位安装包，博主安装的是64位的安装包。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/rust_download.png" alt="xx" class="image-click-scaling"/></div>

安装完成后，可以使用Win+R输入**cmd** 打开命令提示符，输入以下命令验证Rust是否安装成功：
```powershell
rustc --version
# 输出类似于下方的信息，则说明安装成功
# rustc 1.68.0 (2c8cc3432 2023-03-06)
```

接下来就是安装官网维护的VS Code市场里面的[Rust语言服务器插件](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/rust_analyzer_plugin.png" alt="xx" class="image-click-scaling"/></div>

插件提供代码补全，代码引用、定义导航，错误提示，代码高亮，单元测试等等，极大的改善开发者的开发环境，提高开发效率。

其次，推荐微软推出的[rust anycode插件](https://marketplace.visualstudio.com/items?itemName=ms-vscode.anycode-rust)：

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/rust_anucode_rust_plugin.png
" alt="xx" class="image-click-scaling"/></div>

第三个推荐[better-toml](https://marketplace.visualstudio.com/items?itemName=bungcip.better-toml)插件，提供 TOML 文件格式的语法高亮和代码补全等方面的支持，对于 Rust 项目中的 Cargo.toml 文件非常有用



## Rust的Hello World!

在VS Code中，可以使用“Terminal”菜单下的“New Terminal”命令打开一个终端窗口。在终端中输入以下命令创建一个新的Rust项目：

```rust
cargo new myproject
```

这个命令会在当前目录下创建一个名为“myproject”的文件夹，其中包含一个默认的Rust项目。目录结构如下图所示：

```powershell
/
├── Cargo.lock
├── Cargo.toml
├── crate-information.json
├── src/
│   ├── main.rs
└── target/
└── tools/
```

使用VS Code打开“myproject”文件夹，可以看到其中包含一个名为“main.rs”的文件。这个文件是Rust项目的入口文件，可以在其中编写代码。
以下是一个简单的Rust程序，可以输出“Hello, world!”：
```rust
fn main() {
    println!("Hello, world!");
}
```

在终端中进入“myproject”文件夹，使用以下命令编译并运行代码：
```powershell
cargo run
# Hello World!
```

到这一步，我们基本上已经把Rust的开发、编译环境搭建完成，也成功的开发了我们的第一个Rust程序。

## VS Code设置

在项目根目录下 .vscode 文件夹中创建 launch.json 文件。
以下是一个示例的 launch.json 文件：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
//    配置名称，用于在 VS Code 中显示。
            "name": "Debug Rust",
//    调试器类型，Rust 语言的调试器类型是 lldb。
            "type": "lldb",
//    调试请求类型，Rust 语言的调试请求类型是 launch。
            "request": "launch",
//    可执行文件路径，需要指定到 target/debug 目录下的可执行文件。
            "program": "${workspaceFolder}/target/debug/myproject",
//    可执行文件的参数，可以为空。
            "args": [],
//    工作目录，需要指定为项目根目录。
            "cwd": "${workspaceFolder}",
//    调试前需要执行的任务，一般为编译任务。
            "preLaunchTask": "cargo build"
        }
    ]
}
```

配置完成后，在 VS Code 中按下 F5 键即可启动 Rust 代码的调试。


## 总结

本教程介绍了如何使用VS Code搭建Rust语言开发环境，并提供了一些示例代码和配置。通过学习本教程，读者可以了解如何创建Rust项目、编写代码、运行代码和调试代码。



