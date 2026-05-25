---
layout: post
title: Okra框架(四) 使用引导说明
date: 2016-05-19 9:26:00 +0800
categories: [Okra]
tags: [Okra框架]
---

Okra 是一个构建在 Netty 框架和 Disruptor 框架之上轻量级 JAVA 服务器框架。
使用 Netty 实现高性能，可灵活扩展的网络通信，使用 Disruptor 实现高吞吐量，低延迟的并发。

如何将 Okra 应用到实际开发中?

本文旨在帮助初次接触 Okra 框架的用户上手使用 Okra 框架.

## 1. 下载 Okra-x.y.z.jar

首先我们需要下载 Okra 框架最新的稳定版本.Jar:[下载地址](https://github.com/ogcs/Okra/releases).

> **目前 Okra 没有推送到 Maven 仓库,使用 Okra-x.y.z.jar 需要手动添加类库引用.**

## 2. 导入工程

本文以 Intellij IDEA 2016.1.2 为例. IDEA 提供多种多样的添加类库的途径. 本段只做简单的举例示范.

方法一: 设置通用类库导入

1.  打开工程设置. "File" -> "Project Structure..." 或者使用快捷键(Ctrl + Alt + + Shift + S).
2.  选择"Global Libraries", 点击符号"+"，添加 Okra-x.y.z.jar 为通用类库.
3.  添加 Okra 到工程中, 选中新添加的 Okra-x.y.z.jar 点击鼠标右键 -> "Add to Modules" 选中对应的模块, 最终"Ok", 完成导入

方法二: 在 Modules 界面设置导入

1.  打开工程设置. "File" -> "Project Structure..." 或者使用快捷键(Ctrl + Alt + + Shift + S).
2.  选择"Modules"， 选中需要添加 Okra 的模块, 点击"Dependencies", 点击符号"+".
3.  点击"JARs or directories"选择 Okra 文件或所在目录按照提示完成添加

## 3. Okra 框架的依赖

Okra 核心是整合 Netty 和 Disruptor 两个框架. 以便于快速开发高并发, 低延迟，高吞吐量， 灵活可扩展的网络服务器.

(required) :

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.0.36.Final</version>
</dependency>
<dependency>
    <groupId>com.lmax</groupId>
    <artifactId>disruptor</artifactId>
    <version>3.3.2</version>
</dependency>
```

(optional) :

1.  Spring 框架支持

    使用 Spring 框架, 除了 Spring 框架自身带来的 IOC 等便利之外, 还可以快速集成大量优秀的类库, 例如: Hibernate, Mybatis, BoneCP, HikariCP 等等.

    ```xml
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>4.2.2.RELEASE</version>
    </dependency>
    ```

2.  Flex 通信支持

    Flex 客户端和 Java 服务端的通信支持依赖于**BlazeDS**类库.

    ```xml
    <dependency>
        <groupId>org.apache.flex.blazeds</groupId>
        <artifactId>flex-messaging-core</artifactId>
        <version>4.7.2</version>
    </dependency>
    <dependency>
        <groupId>org.apache.flex.blazeds</groupId>
        <artifactId>flex-messaging-common</artifactId>
        <version>4.7.2</version>
    </dependency>
    ```

## 4. 项目中使用

示例 1: [Okra 框架搭建 HTTP 服务器](https://github.com/ogcs/Okra/wiki/Okra%E6%A1%86%E6%9E%B6%E6%90%AD%E5%BB%BAHTTP%E6%9C%8D%E5%8A%A1%E5%99%A8)

示例 2: [Okra 框架搭建 Socket 服务器](https://github.com/ogcs/Okra/wiki/Okra%E6%A1%86%E6%9E%B6%E6%90%AD%E5%BB%BASocket%E6%9C%8D%E5%8A%A1%E5%99%A8)

Java 服务器 Demo: [okra-demo](https://github.com/ogcs/Okra/tree/master/okra-demo)

## 5. 总结

本文旨在帮助初次接触 Okra 框架的用户，快速搭建基于 Okra 的网络服务器. 提供了两个简单的示例和一个相对来说比较完整的服务端 demo.
用户在实际开发过程中遇到问题或者 BUG 欢迎反馈到**[issues](https://github.com/ogcs/Okra/issues)**.
