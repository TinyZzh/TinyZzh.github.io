---
layout: page
title: InfluxDB - 安装
date: 2016-09-30 16:53:00 +0800
categories: [Database]
tags: [Database, InfluxDB]
---

本篇文章记录CentOS 7-x64操作系统，安装InfluxDB时序数据库。

环境:

 1. 系统 : CentOS 7-x64
 2. InfluxDB : 1.0.0


[InfluxDB下载页](https://www.influxdata.com/downloads/)
笔者下载[1.0.0版本](https://dl.influxdata.com/influxdb/releases/influxdb-1.0.0.x86_64.rpm)

CentOS

```shell
wget https://dl.influxdata.com/influxdb/releases/influxdb-1.0.0.x86_64.rpm
sudo yum localinstall influxdb-1.0.0.x86_64.rpm
```

启动influxdb

```shell
>systemctl start influxdb
```

创建配置文件influxdb配置文件:

```shell
>influxd config > influxdb.generated.conf
```

**8083端口用于后台管理界面, 8086端口用于HTTP API接口**

## 总结

笔者使用的是下载rpm之后安装的办法。
各位看官可以使用官网示例的安装过程[官方安装示例](https://docs.influxdata.com/influxdb/v1.0/introduction/installation/)














