---
layout: post
read_time: true
show_date: true
title: 详解Java的record关键字
date: 2022-09-29 12:10:00 +0800
categories: [Java, record]
tags: [Java, record]
toc: yes
image_scaling: true
---


## record关键字

record关键字主要提供了更简洁、更紧凑的final修饰的不可变数据类的定义方式。可以用于数据传输，并发编程等领域。

该特性最早于Java 14引入开始孵化，经历两次孵化，最终于Java 16转为正式特性。


## 使用方法及示例

在Java日常开发中，当我们需要定义个不可变数据类对象用于数据传输，并发编程等途径时。通常写法如下代码块所示. 

以下示例代码块为了突显class和record的getter方法命名规则的差异，故意修改等效于record的x()和y()方法.  常规的getter方法命名方式应该为getX()和getY()

```java
public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() {
        return x;
    }

    public int y() {
        return y;
    }

    @Override
    public String toString() {
        return "Point{" +
                "x=" + x +
                ", y=" + y +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Point point = (Point) o;
        return x == point.x && y == point.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}

```

使用record实现上面等同效果仅需简单的一行即可。

```java
public record PointR(int x, int y) {
}
```

通过简单的对比，我们可以得知，record相当于节省了以下几个方面的代码。

1. 全参数的构造函数
2. getter方法
3. hashCode和equals方法
4. toString方法
5. final修饰的类


### 定义静态属性字段，静态方法、类方法和属性字段注解

record内部 **不允许** 定义非静态属性字段. 除此之外，和class的用法基本上没有区别。


```java
public record PointR(@Nullable int x, int y) {

    /**
     * 1. 定义静态属性字段
     */
    private static int z = 1;

    /**
     * 2. 定义静态方法
     */
    public static int distance(PointR o, PointR o1) {
        return 0;
    }

    /**
     * 3. 定义方法
     */
    public int distance(PointR o) {
        return 0;
    }
}
```

### 实现接口

record关键字隐式继承Record类，所以 **不允许** 在使用 `extends` 继承其他类。和class一样是单根继承，多接口实现。

```java
public record PointR(int x, int y) implements Comparable<PointR> {

    @Override
    public int compareTo(PointR o) {
        return 0;
    }
}
```

### 泛型

```java
public record PointR<R extends Serializable>(int x, int y, R r) {

    public static void main(String[] args) {
        //  测试
        PointR<ArrayList<Integer>> pointR = new PointR<>(1, 2, new ArrayList<Integer>());
    }
}
```

## 反射

相比于class的反射获取属性字段信息方式, record的反射有了颠覆性的变动，我个人感觉是更加简单和直观。

可以通过Class定义的geRecordComponents()方法获取record字段的record组件数组，顺序等同于record构造函数中定义的顺序。

```java
RecordComponent[] recordComponents = PointR.class.getRecordComponents();
```

### 获取字段类型

Class对象中新增 **isRecord()**方法用于区分类是否是record类.

```java
PointR.class.isRecord()
```

其他常用的反射相关的方法基本上类似于Field。例如：**RecordComponent#getType()** 反射获取属性字段的类型, **RecordComponent#getAnnotation()** 反射获取属性字段的注解

```java
RecordComponent[] recordComponents = PointR.class.getRecordComponents();
for (RecordComponent rc : recordComponents) {
    Assertions.assertEquals(int.class, rc.getType());
    rc.getAnnotation(Nullable.class)
}

```
