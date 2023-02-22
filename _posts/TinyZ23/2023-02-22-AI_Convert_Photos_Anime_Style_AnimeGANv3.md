---
layout: post
read_time: true
show_date: true
img: assets/img/branding/TinyZ-logo.svg
title: [实用工具] 免费开源的AI转换图片风格工具 - AnimeGANv3
date: 2023-02-22 12:00:00 +0800
categories: [AnimeGANv3, AI]
tags: [AnimeGANv3, AI, AnimeGANv2, Github, Photos]
toc: yes
image_scaling: true
mermaid: true
---

**AnimeGAN** 是一种新型轻量级生成GAN(对抗网络)模型，可以实现图片、照片、动画等作品的快速动画风格迁移。 

## AnimeGANv2

**[AnimeGANv2](https://github.com/TachibanaYoshino/AnimeGANv2)** 相比于前一代 **AnimeGAN**, 判别器从实力归一化修改特征层归一化。

AnimeGANv2中生成器的网络结构如图2所示，K代表卷积核大小，S代表步长，C代表卷积核个数，IRB代表倒残差块，resize代表插值up-采样方法，SUM表示逐元素相加。AnimeGANv2 的生成器参数大小为 8.6MB，AnimeGAN 的生成器参数大小为 15.8MB。AnimeGANv2 使用与 AnimeGAN 相同的判别器，区别在于判别器使用层归一化而不是实例归一化。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/AnimeGANv2.jpg" alt="生成器网络的架构" width="650px" height="400px" class="image-click-scaling"/></div>


## AnimeGANv3

[AnimeGANv3](https://github.com/TachibanaYoshino/AnimeGANv3) 的主要动画生成风格依然还是宫崎骏和新海诚风格的，相比之前的AnimeGAN和AnimeGANv2，在动画生成效果上，它的改进在于：更小的生成器模型大小，仅有4点几MB；生成的动画效果不再包含训练风格图片中的颜色和色调，能够原本的保持输入照片中的色彩和亮度。

通过网站免费在线使用[AnimeGANv3 Online](https://huggingface.co/spaces/TachibanaYoshino/AnimeGANv3) 或者
手机扫描下方二维码打开
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/AnimeGANv3_phone_code.png" alt="官网Demo" width="650px" height="400px" class="image-click-scaling"/></div>

### 使用示例

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/AnimeGANv3_use_case1.png" alt="使用示例" width="650px" height="400px" class="image-click-scaling"/></div>

可以选择转换结果的风格，内置提供以下8种风格的输出。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/AnimeGANv3_use_case2.png" alt="使用示例" width="650px" height="400px" class="image-click-scaling"/></div>

分别对应 **宫崎骏、新海诚、双城之战、迪士尼卡通、美式卡通、漫画、北欧神话、肖像速写**八种风格。

展示转换结果图

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/AnimeGANv3_use_case3.png" alt="使用示例" width="650px" height="400px" class="image-click-scaling"/></div>

## 参考资料

1. [Jie Chen、Gang Liu、Xin Chen “AnimeGAN：一种用于照片动画的新型轻量级 GAN。” ISICA 2019：人工智能算法和应用，第 242-256 页，2019 年。](https://link.springer.com/chapter/10.1007/978-981-15-5577-0_18)
2. [AnimeGANv3，史诗级的AI动画生成器](https://zhuanlan.zhihu.com/p/580688384)
3. [AnimeGAN将现实照片动漫化，超越清华的CartoonGAN](https://zhuanlan.zhihu.com/p/76574388)

