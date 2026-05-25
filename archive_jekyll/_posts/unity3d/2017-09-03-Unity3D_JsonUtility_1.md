---
layout: post
title: Unity3D的JsonUtility使用
date: 2017-09-03 01:47:00 +0800
categories: [Unity3D]
tags: [Unity3D]
---

记录一下使用 JsonUtility 遇到的坑.

## 1. 类或字段必须是可序列化的

1.  class 必须是 public 或者带[Serializable]的 Attribute.
2.  field 必须是 public 或带[SerializeField]的 Attribute.

[SerializeField]属性, 有 UnityEngine 提供, 表示序列化时需要强制序列化这个字段.

```csharp
[Serializable]
internal class CfgBuild
{
    public int Id;
    public string Name;
    [SerializeField]
    private int Age;
}
```

## 2. 不支持解析 Json 的 Array

```json
[
  { "ID": 1, "Name": "n1" },
  { "ID": 2, "Name": "n2" }
]
```

上面的 JSON 会直接反序列化失败. 但是支持 JSON 中包含 Array, 如下所示:

```json
{
  "list": [
    { "ID": 1, "Name": "n1" },
    { "ID": 2, "Name": "n2" }
  ]
}
```

目前笔者搜索的解决方案也是在外部封装一层.

## 3. 不支持 get 和 set

```csharp
//  get和set不支持
//  public int ret { get; set; }
```

    不会报错，不影响代码执行。但是会导致反序列化后的bean没有赋值.

## 4. 其他

    笔者使用还比较少, 没有详细去处理异常的状态. 扩展信息可以从参考资料中查看

## 5. 参考资料

1.  [SerializeField 和 Serializable](http://www.cnblogs.com/zhaoqingqing/p/3995304.html).
