---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 框架简介
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

> 由于包名和包路径不符合 maven repo 的管理要求，没有推送到 maven repo，有兴趣尝试的同学可以尝试 github 下载或者自行编译发布本地。

## 功能特性

- 低侵入。对已有的代码仅需使用 StructField 和 StructSheet 两个注解
- 高性能、低内存占用。使用增量或 Stream API 的方式避免大文件读取带来的低性能、高内存占用的问题
- 扩展性。提供 WorkerMatcher、StructHandler、Converter 等扩展点供用户实现自定义扩展功能
- 结构化数据自动校验和检查。自动检查校验结构化数据及依赖之间的关系。避免出现循环依赖等问题
- 丰富的内置解析器。内置提供 .xls、.xlsx、.json、.xml 四种常见结构化数据的解析器（扩展中）
- 丰富的 JDK 原生类的类型转换支持
- 自定义类型转换器{Converter}
- 灵活的结构化数据整理机制。输出的结果支持 Array、List、Map、Vector、Set 等 JDK 内置或自定义的集合容器
- 灵活的文件变更监听和结构化数据文件动态加载能力
- 支持 Record 类型(JDK 16+).

## 架构设计

![](/images/2023-04/structutil_design.png)

### 参考资料
