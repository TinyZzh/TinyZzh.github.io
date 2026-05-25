---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 与Spring Framework框架集成
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营、策划三方实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

## struct-spring 模块

struct-spring 主要是针对 struct-core 的扩展，用于支持 Spring Framework，并利用 Spring 框架的众多特性扩展增强 struct-core 功能。

新增了@AutoStruct @StructScan @StructStoreOptions 三个注解。

首先引入依赖包

```gradle
implementation('org.structutil:struct-spring:{VERSION}')
```

### @AutoStruct

结构体自动托管注解, 显示的指明这个类是一个 Struct，并且需要托管给 Spring Framework 容器。

| 属性                 |         缺省值          | 可选字段 |                                                                                        备注 |
| :------------------- | :---------------------: | :------: | ------------------------------------------------------------------------------------------: |
| clzOfStore           |           ''            |    Y     | 数据结构存储的集合类型 ListStructStore MapStructStore 或者其他 StructStore 接口的自定义实现 |
| mapKey               |           ''            |    Y     |                                              当 MapStructStore 结构时, 用于解决键值对的 key |
| keyResolverBeanName  |           ''            |    Y     |                    当 MapStructStore 结构时, 用于解决键值对的 key 的 容器中 resolver 的名称 |
| keyResolverBeanClass | StructKeyResolver.class |    Y     |                                     当 MapStructStore 结构时, 用于解决键值对的 key 的类对象 |

示例代码如下：

```java
@AutoStruct(keyResolverBeanName = "dataStructKeyResolver")
@StructSheet(fileName = "cfg_animal.xlsx", sheetName = "Sheet1")
public class Animal {
//    ...
}
```

或者 XML 风格

```xml
<bean id="store_1" class="org.struct.spring.support.MapStructStore">
    <property name="clzOfBean" value="org.struct.examples.Animal"/>
    <property name="keyResolverBeanName" value="dataStructKeyResolver"/>
</bean>
```

### @StructScan

托管数据结构扫描器。集成到 Spring Framework 框架中，再启动时扫描类路径并处理托管的 Struct 示例。

```java
public @interface StructScan {

    /**
     * Alias for {@link #basePackages}.
     * <p>Allows for more concise annotation declarations if no other attributes
     * are needed &mdash; for example, {@code @ComponentScan("org.my.pkg")}
     * instead of {@code @ComponentScan(basePackages = "org.my.pkg")}.
     */
    String[] value() default {};

    /**
     * Base packages to scan for annotated components.
     * <p>{@link #value} is an alias for (and mutually exclusive with) this
     * attribute.
     * <p>Use {@link #basePackageClasses} for a type-safe alternative to
     * String-based package names.
     */
    String[] basePackages() default {};

    /**
     * Type-safe alternative to {@link #basePackages} for specifying the packages
     * to scan for annotated components. The package of each class specified will be scanned.
     * <p>Consider creating a special no-op marker class or interface in each package
     * that serves no purpose other than being referenced by this attribute.
     */
    Class<?>[] basePackageClasses() default {};

    /**
     * The {@link BeanNameGenerator} class to be used for naming detected components
     * within the Spring container.
     * <p>The default value of the {@link BeanNameGenerator} interface itself indicates
     * that the scanner used to process this {@code @ComponentScan} annotation should
     * use its inherited bean name generator, e.g. the default
     * {@link AnnotationBeanNameGenerator} or any custom instance supplied to the
     * application context at bootstrap time.
     *
     * @see AnnotationConfigApplicationContext#setBeanNameGenerator(BeanNameGenerator)
     */
    Class<? extends BeanNameGenerator> nameGenerator() default BeanNameGenerator.class;

}
```

### @StructStoreOptions 配置

| 属性        |  缺省值   | 可选字段 |                                             备注 |
| :---------- | :-------: | :------: | -----------------------------------------------: |
| workspace   | './data/' |    Y     |                                 配置数据的根目录 |
| lazyLoad    |   false   |    Y     |                         是否允许异步加载配置数据 |
| waitForInit |   false   |    Y     | 当其他线程正在加载数据时，是否同步等待初始化完成 |

## Struct 数据管理

集成到 Spring Framework 的最大一点好处就是可以托管给 Spring 容器管理我们的配置数据，并使用 IOC 特性和业务解耦。

### Struct 数据管理服务 `StructStoreService`

```java
public class StructStoreService implements BeanPostProcessor, SmartInitializingSingleton, DisposableBean {
    //    ....
}
```

StructStoreService 类实现了三个 Spring 框架的接口 `BeanPostProcessor, SmartInitializingSingleton, DisposableBean`，用于管理 StructStore 的初始化和完整的生命周期。

Service 中总结和内置博主业务中常用的一些方法。列表如下：

| 方法                                                    |                                          备注 |
| :------------------------------------------------------ | --------------------------------------------: |
| void initialize(Class<B> clzOfBean)                     |                                        初始化 |
| void reload(Class<B> clzOfBean)                         |                                        重加载 |
| void dispose(Class<B> clzOfBean)                        |                                          销毁 |
| List<B> getAll(Class<B> clzOfBean)                      |                          获取全部 Struct 实例 |
| B get(Class<B> clzOfBean, K key)                        |                     根据 key 获取 Struct 实例 |
| B getOrDefault(Class<B> clzOfBean, K key, B dv)         | 根据 key 获取 Struct 实例，不存在时返回缺省值 |
| Optional<B> tryGet(Class<B> clzOfBean, K key)           |                 尝试根据 key 获取 Struct 实例 |
| List<B> lookup(Class<B> clzOfBean, K... keys)           |             根据 key 列表获取 Struct 实例列表 |
| List<B> lookup(Class<B> clzOfBean, Predicate<B> filter) |                  根据条件筛选 Struct 实例列表 |

### 列表数据结构存储 `ListStructStore`

以 List 的形式管理 Struct 数据。

### 键值对数据结构存储 `MapStructStore`

以 Map 的形式管理 Struct 数据。

### StructKeyResolver

通过传入 Bean 并获取 MapStructStore 的 key 字段值。

```java
/**
 * {@link MapStructStore} key's resolver.
 *
 * @author TinyZ.
 * @version 2020.07.17
 */
@FunctionalInterface
public interface StructKeyResolver<K, B> {

    K resolve(B bean);
}
```
