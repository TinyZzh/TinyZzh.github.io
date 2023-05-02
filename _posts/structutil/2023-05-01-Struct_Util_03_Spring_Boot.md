---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 集成到Spring Boot全家桶
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营、策划三方实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

## struct-spring-boot-starter 模块

struct-spring-boot-starter 主要是针对 struct-spring 的扩展，用于支持 Spring Boot 框架，通过自动化配置，降低 struct-spring 的使用门槛。

首先引入依赖包

```gradle
implementation('org.structutil:struct-spring-boot-starter:{VERSION}')
```

### struct.store 配置

定义数据文件的结构.

| 注解名称   |         缺省值         | 可选字段 |                                                                         备注 |
| :--------- | :--------------------: | :------: | ---------------------------------------------------------------------------: |
| fileName   |           ''           |  **N**   |                               数据文件名称, 带文件的后缀名. e.g. struct.xlsx |
| sheetName  |        'Sheet1'        |    Y     |                                    表单名称. 针对 Excel 文件的包含多个 Sheet |
| startOrder |           1            |    Y     | 控制文件读取的开始. 缺省为: 1 从 excel 的 1 行(第一行为 0)或文件的第一行开始 |
| endOrder   |           -1           |    Y     |                                                控制文件读取的结束. 缺省为:-1 |
| matcher    |  WorkerMatcher.class   |    Y     |                    自定义 WorkHandler, 可以根据条件指定处理的 StructHandler. |
| filter     | StructBeanFilter.class |    Y     |                                                     过滤、筛选符合条件的 JO. |

### Spring 框架 缺省配置

```properties
#===================================== Struct Util Configuration ======================================
#   是否启用spring-boot-starter自动配置. 默认:true
struct.store.enable=true
#   是否开启StructStoreService服务. 默认:true
struct.store.service.enable=true
#   工作空间
struct.store.service.workspace=./data/
#   StructStore是否通过懒加载方式初始化. 默认:true
struct.store.service.lazy-load=false
#   是否启用FileWatchService监控文件变更.  默认:true
struct.store.service.watch-file=true
#   文件变更监控的扫描定时任务初始间隔. 默认:10
struct.store.service.schedule-initial-delay=10
#   文件变更监控的扫描间隔. 默认:5
struct.store.service.schedule-delay=5
#   文件变更监控的扫描间隔时间单位. 默认:秒
struct.store.service.schedule-time-unit=SECONDS
#   懒加载模式下，在读取数据时, StructStore为初始化完成时，是否同步等待加载完成. 魔人:true
struct.store.service.sync-wait-for-init=true
```
