---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 详解Java的 ArrayList
date: 2022-11-18 10:16:00 +0800
categories: [JAVA, ArrayList]
tags: [JAVA, ArrayList]
toc: yes
image_scaling: true
---

**ArrayList** 作为最基础、最常见的Java集合之一。
你是否有过疑惑ArrayList是如何自动扩容的？
使用remove移除元素后，是怎么进行缩容的呢？
非线程安全，不安全在哪些方面呢？ArrayList又是如何检测变更的呢？

> 本文使用**Java 17 LTS**版本

## 构造函数

ArrayList在不指定初始容量和初始集合的情况下，**默认使用长度为0的空数组**。

```java
/**
 * Constructs an empty list with the specified initial capacity.
 *
 * @param  initialCapacity  the initial capacity of the list
 * @throws IllegalArgumentException if the specified initial capacity
 *         is negative
 */
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        this.elementData = EMPTY_ELEMENTDATA;
    } else {
        throw new IllegalArgumentException("Illegal Capacity: "+
                                            initialCapacity);
    }
}

/**
 * Constructs an empty list with an initial capacity of ten.
 */
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

/**
 * Constructs a list containing the elements of the specified
 * collection, in the order they are returned by the collection's
 * iterator.
 *
 * @param c the collection whose elements are to be placed into this list
 * @throws NullPointerException if the specified collection is null
 */
public ArrayList(Collection<? extends E> c) {
    Object[] a = c.toArray();
    if ((size = a.length) != 0) {
        if (c.getClass() == ArrayList.class) {
            elementData = a;
        } else {
            elementData = Arrays.copyOf(a, size, Object[].class);
        }
    } else {
        // replace with empty array.
        elementData = EMPTY_ELEMENTDATA;
    }
}
```


## 扩容

列表扩容是ArrayList面试问题中出现频率非常高的一个问题。
**当前size和元素长度相等时，列表已满时，才会触发扩容**。

```java
private void add(E e, Object[] elementData, int s) {
    if (s == elementData.length)
        elementData = grow();
    elementData[s] = e;
    size = s + 1;
}
```

```java

/**
 * Increases the capacity to ensure that it can hold at least the
 * number of elements specified by the minimum capacity argument.
 *
 * @param minCapacity the desired minimum capacity
 * @throws OutOfMemoryError if minCapacity is less than zero
 */
private Object[] grow(int minCapacity) {
    int oldCapacity = elementData.length;
    if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity >> 1           /* preferred growth */);
        return elementData = Arrays.copyOf(elementData, newCapacity);
    } else {
        return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
    }
}
```

使用ArraysSupport工具计算新的所需的数组长度。 参数分别为（扩容前的长度，最小增长长度，推荐增长长度），根据grow()方法中的使用, 最小申请列表仅需的长度(minCapacity - oldCapacity), 推荐增长长度为（oldCapacity >> 1 = oldCapacity/2)，相当于**默认每次扩容都是老的长度的1.5倍**。**已知的固定长度的列表尽可能指定长度，避免默认扩容导致内存空间浪费**。

```java
public static int newLength(int oldLength, int minGrowth, int prefGrowth) {
    // preconditions not checked because of inlining
    // assert oldLength >= 0
    // assert minGrowth > 0

    int prefLength = oldLength + Math.max(minGrowth, prefGrowth); // might overflow
    if (0 < prefLength && prefLength <= SOFT_MAX_ARRAY_LENGTH) {
        return prefLength;
    } else {
        // put code cold in a separate method
        return hugeLength(oldLength, minGrowth);
    }
}

private static int hugeLength(int oldLength, int minGrowth) {
    int minLength = oldLength + minGrowth;
    if (minLength < 0) { // overflow
        throw new OutOfMemoryError(
            "Required array length " + oldLength + " + " + minGrowth + " is too large");
    } else if (minLength <= SOFT_MAX_ARRAY_LENGTH) {
        return SOFT_MAX_ARRAY_LENGTH;
    } else {
        return minLength;
    }
}
```

## 移除

ArrayList的移除操作，通过移动元素在列表中的位置，占用老的元素的位置，并将末尾元素设置为NULL。

```java
private void fastRemove(Object[] es, int i) {
    modCount++;
    final int newSize;
    if ((newSize = size - 1) > i)
        System.arraycopy(es, i + 1, es, i, newSize - i);
    es[size = newSize] = null;
}
```

**列表的容量不会减少，不会自动缩容**。

## 缩容

ArrayList**不主动缩容**。那假如我们业务场景中使用的列表不定长，同时伴随一系列增删改动，但最终结果是稳定的。这个时候我们该如何避免空间浪费呢？

这个时候**trimToSize**方法就有作用了。观其名知其意，截断列表数值的NULL值。

```java
/**
 * Trims the capacity of this {@code ArrayList} instance to be the
 * list's current size.  An application can use this operation to minimize
 * the storage of an {@code ArrayList} instance.
 */
public void trimToSize() {
    modCount++;
    if (size < elementData.length) {
        elementData = (size == 0)
            ? EMPTY_ELEMENTDATA
            : Arrays.copyOf(elementData, size);
    }
}
```

## 非线程安全

ArrayList是**非线程安全**的。多线程环境下，列表被修改会抛出**ConcurrentModificationException**异常。

以对象序列化为例，**其检测原理时，在变更操作开始前记录modCount值，当操作结束时检测到modCount和序列化之前不同时，不同时则说明被修改，同步抛出异常**。

```java
@java.io.Serial
private void writeObject(java.io.ObjectOutputStream s)
    throws java.io.IOException {
    // Write out element count, and any hidden stuff
    int expectedModCount = modCount;
    s.defaultWriteObject();

    // Write out size as capacity for behavioral compatibility with clone()
    s.writeInt(size);

    // Write out all elements in the proper order.
    for (int i=0; i<size; i++) {
        s.writeObject(elementData[i]);
    }

    if (modCount != expectedModCount) {
        throw new ConcurrentModificationException();
    }
}
```

线上项目需要临时紧急处理，该如何应急处理呢？

```java
//  1. 使用同步块装饰
Collections.synchronizedList(new ArrayList<>())
```



## 参考资料

1. [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html)





