---
layout: post
read_time: true
show_date: true
title: 升级GitHub Pages构建的博客系统
date: 2021-12-28 12:22:00 +0800
categories: [GitHub, Blog]
tags: [GitHub, Blog]
toc: yes
image_scaling: true
---

距离上一次升级GitHub Pages过去好久了。 老博客系统还停留在Jekyll 3.2 + disqus的阶段, 主题也比较老，很多东西不是很兼容现代的浏览器. 部分页面出现一些奇怪情况.
最近刚好比较空，抽空换个主题，扩展一下博客的功能。

## 规划

列一下最近的进展和未来准备实现的项。一部分已经完成，另外一部分还在整理和改造。1

 1. 升级Jekyll版本. 3.2 -> 4.2
 2. 支持GitHub Issue评论系统. Disqus国内网络访问堪忧
 3. 美化语法高亮插件的样式. 修复 **rouge** 高亮针对 **单引号**的异常排版. 
 4. 支持图片点击放大缩小. 美化高清图的显示
 5. 捐助功能. 低优先级
 6. 集成GitHub Action. 一键解决提交、编译、发布流程.
 7. 适配移动设备. 主题兼容智能手机或者pad的屏幕尺寸. 
 8. 支持浅色、暗色模式. 主题支持.
 9. 支持 **mermaid** 语言的图表绘制.
 10. 支持本地化. 支持中文和英文的页面. 主题支持
 11. 其他主题提供的功能. e.g. SEO, 归档等等


## 完成情况(doing)

未完待续. 