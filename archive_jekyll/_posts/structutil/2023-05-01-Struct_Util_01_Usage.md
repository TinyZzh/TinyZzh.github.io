---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 基础应用入门实战
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营、策划三方实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

## 基础入门

框架核心由两个注解组成，业务代码也是围绕着两个注解实现的。下面我们根据注解中定义的属性学习一下 @StructSheet 和 @StructField 两个注解。

### @StructSheet 注解

定义数据文件的结构.

| 注解名称   |         缺省值         | 可选字段 |                                                                         备注 |
| :--------- | :--------------------: | :------: | ---------------------------------------------------------------------------: |
| fileName   |           ''           |  **N**   |                               数据文件名称, 带文件的后缀名. e.g. struct.xlsx |
| sheetName  |        'Sheet1'        |    Y     |                                    表单名称. 针对 Excel 文件的包含多个 Sheet |
| startOrder |           1            |    Y     | 控制文件读取的开始. 缺省为: 1 从 excel 的 1 行(第一行为 0)或文件的第一行开始 |
| endOrder   |           -1           |    Y     |                                                控制文件读取的结束. 缺省为:-1 |
| matcher    |  WorkerMatcher.class   |    Y     |                    自定义 WorkHandler, 可以根据条件指定处理的 StructHandler. |
| filter     | StructBeanFilter.class |    Y     |                                                过滤、筛选符合条件的数据结构. |

### @StructField 注解

定义列结构.

| 注解名称      |    缺省值    | 可选字段 |                                                                   备注 |
| :------------ | :----------: | :------: | ---------------------------------------------------------------------: |
| name          |      ''      |    Y     | 数据文件中的列名, 当设置非空字符串时，使用注解的值替代类文件中的字段名 |
| ref           | Object.class |    Y     |                                                           引用其他结构 |
| refGroupBy    |      {}      |    Y     |                        当 ref 值有效时, 引用的结构数据根据字段进行分组 |
| refUniqueKey  |      {}      |    Y     |                      当 ref 值有效时, 引用的结构数据根据字段转换为 Map |
| aggregateBy   |      ''      |    Y     |         根据父结构中的字段值，对子结构进行聚合. 类似于 groupBy 的功能. |
| aggregateType | Object.class |    Y     |                      当 aggregateBy 生效时，聚合的集合类型. 不支持 Map |
| required      |    false     |    Y     |              字段值非空检查. 设置为 True 时, 字段值必须为非 null 的值. |
| converter     |      无      |    Y     |                                      将数据文件中的数据转换为期望的 JO |

`ref`, `refGroupBy`, `refUniqueKey` 引用关系，groupby 将子数据集进行分组，uniqueKey 将子数据集的键值对的 key，主要是根据子数据集的字段进行数据划分和处理。

![](/images/2023-04/structutil_ref.png)

`aggregateBy`, `aggregateType` 使用父集合中的数据进行聚合处理，类型进支持数组和 List，暂时不支持聚合键值对。

![](/images/2023-04/structutil_aggregate.png)

`converter` 支持可扩展的字段类型转换器。

## 定义 Animal 类型

定义一个 Animal 的 Struct 结构，包含 name age weight 三个字段。结构对应的数据文件为"cfg_animal.xlsx"。

```java
@StructSheet(fileName = "../cfg_animal.xlsx")
public class Animal {
    private String name;
    private int age;
    private int weight;
}

```

使用 StructWorker 进行数据加载。

```java
@Test
public void test() {
    StructWorker<Animal> worker = WorkerUtil.newWorker("./data/", Animal.class);
    ArrayList<Animal> list = worker.load(ArrayList::new);
    //    ...
}
```

## 使用 @StructOptional 注解聚合异构对象

某些业务场景中我们可能需要聚合不同数据结构的类型到同一个表中。

```java
@StructSheet(fileName = "../cfg_animal.xlsx")
public class Animal {
    private String name;
    private int age;
    private int weight;
    @StructOptional(value = {
            @StructField(ref = ExtraData1.class, refUniqueKey = "id"),
            @StructField(ref = ExtraData2.class, refUniqueKey = "id")
    })
    private Object extra;
}

```

根据 value 的 @StructField 顺序尝试解析引用数据，一直到找到某个值为止。例如动物的科属目信息，每个动物皆不相同，需要在总 Animal 信息集成。

![](/images/2023-04/structutil_optional.png)
