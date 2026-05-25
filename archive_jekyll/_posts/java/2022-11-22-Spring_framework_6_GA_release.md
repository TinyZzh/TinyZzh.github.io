---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 梳理Spring Framework 6.0的新特性
date: 2022-11-22 14:16:00 +0800
categories: [JAVA, Spring_Framework_6]
tags: [JAVA, Spring Framework 6, Gradle, 虚拟线程]
toc: yes
image_scaling: true
mermaid: true
---

Spring Framework在Java应用层长期的占据市场统治地位。
在2022年11月16号发布的6.0 GA版本也是颠覆性的改动。本文梳理Spring Framework 6.0的重大变动，已经总结变动带来的革新以及我们如何迁移到6.0版本。

目前服务端正在着手相关的工作，逐步将现有的子系统迁移到Spring Framework 6上。:stars:

## Spring Framework 6.0

### :one: 基于Java 17

Spring框架代码全面**升级到Java 17**。得益于Java版本的升级，意味着下游用户可以使用更多更新的语法（**[Record](https://tinyzzh.github.io/java/record/2022/09/29/JVM_Record.html)、文本块、增强的Switch表达式、密封类sealed**）和系统工具（**Flight Recorder、JShell**），同时还能享受**JVM特性增强、String增强、NPE提示增强、更现代化的GC（G1，ZGC等）算法**等诸多的隐形福利。 

> 

### :two: 全面拥抱云原生

[Spring Native](https://github.com/spring-projects-experimental/spring-native)项目已经默默孵化3年多时间，全面支持Spring Framework 6和Spring Boot 3，支持GraalVM即时编译。使用AOT可以实现**亚毫秒级启动时间，大幅降低堆内存占用**。详见[Initial AOT support in Spring Framework 6.0.0-M3](https://spring.io/blog/2022/03/22/initial-aot-support-in-spring-framework-6-0-0-m3)

### :three: 拥抱虚拟线程Virtual Thread

还记得在Spring Framework 5.0引入的响应式web框架**WebFlux**吗？ Spring WebFlux是一个异步非阻塞式的Web框架。WebFlux相比于Spring MVC可以让服务器占用内存更少，使用线程数更少，在IO密集型业务中，吞吐量更高，应用有更好的伸缩性。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/spring_6_reactor.svg" alt="xx" class="image-click-scaling"/></div>

虚拟线程补充和完善了Java生态中的反应式编程模型的短板，进一步消除和缓解阻塞I/O的影响，对于服务器而言，或者能进一步提高CPU利用率，增加应用吞吐量, 降低响应延迟也犹未可知。

通过 **AsyncTaskExecutor** 和 **TomcatProtocolHandlerCustomizer**启用虚拟线程。详见[Embracing Virtual Threads](https://spring.io/blog/2022/10/11/embracing-virtual-threads)：

```java
@Bean(TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
public AsyncTaskExecutor asyncTaskExecutor() {
  return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
}

@Bean
public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
  return protocolHandler -> {
    protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
  };
}
```

业务侧虚拟线程可以 **当作线程池来使用，可以实现Actor并发模型**等。

```java
//  https://openjdk.org/jeps/425
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
}  // executor.close() is called implicitly, and waits
```

### :four: 其他

**J2EE现在正式迁移到jakarta**, 由eclipse基金会管理。完全开源，无任何商业使用风险。


### 实践总结

这块内容主要以自身服务端项目升级为例，由于迁移的时候Spring Framework 6还没发布，所以本总结是基于今年升级到**Spring Framework 5.3和Java 17 LTS**的。，仅供参考。

页游目前的持续集成环境中依旧使用的Gralde 4.10版本，这个版本很明显是不支持Java 17的。第一个任务就是 **升级Gradle版本到7.3**，以支持最新的Java版本编译。值的额外提一句的时，升级Gradle并且开启并发编译，让项目的编译耗时减少50%甚至更多，也算是意外之喜。

第二个较大改动就是J2EE相关的内容，例如：JAXB等被移除出标准库，还有一部分被捐赠给Exlipse基金会包名被修改为jakarta。
jaxb需要引入老的兼容包，避免业务代码变动：
```groovy
implementation("javax.servlet:javax.servlet-api:4.0.1")
implementation("javax.annotation:javax.annotation-api:1.3.2")
```

第三项是Spring Framework框架从4.x升级到5.3.x版本，全面引入Spring Boot框架 2.5.x版本。核心业务进程login、logic等全部迁移到Spring Boot技术栈。兼容老项目的common-web和jamon指标监控项目。

第四项是关于包路径和访问权限的，使用到**反射**的类库或多或少的都受到影响。lightmc中的HackedObjectInputStream无法使用。使用**变量句柄VarHandle和Unsafe工具绕过底层的访问权限检查**。

```java
public class HackedObjectInputStream extends ObjectInputStream {

    /**
     * Migration table. Holds old to new classes representation.
     */
    private static final Map<String, Class<?>> MIGRATION_MAP = new HashMap<String, Class<?>>();
    private static VarHandle handle;

    static {
        MIGRATION_MAP.put(ApcMigration.JOBJ_NAME, APC.class);
        try {
            handle = UnsafeUtils.trusted().findVarHandle(ObjectStreamClass.class, "name", String.class);
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    public HackedObjectInputStream(final InputStream stream) throws IOException {
        super(stream);
    }

    @Override
    protected ObjectStreamClass readClassDescriptor() throws IOException, ClassNotFoundException {
        ObjectStreamClass resultClassDescriptor = super.readClassDescriptor();

        for (final String oldName : MIGRATION_MAP.keySet()) {
            if (resultClassDescriptor.getName().equals(oldName)) {
                String replacement = MIGRATION_MAP.get(oldName).getName();

                try {
                    handle.set(resultClassDescriptor, replacement);
                } catch (Exception e) {
                    throw new IllegalArgumentException(e);
                }

            }
        }

        Map<String, String> m = ApcMigration.JOBJ_INPUT_RENAME;
        for (final String oldName : m.keySet()) {
            if (resultClassDescriptor.getName().equals(oldName)) {
                String replacement = m.get(oldName);

                try {
                    handle.set(resultClassDescriptor, replacement);
                } catch (Exception e) {
                    throw new IllegalArgumentException(e);
                }

            }
        }

        return resultClassDescriptor;
    }
}
```

项目中其他杂七杂八第三方依赖，这个只能根据项目的实际情况，以及依赖库对Java 17的兼容程度分别单独处理。


## 参考资料
1. [What's New in Spring Framework 6.x](https://github.com/spring-projects/spring-framework/wiki/What's-New-in-Spring-Framework-6.x)
2. [Embracing Virtual Threads](https://spring.io/blog/2022/10/11/embracing-virtual-threads)
3. [压测对比: Spring WebFlux VS. Spring MVC](https://zhuanlan.zhihu.com/p/172010354)
4. [Java Flight Recorder](https://docs.oracle.com/javacomponents/jmc-5-4/jfr-runtime-guide/about.htm#JFRUH170)