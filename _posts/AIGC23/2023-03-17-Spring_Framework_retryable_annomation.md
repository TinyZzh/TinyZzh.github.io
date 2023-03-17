---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Spring框架实战技巧 - 使用@Retryable注解实现业务自动重试
date: 2023-03-17 01:00:00 +0800
categories: [Spring Framework]
tags: [Spring Framework, \@Retryable]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/Spring_Framework_retryable_annomation.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/retryable_annomations.png)

`@Retryable` 是 Spring Retry 模块提供的一个注解，用于声明一个方法需要在失败时进行重试。如果一个方法使用了 `@Retryable` 注解，那么当执行该方法时，如果发生了异常，则 Spring 会自动进行重试，直到达到最大重试次数或者重试成功为止。

> 本文示例代码基于Spring-Retry模块 `1.3.4.RELEASE` 版本.

> Spring-Retry 2.x 版本，在后续有空再填坑。

下面通过一个简单的示例，开始本教程的学习。
首先，再build.gradle文件中添加依赖，导入Spring-Retry模块

```groovy
implementation 'org.springframework.retry:spring-retry:1.3.4.RELEASE'
```

在方法上使用@Retryable注解，示例代码如下：

```java
@Retryable(RuntimeException.class)
public void doSomething() {
        // 业务代码
}
```

以上是使用注解方式定义的 Spring Retry 的重试机制。在上述示例中，我们声明了一个 `doSomething()` 方法，并使用了 `@Retryable(RuntimeException.class)` 注解来告诉 Spring 当遇到 `RuntimeException` 异常时需要进行重试。默认情况下，Spring Retry 最多会重试 3 次。


### interceptor属性

`interceptor` 属性指定了要使用的拦截器类名。

```java
@Retryable(value = { IOException.class }, interceptor = "myRetryInterceptor")
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们使用了 `myRetryInterceptor` 拦截器类来处理重试逻辑。

### value属性

`value` 属性指定了可以触发重试的异常类型。

```java
@Retryable(value = { IOException.class, SQLException.class })
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们指定了只有当发生 `IOException` 或 `SQLException` 异常时才会触发重试。

### include和exclude属性

`include` 和 `exclude` 属性可以用来控制哪些异常类型可以或不可以被重试。

```java
@Retryable(include = { NetworkException.class }, exclude = { TimeoutException.class })
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们指定了只有当发生 `NetworkException` 异常时才会触发重试，而 `TimeoutException` 异常不会被重试。

### label属性

`label` 属性可以用来给重试操作设置标签。

```java
@Retryable(value = RuntimeException.class, label = "my-retry-label")
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们给重试操作设置了一个名为 `my-retry-label` 的标签。

### stateful属性

`stateful` 属性指定了是否启用状态模式。默认情况下，它是关闭的。

```java
@Retryable(value = RuntimeException.class, stateful = true)
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们启用了状态模式。

### maxAttempts和maxAttemptsExpression属性

`maxAttempts` 属性指定了最大重试次数。

```java
@Retryable(value = RuntimeException.class, maxAttempts = 5)
public void doing() {
        // 业务代码
}
```

在上述示例中，我们指定了最大重试次数为 5 次。

`maxAttemptsExpression` 属性可以用来动态地设置最大重试次数。它需要一个 SpEL 表达式作为参数。

```java
@Retryable(value = RuntimeException.class, maxAttemptsExpression = "#{retryConfiguration.maxAttempts}")
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们使用 SpEL 表达式来动态地设置最大重试次数。

### backoff属性

`backoff` 注解用于指定重试操作的退避策略。退避策略是用于控制重试操作之间的延迟时间的一组规则。

| 属性名              | 属性含义                 | 属性作用和途|
|--|:--:|:--:|
| value            | int[]类型，表示延迟时间      | 定义重试时每次重试的延迟时间，单位为毫秒。如果仅指定一个整数值，则表示所有的重试延迟时间都为该值。如果指定多个整数值，则每次重试的延迟时间将从这些值中随机选择一个。 |
| delay            | long类型，表示初始延迟时间    | 定义重试工作开始之前的延迟时间，单位为毫秒。例如，如果设置为500L，则将在第一次重试之前等待500毫秒。 |
| maxDelay         | long类型，表示最大延迟时间    | 定义重试工作期间的最大延迟时间，单位为毫秒。如果在重试过程中延迟超过此时间，则不再重试，并且抛出重试失败异常。 |
| multiplier       | double类型，表示延迟时间倍增因子 | 定义每次重试延迟时间的倍增因子。例如，如果设置为1.5，则每次重试的延迟时间都会增加50％。 |
| delayExpression   | String类型，表示初始延迟时间表达式 | 使用Spring表达式语言定义重试工作开始之前的延迟时间。例如，如果设置为"#{T(java.lang.Math).random() * 1000}"，则将在第一次重试之前等待随机500到1000毫秒的时间。 |
| maxDelayExpression| String类型，表示最大延迟时间表达式| 使用Spring表达式语言定义重试工作期间的最大延迟时间。例如，如果设置为"#{10000}",则将最大延迟时间设置为10000毫秒。  |
| multiplierExpression | String类型，表示延迟时间倍增因子表达式 | 使用Spring表达式语言定义每次重试延迟时间的倍增因子。例如，如果设置为"#{1.0/2}",则每次重试的延迟时间都会减少一半。 |
| random           | boolean类型，表示是否随机化   | 定义是否启用随机化延迟时间。如果设置为true，则每次重试的延迟时间将从[0,value]+jitter之间随机选择。其中value为value属性中指定的值，jitter是一个随机值，其范围在0到value之间。默认值为false。|

通过一个简单的例子加深理解。

```java
@Retryable(value = RuntimeException.class, backoff = @Backoff(delay = 1000, multiplier = 2))
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们指定了在每次重试之间等待 1 秒，并且每次重试后等待时间加倍。

### exceptionExpression属性

`exceptionExpression` 属性用于控制哪些异常类型应该被重试。它接收一个 SpEL 表达式作为参数。

```java
@Retryable(exceptionExpression = "#{message.contains('Not Found')}")
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们使用 SpEL 表达式来判断只有当错误消息包含 "Not Found" 时才会触发重试。

### listeners方法

`listeners` 方法可以用来添加重试操作监听器。

```java
@Retryable(value = RuntimeException.class, listeners = {"myRetryListener"})
public void doSomething() {
        // 业务代码
}
```

在上述示例中，我们给重试操作添加了一个名为 `myRetryListener` 的监听器。

这是重试监听器的一种实现方式：

```java
@Component("myRetryListener")
public class MyRetryListener implements RetryListener {
    
    @Override
    public <T, E extends Throwable> boolean open(RetryContext context, RetryCallback<T, E> callback) {
            return true;
    }

    @Override
    public <T, E extends Throwable> void close(RetryContext context, RetryCallback<T, E> callback,
            Throwable throwable) {
    
    }

    @Override
    public <T, E extends Throwable> void onError(RetryContext context, RetryCallback<T, E> callback,
            Throwable throwable) {
            System.out.println("Failed to execute: " + throwable.getMessage());
    }

}
```

### RetryTemplate

除了注解方式，Spring Retry 还提供了编程式的重试方式。下面是一个使用编程式方式实现重试的示例：

```java
RetryTemplate retryTemplate = new RetryTemplate();

FixedBackOffPolicy fixedBackOffPolicy = new FixedBackOffPolicy();
fixedBackOffPolicy.setBackOffPeriod(2000L);

SimpleRetryPolicy simpleRetryPolicy = new SimpleRetryPolicy();
simpleRetryPolicy.setMaxAttempts(3);

retryTemplate.setBackOffPolicy(fixedBackOffPolicy);
retryTemplate.setRetryPolicy(simpleRetryPolicy);

retryTemplate.execute(context -> {
        // 业务代码
    return null;
});
```

在上述示例中，我们创建了一个 `RetryTemplate` 实例，并设置了重试策略和重试间隔时间。然后我们调用 `execute()` 方法并将业务逻辑代码放入其中。

## 总结

Spring Retry 提供了多种方式来实现重试机制，包括注解方式、编程式方式，以及自定义的拦截器和监听器等。这些功能在处理失败操作时非常有用，并且可以使应用程序更加稳定和可靠。