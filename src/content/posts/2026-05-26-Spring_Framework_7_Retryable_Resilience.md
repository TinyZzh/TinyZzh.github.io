---
title: Spring Framework 7 核心内置重试 - 使用 @Retryable 与 @ConcurrencyLimit 构建弹性应用
published: 2026-05-26
description: "Spring Framework 7.0 将 Spring Retry 的核心能力整合进 spring-core 模块，@Retryable 和全新的 @ConcurrencyLimit 注解成为一等公民，本文基于 Spring Boot 4 / Spring Framework 7.x 讲解弹性重试机制。"
image: ""
tags: [Spring Framework 7, Spring Boot 4, \@Retryable, \@ConcurrencyLimit, Resilience]
category: Spring Framework
draft: false
lang: zh_CN
---

在 Spring Framework 7.0 之前，如果我们需要方法级重试，通常要引入独立的 `spring-retry` 依赖。Spring Framework 7.0 将 Spring Retry 项目精简重构后合并至 `spring-core` 模块，`RetryTemplate`、`RetryPolicy` 等核心类位于 `org.springframework.core.retry` 包下；同时 `@Retryable` 注解支持移入 `spring-context`，并新增了 `@ConcurrencyLimit` 注解用于并发限流。两者可通过 `@EnableResilientMethods` 一键开启。

> 本文示例代码基于 Spring Boot 4.0 / Spring Framework 7.0。

## 快速上手

### 1. 不再需要额外依赖

Spring Boot 4 已内建弹性支持，**无需** 再添加 `spring-retry` 依赖：

```groovy
// build.gradle — 无需额外依赖！
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
}
```

### 2. 开启弹性方法支持

在配置类上添加 `@EnableResilientMethods`：

```java
@Configuration
@EnableResilientMethods
public class AppConfig {
}
```

> 这替代了旧版的 `@EnableRetry`。

### 3. 使用 @Retryable

```java
@Service
public class OrderService {

    @Retryable(RuntimeException.class)
    public void placeOrder() {
        // 业务代码
    }
}
```

以上声明了 `placeOrder()` 方法在抛出 `RuntimeException` 时自动重试，默认最多重试 3 次。

## @Retryable 属性详解

### value — 指定触发重试的异常类型

```java
@Retryable(value = { IOException.class, SQLException.class })
public void doSomething() {
    // 业务代码
}
```

只有当发生 `IOException` 或 `SQLException` 时才触发重试。

### include 和 exclude — 控制异常白名单与黑名单

```java
@Retryable(include = { NetworkException.class }, exclude = { TimeoutException.class })
public void doSomething() {
    // 业务代码
}
```

`NetworkException` 触发重试，`TimeoutException` 不重试。

### maxAttempts — 最大重试次数

```java
@Retryable(value = RuntimeException.class, maxAttempts = 5)
public void doSomething() {
    // 业务代码
}
```

最大重试次数设为 5 次。

### maxAttemptsExpression — SpEL 动态设置最大重试次数

```java
@Retryable(value = RuntimeException.class, maxAttemptsExpression = "#{retryConfig.maxAttempts}")
public void doSomething() {
    // 业务代码
}
```

### backoff — 退避策略

`@Backoff` 注解用于控制重试之间的延迟时间：

| 属性名 | 含义 | 说明 |
|--|--|--|
| `value` | 延迟时间 (ms) | 固定或随机延迟 |
| `delay` | 初始延迟时间 (ms) | 首次重试前的等待 |
| `maxDelay` | 最大延迟时间 (ms) | 延迟上限 |
| `multiplier` | 倍增因子 | 每次延迟乘以此系数，实现指数退避 |
| `delayExpression` | 初始延迟 SpEL 表达式 | |
| `maxDelayExpression` | 最大延迟 SpEL 表达式 | |
| `multiplierExpression` | 倍增因子 SpEL 表达式 | |
| `random` | 是否随机化 | 启用后延迟在 [0, value] + jitter 间随机 |

```java
@Retryable(value = RuntimeException.class,
           backoff = @Backoff(delay = 1000, multiplier = 2))
public void doSomething() {
    // 业务代码
}
```

每次重试间隔 1 秒，且间隔时间翻倍（指数退避）。

### exceptionExpression — SpEL 异常条件判断

```java
@Retryable(exceptionExpression = "#{message.contains('Not Found')}")
public void doSomething() {
    // 业务代码
}
```

仅当异常消息包含 "Not Found" 时才重试。

### label — 重试标签

```java
@Retryable(value = RuntimeException.class, label = "order-retry")
public void doSomething() {
    // 业务代码
}
```

### listeners — 重试监听器

```java
@Retryable(value = RuntimeException.class, listeners = {"myRetryListener"})
public void doSomething() {
    // 业务代码
}
```

监听器实现（包路径已变更为 `org.springframework.core.retry`）：

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
        System.out.println("Retry failed: " + throwable.getMessage());
    }
}
```

## @Recover — 重试耗尽后的兜底

```java
@Service
public class OrderService {

    @Retryable(value = RuntimeException.class, maxAttempts = 3)
    public String placeOrder() {
        // 可能失败的业务
    }

    @Recover
    public String recover(RuntimeException e) {
        return "fallback";
    }
}
```

当所有重试耗尽后，自动调用 `@Recover` 标注的兜底方法。

## 编程式重试 — RetryTemplate

`RetryTemplate` 现位于 `org.springframework.core.retry` 包：

```java
RetryTemplate retryTemplate = new RetryTemplate();

FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
backOffPolicy.setBackOffPeriod(2000L);

SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
retryPolicy.setMaxAttempts(3);

retryTemplate.setBackOffPolicy(backOffPolicy);
retryTemplate.setRetryPolicy(retryPolicy);

String result = retryTemplate.execute(context -> {
    // 业务代码
    return "success";
});
```

## 全新 @ConcurrencyLimit — 并发限流

Spring Framework 7.0 新增 `@ConcurrencyLimit` 注解，基于 Spring 的并发限流能力，可限制方法的并发调用数：

```java
@ConcurrencyLimit(5)
public void processPayment() {
    // 最多允许 5 个并发调用
}
```

与 `@Retryable` 一样，需要 `@EnableResilientMethods` 才能生效。

`@ConcurrencyLimit` 和 `@Retryable` 可组合使用：

```java
@Retryable(value = RuntimeException.class, maxAttempts = 3)
@ConcurrencyLimit(10)
public String callExternalApi() {
    // 限流 + 重试
}
```

## 响应式方法自动适配

Spring Framework 7.0 的 `@Retryable` 会**自动适配**响应式返回类型。当方法返回 `Mono` 或 `Flux` 时，框架会使用 Reactor 的 `retry` 操作符装饰响应式管道，无需额外配置：

```java
@Retryable(value = WebClientException.class, maxAttempts = 3,
           backoff = @Backoff(delay = 500))
public Mono<User> fetchUser(String id) {
    return webClient.get().uri("/users/{id}", id).retrieve().bodyToMono(User.class);
}
```

## 从 Spring Retry 迁移

| 旧版 (spring-retry) | 新版 (Spring Framework 7) |
|--|--|
| `org.springframework.retry` | `org.springframework.core.retry` |
| `@EnableRetry` | `@EnableResilientMethods` |
| `spring-retry` 依赖 | 内置于 `spring-core` / `spring-context` |
| 仅支持 imperative 方法 | 自动适配 reactive (Mono/Flux) |
| 无并发限流 | `@ConcurrencyLimit` |
| `RetryTemplate` 在 `spring-retry` | `RetryTemplate` 在 `spring-core` |

迁移步骤：

1. 移除 `spring-retry` 和 `spring-boot-starter-retry` 依赖
2. 将 `@EnableRetry` 替换为 `@EnableResilientMethods`
3. 将 `import org.springframework.retry.*` 替换为 `import org.springframework.core.retry.*`
4. 如需并发限流，添加 `@ConcurrencyLimit`

## 总结

Spring Framework 7.0 将重试能力提升为框架核心特性，开发者不再需要额外依赖即可使用 `@Retryable` 和 `RetryTemplate`；新增的 `@ConcurrencyLimit` 提供了方法级并发限流；响应式方法的自动适配让 Reactor 用户开箱即用。通过 `@EnableResilientMethods` 即可一键开启所有弹性能力。
