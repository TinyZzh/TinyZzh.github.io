---
layout: post
read_time: true
show_date: true
title: 逆向实验室 - 处理Cocos Creater打包的Apk
date: 2022-03-16 15:09:00 +0800
categories: [Apk, 逆向工程]
tags: [Apk, Cocos Creater, 逆向工程]
toc: yes
image_scaling: true
---

逆向提取安卓的apk包里面的资源。

本期主要处理cocos creater发布的apk包, 默认使用xxtea算法进行加密/解密.



VSCode安装 [Hex Editor](https://marketplace.visualstudio.com/items?itemName=ms-vscode.hexeditor) 插件. 
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/3.png" alt="Hex Editor" width="300px" height="400px" class="image-click-scaling"/></div>



打开文件 **libcocos2djs.so** , 搜索关键字 **jsb-adapter** 

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/1.png" alt="jsc" width="300px" height="400px" class="image-click-scaling"/></div>

获取到加密的密钥 **f1Ex2F3aHyuxXYUI**, 使用密钥和xxtea算法进行解密即可.

成功解密js文件。

下一步尝试解密资源文件（e.g. *.png, *.mp3）。然后失败了，大概率是加密的密钥和jsc文件不相同。

打开资源文件查看，发现加密方式和jsc明显不同，都有一个未加密混淆的前缀字符串 **encrypt_zy_**。同理，通过 **libcocos2djs.so** 
获取到资源文件的加密密钥 **8bPxY2BENM73vWBP**,

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/2.png" alt="res" width="300px" height="400px" class="image-click-scaling"/></div>

 使用xxtea解密。
