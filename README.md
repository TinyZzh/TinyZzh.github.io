# TinyZ's Blog

> 积累技术，记录分享

基于 [Firefly](https://github.com/CuteLeaf/Firefly)（Astro）构建的个人技术博客，部署于 GitHub Pages。

## 技术栈

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + [Svelte](https://svelte.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Pagefind](https://pagefind.app) 全文搜索

## 本地开发

```bash
pnpm install
pnpm dev
```

博客将在 `http://localhost:4321` 启动。

## 构建

```bash
pnpm build
```

输出目录：`dist/`

## 配置

站点配置位于 `src/config/siteConfig.ts`，更多配置文件参见 `src/config/` 目录。

### 文章 Frontmatter

```yaml
---
title: 文章标题
published: 2024-01-01
description: 文章描述
image: ./cover.jpg
tags: [Tag1, Tag2]
category: 分类
draft: false
lang: zh-CN
pinned: false
comment: true
---
```

## 常用指令

| 指令 | 说明 |
|:--|:--|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建站点 |
| `pnpm preview` | 预览构建结果 |
| `pnpm new-post <filename>` | 创建新文章 |
| `pnpm check` | 代码检查 |
| `pnpm format` | 格式化代码 |

## 致谢

- [Firefly](https://github.com/CuteLeaf/Firefly) - 博客主题
- [fuwari](https://github.com/saicaca/fuwari) - Firefly 基础模板

## 许可

[MIT](./LICENSE)
