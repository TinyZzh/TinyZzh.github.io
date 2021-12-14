---
layout: page
title: 搭建自己的GitHub Pages
date: 2016-04-13 09:54:00 +0800
categories: [GitHub]
tags: [GitHub, Blog]
---

本文记录博主使用Win 10操作系统和Jekyll 3.1.2搭建GitHub Pages的过程。希望能帮助到相同有需要的朋友。

**[2016-10-09补充]**[升级Jekyll到3.2]({{site.baseurl}}github/2016/10/09/Build_GitHub_Pages_Update.html)

## 基本需求
 * [GitHub](https://github.com/)账号及一个命名为{GitHub昵称}.github.io的仓库
 * Jekyll软件 [Jekyll官网](https://jekyllrb.com/), [Jekyll中文站](http://jekyllcn.com/)

## 1.创建GitHub账号及用户名开头的仓库
:）.本步骤默认已经完成。

## 2. 安装Jekyll
Jekyll是一个将纯文本转换为静态博客网站的轻量级快速建站工作。也是GitHub Page官方推荐使用的静态网站生成工具(大量应用于GitHub内)。
下面开始安装过程。Jekyll是有Ruby开发, 所以依赖于Ruby环境。所以我们的第一步就是安装Ruby环境

### 2.1安装Ruby环境

下载Ruby环境和开发者工具包。下载地址：[Ruby Windows平台](http://rubyinstaller.org/downloads/)。

Ruby环境安装包：

![Ruby环境安装包]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s1.png){: style="float:none"}

Ruby DevKit安装包：

![Ruby DevKit安装包]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s2.png)

安装完成后打开命令行(或Win + R, 输入cmd回车)输入ruby -version ：

![检查]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s3.jpg)

### 2.2 安装Jekyll
在命令行中使用如下命令安装Jekyll:

```cpp
> gem install jekyll
```
![Jekyll安装成功]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s4.jpg)

![检查Jekyll安装成功]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s5.jpg)

笔者出现安装失败的情况。Google之后一说百说的推荐了淘宝Gem仓库，但是博主无法成功更换使用淘宝的Gem（HTTPS）。(淘宝的Gem目前已不支持Http连接)。
经过一番研究解决,博主命令如下:

```ruby
> gem sources --remove https://rubygems.org/ -a http://rubygems.org/
```

怀疑可能是Windows Installer安装的Ruby对Https支持不是很好。更换为http源就解决问题了。

### 2.3 markdown文档解析
Jekyll默认的md文档解析器是kramdown，缺省的代码高亮插件是rouge。详细的缺省配置见:[Jekyll缺省配置](https://jekyllrb.com/docs/configuration/).

未安装的可以使用以下命令安装.

```cpp
> gem install kramdown
> gem install rouge
```

### 2.4 代码高亮
无代码高亮需求的小伙伴无视本节内容即可。Jekyll相关的代码高亮插件有很多。本站使用CodeRay + rouge实现代码高亮。示例配置如下:

```cpp
markdown: kramdown  #  [rdiscount, karkdown]
highlighter: rouge #  [rouge, pygments]
kramdown:
  input: GFM
  extensions:
    - autolink
    - footnotes
    - smart
  enable_coderay: true
  syntax_highlighter: rouge
  coderay:
    coderay_line_numbers:  nil
```

### 2.4 创建Jekyll模板
创建一个简单的缺省页面示例。

```cpp
> jekyll new myblog
> jekyll build
> jekyll server
```

在浏览器访问``127.0.0.1:4000``预览文字及内容

本站使用的是Jekyll-uno模板，遵循MIT开源协议(博主通过Google搜索出来的)。

## 参考资料
 1. [GitHub Pages官方引导](https://pages.github.com/)
 2. [一步一步引导在Windows系统安装Jekyll](http://jekyll-windows.juthilo.com/)
 3. [CodeRay插件](http://coderay.rubychan.de/)
 4. [rouge插件](https://github.com/jneen/rouge)


