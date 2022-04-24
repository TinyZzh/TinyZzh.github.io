---
layout: post
read_time: true
show_date: true
title: JVM全知道系列 -XX:+UseCompressedOops 压缩指针
date: 2022-04-24 14:13:00 +0800
categories: [JAVA, JVM]
tags: [JAVA, JVM, UseCompressedOops, 压缩指针]
toc: yes
image_scaling: true
---

-XX:+UseCompressedOops  使用压缩指向普通对象的指针. [Oracle Java SE 7](https://docs.oracle.com/javase/7/docs/technotes/guides/vm/performance-enhancements-7.html)
缺省情况下，JVM最大堆小于32GB时，默认启用压缩指针. [查看详细参数 JDK 17 LTS JVM Options](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html)

## 压缩指针的好处

在JDK 1.6u23引入压缩指针，让32位JDK支持超过4GB的堆空间。有效减少64位平台的堆内存占用（有利于降低GC开销. e.g. 主要是类压缩指针）。提高CPU缓存命中率（能缓存更多的普通对象指针）。

## 核心探秘

### JAVA对象模型

JAVA的对象由对象头、实例数据和对齐填充三部分组成。

对象头一般包含Mark Word和Klass Word两个指针，数组的对象头会额外多一个4byte的数组长度。Mark Word根据平台固定为4~8byte，Klass Word类元数据指针，指向元数据空间Metaspace

对齐填充是根据平台(32或64位)对未对齐的数据4或8byte补齐，进行补0

### 启用压缩指针

启用压缩指针之后，指针表示的含义从真实的地址偏移转换为基于对齐填充的对象偏移。
这样4byte(32位)指针就可以映射管理40e(2^32^-1))对象或32GB(8byte * 2^32^=32GB)的堆空间。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/04-24-01.png" alt="OOP" class="image-click-scaling"/></div>


### 超过32GB的堆

可以通过通过 *-XX:ObjectAlignmentInBytes=alignment* 修改对象对齐来支持。最大堆空间 = 4GB(2^32^-1) * ObjectAlignmentInBytes。

## GC算法中的应用

截至目前为止，除了ZGC算法外，其他全部GC算法都支持Compressed OOP(e.g. G1, Shenandoah GC[JEP-404](https://openjdk.java.net/jeps/404). etc)。

ZGC因为着色指针(Colored Pointers)的设计先天 **不支持32位平台**，不支持压缩指针优化，也无法单独开启类压缩指针。但是从 **JDK 15** 开始，*-XX:+UseCompressedClassPointers* 可以脱离 *-XX:+UseCompressedOops* 之外，单独开启。这种变动对使用ZGC垃圾回收算法或者堆大于32GB的JVM有比较大的意义，当然还是不支持Compressed OOP。

