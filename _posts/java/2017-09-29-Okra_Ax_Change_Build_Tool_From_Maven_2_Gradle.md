---
layout: page
title: 项目从Maven迁移到Gradle
date: 2017-09-29 22:20:00 +0800
categories: [Okra-Ax, Gradle]
tags: [Okra-Ax, Gradle]
---

Okra-Ax从Maven迁移到Gradle.

 公司项目使用Gradle也将近一年时间了。准备将自己的项目转换为Gradle。主要是使用统一的
工具方便一点。

## 1. 安装Gradle

 自行安装, 不赘述。

## 2. 项目从Maven转到Gradle

```powershell
gradle init --type pom
```

 转换后项目多出如下图所示文件夹和文件:

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/2017-09-29-1.png" alt="转换后项目"/></div>


 模块中新增build.gradle. 包依赖等信息由gradle自动转换过来.

 .gradle目录无需版本控制. 所以在.gitignore中忽略增加忽略.

```bash
.gradle/*
```

## 3. 总结

 End





















