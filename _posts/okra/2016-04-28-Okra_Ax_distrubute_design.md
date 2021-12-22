---
layout: post
title: 简单的分布式服务器设计
date: 2099-09-28 09:26:00 +0800
categories: [Okra]
tags: [Okra框架, 分布式]
---

服务端的分布式设计可以有效扩展服务器的负载，但同时增加系统的复杂度。
开源的分布式服务器框架目前也有不少了。例如：

1.  [pemole](http://pomelo.netease.com/) : 网易开源的基于 node.js 的分布式服务器框架. (可以粗略认为是将 ErLang 搬到 node.js 上)
2.  [skynet](https://github.com/cloudwu/skynet) : 基于 Actor 模式的开源并发框架.使用 c 做底层通信，主要使用 lua 做业务逻辑的。作者是云风
3.  [NoahGameFrame](https://github.com/ketoo/NoahGameFrame) : C++封装的游戏框架. 使用 Theron 实现 Actor 模型的并发
4.  [akka](http://akka.io/) : Actor 模型的分布式应用框架.Scale 语言当前默认的 Actor 库。**兼容 Java 6+**

类似的开源框架太多了。

Okra 是一个构建在 Netty 框架和 Disruptor 框架之上轻量级 JAVA 服务器框架。
使用 Netty 实现高性能，可灵活扩展的网络通信，使用 Disruptor 实现高吞吐量，低延迟的并发。
Okra 主要依赖如下：

- [Netty 4.x 以上版本](netty.io)
- [Disruptor 3.3.x 以上版本](https://lmax-exchange.github.io/disruptor/)
- JDK 1.8 above

### 相关资料:

[GitHub Wiki](https://github.com/ogcs/Okra/wiki)

### Okra 开源在 GitHub

开源地址 : [https://github.com/ogcs/Okra/](https://github.com/ogcs/Okra/)

### 为什么叫 Okra?

Okra 中文意思是秋葵。作者一直很想试试，但一直都没机会吃。所以就这么称呼，已提醒自己啥时候有机会要尝试一下。
