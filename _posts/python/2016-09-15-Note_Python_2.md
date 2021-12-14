---
layout: page
title: Python - 语法基础
date: 2016-09-15 21:15:00 +0800
categories: [Python]
tags: [Python]
---

**第一次接触程序且语言是Python，推荐仔细看一下本文章**. 内容主要介绍Python的一些语法基础信息

## 1. Hello World！

创建第一个python文件hello_world.py,

```python
#!/usr/bin/python
# -*- coding: UTF-8 -*-
print("Hello World!")
```

第一行: 调用/usr/bin下的python解释器

第二行: **-*- coding: UTF-8 -*-**用于解决文件编码问题。

第三行: 输出Hello World！文本

## 2. Python保留关键字

![Alt text]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/py_img_1.jpg)

## 3. 标准数据类型

### 3.1 数字

数字类型有四种 : int, long, float, complex

### 3.2 字符串

略

### 3.3 列表(list)

```python
# 1. 创建list - 内部元素没有类型要求
list = ['abc', "xxx", True, 10, 10.5, [1, 2]]

# 2. 元组索引，截取
# 获取第一个元素
first = list[0]
# 获取最后一个元素
last = list[len(list) - 1]
# 截取list
ary = list[1:3]     # ["xxx", True]
ary1 = list[-5:-3]      # ["xxx", True]

# 3. 删除
del list[2]
# 清空list
# 方式一
del list[:]
# 方式二
list[:] = []
```

### 3.4 元组

```python
#  1. 创建元组  -  类似于list
tuple = ()
tuple1 = ('xx', 'yy', 1, 2.0, ['x', 1])
#   只包含一个元素时，需要在元素后面添加逗号
tup1 = (50,)

#  2. 修改操作
# 禁止修改元素值
# tuple[0] = 100;
tup1 = (12, 34.56)
tup2 = ('abc', 'xyz')
tup3 = tup1 + tup2

#  2. 删除操作
del tup3

# 3. 元组索引，截取 - 类似于list

# 4. 任意无符号的对象，以逗号隔开，默认为元组
x, y = 1, 2
tuple = x, y
```

### 3.5 字典

```python
#  1. 创建
info = {"name": 'lily', 'age': 17, 'isAdult': False}
#  2. 访问
print(info['name'])

#  3. 修改
info['name'] = 'lucy'

#  4. 删除
del info['name']    # 删除键是'Name'的条目
info.clear()     # 清空词典所有条目
del info         # 删除词典
```

## 4. 条件与循环

```python
var1 = 1
var2 = 2
if var1 == var2:
    print var1
elif var1 == 0:
    print 0
else:
    print var2
```

```python
world = 'Python'
#  for
for letter in world:
    print 'for:', letter
#  while
index = 0
while (index < len(world)):
    print 'while:', world[index]
    index += 1
# while - break
in dex = 0
while (1):
    if index >= len(world):
        break
    print 'while - break:', world[index]
    index += 1
```

## 4. 日期与时间

Python的日期时间类库time和datetime库

推荐文章[链接地址](http://www.wklken.me/posts/2015/03/03/python-base-datetime.html)


























