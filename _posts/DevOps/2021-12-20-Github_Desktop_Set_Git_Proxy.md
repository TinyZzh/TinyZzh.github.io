---
layout: page
title: GitHob Desktop设置Git代理, 绕过GTW
date: 2021-12-20 18:13:00 +0800
categories: [DevOps]
tags: [DevOps]
---


* 目录
{:toc}

## 1. 前置条件

先准备一个vpn代理。假如 **没有代理** 的请直接无视。 可以考虑赛风，自由门等老牌免费科技，也可以选择其他付费科技。或者修改hosts

## 2. 设置Git代理

GitHub Desktop是GitHub官方提供的仓库访问gui工具。虽然相比于其他来拍工具能力略显不足，但是访问GitHub支持的比价好，也就勉强用着。

但是从2021年开始国内政策审查日益加剧，经常出现无法push等奇怪的网络问题。随缘式的网络，让人心碎。于是，决定设置一下代理。

1. 再c盘的user目录下找到.gitconfig文件
1. 添加http、https、git三个设置为代理地址.

```ini
[http]
    proxy = socks5://127.0.0.1:1080
[https]
    proxy = socks5://127.0.0.1:1080
[git]
    proxy = socks5://127.0.0.1:1080
```
