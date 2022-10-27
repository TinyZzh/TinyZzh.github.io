---
layout: post
read_time: true
show_date: true
img: images/2022-10/unity3d_assetStudio_gui.png
title: 逆向实验室 - 使用AssetStudio提取Unity3D素材资源
date: 2022-10-27 10:16:00 +0800
categories: [逆向工程, Unity3D, AssetStudio]
tags: [逆向工程, Unity3D, AssetStudio]
toc: yes
image_scaling: true
---

[AssetStudio](https://github.com/Perfare/AssetStudio)是一个用于探索、提取和导出资产和资产包的工具。主要针对Unity3D

> 逆向有法律风险，不要将逆向素材应用于任何形式的商业活动。

## AssetStudio

支持Unity3D **3.4 - 2022.1**版本。

|素材类型||
|:--:|--:|
|Texture2D | 转换为 png, tga, jpeg, bmp|
|Sprite|将 Texture2D 裁剪为 png、tga、jpeg、bmp|
|AudioClip|mp3、ogg、wav、m4a、fsb。支持将 FSB 文件转换为 WAV(PCM)|
|Font |ttf、otf|
|Mesh|obj|
|TextAsset||
|Shader||
|MovieTexture||
|VideoClip||
|MonoBehaviour||
|Animator |使用绑定的 AnimationClip 导出到 FBX 文件|

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetStudio_gui.png" alt="xx" class="image-click-scaling"/></div>

## 提取地下城堡3：魂之诗素材

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3.png" alt="xx" class="image-click-scaling"/></div>

选中需要到处的资源，点击导出即可。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3_export.png" alt="xx" class="image-click-scaling"/></div>


<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3_icon.png" alt="xx" class="image-click-scaling"/></div>





