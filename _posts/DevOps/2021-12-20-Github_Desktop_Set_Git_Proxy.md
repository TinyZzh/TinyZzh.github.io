---
layout: post
read_time: true
show_date: true
title: GitHob Desktop设置Git代理, 绕过GTW
date: 2021-12-20 18:13:00 +0800
categories: [DevOps]
tags: [DevOps, Git]
toc: yes
---

- 目录
  {:toc}

## 1. 前置条件

先准备一个 vpn 代理。假如 **没有代理** 的请直接无视。 可以考虑赛风，自由门等老牌免费科技，也可以选择其他付费科技。或者修改 hosts

## 2. 设置 Git 代理

GitHub Desktop 是 GitHub 官方提供的仓库访问 gui 工具。虽然相比于其他来拍工具能力略显不足，但是访问 GitHub 支持的比价好，也就勉强用着。

但是从 2021 年开始国内政策审查日益加剧，经常出现无法 push 等奇怪的网络问题。随缘式的网络，让人心碎。于是，决定设置一下代理。

1. 再 c 盘的 user 目录下找到.gitconfig 文件
1. 添加 http、https、git 三个设置为代理地址.

```ini
[http]
    proxy = socks5://127.0.0.1:1080
[https]
    proxy = socks5://127.0.0.1:1080
[git]
    proxy = socks5://127.0.0.1:1080
```

## 3. 指定仓库生效

当不需要全局生效，仅某些特定的仓库指定生效代理提交时，
可以通过修改仓库根目录的 **.git** 目录下 **config** 文件，指定特定仓库生效代理配置。
