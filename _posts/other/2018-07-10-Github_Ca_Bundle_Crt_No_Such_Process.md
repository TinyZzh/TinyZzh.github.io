---
layout: page
title: Github CA证书导致无法迁出和提交代码的异常
date: 2018-07-10 19:45:00 +0800
categories: [Github]
tags: [Github]
---


```
git config --system http.sslcainfo "C:\Program Files (x86)\git\bin\curl-ca-bundle.crt"
```
或
```
git config --system http.sslverify false
```




