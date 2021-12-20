---
layout: page
title: 常见Linux工具 - Cut
date: 2021-12-20 11:22:00 +0800
categories: [DevOps]
tags: [DevOps]
---

\`Cut\`是一个强大的字符串处理工具.

[Cut Command Document](https://linuxize.com/post/linux-cut-command/)

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/2.png" alt="m"/></div>

* TOC
{:toc}

## 1. \`-b\`和\`-c\`获取列表参数中的字节、字符

默认使用\`TAB\`进行位置偏移（LIST）
选取某个位置的字符. 
>echo "Hello World!" \| cut -c 2 => \`e\`

选取位置范围的字符. 
>echo "Hello World!" \| cut -c 1-5 => \`Hello\`


## 2. **\`-d\`** 使用分隔符替代\`TAB\`对字符进行拆分定位


根据某个分隔符拆分并打印. 
>echo 'Hello World!' \| cut -d ' ' -f2 => \`World!\`

## 3. **\`-f\`** 获取根据字段，域

配合\`-d\`有奇效. 最常见的应用常见之一.


## 4. \`--complement\`排除选择的内容

>echo 'Hello World!' \| cut -d ' ' -f2 => \`Hello\`

## 5. \`--only-delimited\` 是否\`仅\`打印带分隔符的行

分隔符不存的行. 
> echo 'Hello World!' \| cut -d 'x' -f2 => \`\`

分隔符存在的行. 
>echo 'Hello World!' \| cut -d ' ' -f2 => \`Hello\`

## 6. \`--output-delimiter\`替换输出的分隔符

分隔符不存的行. 

> echo 'Hello World!' \| cut -d ' ' --output-delimiter=' and ' -f-2 => \`Hello and World!\`

