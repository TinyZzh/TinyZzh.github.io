---
title: "为什么我推荐升级到 Spring Boot 4.x + Spring Framework 7.x"
published: 2026-05-26
description: "Spring Boot 4.x 和 Spring Framework 7.x 带来了模块化架构、Jackson 3、弹性内建、API Versioning、Jakarta EE 11 等重大演进。本文从工程实践角度总结升级的核心价值。"
image: ""
tags: [Spring Boot 4, Spring Framework 7, Upgrade, Jakarta EE 11, Jackson 3]
category: Spring Framework
draft: false
lang: zh_CN
---

从 Spring Boot 3.x 到 4.x、从 Spring Framework 6.x 到 7.x，这不只是一次版本号递增，而是一次面向未来十年的架构升级。以下是我推荐升级的核心理由。

---

## 1. 模块化：从"全家桶"到"按需取用"

Spring Boot 4.x 完成了全面模块化重构。每个模块拥有清晰的命名空间：

- 模块：`spring-boot-<technology>`
- 根包：`org.springframework.boot.<technology>`
- Starter：`spring-boot-starter-<technology>`

**这意味着什么？**

- 依赖树大幅瘦身，启动速度和构建体积双降
- 类路径冲突显著减少，不再因为引入一个 Starter 拉入半生态圈
- 模块边界清晰，团队协作时各模块职责明确

过渡方案也考虑周到——`spring-boot-starter-classic` 让你零成本先跑起来，再逐步拆分到精确 Starter。

---

## 2. Jackson 3：JSON 处理的代际升级

Spring Boot 4.x 默认 Jackson 3，这是 JSON 序列化层十年来最大的一次重构：

- **包名迁移**：`com.fasterxml.jackson` → `tools.jackson`，彻底脱离旧命名空间
- **性能提升**：Jackson 3 基于 Project Panama（JDK 22+ FFI），JSON 解析吞吐量有显著提升
- **不可变对象支持**：原生支持 Record 和不可变 POJO 的零拷贝反序列化

如果你暂时不想动序列化层，`spring-boot-jackson2` 模块提供了完整的 Jackson 2 兼容桥接，给足迁移时间。

---

## 3. 弹性内建：不再需要 spring-retry 外挂

Spring Framework 7.x 将 Retry 和并发限制合并到 `spring-core`：

```java
// 旧：需要额外依赖 spring-retry
@EnableRetry
@Retryable

// 新：内建于 spring-core
@EnableResilientMethods
@Retryable          // import org.springframework.core.retry.annotation.Retryable
@ConcurrencyLimit   // 新增：并发限制注解
```

- **零额外依赖**：retry 不再是"加装"，而是框架一等公民
- **响应式自动适配**：响应式方法自动使用 Reactor retry，无需手动适配
- **@ConcurrencyLimit**：新增并发控制注解，一个注解搞定限流

---

## 4. API Versioning：版本控制一等公民

Spring Framework 7.x 在 MVC / WebFlux 中内置了 API 版本控制：

- 不再需要第三方库（如 spring-api-versioning）或自定义 Header 解析
- 支持 Header、Path、Param、MediaType 四种版本策略
- 与 Content Negotiation 深度集成

对于维护多版本 API 的团队，这是消除技术债务的关键特性。

---

## 5. Jakarta EE 11 / Servlet 6.1：拥抱最新标准

Jakarta EE 11 是 Java 企业级规范的最新基线：

- **Servlet 6.1**：支持虚拟线程（Virtual Threads）友好的异步处理模型
- **Jakarta Persistence 3.2**：对 Record 类型的更好支持
- **Jakarta Validation 3.1**：与 JDK 新特性对齐

停留在旧基线意味着你的应用将与 Java 生态最新规范渐行渐远。

---

## 6. Null Safety 迁移到 JSpecify

Spring Framework 7.x 将 nullable 注解从 `org.springframework.lang` 迁移到 [JSpecify](https://jspecify.dev/)：

- JSpecify 是跨生态的 null safety 标准，Kotlin、Guava、Checker Framework 均在采用
- 统一 null 标注意味着 Kotlin 互操作性更强，IDE 提示更精准
- 长远看，这是消除 NPE 的基础设施升级

---

## 7. 淘汰技术债务的窗口期

| 正式标记为 Deprecated / 移除 | 推荐替代 |
|------------------------------|----------|
| `RestTemplate` | `RestClient`（SF 6.1 引入） |
| `@MockBean` / `@SpyBean` | `@MockitoBean` / `@MockitoSpyBean` |
| JUnit 4 支持 | JUnit 5 `SpringExtension` |
| Jackson 2.x 自动发现 | Jackson 3.x（7.1 禁用 2.x，7.2 移除） |
| Undertow | Tomcat 11 / Jetty 12.1 |
| Spring Authorization Server（独立项目） | 合并入 Spring Security 7 |

**现在升级，你有完整的过渡方案；再晚，桥接方案会逐步移除。**

---

## 8. Virtual Threads 友好

Spring Boot 4.x + Spring Framework 7.x 全面适配 JDK 21+ Virtual Threads：

- 请求处理链路默认虚拟线程友好
- Servlet 6.1 异步模型与虚拟线程深度协同
- 不再需要 `spring.threads.virtual.enabled=true` 这类实验性配置

---

## 总结

| 维度 | Spring Boot 3.x + SF 6.x | Spring Boot 4.x + SF 7.x |
|------|--------------------------|--------------------------|
| 模块化 | 半模块化，Starter 拉入过多 | 全面模块化，按需取用 |
| JSON | Jackson 2（十年架构） | Jackson 3（Project Panama） |
| 弹性 | spring-retry 外挂 | 内建 retry + 并发限制 |
| API 版本控制 | 需第三方库 | 一等公民支持 |
| Jakarta EE | EE 10 / Servlet 6.0 | EE 11 / Servlet 6.1 |
| Null Safety | Spring 私有注解 | JSpecify 跨生态标准 |
| Virtual Threads | 实验性支持 | 全面适配 |
| RestTemplate | 可用但无新特性 | Deprecated → RestClient |

升级不是目的，让技术栈与生态演进保持同步才是。Spring Boot 4.x + Spring Framework 7.x 提供了完整的过渡方案（classic starter、jackson2 桥接、属性 migrator），升级成本可控，收益深远。

> 迁移实操指南见：[Spring Boot 2.7 → 4.x 迁移指南：跨越三大版本的破壁之旅](/posts/Spring_Boot_2.7_to_4.x_Migration_Guide/)
