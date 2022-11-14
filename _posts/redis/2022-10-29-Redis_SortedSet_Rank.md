---
layout: post
title: 如何用Redis实现高性能高可用排行榜服务？
date: 2022-10-29 9:00:00 +0800
categories: [Redis, 排行榜]
tags: [Redis, 排行榜]
read_time: true
show_date: true
img: images/2022-10/Redis_Logo.svg
toc: yes
image_scaling: true
---

微博点赞榜，粉丝/观众活跃榜，直播打赏/热度榜，关键词热搜榜等等，你是否曾经和我一样好奇这些排行榜是怎么实现的？

到底是怎样一个工具或方案支撑了这些充斥在我们生活日常方方面面的“排行榜”。

本文就介绍如何使用Redis实现高性能高可用排行榜服务。

## Redis [有序集合(Sorted Sets)](https://redis.io/docs/data-types/sorted-sets/)

[有序集合(Sorted Sets)](https://redis.io/docs/data-types/sorted-sets/)是[Redis](https://redis.io/docs/)内置的一种基于跳跃表(skip list)，时间复杂度为O(log(N))数据类型。

本文的基础都是基于Redis的有序集合。

## Redis相关命令

### [ZADD](https://redis.io/commands/zadd/)

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


### [ZINCRBY](https://redis.io/commands/zincrby/)

当记录存在时，值为正数时，累加score的值, 当值为负数时，减少score值.
当记录不存在时，和 **ZADD** 类似插入一条新记录。

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

### [ZRANGE](https://redis.io/commands/zrange/)

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

### [ZRANK](https://redis.io/commands/zrank/)

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

### [ZCARD](https://redis.io/commands/zcard/)

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
这种情况下，需要业务上做一些适当的妥协，缩减数值范围。

例如缩减等级经验值的数值范围。最简单的办法，按照一定比例换算经验值和分值计算做一次除法运算，例如：将10000游戏经验值转换为1"排行榜经验分数"，这样24bits的的"经验分"就可以涵盖32bits的整数的数值范围。

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

当然也可以从上榜的时间戳字段入手, 假如游戏排行榜是按照赛季分，且一个周期时间为2个月，将时间戳换算为上榜时间至玩法赛季截至时间的秒数，数据有效范围为[0, 24 * 3600 * 60 = 5_184_000]，只需要23bits（2^23^=8,388,608）就满足需求。

#### 数值字符串拼接成大整数

第二种方案就更简单粗暴了，将**数值字符串进行拼接**，然后将字符串转换为为双精度浮点数 **Double**。

这个方案和上例一样会有丢失精度的问题，在大于2^53^的整数方面，情况尤其突出。

```java
//  排行榜分数计算公式
double score = Double.parseDouble(String.valueOf(cost) + (100 - vipLv) + mills);

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

#### 分段百分比拼接

结合上面两种方案，将数据通过除法换算，在根据实际需求按照十进制偏移n位后取整，再复用字符串拼接，组合出最终的Score分数。 
例如将等级经验转换为最大值的比例程度，再精确到小数点后6位，：101w/10e = 0.001在进行十进制位偏移6位，转换为1010，无论是使用bits亦或是字符串拼接，数值范围都不是很大。

这种方法更需要不断调整和结合实际业务需求。仅提供一种思路。

### 合理的缩减数值范围

一方面，在不影响业务效果的情况，应该尽可能的进行各种各样形式的**缩减数值范围**，达到优化排行榜Score的目的。另一方面，缩减数值范围虽然方便Score的生成和排序，也或多或少的影响了排序的数据精度。

不断调整，逐步在数值和Score算法之间取得一个平衡，才能将Redis更好的应用于我们的排行榜。

## 参考资料

1. [Redis Sorted Sets Docs](https://redis.io/docs/data-types/sorted-sets/)
2. [Try Redis IO](https://try.redis.io/)
