---
layout: post
read_time: true
show_date: true
img: images/2022-11/tabby_readme.png
title: 开源跨平台终端模拟器 - Tabby
date: 2022-11-17 00:16:00 +0800
categories: [Tabby]
tags: [Tabby, 终端模拟器, 跨平台]
toc: yes
image_scaling: true
---


[Tabby](https://github.com/Eugeny/tabby)是一款跨平台高度配置化的终端模拟器。

在使用Tabby之前博主使用的XShell 6这款古董级软件的绿色免安装版。本文主要总结弃用XShell，使用Tabby的近半年的回顾和总结。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_readme.png" alt="新SSH链接" width="450px" height="400px" class="image-click-scaling"/></div>

## 为什么弃用XShell 6？

以前用的**绿色版**，商业版收费，绿色版时不时的提示升级，付费广告，最终不想继续折腾绿色版。其次开原生态逐渐成熟，**所谓的**平替产品层出不穷，截至目前位置，Tabby在Github累计标星40k+，算是生态中已经比较成熟一款，想尝尝鲜。

## Tabby

1. 集成 **SSH**，Telnet 客户端和连接管理器
1. 集成 **串行终端**
1. 定制主题和配色方案
1. 完全可配置的快捷键和多键快捷键
1. 分体式窗格
1. 自动保存标签页
1. 支持 PowerShell（和 PS Core）、WSL、Git-Bash、Cygwin、MSYS2、Cmder 和 CMD
1. 在 SSH 会话中通过 Zmodem 进行直接文件传输
1. 完整的 Unicode 支持，包括双角字符
1. 不会因快速的输出而卡住
1. Windows 上舒适的 shell 体验，包括 tab 自动补全（通过 Clink）
1. 为 SSH secrets 和设置集成了加密容器
1. SSH、SFTP 和 Telnet 客户端可用作 Web 应用（也可托管）


### 创建一个新的SSH链接

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_create_new_ssh.png" alt="新SSH链接" width="450px" height="400px" class="image-click-scaling"/></div>

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_create_new_ssh_config.png" alt="配置" width="450px" height="400px" class="image-click-scaling"/></div>

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_create_new_ssh_config_completed.png" alt="设置完成" width="450px" height="400px" class="image-click-scaling"/></div>


### Tabby体验回顾

相比于其他C或C++开发的工具，工具使用TypeScript编写，便携版（离线版）内置Chrome的V8引擎，使用开发网站前端的思路开发终端模拟器，虽然**内存占用较大**，但是同时可以享受积年累积的JS和CSS的成果。也确实得益于网站样式的迅猛发展和丰富多彩，Tabby可以**轻松的定制样式和主题风格**。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_config_colors.png" alt="配色方案" width="450px" height="400px" class="image-click-scaling"/></div>

高度可配置的特性让Tabby更轻松的实现**跨设备同步和共享配置**。保存好配置可以在任意地点在线SSH办公、排查问题、解决BUG。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_sync_configuration.png" alt="同步配置" width="450px" height="400px" class="image-click-scaling"/></div>


随时随地都可以联网就可以访问的 **[Tabby Web](https://app.tabby.sh/)** 在线工具

实用的窗口分栏功能，当我们一般要对照查看数据时，很方便。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_split_window.png" alt="分栏" width="450px" height="400px" class="image-click-scaling"/></div>

Tabby是通关**tags分组管理链接信息的，配合搜索功能**，可以帮助开发中在一大堆机器中快速找到对应的那一台。

目前依旧有不少BUG还没来得及修复，**版本稳定度不足**，。虽然有公共开源的在线服务帮助开发组测试，但是ISSUE反馈到修复整个流程还是比较冗长的，另外开源社区用爱发电，和纯商业公司还是有区别的。时不时的会出现意外全屏的情况，需要重启客户端。

**支持SFTP文件传输**，但是不稳定，经常莫名其妙的会出现异常，可以使用**sz和rz代替**。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/tabby_sftp.png" alt="设置完成" width="450px" height="400px" class="image-click-scaling"/></div>

## 参考资料

1. [Tabby 官网](https://tabby.sh/)
2. [Tabby Web App](https://app.tabby.sh/)


