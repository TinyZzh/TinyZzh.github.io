---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 漫谈生死狙击页游排行榜服务的迭代演进
date: 2022-10-21 16:16:00 +0800
categories: [JAVA, Redis, 排行榜]
tags: [JAVA, Redis, 排行榜]
toc: yes
image_scaling: true
---


微博点赞榜，粉丝/观众活跃榜，直播打赏/热度榜，关键词热搜榜等等，你是否曾经和我一样好奇这些排行榜是怎么实现的？

到底是怎样一个工具或方案支撑了这些充斥在我们生活日常方方面面的“排行榜”。

本期就通过回顾生死狙击页游排行榜迭代演进，漫谈生死一是如何实现排行榜业务的，为什么选中这样的技术方案。

### 远古时期的排行榜

我是2016年入职的，所以这里的远古也仅仅代指我入职初期这段时间。

实话讲，当时的排行榜实现方案还比较简陋，整个业务逻辑流程大概分为以下四个阶段：

1. 收集阶段：在业务代码中打点记录并收集玩家的原始数据，并写入MySQL数据库备用
2. 整理阶段：**每日凌晨**排行榜的定时更新任务，通过对数据的过滤和整理，筛选出有效数据，
3. 排序阶段：通过 **Collection.sort()** 对数据进行一次排序。
4. 输出阶段：将玩家的**当前排名信息curRank**、上次排名、玩家信息等结果信息写入到排行榜数据表中。

值得注意的是由于**每个排行榜记录中都包含一个名为curRank字段，表示记录在排行榜中的排名情况，所以在Collection.sort()后, 需要对每一个排行榜记录的curRank字段进行更新和赋值**。

### 石器时代

这个时期，策划童鞋引入跳跃模式，专注于游戏身法练习的特殊模式，并且希望有一种更及时一点的排行榜，帮助玩家更早更及时的关注到排名或者成绩的变化。而彼时生死狙击的**排行榜业务数据更新周期是每日**，显然不能满足策划童鞋的预期。

自此，博主也开始了和排行榜的不解之缘。并首次着手重构改进排行榜业务。

实现**实时排序**必须**追踪每次数据变动**，并根据数据变动堆排行榜数据更新。但是每次变动都调用**Collection.sort()**进行全量排序显然是一种极其消耗和浪费服务器性能的做法。跳跃排行榜有一个业务特点**玩家创造的排行榜数据只增不减，后续创造的较差的记录，不会影响以及记录在排行榜的记录**。梳理一下业务，概括成以下三个情况：

1. 排行榜上榜记录未达到上限时，上报的玩家记录必定上榜。
2. 排行榜记录达到上限时，未上榜玩家的上报记录超过排行榜最后一名时，必定上榜。
3. 已经上榜的玩家，创造更好的记录，排名只会**向前变动**。

这个方案的目的，**支持实时排序的同时避免使用Collection.sort()进行全量的排序，减少同步更新玩家curRank字段的成本，避免遍历全排行榜记录**。

排序的核心算法如下：

```java
/**
    * 实时排行榜排序.
    * 从排行榜最后一名开始向前检查并更新排名。
    * <p>1. 当var1等于null时, 比最后一名优秀, 排行榜一定变更</p>
    * <p>2. 当排行榜的length为0时, 排行榜一定变更， 第一名入榜</p>
    * <p>3. 当var1排序在bean右侧时, 玩家刷新个人记录，排行榜可能变更. 否则玩家排名不变</p>
    *
    * @param bean     新纪录
    * @param var0     旧记录
    * @param copyRank 排行榜列表
    */
protected boolean sortRank0(final B bean, final B var0, List<B> copyRank) {
    B var1 = var0;
    int endIndex;
    boolean isDirty = false;
    if (var1 == null) {
        var1 = bean;
        endIndex = copyRank.size() - 1;
        isDirty = true;
    } else {
        if (var1.isChanged(bean)) {
            var1.updateInfo(bean);
            setChanged(true);
        }
        if (var1.compareTo(bean) > 0) {
            var1.updateValue(bean);
            setChanged(true);
            endIndex = var1.curRank - 1;
            copyRank.remove(endIndex);
            endIndex--;
        } else {    //  排名未改变
            return false;
        }
    }
    int startIndex;
    if (copyRank.isEmpty()) {
        var1.curRank = 1;
        var1.lastRank = 0;
        copyRank.add(var1);
    } else {
        for (int i = endIndex; i >= 0; i--) {
            B next = copyRank.get(i);
            if (next.compareTo(var1) < 0) {
                startIndex = i + 1;
                var1.lastRank = var1.curRank;
                var1.curRank = startIndex + 1;
                copyRank.add(startIndex, var1);
                isDirty = true;
                break;
            } else {
                next.lastRank = next.curRank;
                next.curRank += 1;
                if (i == 0) {
                    var1.lastRank = var1.curRank;
                    var1.curRank = 1;
                    copyRank.add(0, var1);
                    isDirty = true;
                }
            }
        }
    }
    return isDirty;
}
```

### 工业时代

显然石器时代的方案比较落后。首先，**不支持有自动排名下降的需求**，只能和老方案一样通过 **Collection.sort()** 来处理。第二点，虽然方案中使用了泛型特性，一定程度上提高了代码的复用率，但是也引入了对记录类的泛型约束，**记录类必须继承BaseRankInfo**，这种实践随着时间推移，项目迭代，也被证明依旧不方便扩展，同时限制了父类的公共字段，创建和实现大量特异的子类数据类，**增加了排行榜记录类的维护成本**。第三点就是**排行榜都是硬编码实现的**，每次新增需求都会设计到技术排期、开发。

演进到“工业化时代”，我们试图对旧有业务进行抽象。抽象DB处理接口，数据Bean处理结构接口以及特定注解@GameRankTemplate等等对排行榜功能进行整合打包。**将打包后的排行榜定义为一个Rank特定的结构方案，并暴露给策划童鞋填模板表进行复用**。

```java
@Inherited
@Documented()
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface GameRankTemplate {

    /**
     * 排行榜的长度上限
     */
    int length() default Constant.RANK_MAX_LENGTH;

    /**
     * 数据库操作组件
     *
     * @return the bean's mybatis mapper.
     */
    Class<? extends GameRankBeanMapper> mapper() default DefaultGameRankBeanMapper.class;

    /**
     * Bean处理器. 数据加载完成后调用handler处理排行榜的数据.
     */
    Class<? extends GameRankBeanHandler> beanHandler() default RpgCharNameHandler.class;
}

public interface GameRankBeanMapper<T> {

    void createTable(int group);

    List<T> selectById(int group);

    void deleteById(int group);

    void batchInsert(int group, List<T> ranks);
}

public interface GameRankBeanHandler<T> {

    void handle(List<T> beans);

}
```

有一定的改进成果，首先**引入模板表配置，通过策划童鞋配置来复用排行榜结构，更灵活**，其次**通过配置，一定程度上解决硬编码问题，提高排行榜业务代码的复用率**。但是很明显，基于Rank的打包方案依旧不够通用，会因为排序规则，排序影响因子等而导致Rank结构不复用，后续迭代中技术定义的越来越多的Rank结构就足以说明一切。

### 后工业化时代

这次是一个颠覆性的重构，重写了生死狙击页游的排行榜业务，并借鉴**Redis的Sorted Set（跳表）**的一些思路，引入并使用skipList。

统一的排行榜的数据结构 **ReducedGameRank**，通过**descriptor**策划配置的模板表数据, 可以控制排行榜行为(e.g. 发奖，清榜 .etc)，**mappingMap**管理玩家排行榜记录，**sortedMap**是根据记录有序排序的玩家信息map。主要结构如下：

```java
public class ReducedGameRank implements Serializable {

    /**
     * Unique rank identify.
     */
    private final RankConfig config;
    /**
     * The rank struct description.
     */
    private final ReducedGameRankStructDescriptor descriptor;
    /**
     * Unique player's identify and rank score mapping map.
     * Unique Id - Sorted Key.
     */
    protected final ConcurrentHashMap<Object, Comparable> mappingMap;
    /**
     * player's rank goal and displayed rank info map.
     */
    protected final ConcurrentSkipListMap<Comparable, RankBean> sortedMap;
}
```

本次重构的另外一个重大变动是**弱化排行榜记录和个人信息两个对象类的各种限制**，同时客户端同步重构为**通过反射获取排行榜记录各个字段的数据值**，将各个业务中繁花似锦的对象bean结构和排行榜界面显示彻底解耦。

核心排序算法和sortRank0类似，源码：

```java
public boolean update(final Object uniqueId, final Comparable score, final Object displayInfo) {
    Assert.isInstanceOf(this.descriptor.getClzOfUniqueId(), uniqueId);
    Assert.isInstanceOf(this.descriptor.getClzOfScore(), score);
    Assert.isInstanceOf(this.descriptor.getClzOfInfo(), displayInfo);

    Comparable lastScore = this.mappingMap.get(uniqueId);
    if (lastScore != null
            && lastScore.compareTo(score) < 0) {
        //  if display info changed. replace by newly info.
        RankBean bean = this.sortedMap.get(lastScore);
        boolean infoChanged = bean != null && !Objects.equals(bean.getInfoBean(), displayInfo);
        if (infoChanged) {
            bean.setInfoBean(displayInfo);
            this.updateWithIncremental(bean, CHANGED);
        }
        return infoChanged;
    }
    if (hasMaxRankLength()) {
        Comparable lowest = this.lowest;
        if (lowest != null && lowest.compareTo(score) < 0) {
            return false;
        }
    }
    if (this.sortedMap.containsKey(score)) {
        LOG.error("player's rank data is conflicted. uniqueId:{}, score:{}, info:{}", uniqueId, score, displayInfo);
        return false;
    }
    RankBean bean = new RankBean(identify(), uniqueId, score, displayInfo, rank(uniqueId), GameClock.currentTimeMillis(), 0L, 0, true);
    this.lock.writeLock().lock();
    try {
        this.mappingMap.put(uniqueId, score);
        if (lastScore != null) {
            //  replace the prevent player's rank goal.
            RankBean prev = this.sortedMap.remove(lastScore);
            if (prev != null) {
                bean.setLastChangeDisplayFlag(prev.getLastChangeDisplayFlag());
                bean.setUpdateDisplayCount(prev.getUpdateDisplayCount());
                bean.setDisplay(prev.isDisplay());
            }
            this.updateWithIncremental(bean, CHANGED);
            this.sortedMap.putIfAbsent(score, bean);
        } else if (hasMaxRankLength()) {
            //  remove the lowest player's rank goal.
            RankBean removed = this.sortedMap.remove(this.sortedMap.lastKey());
            if (removed != null) {
                this.updateWithIncremental(removed, REMOVED);
            }
            this.updateWithIncremental(bean, ADDED);
            this.sortedMap.putIfAbsent(score, bean);
            this.lowest = this.sortedMap.lastEntry().getKey();
        } else {
            this.updateWithIncremental(bean, ADDED);
            this.sortedMap.putIfAbsent(score, bean);
            this.currentRankLength++;
        }
        this.rankChanged = true;
        return true;
    } finally {
        this.lock.writeLock().unlock();
    }
}
```

相比较sortRank0，**使用skipList解决了分数变动无法降低排名的问题**。

### 为什么选择自研而不是引入Redis呢？

Redis是缓存中间件领域的佼佼者，是主流的缓存中间件之一。从网站的服务器的技术架构方案上说，一个网站或多或少的都会使用到**缓存中间件**，用来缓存用户数据，在各个服务共享状态，降低DB的访问压力等等。

与此同时，Redis提供的多种数据类型中有一个名为**Sorted Set**有序集合。通过有序集合可以快速的对数据进行排序，查询时间复杂度为O(log(n))，核心原理是使用跳表，通过多层索引实现高效率的查询。**有序集合特性让Redis成为优先选则为实现涉及到排序类型的业务的根本原因，可以在不增加架构复杂度的基础上，快速可靠的实现新需求**。另外，网站的技术架构也让不少的公司使用**Redis做分布式锁**。

而生死一页游不选择的主要原因有一下几点：

1. 架构上需要单独引入Redis这个第三方中间件。增加架构复杂度。
2. Redis的sorted set通过一个长整型数值来排序。当排序条件超过4-5个时，需要业务层妥协(e.g. 缩减数据规模，降低精度 .etc)，此时就有些捉襟见肘了。
3. 相比于Redis的高可用架构，使用Java标准库的ConcurrentSkipListMap可以实现更高效且低成本的并发。接入目前的技术架构比较简单。

### 现今

排行榜服务实现了独立部署，快速启动，动态缓存

截至目前为止，排行榜服务接入超过**1500+**游戏排行榜。

经历多代演进，排行榜服务被剥离出主服务进程，作为一个单独的服务用于支撑全服的排行业务。




### 展望

列举一部分未尽的设想和未来展望。等后续有空的时候开发。

1. 排行榜模板和周期性重复模板，例如：按照赛季时间滚动的排行榜，赛季过期老的排行榜也就废弃了，但是新赛季配置基本一致。目前都需要重复的配置。
2. 排行榜服务负载不均衡。目前可以通过客户端负载均衡来协调排行榜服务的负载，但存在热点排行榜数据的问题，在高负载情况下，会出现响应慢等问题。
3. 支持无限长度排行榜。
4. 






## 参考资料

1. [Java 17 JVM logging framework](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html#enable-logging-with-the-jvm-unified-logging-framework)
2. [Embracing JVM unified logging](https://blog.arkey.fr/2020/07/28/embracing-jvm-unified-logging-jep-158-jep-271/)




