---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 详解Java的 GCRoot
date: 2022-10-12 23:57:00 +0800
categories: [JAVA, GCRoot]
tags: [JAVA, GCRoot]
toc: yes
image_scaling: true
---


### GCRoot是什么？

GCRoot是Java实现精准式GC算法的基石。在了解GCRoot之前就必须对 **GC、可达性分析、精准式GC**的概念有所了解。

GC是垃圾回收的简称。是Java对堆栈进行内存管理的重要手段。将开发者的内存管理权限收归Jvm统一托管，降低开发者维护内存的心智成本，提高开发进度，降低技术开发者的上手门槛。

GC算法从提出方案到成为正式生产特性，不是一蹴而就的，完善的GC算法都是经历过长久的版本孵化、功能迭代和一些列的优化提案，并逐步的新增、暴露GC实现细节的用户自定义配置项，以便于用户去在一定范围内根据自身的实际业务需求进行调整，找到自身应用的GC和内存管理开销的平衡点。Jvm也会给GC算法提供一些列的缺省参数，简化用户的配置。

**精准式GC**是指通过算法精准区别识别对象指针，精准区分垃圾和存活对象的GC算法。**可达性分析算法**是GC中用于快速区分**垃圾**的算法，而**GCRoot**是可达性分析的根节点，是算法的初始点。

### GCRoot有哪些？

在OpenJDK的源码中搜索GC_ROOT。可以在Hprof工具相关的代码中查到 **[HeapHprofBinWriter](https://github.com/openjdk/jdk/blob/5725a93c078dac9775ccef04f3624647a8d38e83/src/jdk.hotspot.agent/share/classes/sun/jvm/hotspot/utilities/HeapHprofBinWriter.java)**， 列举**9种类型GCRoot**， 包含**8种类型**和**未知类型(为了兼容其他JVM实现的Dump)**，相关源码如下：

```java
public class HeapHprofBinWriter extends AbstractHeapGraphWriter {
    
    // hprof binary file header
    private static final String HPROF_HEADER_1_0_2 = "JAVA PROFILE 1.0.2";
    //    .....
    private static final int HPROF_GC_ROOT_UNKNOWN       = 0xFF;
    private static final int HPROF_GC_ROOT_JNI_GLOBAL    = 0x01;
    private static final int HPROF_GC_ROOT_JNI_LOCAL     = 0x02;
    private static final int HPROF_GC_ROOT_JAVA_FRAME    = 0x03;
    private static final int HPROF_GC_ROOT_NATIVE_STACK  = 0x04;
    private static final int HPROF_GC_ROOT_STICKY_CLASS  = 0x05;
    private static final int HPROF_GC_ROOT_THREAD_BLOCK  = 0x06;
    private static final int HPROF_GC_ROOT_MONITOR_USED  = 0x07;
    private static final int HPROF_GC_ROOT_THREAD_OBJ    = 0x08;
    //    .....
}
```

> Hprof 是Jvm堆内存快照文件. 通过**jmap、jconsole**等工具将内存快照保存下来，有助于开发中排查内存泄露等问题。

源码中定义的Hprof版本标识为**JAVA PROFILE 1.0.2**，这个很重要，后续还会在提到。


很多博客和文章中会提到Eclipse的内存分析工具[Eclipse Memory Analyzer(MAT)]((<https://help.eclipse.org/latest/index.jsp?topic=%2Forg.eclipse.mat.ui.help%2Fconcepts%2Fgcroots.html>))，MAT的文档中描述的GCRoot的类型和OpenJDK中的不一致，多了6个枚举 (**INTERNED_STRING、FINALIZING、DEBUGGER、REFERENCE_CLEANUP、VM_INTERNAL、JNI_MONITOR**)。

怎么会出现不一致的情况呢？
多方查找资料，也没有得到很明确的解答，甚至可以说没有找到任何相关的回答，就好像全世界除了我没有人对此有疑问一样。一头莫展之际，灵光一闪的想到VisualVM这个堆dump分析工具。

### VisualVM的Commit解惑

VisualVM 1.4.4是最后一个集成在JDK中的版本，支持JDK 1.8及以下版本。
VisualVM 2.x支持JDK 1.8以上的版本。**不再集成在JDK中，作为独立开源项目发布和使用**。

在历史提交记录的备注中查到端倪，OpenJDK和现行的JVM基本上都是遵循**JAVA PROFILE 1.0.2**规范，Android操作系统中使用的是**Dalvik虚拟机**遵循**JAVA PROFILE 1.0.3**。

2.x版本支持Android的Dalvik虚拟机的内快照存堆Dump解析，VisualVM升级支持**JAVA PROFILE 1.0.3**并支持新增的6个GCRoot类型。

> 早期由于MAT和VisualVM等分析查看工具，不支持1.0.3规范，会使用**hprof-conv input.hprof out.hprof**将dump文件转换为1.0.2规范格式。

以下截取**VisualVM 2.1.4**版本的**GCRoot.java**部分源码：

```java
public interface GCRoot {
    //~ Static fields/initializers -----------------------------------------------------------------------------------------------

    /**
     * JNI global GC root kind.
     */
    public static final String JNI_GLOBAL = "JNI global"; // NOI18N

    /**
     * JNI local GC root kind.
     */
    public static final String JNI_LOCAL = "JNI local"; // NOI18N

    /**
     * Java frame GC root kind.
     */
    public static final String JAVA_FRAME = "Java frame"; // NOI18N

    /**
     * Native stack GC root kind.
     */
    public static final String NATIVE_STACK = "native stack"; // NOI18N

    /**
     * Sticky class GC root kind.
     */
    public static final String STICKY_CLASS = "sticky class"; // NOI18N

    /**
     * Thread block GC root kind.
     */
    public static final String THREAD_BLOCK = "thread block"; // NOI18N

    /**
     * Monitor used GC root kind.
     */
    public static final String MONITOR_USED = "monitor used"; // NOI18N

    /**
     * Thread object GC root kind.
     */
    public static final String THREAD_OBJECT = "thread object"; // NOI18N

    /**
     * Unknown GC root kind.
     */
    public static final String UNKNOWN = "unknown"; // NOI18N

    //    ================================
    //    以下为HPROF HEAP 1.0.3新增 
    //    ================================

    /**
     * Interned string GC root kind.
     */
    public static final String INTERNED_STRING = "interned string"; // NOI18N

    /**
     * Finalizing GC root kind.
     */
    public static final String FINALIZING = "finalizing"; // NOI18N

    /**
     * Debugger GC root kind.
     */
    public static final String DEBUGGER = "debugger"; // NOI18N

    /**
     * Reference cleanup GC root kind.
     */
    public static final String REFERENCE_CLEANUP = "reference cleanup"; // NOI18N

    /**
     * VM internal GC root kind.
     */
    public static final String VM_INTERNAL = "VM internal"; // NOI18N

    /**
     * JNI monitor GC root kind.
     */
    public static final String JNI_MONITOR = "JNI monitor"; // NOI18N
}
```

### VisualVM GCRoot详解

|GC Root|描述|
|:--:|--:|:--:|
|JNI_GLOBAL |native本地方法代码中的全局变量, JNI或者Jvm内部方法||
|JNI_LOCAL |native本地方法代码中的本地变量, JNI或者Jvm内部方法||
|**JAVA_FRAME**|Jvm虚拟机栈帧中引用对象。线程调用的方法参数，局部变量等等||
|NATIVE_STACK|native本地方法栈中引用对象, JNI或者Jvm内部方法。文件/网络/IO相关的低层方法或反射||
|**STICKY_CLASS**|bootstrap/system类加载器加载的类。例如：jr.jar中java.util包下类|
|THREAD_BLOCK|An object that was referenced from an active thread block.||
|**MONITOR_USED**| 调用wait()或notify()方法的对象，synchronized关键字监控的对象 ||
|THREAD_OBJ|调用start()启动之后未停止的线程对象|
|UNKNOWN|未知类型, 不同平台的Dump文件输出的信息可能会不同||
|INTERNED_STRING |||
|FINALIZING |||
|DEBUGGER |||
|REFERENCE_CLEANUP |||
|VM_INTERNAL |||
|JNI_MONITOR |||

总结一下，**JNI相关（本地/全局/引用变量）, 虚拟机相关（运行时的类对象，静态对象，常量池），线程相关（对象，栈帧，同步）** 都可以作为GC Root。


### 参考资料

1. [Eclipse Memory Analyzer](https://help.eclipse.org/latest/index.jsp?topic=%2Forg.eclipse.mat.ui.help%2Fconcepts%2Fgcroots.html)
2. [OpenJDK HprofReader](https://github.com/openjdk/jdk/blob/739769c8fc4b496f08a92225a12d07414537b6c0/test/lib/jdk/test/lib/hprof/parser/HprofReader.java)
1. [Oracle Visualvm](https://github.com/oracle/visualvm/blob/b72cd6f57c4f992fea6ef95aa1fe85b226e2fa4b/lib.profiler/src/org/netbeans/lib/profiler/heap/GCRoot.java)
1. [HPROF Agent](http://hg.openjdk.java.net/jdk8/jdk8/jdk/raw-file/43cb25339b55/src/share/demo/jvmti/hprof/manual.html)
1. [hprof manual](http://hg.openjdk.java.net/jdk8/jdk8/jdk/raw-file/43cb25339b55/src/share/demo/jvmti/hprof/manual.html)





