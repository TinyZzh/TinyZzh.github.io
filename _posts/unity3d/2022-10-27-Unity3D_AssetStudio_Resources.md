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

目前Unity3D引擎开发的游戏产品越来越多，对于游戏中的**音频，ICON，模型和动画**时常会感觉很惊艳，想提取这些资源素材。本期以我之前一段时间比较沉迷的**地下城堡3：魂之诗**为例，演示并介绍素材提取工具 AssetStudio 。

[AssetStudio](https://github.com/Perfare/AssetStudio)是一个用于探索、提取和导出资产和资产包的工具。主要针对Unity3D

> 逆向有法律风险，不要将逆向素材应用于任何形式的商业活动。

## AssetStudio

支持Unity3D **3.4 - 2022.1**版本。 基本上涵盖至今为止的全部可能遇到的Unity3D发行版。具体的技术实现原理，不是很了解，希望了解的小伙伴可以移步到Github仓库查看源码。

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

### Scene Hierarchy(场景层次结构)

游戏中场景和模型相关列表视图。可预览游戏场景和模型，地下城堡3使用的2D场景2D贴图动画。

### Asset List(资产列表)

提取出来的贴图，动画，字体等游戏资产的列表视图。

## 提取**地下城堡3：魂之诗**素材

首先需要从官网或者第三方渠道下载对应的APK包。

解压缩APK包到本地磁盘目录，使用“File” -> "Load folder", 选中解压缩的文件夹，然后等待AssetStudio索引解压资源完成。博主只需要提取地下城堡3的游戏ICON和音效，所以直接选中切换到“Asset List”查看全部资产列表。如下图所示：

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3.png" alt="xx" class="image-click-scaling"/></div>

根据名称或者类型进行筛选，批量选中需要导出的资源，鼠标右键单击，选中Export即可。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3_export.png" alt="xx" class="image-click-scaling"/></div>

展示导出结果图：
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/unity3d_assetstudio_dxcb3_icon.png" alt="xx" class="image-click-scaling"/></div>


## 提取**无神之界**素材

以导出宠物**怒狮**模型为例。在Scene Hierarchy视图选中**模型**，

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/wszj_nushi_model.png" alt="xx" class="image-click-scaling"/></div>

在Asset List视图中选中对应的**动画**。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/wszj_nushi_model_animationclip.png" alt="xx" class="image-click-scaling"/></div>

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/wszj_nushi_model_output.png" alt="xx" class="image-click-scaling"/></div>

点击后输出为FBX格式的模型加动画。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/wszj_nushi_model_output_result.png" alt="xx" class="image-click-scaling"/></div>

### 怒狮.fbx

<a href="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/pet_nushi_merge.fbx"></a>

