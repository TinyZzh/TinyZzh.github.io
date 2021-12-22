---
layout: post
read_time: true
show_date: true
title: 面试笔试题 - 续
description: 面试笔试题 - 续
date: 2016-06-04 23:42:00
categories: [Other]
tags: [Other, 生活]
---

回顾一下之前的笔试题。[URL 地址](./2016/06/03/Interview.html)。

> 问题：有一个数组 a，有一个变量 n，大于变量 n 的放到数组的前面，小于变量 n 的放到数组的后面（不需要排序）。

解决思路：
数组 a 从 0 开始向后遍历，检查到小于 n 的元素 k1，那么从队尾指针 tail 处向前遍历，检查到大于 n 的元素 k2 停止，并 k1 和 k2 互换位置。
在从 k1 处继续向后遍历直至 k1 位置大于队尾指针位置（遍历结束）。

测试用例:

```java
public static void main(String[] args) {
    int[] ary = new int[] { 1,2,3,4,5,6,8,5,2,1,3,9,5};
    int n = 5;
    sort(ary, n);

    System.out.println();
}
```

逻辑代码如下:

```java
public static void sort(int[] array, int n) {
    int tail = array.length - 1;
    for (int h = 0; h < array.length; h++) {
        if (h > tail){
            break;
        }
        if (array[h] < n) {
            for (int k = tail; k >= h; k--) {
                tail = k;
                if (array[k] >= n) {
                    int obj = array[h];
                    array[h] = array[k];
                    array[k] = obj;
                    break;
                }
            }
        }
    }
}
```

延伸版本，当 n 改为 n1，n2...nx 数组时如何实现?

晚上洗澡的时候想起了这么一个问题。决定折腾一下解决这个问题。
最开始有点钻进死胡同。想通过一次遍历实现相应的拆分功能（效率最高的情况）。感觉情况略微有点复杂。
考虑十几分钟后感觉可能需要向效率妥协，转变思路。

解决思路：根据 n1, n2... nx 分隔数组 array，先将 n 的数组从大到小排序。再将分隔问题简化成 x 个拆分 n 的连续小问题。

1.  按照 n1 和其他拆分
2.  在 n1 和其他的分界点为起始点, 按照 n2 和其他拆分
3.  重复步骤 2，直至起始点到达数组终点，退出循环.

算法根据数据的复杂度，时间复杂度最小是(O(n)), 最大是 O(n(n+1)/2)。

```java

public static void sortn(int[] array, Integer... ns) {
    // 这里的排序保证n的数组是从大到小有序的， 当然可以自己设置，以避免排序的损耗
    Arrays.sort(ns, new Comparator<Integer>() {
        @Override
        public int compare(Integer o1, Integer o2) {
            return o2-o1;
        }
    });
    int index = 0;
    for (int i = 0; i < ns.length; i++) {
        index = sort(array, ns[i], index);
        if (index >= array.length) {
            break;
        }
    }
}

public static int sort(int[] array, int n, int index) {
    int tail = array.length - 1;
    for (int h = index; h < array.length; h++) {
        if (h > tail){
            break;
        }
        if (array[h] < n) {
            for (int k = tail; k >= h; k--) {
                tail = k;
                if (array[k] >= n) {
                    int obj = array[h];
                    array[h] = array[k];
                    array[k] = obj;
                    break;
                }
            }
        }
    }
    return tail;
}
```

ok。解决问题。以后想到更高效的算法逻辑了。再继续优化。目前可能就这样啦。各位晚安
