---
layout: page
title: Java随笔 - Java 8特性之接口中的default方法和其他类、接口定义方法冲突
date: 2019-09-30 20:16:00 +0800
categories: [JavaNote]
tags: [Java随笔]
---

> Java 1.8引入一个新的特性. 接口中定义的方法可以使用default关键字提供默认的缺省实现.
>  
> 这项新特性很便捷的帮助开发者在不修改接口的实现类的前提下，达到扩展功能的目的。可以说是非常的方便。但是这项特性带来便利的同时, 也带来了一些困惑。本文章记录笔者通过实例逐步学习这项变动的过程。

## 目录

 >1. [Q1. Java 8之前继承多个接口. 且父接口中定义的方法有冲突](#q1-java-8之前继承多个接口-且父接口中定义的方法有冲突)
 >2. [Q2: Java 8之后继承多个接口. 且父接口中定义的方法有冲突](#q2-java-8之后继承多个接口-且父接口中定义的方法有冲突)
 >3. [Q3. 继承类和实现接口共存的情况](#q3-继承类和实现接口共存的情况)
 >4. [总结](#总结)

## Q1. Java 8之前继承多个接口. 且父接口中定义的方法有冲突

类结构如下图：
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/1.png" alt="类结构图"/></div>

示例代码：

```java
public interface A {
    void print(String str);
}

public interface B {
    void print(String str);
}

public interface C extends A, B {

}
```

上述代码能编译通过。对C接口来讲. 父接口中定义的方法都没有具体的逻辑实现, 仅有一个定义。所以不会引起编译冲突.
子类必须实现接口定义的方法. 

## Q2: Java 8之后继承多个接口. 且父接口中定义的方法有冲突

而Java 8之后，接口中定义了冲突的方法，且有default实现时：

```java
public interface A {
    default void print(String str) {
        System.out.println("A");
    }
}

public interface B {
    default void print(String str) {
        System.out.println("B");
    }
}

public interface C extends A, B {

    /**
     * <strong>必须重写父类的方法. 否则编译报错</strong>
     */
    @Override
    default void print(String str) {
        //  ...do something
    }
}
```

结论：
当接口A和接口B任意一个有default实现时. 接口C必须Override接口中的冲突的方法. 

可以通过 **A.super.print(str)** 和 **B.super.print(str)** 来分别指定要继承的默认实现.
示例：C的print方法的default实现。先执行A再执行B

```java
public interface C extends A, B {
    /**
     * <strong>必须重写父类的方法</strong>
     */
    @Override
    default void print(String str) {
        A.super.print(str);
        B.super.print(str);
    }
}
```

## Q3. 继承类和实现接口共存的情况

类结构如下图：
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/2.png" alt="类结构图"/></div>

```java
public class A {
    public void print(String str) {
        System.out.println("A");
    }
}

public interface B {
    default void print(String str) {
        System.out.println("B");
    }
}

public class C extends A implements B {

}
//  => 编译成功。输出“A”
```

结论：
当父类中定义的方法和接口中定义的default实现冲突时。隐式的采用类中的方法. 

## 总结

 1. 当父类或接口中的定义的方法实现有冲突时, 子类必须覆写父中的方法. 或者把类定义为abstract
 2. 当子类继承父类, 实现父接口的情况时。隐式的继承父类中的方法.
 3. 类中定义的方法实现，优先级高于接口中default实现

 End


