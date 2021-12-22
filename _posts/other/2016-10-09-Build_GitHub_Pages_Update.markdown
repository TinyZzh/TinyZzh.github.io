---
layout: post
title: 搭建自己的GitHub Pages(二) - 升级Jekyll到3.2
date: 2016-10-09 15:01:00 +0800
categories: [GitHub]
tags: [GitHub, Blog]
---

4 月份的时候博文记录搭建 3.0 的环境[搭建自己的 GitHub Pages]({{site.baseurl}}github/2016/04/13/Build_GitHub_Pages.html)。
最近升级 Jekyll 到最新版本(**3.2**)。

博主之前为了方便写了一个简单的批处理用于快速启动 Jekyll 本地服务器。升级 Jekyll 之后发现批处理启动不起来，批处理脚本报错。
于是去官网查看一下原因。 发现版本变更貌似影响还比较大. 记录一下升级过程:

[官网](http://jekyllrb.com/)引导如下:

```shell
~ $ >gem install jekyll bundler
~ $ >jekyll new my-awesome-site
~ $ >cd my-awesome-site
~/my-awesome-site >bundle exec jekyll serve
# => Now browse to http://localhost:4000   (现在浏览器打开http://localhost:4000)
```

**博主对 ruby 了解甚少，假如不是 Jekyll 的话，可能都不会和 ruby 产生交集。所以...不要苛求**

Jekyll 引入的 Bundler，博主从未接触过，从纯新人角度跟着官网的示例一行一行的执行命令记录自己踩的坑。

## Step 1: 遇到 gem 报 SSL_connect 错误

win7 系统电脑, 使用 ruby installer 安装完 ruby 环境.

当时不知道因为啥引发的，但是根据错误输出知道是 SSL 引发的问题。增加 http 的 gem 仓库解决。

默认的 gem 是**https://rubygems.org/**

```shell
> gem sources --add http://rubygems.org/
```

## Step 2: bundle install

首先安装完 bundler 之后，进入 jekyll 目录(Gemfile)文件所在目录, 执行:

```shell
$> bundle exec jekyll serve
```

输出一段英文. 大意是需要 bundle install 先执行一次。

```shell
~ $> bundle install
```

win10 电脑很顺利的安装完成了 bundle install 的各种安装下载等等巴拉巴拉....
但是在 win7 电脑的时候，
cmd 中执行之后中途会因为各种各样的问题停下来。请按照输出的提示安装相对于的库? 等等还是蛮多的。

```shell
~$> gem install execjs -v '2.7.0'
```

当时没注意，直接无脑的按照提示命令进行手动安装，居然手动安装成功了。也是感觉怪怪的，不知道啥原因也。
紧跟着手动处理了两三次，感觉有点不正常，于是下决定查一下原因，
仔细看输出信息，发现都是因为 SSL 连接引发，再跟着注意到 Gemfile 中 gem 仓库使用的是 https
修改为 http 之后，在执行 install，一步到底。解决

## 脱坑

隔了几天再去查 SSL_connect 错误原因，发现下面的文章[脱坑办法](https://github.com/ruby-china/rubygems-mirror/wiki)

感觉还是直接 http 算了。折腾。反正博主基本上除了 GitHub pages 基本上也不用 ruby
