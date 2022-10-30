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



[有序集合(Sorted Sets)](https://redis.io/docs/data-types/sorted-sets/)是[Redis](https://redis.io/docs/)内置的一种基于跳跃表(skip list)，时间复杂度为O(log(N))数据类型。

本文的基础都是基于Redis的有序集合。

## 排行榜业务涉及的命令

### ZADD

插入一条排行榜记录，当记录存在时，替换key对应的score。

```powershell
redis> ZADD myrank 1 "lucy"
(integer) 1
redis> ZRANGE myrank 0 -1 WITHSCORES
1) "lucy"
2) "1"
redis> ZADD myrank 2 "lucy"
(integer) 0
redis> ZRANGE myrank 0 -1 WITHSCORES
1) "lucy"
2) 2.0
```


### ZINCRBY

当记录存在时，累加score的值，否则和ADD类似插入一条新记录。

```powershell
ZINCRBY key increment member
```

```powershell
redis> ZADD myrank 1 "lucy"
(integer) 1
redis> ZRANGE myrank 0 -1 WITHSCORES
1) "lucy"
2) "1"
redis> ZINCRBY myrank 2 "lucy"
3.0
redis> ZRANGE myrank 0 -1 WITHSCORES
1) "lucy"
2) 3.0
```

### ZRANGE

根据起始和结束索引获取列表，可以实现排行榜数据的分页查询。默认是**根据score值从小到大排序**。

```powershell
ZRANGE key start stop [BYSCORE | BYLEX] [REV] [LIMIT offset count]  [WITHSCORES]
```

|参数|描述|
|--:|--:|
|start|开始位置。 0|
|stop|结束位置。负数表示倒序计数，-1表示获取全部|
|REV|获取逆序排序的数据。Redis 6.2开始替代 **ZREVRANGE** 命令。|
|WITHSCORES|在返回的列表的每个key之后追加对应的score数据|

ZRANGE 排行榜的key start(开始位置) stop(结束位置) REV(逆序排序) (同时返回分数)

```powershell
> ZRANGE myrank 0 -1 WITHSCORES
1) "lucy"
2) 2.0
3) "mike"
4) 3.0
```

### ZRANK

获取个人再排行榜的排名。返回**从小到大排序的排行榜位置索引(排名)**。
往往排行榜的业务都是从大到小排序的，可以通过使用**ZREVRANK命令**获取**从大到小排序**的排名。

```powershell
ZREVRANK key member
```

```powershell
> ZRANGE myrank lucy
2
```

更多内容命令说明见[Redis文档 - 有序集合](https://redis.io/commands/?group=sorted-set)

### ZCARD

获取有序集合的元素数量。获取排行榜的总长度。

```powershell
> ZCARD myrank
2
```

## 排行榜业务实践

Redis的有序集合提供了高可用、高效的查询，那如何将它和我们实际业务结合起来呢？
Redis只有一个score值但是业务中排序影响因子又4、5个怎么办？

有序集合的score是一个 **IEEE 754标准的双精度浮点数**，数据范围为 **-2^1024^ ~ +2^1024^**。其中**精确表示整数**的范围为**2^-53^(-9007199254740992) ~ 2^52^(90071992547409992)** 。超过精确范围的值将根据IEEE 754取/舍之后表示。

一般平台的长整型范围为-(2^63^) ~ (2^63^ - 1)

### 经验值排行榜

根据等级从大到小，经验从大到小，**上榜时间从小到大**三个条件进行排序。

```java

int level = 60;
int exp = 6000000;
int timestamp = (int) (System.currentTimeMillis() / 1000);

long redisScore = ((level & 0xFFL) << 56) | ((exp & 0xFFFFFFL) << 32) | (timestamp & 0xFFFFFFFFL);

int tempTime = redisScore & 0xFFFFFFFFL;
int tempExp = (redisScore >> 32) & 0xFFFFFFL;
int tempLevel = (redisScore >> 56) & 0xFFL;

```

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



## 总结

详细可以查看 Redis 的[官方命令说明文档](http://redis.io/commands#sorted_set)
或笔者在 Okra 框架的 example 包下的
[示例代码](https://github.com/ogcs/Okra/blob/master/okra-examples/src/main/java/org/ogcs/okra/example/rank/RedisRankMain.java)
。
