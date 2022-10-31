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
Redis只有一个score值但是业务中有4、5个排序影响因子该怎么处理呢？

有序集合根据一个 **IEEE 754标准的双精度浮点数**表示分数进行从小到大排序，数据范围为 **-2^1024^ ~ +2^1024^**。其中**精确表示整数**的范围为**2^-53^(-9007199254740992) ~ 2^52^(90071992547409992)** 。超过精确范围的值将根据IEEE 754取/舍之后表示。

一般平台的长整型范围为-(2^63^) ~ (2^63^ - 1)

### 游戏通关记录排行榜

根据关卡通关耗时从小到大排序, 根据VIP等级**从大到小**排序，上榜时间从小到大三个条件进行排序。

首先将排序规则是从小到大还是从大到小进行统一，统一规则就可以，两种方式差别不大。根据本示例来讲，将VIP等级通过某种算法，转换为从小到大排序是比较合适的，例如：**将VIP等级上限设定为100级，使用100级减去当前VIP等级的差值从小到大排序**。

统一规则之后，下一步就是通过算法将排序影响因子数据转换为有序集合的score。
这里博主提供两个简单的实现思路以供参考。

假定本示例的三个影响因子的有效值分别为**等级经验值上限为整型（32位），vip等级上限为15级（8位），时间戳（32位）**

#### 按bit划分计算

**将双精度浮点数的64位的拆分并用于表达3个排序条件值**。很明显数据所需的位数（32+8+32=72）超过64位。
这种情况下，需要业务上做一些适当的妥协，缩减数值规模，例如：按照一定比例换算经验值和分值计算做一次除法运算，每1w点经验值为1"经验分"，这样24位的"经验分"就可以涵盖32位的整数。

例如：
第一个排序条件等级经验值，使用最高的24位，有效值范围为[0, 16777216]。
第二个当前，占用8位，有效取值[0, 127]。
剩余的32位，用于时间戳。

```java

int cost = 185215;
int vipLv = 10;
long mills = System.currentTimeMillis();
//  分别偏移40位, 32位
long redisScore = ((cost & 0xFFFFFFL) << 40) | (((100 - vipLv) & 0xFFL) << 32) | (mills & 0xFFFFFFFFL);

long tMills = redisScore & 0xFFFFFFFFL;
int tVipLv = (redisScore >> 32) & 0xFFL;
int tCost = (redisScore >> 40) & 0xFFFFFFL;
```

再举一个🌰，从上榜的时间戳这个字段入手，可以将时间戳换算为上榜时间至玩法赛季截至时间的秒数，同样可以缩减时间戳所需要的bit位数。

#### 大整数计算

**转换为字符串进行拼接**或者**BigInteger或BigDecimal**进行超大数据运算，然后将结果输出为双精度浮点数 **Double**。

示例算法 **Double.parseDouble(String.valueOf(cost) + (100 - vipLv) + mills)**

Double的精度缺失问题，在超大整数方面(大于2^53^)情况尤其突出。

```java
int cost = 185215;
int vipLv = 10;
long mills = 1667212407355L; // System.currentTimeMillis();
System.out.println(mills);
System.out.println("" + cost + vipLv + mills);
System.out.printf("score:%f", Double.parseDouble(String.valueOf(cost) + vipLv + mills));
System.out.println();
System.out.printf("score:%f", Double.parseDouble(String.valueOf(cost) + vipLv + (mills + 4_000L)));
System.out.println();
System.out.printf("score:%f", Double.parseDouble(String.valueOf(cost) + vipLv + (mills + 30_000L)));
//  185215101667212407355
//  score:185215101667212400000.000000
//  score:185215101667212430000.000000
//  score:185215101667212430000.000000
//  score:9223372036854775807
```

当通关耗时，VIP等级相同时，创建记录的时间(mills + 4s)和(mills + 30s)算出来的浮点数是一样的, 而实际上这两种中间相差26s的实际时间。

**总结：简单直观的拼接数据，但是需要评估双精度浮点数的就近舍去会不会导致业务极限情况下的异常。**


#### 混合位运算和大整数计算





### 合理的缩减数值规模

在不影响业务效果的情况，可以针对性的进行各种各样形式的**缩减数据规模**，达到优化排行榜Score的目的。




## 总结

详细可以查看 Redis 的[官方命令说明文档](http://redis.io/commands#sorted_set)
或笔者在 Okra 框架的 example 包下的
[示例代码](https://github.com/ogcs/Okra/blob/master/okra-examples/src/main/java/org/ogcs/okra/example/rank/RedisRankMain.java)
。
