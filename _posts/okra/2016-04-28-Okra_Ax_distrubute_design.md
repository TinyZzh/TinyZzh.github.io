---
layout: page
title: 简单的分布式服务器设计
date: 2099-09-28 09:26:00 +0800
categories: [Okra]
tags: [Okra框架, 分布式]
---

服务端的分布式设计可以有效扩展服务器的负载，但同时增加系统的复杂度。
开源的分布式服务器框架目前也有不少了。例如：

 1. [pemole](http://pomelo.netease.com/) : 网易开源的基于node.js的分布式服务器框架. (可以粗略认为是将ErLang搬到node.js上)
 2. [skynet](https://github.com/cloudwu/skynet) : 基于Actor模式的开源并发框架.使用c做底层通信，主要使用lua做业务逻辑的。作者是云风
 3. [NoahGameFrame](https://github.com/ketoo/NoahGameFrame) : C++封装的游戏框架. 使用Theron实现Actor模型的并发
 4. [akka](http://akka.io/) : Actor模型的分布式应用框架.Scale语言当前默认的Actor库。**兼容Java 6+**

类似的开源框架太多了。






Okra是一个构建在Netty框架和Disruptor框架之上轻量级JAVA服务器框架。
使用Netty实现高性能，可灵活扩展的网络通信，使用Disruptor实现高吞吐量，低延迟的并发。
Okra主要依赖如下：

 * [Netty 4.x 以上版本](netty.io)
 * [Disruptor 3.3.x 以上版本](https://lmax-exchange.github.io/disruptor/)
 * JDK 1.8 above

### 相关资料:
[GitHub Wiki](https://github.com/ogcs/Okra/wiki)

### Okra开源在GitHub
开源地址 : [https://github.com/ogcs/Okra/](https://github.com/ogcs/Okra/)

### 为什么叫Okra?
Okra中文意思是秋葵。作者一直很想试试，但一直都没机会吃。所以就这么称呼，已提醒自己啥时候有机会要尝试一下。



