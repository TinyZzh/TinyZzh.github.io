---
layout: post
read_time: true
show_date: true
img: images/logo/windows_11_logo.png
title: Windows无界鼠标(Mouse without Borders)
date: 2023-02-16 12:16:00 +0800
categories: [Windows, 无界鼠标]
tags: [Windows, 无界鼠标]
toc: yes
image_scaling: true
mermaid: true
---

当**仅有一台电脑主机多个显示器** 时，我们可以很轻松的通过HDMI等连接线，使用**一套键盘鼠标设备**，在扩展我们的显示屏的同时，在多个屏幕中操作。
但是假如**有多台电脑主机，多个显示器**，每台主机都有其单独的用处，如何才能**使用一套键盘鼠标外设操作多台电脑**呢？


本文分享微软开发的Windows下的无界鼠标驱动[下载地址](https://www.microsoft.com/en-us/download/details.aspx?id=35460)。仅需要简单的几步，就可以一套键鼠无缝切换操作多台电脑。


## 安装微软无界鼠标

需要无缝切换键鼠的主机或笔记本都需要安装无界鼠标驱动。安装步骤掠过，一路Next即可。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_1.png" alt="xx" class="image-click-scaling"/></div>

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_2.png" alt="xx" class="image-click-scaling"/></div>

## 配置

首次打开弹出界面为**主电脑**和 **其他电脑** 选项界面，主要使用的电脑点 “YES” 即可。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_3.png" alt="xx" class="image-click-scaling"/></div>

主机界面会跳转到 **安全码** 和 **电脑名** 界面，**无界鼠标软件通过电脑名链接局域网内的其他电脑**。

其他主机生成安全码之后在主机中输入，连接成功之后。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_4.png" alt="xx" class="image-click-scaling"/></div>

拖动电脑icon可以控制显示屏鼠标切换顺序和位置。默认为 **右侧边无缝切换副主机**。
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_5.png" alt="xx" class="image-click-scaling"/></div>

点击“Two Row”可以切换为两行的显示屏模式。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_6.png" alt="xx" class="image-click-scaling"/></div>


## 其他设置

登录成功之后，建议 IP Mappings 设置一下电脑主机名和ip地址的映射，避免电脑主机名找不到的问题。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/windows_mwb_7.png" alt="xx" class="image-click-scaling"/></div>

## FAQ

问题基本上就是局域网网络连不上。
