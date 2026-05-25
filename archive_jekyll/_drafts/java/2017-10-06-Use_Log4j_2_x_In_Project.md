---
layout: post
title: Rust笔记(一) 搭建开发环境
date: 2016-04-15 14:14:00 +0800
categories: [Rust]
tags: [Rust笔记]
---

Rust 是一门强调安全、并发、高效的系统编程语言。无 GC 实现内存安全机制、无数据竞争的并发机制、无运行时开销的抽象机制，是 Rust 独特的优越特性。
它声称解决了传统 C 语言和 C++语言几十年来饱受责难的内存安全问题，同时还保持了很高的运行效率、很深的底层控制、很广的应用范围，
在系统编程领域具有强劲的竞争力和广阔的应用前景。

# 搭建 Rust 开发环境

博主从 Rust 0.9 版本时开始关注 Rust 项目。到现在落笔时 Rust 的 1.8 稳定版本。
感觉是时候接触一下这门新系统级编程语言了。Rust 诞生至今还不算很长，虽然社区等对各种 IDE 都有了初步支持，
但是相比于其他老牌语法而言，仍很不完善。本文记录博主搭建 Rust 环境的流程和遇到的坑

需求：

- [Rust 环境](https://www.rust-lang.org/downloads.html)
- Visual Studio 2015
- [VisualRust 插件](https://visualstudiogallery.msdn.microsoft.com/c6075d2f-8864-47c0-8333-92f183d3e640/)
- [racer 代码补全](https://github.com/phildawes/racer)

## 1.1 安装 Rust 环境

选择适合自己开发平台的 Rust 包.由于博主使用的是 VS2015，这里选择下载 Rust 的 MSVC 安装包。
另外一个需要下载的是 source 包（用于 rust 标准库的代码提示）。

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a1.jpg)

双击运行"rust-1.8.0-x86_64-pc-windows-msvc.msi"启动 windows 操作系统的安装程序.

- 默认安装路径: C:\Progrem Files\Rust \*\*\* 版本号
- 自定义安装路径: 点选"advanced"按钮.在设置里面安装路径和需要的模块.
  一路 Next 然后 Finish

- **由于需要写入注册列表和修改环境变量，所以操作系统中安装了安全软件的请允许安装器操作**

## 1.2 校验 Rust 编译环境

运行 windows 命令行(快捷键:Win + R 输入 cmd 回车). 输入如下命令并回车

```cpp
> rustc --version
> cargo --version
```

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a2.jpg)

正确输出版本信息说明安装和环境变量配置成功.
**假如出现 "'rustc'不是内部或外部命令，也不是可运行的程序或批处理文件"
请在"环境变量"的 Path 中增加 rust 的 bin 目录**

## cargo

cargo 是 rust 官方推荐使用的项目管理软件。功能大概类似于 java 里面的 maven 和 ant。负责管理依赖项和编译。
安装 rust 时，默认安装(可以自定义为不安装)

## 2 安装 VisualRust 插件

VisualRust 插件下载地址:

- [MSDN-VisualRust](https://visualstudiogallery.msdn.microsoft.com/c6075d2f-8864-47c0-8333-92f183d3e640/)

下载插件，选择对应的 Visual Studio 版本安装即可.

## 3 安装 racer

racer 是 rust 社区里面出现的一个代码补全提示工具。针对多种 IDE 都有相对应的支持。
(截至于 v1.2.6 版本貌似只支持标准库的代码提示)

在命令行中输入如下指令并回车:

```cpp
> cargo install racer
```

此方法来自《Rust primer》pdf 电子书。博主一直无法编译安装成功。所以采用了下载源码包编译的办法，具体办法如下

- 在[https://github.com/phildawes/racer](https://github.com/phildawes/racer)项目下载最新的 racer 包
- 在解压缩之后的目录中，使用 cargo 编译 racer

```cpp
> cd racer
> cargo build --release
```

编译需要联网，cargo 会管理和下载 racer 的相关依赖。中途可能会出现编译失败（基本上都是因为网络原因无法下载到，你懂的）。
多尝试编译几次即可。
编译完成，在 racer 目录下面的 target 目录会生成一个 racer.exe 的可执行文件
将 racer.exe 文件复制到 rust 的 bin 目录下

### 3.1 在 VS2015 中配置 racer

点击"工具" -> "选项" -> "Visual Rust" 界面如下:

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a3.jpg)

根据 racer.exe 的路径配置。设置 rust 源码的 source/src 的目录。
博主这里设置了 RUST_SRC_PATH 的环境变量，所以无需手动设置 Rust sources 的路径

至此，在 Windows 10 操作系统中使用 Visual Studio 2015 开发 Rust 的环境就搭建完成了。

enjoy it !:)
