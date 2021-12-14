---
layout: page
title: Glances监控服务器状态
date: 2016-10-01 22:17:00 +0800
categories: [CentOS, Python]
tags: [CentOS, Python]
---

Glances是Python编写的基于curses的跨平台系统监控工具。

最近leader引入了InfluxDB + Grafana做服务状态监控，主要监控用户在线，队列IO，线程状态等服务端服务有关性能指标和参数。
笔者在服务监控这块接触的并不是特别多。所以打算花点业余时间研究记录学习一下。

在这个过程中想到是否可以利用Python脚本解析(top, iostat)等工具的监控数据，汇总并上报信息到InfluxDB，在Grafana显示，
实现对服务器机器状态的监控。

万事先Google，看看是否有前辈已经造轮子，避免重复制造垃圾轮子。o(∩_∩)o 哈哈

Google发现了Glances项目，使用Python开发并且直接支持InfluxDB+Grafana输出显示。

## 从Glances安装开始

Glances提供多系统的多种安装途径。本文只记录笔者安装流程和遇到的问题。

依赖：

 1. ```python 2.7,>=3.3```
 2. ```psutil>=2.0.0```
 3. ```setuptools```

可选依赖:

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/img_2016-10-01-1.png)

有兴趣可以参见官网[说明文档](https://github.com/nicolargo/glances)

环境：

 1. 操作系统 : CentOS 7-x64
 2. Python版本 : 2.7.8(系统自带)


值得一提的是，安装过程中**庆幸也是不幸**的事情是 : 安装过程笔者没遇到啥问题。

我只能攒一句Glances官方提供的自动安装初始化脚本 [下载地址](https://bit.ly/glances)支持的太好了。

```shell
> curl -L https://bit.ly/glances | /bin/bash
```

对于InfluxDB相关的参数配置:

```javascript
[influxdb]
host=localhost
port=8086
user=root
password=root
db=glances  # InfluxDB中的数据库 - 启动Glances前要创建对应的数据库
tags=foo:bar,spam:eggs
```

启动Glances：

```shell
> glances --export-influxdb
```

## 配置Grafana数据源

同样庆幸也是不幸的是：Glances提供了便捷的模板配置。官网模板配置:[下载地址](https://github.com/nicolargo/glances/blob/master/conf/glances-grafana.json)

在Grafana中选择"Import" -> glances-grafana.json文件

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/img_2016-10-01-2.png)

**Grafana导入的*.json文件中的datasource配置必须对应InfluxDB中的db，否则无法找到数据源**


## 总结

至此，整个环境就安装好了。看一下效果：

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/img_2016-10-01-3.png)

Glances监控包括CPU，IO，网络，磁盘等等。Enjoy it!!!






















