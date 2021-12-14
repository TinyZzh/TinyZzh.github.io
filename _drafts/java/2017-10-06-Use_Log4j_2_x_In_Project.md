---
layout: page
title: Rust笔记(一) 搭建开发环境
date: 2016-04-15 14:14:00 +0800
categories: [Rust]
tags: [Rust笔记]
---

Rust是一门强调安全、并发、高效的系统编程语言。无GC实现内存安全机制、无数据竞争的并发机制、无运行时开销的抽象机制，是Rust独特的优越特性。
它声称解决了传统C语言和C++语言几十年来饱受责难的内存安全问题，同时还保持了很高的运行效率、很深的底层控制、很广的应用范围，
在系统编程领域具有强劲的竞争力和广阔的应用前景。

# 搭建Rust开发环境

博主从Rust 0.9版本时开始关注Rust项目。到现在落笔时Rust的1.8稳定版本。
感觉是时候接触一下这门新系统级编程语言了。Rust诞生至今还不算很长，虽然社区等对各种IDE都有了初步支持，
但是相比于其他老牌语法而言，仍很不完善。本文记录博主搭建Rust环境的流程和遇到的坑

需求：

 * [Rust环境](https://www.rust-lang.org/downloads.html)
 * Visual Studio 2015
 * [VisualRust插件](https://visualstudiogallery.msdn.microsoft.com/c6075d2f-8864-47c0-8333-92f183d3e640/)
 * [racer代码补全](https://github.com/phildawes/racer)


## 1.1安装Rust环境
选择适合自己开发平台的Rust包.由于博主使用的是VS2015，这里选择下载Rust的MSVC安装包。
另外一个需要下载的是source包（用于rust标准库的代码提示）。

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a1.jpg)

双击运行"rust-1.8.0-x86_64-pc-windows-msvc.msi"启动windows操作系统的安装程序.
 * 默认安装路径: C:\Progrem Files\Rust *** 版本号
 * 自定义安装路径: 点选"advanced"按钮.在设置里面安装路径和需要的模块.
一路Next然后Finish

 * **由于需要写入注册列表和修改环境变量，所以操作系统中安装了安全软件的请允许安装器操作**

## 1.2校验Rust编译环境
运行windows命令行(快捷键:Win + R 输入cmd 回车). 输入如下命令并回车

```cpp
> rustc --version
> cargo --version
```
![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a2.jpg)

正确输出版本信息说明安装和环境变量配置成功.
**假如出现  "'rustc'不是内部或外部命令，也不是可运行的程序或批处理文件"
请在"环境变量"的Path中增加rust的bin目录**

## cargo
cargo是rust官方推荐使用的项目管理软件。功能大概类似于java里面的maven和ant。负责管理依赖项和编译。
安装rust时，默认安装(可以自定义为不安装)

## 2 安装VisualRust插件

VisualRust插件下载地址:

 * [MSDN-VisualRust](https://visualstudiogallery.msdn.microsoft.com/c6075d2f-8864-47c0-8333-92f183d3e640/)

下载插件，选择对应的Visual Studio版本安装即可.

## 3 安装racer
racer是rust社区里面出现的一个代码补全提示工具。针对多种IDE都有相对应的支持。
(截至于v1.2.6版本貌似只支持标准库的代码提示)

在命令行中输入如下指令并回车:

```cpp
> cargo install racer
```
此方法来自《Rust primer》pdf电子书。博主一直无法编译安装成功。所以采用了下载源码包编译的办法，具体办法如下

 * 在[https://github.com/phildawes/racer](https://github.com/phildawes/racer)项目下载最新的racer包
 * 在解压缩之后的目录中，使用cargo编译racer

```cpp
> cd racer
> cargo build --release
```
编译需要联网，cargo会管理和下载racer的相关依赖。中途可能会出现编译失败（基本上都是因为网络原因无法下载到，你懂的）。
多尝试编译几次即可。
编译完成，在racer目录下面的target目录会生成一个racer.exe的可执行文件
将racer.exe文件复制到rust的bin目录下

### 3.1 在VS2015中配置racer
点击"工具" -> "选项"  -> "Visual Rust"  界面如下:

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/a3.jpg)

根据racer.exe的路径配置。设置rust源码的source/src的目录。
博主这里设置了RUST_SRC_PATH的环境变量，所以无需手动设置Rust sources的路径

至此，在Windows 10操作系统中使用Visual Studio 2015开发Rust的环境就搭建完成了。

enjoy it !:)

