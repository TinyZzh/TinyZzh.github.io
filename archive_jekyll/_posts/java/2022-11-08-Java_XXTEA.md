---
layout: post
read_time: true
show_date: true
img: images/2022-11/TEA_InfoBox_Diagram.png
title: 简单但不平凡的加密算法 - XXTEA
date: 2022-11-08 10:16:00 +0800
categories: [JAVA, XXTEA, 加密算法]
tags: [JAVA, XXTEA, 加密算法]
toc: yes
image_scaling: true
---

微型加密算法（Tiny Encryption Algorithm，TEA）是剑桥大学计算机实验室的David Wheeler与Roger Needham于1994年发明。算法以加密解密速度快，实现简单著称。TEA算法每一次可以操作64bit(8byte)，采用128bit(16byte)作为key，算法采用迭代的形式，推荐的迭代轮数是64轮，最少32轮。

**XXTEA** 是TEA系列算法中的最新版本，也是其第三个版本，发表于1998年，进一步提高了TEA算法的安全性，避免了密钥表攻击。

TXTEA是腾讯QQ和微信中常用的加密算法，算法原理不变，降低加密轮次到16轮。

**其轻量，易实现、易跨平台特性使XXTEA而被广泛应用于各个领域。例如：游戏（Cocos2d-x）、通信（QQ和微信）、嵌入式、芯片卡等等。**

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/TEA_InfoBox_Diagram.png" alt="TEA"/></div>


## [TEA算法初版源码 - C语言](https://zh.m.wikipedia.org/zh/%E5%BE%AE%E5%9E%8B%E5%8A%A0%E5%AF%86%E7%AE%97%E6%B3%95)

```c
#include <stdint.h>

void encrypt (uint32_t* v, uint32_t* k) {
    uint32_t v0=v[0], v1=v[1], sum=0, i;           /* set up */
    uint32_t delta=0x9e3779b9;                     /* a key schedule constant */
    uint32_t k0=k[0], k1=k[1], k2=k[2], k3=k[3];   /* cache key */
    for (i=0; i < 32; i++) {                       /* basic cycle start */
        sum += delta;
        v0 += ((v1<<4) + k0) ^ (v1 + sum) ^ ((v1>>5) + k1);
        v1 += ((v0<<4) + k2) ^ (v0 + sum) ^ ((v0>>5) + k3);  
    }                                              /* end cycle */
    v[0]=v0; v[1]=v1;
}

void decrypt (uint32_t* v, uint32_t* k) {
    uint32_t v0=v[0], v1=v[1], sum=0xC6EF3720, i;  /* set up */
    uint32_t delta=0x9e3779b9;                     /* a key schedule constant */
    uint32_t k0=k[0], k1=k[1], k2=k[2], k3=k[3];   /* cache key */
    for (i=0; i<32; i++) {                         /* basic cycle start */
        v1 -= ((v0<<4) + k2) ^ (v0 + sum) ^ ((v0>>5) + k3);
        v0 -= ((v1<<4) + k0) ^ (v1 + sum) ^ ((v1>>5) + k1);
        sum -= delta;                                   
    }                                              /* end cycle */
    v[0]=v0; v[1]=v1;
}
```


## Java中实现

将byte[]类型的加密内容转换为int[]，方便处理运算。

```java
/**
* Convert byte array to int array.
*/
private static int[] toIntArray(byte[] data, boolean includeLength) {
    int n = (((data.length & 3) == 0) ? (data.length >>> 2) : ((data.length >>> 2) + 1));
    int[] result;

    if (includeLength) {
        result = new int[n + 1];
        result[n] = data.length;
    } else {
        result = new int[n];
    }
    n = data.length;
    for (int i = 0; i < n; i++) {
        result[i >>> 2] |= (0x000000ff & data[i]) << ((i & 3) << 3);
    }
    return result;
}
```

加密：

```java
/**
* Encrypt data with key.
*/
public static int[] encrypt(int[] v, int[] k) {
    int n = v.length - 1;
    if (n < 1) {
        return v;
    }
    if (k.length < 4) {
        int[] key = new int[4];
        System.arraycopy(k, 0, key, 0, k.length);
        k = key;
    }
    int z = v[n], y = v[0], delta = 0x9E3779B9, sum = 0, e;
    int p, q = 6 + 52 / (n + 1);

    while (q-- > 0) {
        sum = sum + delta;
        e = sum >>> 2 & 3;
        for (p = 0; p < n; p++) {
            y = v[p + 1];
            z = v[p] += (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        }
        y = v[0];
        z = v[n] += (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
    }
    return v;
}
```

解密：

```java
/**
* Decrypt data with key.
*/
public static int[] decrypt(int[] v, int[] k) {
    int n = v.length - 1;
    if (n < 1) {
        return v;
    }
    if (k.length < 4) {
        int[] key = new int[4];
        System.arraycopy(k, 0, key, 0, k.length);
        k = key;
    }
    int z = v[n], y = v[0], delta = 0x9E3779B9, sum, e;
    int p, q = 6 + 52 / (n + 1);
    sum = q * delta;
    while (sum != 0) {
        e = sum >>> 2 & 3;
        for (p = n; p > 0; p--) {
            z = v[p - 1];
            y = v[p] -= (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        }
        z = v[n];
        y = v[0] -= (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        sum = sum - delta;
    }
    return v;
}
```

解密完成将int[]转换为byte[].

```java
/**
* Convert int array to byte array.
*/
private static byte[] toByteArray(int[] data, boolean includeLength) {
    int n = data.length << 2;
    if (includeLength) {
        int m = data[data.length - 1];
        if (m > n) {
            return null;
        } else {
            n = m;
        }
    }
    byte[] result = new byte[n];
    for (int i = 0; i < n; i++) {
        result[i] = (byte) ((data[i >>> 2] >>> ((i & 3) << 3)) & 0xff);
    }
    return result;
}
```






