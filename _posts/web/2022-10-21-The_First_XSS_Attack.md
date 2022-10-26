---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: XSS攻击实战 - 破解网站水印，右键复制屏蔽，打印屏蔽等等
date: 2022-10-21 22:04:00 +0800
categories: [XSS]
tags: [XSS]
toc: yes
image_scaling: true
---

你是否有过这样一段类似的经历。
想复制网页上的文字，提示你需要登录! 内容被强制追加了宣传广告！
想保存网页上的图片，确发现右键被禁用，单击右键没反应！
想打印网页，但是打印预览无法正确预览内容！
想下载mp3，网站只提供试听，不提供下载！
看过的视频，想保存确找不到下载地址！

本文带你走近XSS跨站脚本攻击（[浅谈跨站脚本攻击(XSS)那些事儿](https://lexiangla.com/teams/k100015/docs/f1e03ebc47ab11edbd42de5d75efa922?company_from=7789a506315c11ec8a0d9acd63fadb80)）的世界。用常见的几个场景示例，带你理解XSS攻击, 学习和简单使用XSS攻击技术。**存储型XSS和反射型XSS不在本文讨论范围内**，至于为什么不在本文分享，⭐懂的都懂 :star: 。

本文开始之前需要感兴趣的同学对**Html、CSS、JavaScript**有基础的了解和概念。

本文以**Chrome浏览器**为例，**使用方法适用于市场上所有主流的浏览器**。
主要工具是 浏览器内置的**Chrome DevTool**
涉及演示的网站：**[Hi库](https://lexiangla.com/)、[CSDN](https://blog.csdn.net)、[360doc](https://www.360doc.com)、[起点中文网](https://www.qidian.com)**


### Chrome DevTool

工欲善其事必先利其器。在开始操作之前，需要简单介绍一下我们需要使用的工具。浏览器自带的开发调试工具，本文主要就是Chrome DevTool。打开网站，按**F12**打开开发者工具。浏览器的下方会弹出如下图所示的界面。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/chrome_devtool.png" alt="-"/></div>

本文主要会涉及**Elements、Sources、Network**三个子页签，分别对象网页元素，网站资源和网站下载内容。


## 解除网页的各种限制

本小节主要分享和演示通过修改DOM以接触各种网页的限制。例如：复制按钮被劫持、鼠标右键失效，无法打印等等。

### 解除Hi库乐问无法复制回答的限制

乐问题主的问题是可以复制的，但是问答的回复是不能复制的，假如你收到下图所示的回复，回复的是网址url而不是超链接时，就尴尬了。由于无法复制打开网址，我该怎么查看呢？

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/hiku_lewen_copy_limit.png" alt="-"/></div>

按**F12**打开调试工具，在乐问无法复制的地方鼠标右键选择查看，下方Elements面板就会定位到需要复制的内容，在面板中复制即可。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/hiku_lewen_copy_operation.png" alt="-"/></div>

如何让避免这种尴尬的问题呢？
**在回答里面使用超链接类型，替代直接粘贴网站地址。**
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/hiku_lewen_href.png" alt="-"/></div>


### 去除Hi库的防泄密水印

我一般写文章是会写到个人博客里面，然后再使用Chrome Print打印导出为PDF再发布到Hi库中。有时候会相反。此时就需要把Hi库的文档导出出来。然而很明显受限于Hi库的防泄密水印这个想法并不好实现。那有没有办法处理呢？ 答案肯定是有的。

关于水印有非常多的实现方案，本小节只讨论Hi库的方案，它是通过watermark.vue的插件实现的，原理就是使用和生成一张透明背景的png图片，内嵌到网页中。只需要在Elements中删除这些内嵌的元素即可。

**Ctrl+F**搜索**watermark**关键字，你会搜到如下图所示的结构：
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/hiku_lewen_watermark.png" alt="-"/></div>

使用**Delete**删除这些内容即可。同一个网页会有多个此类型的元素，按需求删除就可以了。


### 解决Hi库的导出打印限制

有些同学可能没使用过Chrome Print功能。这是浏览器自带的一种打印接口工具，可以连接打印机打印网页，也可以打印导出为PDF格式文件，属于非常实用的工具功能之一。有空我会针对Chrome浏览器的实用插件进行一期分享。

Hi库的方案是再网页的头部增加一个名称为print的media。浏览器打印会根据这个标签控制打印的样式，将打印的内容和样式设置为空白。源码如下：

```html
<link rel="stylesheet" type="text/css" media="print" href="//static.lexiang-asset.com/build/css/common/print-a52d141bed.css">
```

```css
.breadcrumb,.comment-container,.footer,.header-general-container,.like-favorite,.team-top-section {
 box-shadow:none;
 display:none
}
.exam-paper.block-container {
 box-shadow:none
}
body {
 background-color:#fff
}
@page {
 size:auto;
 margin:.8cm 0 1cm 0
}
```

了解其实现方案，破解也就变得很简单了，在我们使用**Ctrl+P**后预览打印的内容为空白的页面，此时Hi库的js脚本监听了我们的安检，并给页面的根节点**app-layout**增加一个class **class="disable-print"** 打开打印预览，然后移除这个属性，再打印预览里面刷新一下就可以正确的看到预览。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/hiku_lewen_print_limit.png" alt="-"/></div>


### 解除360doc的防未登录复制的限制

使用搜索引擎时，经常会搜到360doc的结果词条，点入之后，**鼠标右键被劫持，使用Ctrl+C时强制弹窗提示登录和付费**。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/360doc_login.png" alt="-"/></div>


### 解除

CSDN登录限制
javascript:document.body.contentEditable='true';document.designMode='on';


### 原理


## 资源和素材提取

本节主要演示通过Network面板提取资源素材，下载mp3音乐，mp4视频等等。

### 提取mp3音频文件

很多音乐网站都提供**完整音频试听**服务。**1分钟试听的这种除外**，这种类型的试听往往整个音频文件是切割过的，只有1分钟有效数据，无法简单的破解提取。





## 这也算XSS攻击？

没错，以上的例子在广义上讲都属于XSS攻击范畴。属于危害相对较轻的DOM型攻击，虽然我们可能自认为没有进行**破坏性**的攻击网站。但是违背网站站长原意的操作，何尝不是一种破坏呢？且用且珍惜。

DOM攻击的原理基本上都是一样的，只不过网络黑产使用的手段更隐蔽，更自动化，工业化。

给大家再举一个场景🌰。现在的博客很多都会有打赏看全文的限制，假如通过一些手段劫持并修改转账的按钮的链接，此时域名显示的支付是二维码，二维码图片读者也不太可能去验证真伪，这个时候你的打赏被错误的转给攻击者，造成作者的直接经济损失。是不是很可怕？

更深入的一些手法例如：通过盗取你浏览器里面的认证信息，并冒用你的凭证，去破坏你的用户数据，使用你的账户余额等等。


### 要如何防御呢？

假如说要改进，增加防破解的门槛，有哪些途径和路子呢？ 

这里举简单的两个方向🌰。更多详细内容，见[浅谈跨站脚本攻击(XSS)那些事儿](https://lexiangla.com/teams/k100015/docs/f1e03ebc47ab11edbd42de5d75efa922?company_from=7789a506315c11ec8a0d9acd63fadb80)这篇文章。

最简单，最有效，最直接的方案莫过于架构修改为**服务器渲染**，仅下发展示所需的最小数据集。这种方式有效且很难被破解。但是缺点也很明显和目前主流的前后端分离开发的思想不一致（**目前htmlx有抬头的趋势**）。粗俗点说，都改成服务器渲染了，你还想顺着网线爬过来，然后跳起来打我膝盖？怕不是想屁吃。

> 假如有熟悉**HtmlX**的大佬，期待大佬深入剖析一下。

客户端的套路，基本上治标不治本，防君子不防小人，只是无谓的增加破解门槛，没有真正意义的**防御**作用。
例如：检测到打开console就使用setInterval()开始一个定时弹窗提示或清空界面数据。通过sources面板找到源码，并用断点debug就可以绕过。






