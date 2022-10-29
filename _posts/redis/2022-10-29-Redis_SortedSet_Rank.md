---
layout: post
title: 如何用Redis实现高性能高可用排行榜服务？
date: 2022-10-29 9:00:00 +0800
categories: [Redis, 排行榜]
tags: [Redis, 排行榜]
read_time: true
show_date: true
img: images/2022-04/04-24-01.jpg
toc: yes
image_scaling: true
---



[有序集合(Sorted Sets)](https://redis.io/docs/data-types/sorted-sets/)是[Redis](https://redis.io/docs/)内置的一种基于跳跃表(skip list)，时间复杂度为O(log(n))数据类型。

本文的基础都是基于Redis的有序集合。

## 有序集合相关的命令

本文会使用到的命令。

|命令|描述|
|--:|--:|
|||

更多内容参考[有序集合相关的全部命令](https://redis.io/commands/?group=sorted-set)


## Java中的实践





## 用法实战


假若项目中未使用 Redis, 未来也不准备引入 Redis 的朋友。
可以借鉴引用一下跳跃表的自己实现 SortedSet 或引用 GitHub 上其他网友的开源实现。

Redis 中的 SortedSet 根据一个名为 score 的 64 位双精度浮点数的参数实现排序. 但是在实际应用中推荐将 score 当做 64 位长整型来使用.
原因很简单: long 的取值范围要大于 double.

> > double 范围为[-(2^53), +(2^53)] long 范围为[-(2^63), +(2^63) - 1]

当只有一个排序原则时，直接使用 score 排序即可。
但是引言中的排序有三个条件，而 SortedSet 只提供一个参数而且还是数字，那该如何应用呢?

下面来正菜了。因为 redis 保存的数据是 64 位的，而我们需要的数据可能不需要 64 位这么多。
既如此合理分析拆分这 64 位长度拼接并组合成我们需要的数据，就可以实现简单的多条件排序了。

## 分析各部分数据的取值范围

先普及一点基础知识.

- 8 位二进制: 有符号[-128, 127]， 无符号[0, 255]
- 8 位二进制: 有符号[-128, 127]， 无符号[0, 255]
- ...
- 32 位二进制: 有符号[-2^31, 2^31 - 1]， 无符号[0, 2^32]
- ...
- 64 位二进制: 有符号[-2^63, 2^63 - 1]， 无符号[0, 2^64]

64 位二进制数，首先时间戳精确到秒 则需要 32 位，等级一般 8 位即可（根据需求扩展到 9 位、10 位...）。
这么拆分下来经验值最多使用剩余 24 位表示，有符号[-2^23, 2^23 - 1],也就 800w+。
对于一些小数值经验应该是足够了。但是假如是类似于暗黑三这种按 E 计算的咋办?

目前笔者能想到的就是通过降低数值规模。例如：
每 1w 实际经验值转换为 1 点排序经验值。即 20E 实际经验 / 1w = 20w 排序经验. 20w 完全足够 24 位二进制来表示了。

## 示例

实现优先等级排序，经验排序，满级时间。

```java

int level = 60;
int exp = 6000000;
int timestamp = (int) (System.currentTimeMillis() / 1000);

long redisScore = ((level & 0xFFL) << 56) | ((exp & 0xFFFFFFL) << 32) | (timestamp & 0xFFFFFFFFL);

int tempTime = redisScore & 0xFFFFFFFFL;
int tempExp = (redisScore >> 32) & 0xFFFFFFL;
int tempLevel = (redisScore >> 56) & 0xFFL;

```

## 总结

详细可以查看 Redis 的[官方命令说明文档](http://redis.io/commands#sorted_set)
或笔者在 Okra 框架的 example 包下的
[示例代码](https://github.com/ogcs/Okra/blob/master/okra-examples/src/main/java/org/ogcs/okra/example/rank/RedisRankMain.java)
。
