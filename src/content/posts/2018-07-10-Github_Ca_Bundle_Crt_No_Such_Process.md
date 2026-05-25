---
title: Github CA证书导致无法迁出和提交代码的异常
published: 2018-07-10
description: ""
image: ""
tags: [Github]
category: Github
draft: false
lang: zh_CN
---

```powershell
git config --system http.sslcainfo "C:\Program Files (x86)\git\bin\curl-ca-bundle.crt"
```

或

```powershell
git config --system http.sslverify false
```
