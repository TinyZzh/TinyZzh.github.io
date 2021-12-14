---
layout: page
title: Python - 安装py环境
date: 2016-09-12 23:27:00 +0800
categories: [Python]
tags: [Python]
---

昨天帮同事从MySQL数据库统计查运营数据。越查越感觉到深深的恶意（要查的数据太多了，而且由于数据量问题，每一个SQL执行时间都比较长）。
于是下定决心折腾一下Python。下次可以用脚本去完成查询操作。避免人工手动查询的作死。

第一天下午开始学习Python，折腾下载和安装相关的环境。今天搞定了记录一下。

笔者从事网络游戏服务器开发，业务基本不需要Python脚本，感觉linux环境需要一个脚本语言，快速帮助自己开发一些小工具。
且一般CentOS 6.5和7.0操作系统打交道比较多。 CentOS系统默认自带Python环境是2.x版本。最终选择学习python 2.x 而不是3.x。

开发环境：Windows 10
编辑器：PyCharm 2016 社区开源版

## 安装Python环境

下载python 2.7.12[官网下载地址](https://www.python.org/downloads/)版本。选择[“Windows x86 MSI installer”](https://www.python.org/ftp/python/2.7.12/python-2.7.12.msi)
下载安装对应版本。

## 安装MySQLdb

初次入门就直接选择mysql相关的内容作为切入口(新手不推荐这么做)，MySQL安装遇到很多坑。

```shell
#> pip install MySQL-python
```

提示缺少VC对Python的编译环境。

下载和安装VCForPython27[下载地址](http://www.microsoft.com/en-us/download/details.aspx?id=44266)

继续pip安装。依旧报错

```shell
#> ... Cannot open include file: 'config-win.h': .....
```

一番Google之后改用easy_install。easy_install默认在{$_PYTHON_HOME}/Scripts/目录下和pip同级。

```shell
#> easy_install MySQL-python
```

在公司采用这种方式顺利安装MySQL扩展完成。

晚上回家之后重复走了一遍安装配置流程。网络不好的情况，会出现time out问题。
一番尝试，最后没办法修改为从[MySQL-python](https://pypi.python.org/pypi/MySQL-python)
下载对应的版本[MySQL-python-1.2.5.win32-py2.7.exe (md5)](https://pypi.python.org/packages/27/06/596ae3afeefc0cda5840036c42920222cb8136c101ec0f453f2e36df12a0/MySQL-python-1.2.5.win32-py2.7.exe#md5=6f43f42516ea26e79cfb100af69a925e)

## 测试示例

```python
#!/usr/bin/python
# -*- coding: UTF-8 -*-

import MySQLdb

config = {'host': '127.0.0.1', 'db': 'test_db', 'user': 'root', 'passwd': '123456'}
try:
    conn = MySQLdb.connect(host=config['host'], db=config['db'], user=config['user'], passwd=config['passwd'])
    conn.set_character_set('utf8')

    cur = conn.cursor()
    cur.execute("show databases;")

    cur.close()
    conn.close()
except MySQLdb.Error, e:
    print "Mysql Error %d: %s" % (e.args[0], e.args[1])

print "endl"
```

## 总结

至此, 完整的python环境就安装好了。enjoy it !
