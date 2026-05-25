---
layout: post
title: 搭建自己的GitHub Pages
date: 2016-04-13 09:54:00
categories: [GitHub]
tags: [GitHub, Blog]
---

本文记录博主使用 Win 10 操作系统和 Jekyll 3.1.2 搭建 GitHub Pages 的过程。希望能帮助到相同有需要的朋友。

**[2016-10-09 补充]**[升级 Jekyll 到 3.2]({{site.baseurl}}github/2016/10/09/Build_GitHub_Pages_Update.html)

## 基本需求

- [GitHub](https://github.com/)账号及一个命名为{GitHub 昵称}.github.io 的仓库
- Jekyll 软件 [Jekyll 官网](https://jekyllrb.com/), [Jekyll 中文站](http://jekyllcn.com/)

## 1.创建 GitHub 账号及用户名开头的仓库

:）.本步骤默认已经完成。

## 2. 安装 Jekyll

Jekyll 是一个将纯文本转换为静态博客网站的轻量级快速建站工作。也是 GitHub Page 官方推荐使用的静态网站生成工具(大量应用于 GitHub 内)。
下面开始安装过程。Jekyll 是有 Ruby 开发, 所以依赖于 Ruby 环境。所以我们的第一步就是安装 Ruby 环境

### 2.1 安装 Ruby 环境

下载 Ruby 环境和开发者工具包。下载地址：[Ruby Windows 平台](http://rubyinstaller.org/downloads/)。

Ruby 环境安装包：

![Ruby环境安装包]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s1.png){: style="float:none"}

Ruby DevKit 安装包：

![Ruby DevKit安装包]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s2.png)

安装完成后打开命令行(或 Win + R, 输入 cmd 回车)输入 ruby -version ：

![检查]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s3.jpg)

### 2.2 安装 Jekyll

在命令行中使用如下命令安装 Jekyll:

```cpp
> gem install jekyll
```

![Jekyll安装成功]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s4.jpg)

![检查Jekyll安装成功]({{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/s5.jpg)

笔者出现安装失败的情况。Google 之后一说百说的推荐了淘宝 Gem 仓库，但是博主无法成功更换使用淘宝的 Gem（HTTPS）。(淘宝的 Gem 目前已不支持 Http 连接)。
经过一番研究解决,博主命令如下:

```ruby
> gem sources --remove https://rubygems.org/ -a http://rubygems.org/
```

怀疑可能是 Windows Installer 安装的 Ruby 对 Https 支持不是很好。更换为 http 源就解决问题了。

### 2.3 markdown 文档解析

Jekyll 默认的 md 文档解析器是 kramdown，缺省的代码高亮插件是 rouge。详细的缺省配置见:[Jekyll 缺省配置](https://jekyllrb.com/docs/configuration/).

未安装的可以使用以下命令安装.

```cpp
> gem install kramdown
> gem install rouge
```

### 2.4 代码高亮

无代码高亮需求的小伙伴无视本节内容即可。Jekyll 相关的代码高亮插件有很多。本站使用 CodeRay + rouge 实现代码高亮。示例配置如下:

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

### 2.4 创建 Jekyll 模板

创建一个简单的缺省页面示例。

```cpp
> jekyll new myblog
> jekyll build
> jekyll server
```

在浏览器访问`127.0.0.1:4000`预览文字及内容

本站使用的是 Jekyll-uno 模板，遵循 MIT 开源协议(博主通过 Google 搜索出来的)。

## 参考资料

1.  [GitHub Pages 官方引导](https://pages.github.com/)
2.  [一步一步引导在 Windows 系统安装 Jekyll](http://jekyll-windows.juthilo.com/)
3.  [CodeRay 插件](http://coderay.rubychan.de/)
4.  [rouge 插件](https://github.com/jneen/rouge)
