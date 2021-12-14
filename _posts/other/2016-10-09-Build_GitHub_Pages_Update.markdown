---
layout: page
title: 搭建自己的GitHub Pages(二) - 升级Jekyll到3.2
date: 2016-10-09 15:01:00 +0800
categories: [GitHub]
tags: [GitHub, Blog]
---

4月份的时候博文记录搭建3.0的环境[搭建自己的GitHub Pages]({{site.baseurl}}github/2016/04/13/Build_GitHub_Pages.html)。
最近升级Jekyll到最新版本(**3.2**)。

博主之前为了方便写了一个简单的批处理用于快速启动Jekyll本地服务器。升级Jekyll之后发现批处理启动不起来，批处理脚本报错。
于是去官网查看一下原因。 发现版本变更貌似影响还比较大. 记录一下升级过程:


[官网](http://jekyllrb.com/)引导如下:

```shell
~ $ >gem install jekyll bundler
~ $ >jekyll new my-awesome-site
~ $ >cd my-awesome-site
~/my-awesome-site >bundle exec jekyll serve
# => Now browse to http://localhost:4000   (现在浏览器打开http://localhost:4000)
```

**博主对ruby了解甚少，假如不是Jekyll的话，可能都不会和ruby产生交集。所以...不要苛求**

Jekyll引入的Bundler，博主从未接触过，从纯新人角度跟着官网的示例一行一行的执行命令记录自己踩的坑。

## Step 1: 遇到gem报SSL_connect错误

win7系统电脑, 使用ruby installer安装完ruby环境.

当时不知道因为啥引发的，但是根据错误输出知道是SSL引发的问题。增加http的gem仓库解决。

默认的gem是**https://rubygems.org/**

```shell
> gem sources --add http://rubygems.org/
```

## Step 2: bundle install

首先安装完bundler之后，进入jekyll目录(Gemfile)文件所在目录, 执行:

```shell
$> bundle exec jekyll serve
```

输出一段英文. 大意是需要bundle install先执行一次。

```shell
~ $> bundle install
```

win10电脑很顺利的安装完成了bundle install的各种安装下载等等巴拉巴拉....
但是在win7电脑的时候，
cmd中执行之后中途会因为各种各样的问题停下来。请按照输出的提示安装相对于的库? 等等还是蛮多的。

```shell
~$> gem install execjs -v '2.7.0'
```

当时没注意，直接无脑的按照提示命令进行手动安装，居然手动安装成功了。也是感觉怪怪的，不知道啥原因也。
紧跟着手动处理了两三次，感觉有点不正常，于是下决定查一下原因，
仔细看输出信息，发现都是因为SSL连接引发，再跟着注意到Gemfile中gem仓库使用的是https
修改为http之后，在执行install，一步到底。解决

## 脱坑

隔了几天再去查SSL_connect错误原因，发现下面的文章[脱坑办法](https://github.com/ruby-china/rubygems-mirror/wiki)

感觉还是直接http算了。折腾。反正博主基本上除了GitHub pages基本上也不用ruby




