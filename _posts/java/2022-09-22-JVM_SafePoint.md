---
layout: post
read_time: true
show_date: true
img: images/2022-04/04-24-01.jpg
title: 详解Java的 安全点(SafePoint)
date: 2022-09-22 10:16:00 +0800
categories: [JAVA, SafePoint]
tags: [JAVA, SafePoint]
toc: yes
image_scaling: true
---


在Java虚拟机（JVM）的运行过程中，有些操作需要保证所有线程都到达一个安全点（SafePoint）后才能进行。SafePoint通常指一组位置，在这些位置处所有线程都处于安全状态，即没有正在执行不可中断的代码（如native方法、VM内部代码等），也没有锁定任何对象。

如果JVM要执行需要等待SafePoint的操作，但某个线程没有到达SafePoint，那么JVM就要等待这个线程到达SafePoint，然后再继续执行所需操作。因此，SafePoint对Java应用程序的性能有很大的影响，特别是当应用程序有大量线程时。

## SafePoint的类型

在Java虚拟机中，有多种类型的SafePoint：

### Polling SafePoint

Polling SafePoint是一种最常见的类型，它通常在循环体中使用，并且可以被打断。当一个线程到达一个Polling SafePoint时，它会检查是否有新的任务或者消息需要处理。如果没有，则线程会继续执行下一个任务或者等待新的任务或消息。

```java
public void run() {
    while (true) {
        // Polling SafePoint
        if (shouldProcessTask()) {
            processTask();
        }
    }
}
```


### Deoptimization SafePoint

Deoptimization SafePoint是一种比较特殊的SafePoint，它通常用于当JVM需要回滚一些已经做出的优化决策时。例如，如果JVM在某个方法的调用点做了内联处理，但后来发现这种内联处理导致了错误，那么JVM就需要回滚这个决策，将该方法的调用点还原为正常的方法调用。此时，JVM会等待所有线程都到达一个Deoptimization SafePoint，以确保回滚操作是安全的。

## Safepoint for GC

当JVM启动垃圾回收时，它需要等待所有线程都到达一个Safepoint，以确保垃圾回收操作是安全的。在GC过程中，JVM需要暂停所有运行中的线程，然后才能执行垃圾回收操作。因此，Safepoint for GC可以看作是一种特殊的Polling SafePoint。

### 常见的SafePoint操作

在Java虚拟机中，有一些常见的操作需要等待SafePoint：

 -  类加载和卸载

当Java虚拟机需要加载或卸载某个类时，它需要等待所有线程都到达一个SafePoint。这是因为，在类加载或卸载的过程中，Java虚拟机需要修改ClassLoader相关的数据结构，这可能会影响到其他线程的代码执行。因此，必须确保所有线程都处于安全状态，才能进行这些操作。

 - JIT编译器

Java虚拟机中的Just-In-Time（JIT）编译器通常在运行时将Java字节码编译成本地机器码。这种编译过程需要等待所有线程都到达一个SafePoint，以确保编译过程不会影响到其他线程的代码执行。在编译过程中，JIT编译器需要访问Java虚拟机的内部数据结构，这可能会影响到其他线程的代码执行。

 - 垃圾回收

在Java虚拟机中，垃圾回收是一项非常重要的操作。垃圾回收器需要暂停所有运行中的线程，然后才能执行垃圾回收操作。在垃圾回收操作期间，Java虚拟机需要

修改对象引用关系，这可能会导致其他线程的代码执行出现问题。因此，在执行垃圾回收之前，必须确保所有线程都到达了一个SafePoint。

### 如何优化SafePoint

由于SafePoint对Java应用程序的性能有很大的影响，因此需要进行一些优化以改善性能。下面是一些常见的优化方法：

 - 调整SafePoint间隔时间

在JVM中，可以通过设置-XX:PollingPageInterval参数来调整Polling SafePoint的时间间隔。默认情况下，该参数的值为1ms。如果将其设为更高的值，可以减少SafePoint检查的频率，从而提高应用程序的吞吐量。但是，这样做也会增加某些操作（如类加载和卸载）的等待时间。

 - 避免过多使用native方法

在Java虚拟机中，native方法通常是无法被JIT编译器优化的，因此会导致频繁的SafePoint检测。如果应用程序过多地使用native方法，就会降低应用程序的性能。因此，应该尽量避免过多地使用native方法，除非必要。

 - 使用适当的锁策略

在Java应用程序中，锁是非常重要的同步机制。不同的锁策略对SafePoint检测的影响也不同。例如，如果使用synchronized关键字来实现锁，则会阻塞所有线程，直到获取到锁的线程释放锁为止。这会导致所有线程都在等待SafePoint，从而降低应用程序的性能。因此，应该使用适当的锁策略来避免这种情况的发生。

 -  使用并发数据结构

在Java应用程序中，使用并发数据结构可以避免锁定整个数据结构，从而减少等待SafePoint的时间。例如，ConcurrentHashMap就是一种高效的并发数据结构，它可以在多线程同时访问时保持高性能。

## 总结

SafePoint是Java虚拟机中的一个重要概念，它对Java应用程序的性能有很大的影响。在Java应用程序中，有一些操作需要等待SafePoint，例如类加载、JIT编译器、垃圾回收等。为了优化应用程序的性能，可以采取一些措施，如调整SafePoint间隔时间、避免过多使用native方法、使用适当的锁策略和使用并发数据结构等。









