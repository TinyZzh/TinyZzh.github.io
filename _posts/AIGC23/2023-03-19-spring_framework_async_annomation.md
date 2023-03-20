---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Spring框架实战技巧 - @Async实现代码零入侵异步化改造
date: 2023-03-19 00:00:00 +0800
categories: [Spring Framework]
tags: [Spring Framework, \@Async]
toc: yes
image_scaling: true
mermaid: true
---

Spring 框架提供了一种简单的方式实现异步调用方法。通过@Async注解，将方法标记为异步，可以在不阻塞主线程的情况下执行代码。

本教程将介绍使用 Spring 框架的 @Async 注解实现方法异步调用的步骤，并通过 Person 类的例子来讲解如何在 Spring 框架中使用 @Async 注解。

##  启用和配置@Async

步骤如下：

在pom.xml文件中添加Spring框架的依赖，以便使用@Async注解。

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>5.0.8.RELEASE</version>
</dependency>
```
在 Spring 配置文件中开启异步调用。

在xml配置中：

```xml
<task:annotation-driven executor="asyncExecutor"/>
<task:executor id="asyncExecutor" pool-size="5"/>
```
在Java配置中：

```java
@Configuration
@ComponentScan("com.example")
@EnableAsync
public class AppConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("MyAsyncExecutor-");
        executor.initialize();
        return executor;
    }
}
```
在代码中使用@Async注解标记异步方法。

```java
public class Person {
    @Async
    public void sayHello() {
        System.out.println("Hello from " + Thread.currentThread().getName() + "!");
    }
}
```

### Person 类代码示例

```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class Person {
    @Async
    public void sayHello() {
        System.out.println("Hello from " + Thread.currentThread().getName() + "!");
    }
}
```

在代码中调用异步方法：

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class Main {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        Person p = context.getBean(Person.class);
        p.sayHello();
        System.out.println("Main thread done!");
    }
}
// 输出结果：
// Main thread done!
// Hello from MyAsyncExecutor-1!
```

在 Person 类中，我们定义了一个异步方法 sayHello()，该方法在被调用时，会打印一条消息 "Hello from <executor-thread>!"，其中 <executor-thread> 替换为执行该方法的线程名称。

在 Main 类中，我们创建了一个 Spring 应用程序上下文，并获取了通过 AppConfig 类定义的 Person bean 的一个实例。我们调用了 Person bean 的 sayHello() 方法，然后打印一条消息“Main thread done!”（表示主线程已完成）。

因为我们在 sayHello() 方法上使用了 @Async 注解，因此该方法会在异步线程池中执行（即 MyAsyncExecutor-1）。

## 实战示例

以下是一个使用@Async注解的示例代码，该示例演示了如何使用异步方法在后台计算一个数字序列的总和。代码分为三个部分：序列生成器、序列求和器和主应用程序。

### 序列生成器
在这个例子中，我们将使用一个简单的生成器来生成一个数字序列。该生成器将接收一个起始值和一个结束值，并生成一个从起始值到结束值的数字序列。

```java
@Component
public class NumberSequenceGenerator {
    public List<Integer> generate(int start, int end) {
        List<Integer> list = new ArrayList<Integer>();
        for (int i = start; i <= end; i++) {
            list.add(i);
        }
        return list;
    }
}
```

在这个例子中，我们定义了一个名为NumberSequenceGenerator的组件，它包含一个名为generate()的方法，该方法接收两个整数参数（start和end），并生成一个数字序列，其中第一个元素是start，最后一个元素是end。

### 序列求和器
在这个例子中，我们将使用一个异步方法来计算数字序列的总和。该方法将接收一个数字序列，并计算该序列的总和。

```java
@Service
public class SumCalculator {
    @Autowired
    private NumberSequenceGenerator generator;

    @Async
    public Future<Integer> calculateSumAsync(int start, int end) {
        List<Integer> list = generator.generate(start, end);
        int sum = 0;
        for (Integer i : list) {
            sum += i;
        }
        return new AsyncResult<Integer>(sum);
    }
}
```

在这个例子中，我们定义了一个名为SumCalculator的服务，它包含一个异步方法calculateSumAsync()，该方法接收两个整数参数（start和end），并计算从start到end的数字序列的总和。在方法的内部，我们使用NumberSequenceGenerator生成数字序列，并迭代该序列以计算总和。最后，我们将总和封装在一个Future对象中，并返回该对象以供调用者使用。


### 启动示例

在这个例子中，我们将使用一个主应用程序来演示如何使用异步方法计算数字序列的总和。

```java
public class MainApplication {
    public static void main(String[] args) throws Exception {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        SumCalculator calculator = context.getBean(SumCalculator.class);
        Future<Integer> future = calculator.calculateSumAsync(1, 1000);
        while (!future.isDone()) {
            System.out.println("异步方法正在执行...");
            Thread.sleep(1000);
        }
        System.out.println("异步方法返回值：" + future.get());
        context.close();
    }
}
```

在这个例子中，我们创建了一个Spring应用程序上下文，并从该上下文中获取SumCalculator服务。然后，我们使用calculateSumAsync()方法计算数字序列的总和，并使用while循环等待异步方法的结果。当异步方法执行完成后，我们将输出异步方法的返回值，并关闭Spring应用程序上下文。

## 总结
使用 Spring 框架的 @Async 注解，可以轻松地实现方法异步调用。虽然示例代码很简单，但实际上，异步方法比较适用于涉及复杂或长时间运行的操作。在这种情况下，异步方法可以在后台执行，而不会阻塞主线程。如果你使用 Spring 框架开发 web 应用或其他需要异步处理的场景，那么学习使用 @Async 注解将非常有用。