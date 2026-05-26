---
title: "Spring Boot 2.7 → 4.x 迁移指南：跨越三大版本的破壁之旅"
published: 2026-05-23
description: "从 Spring Boot 2.7 直达 4.x，跨越 3.0 和 4.0 两代大版本。本文按迁移顺序梳理全部破坏性变动，重点标注 Breaking Change，帮助你在迁移路上少踩坑。"
image: ""
tags: [Spring Boot 4, Spring Boot 3, Spring Framework 7, Migration, Breaking Change]
category: Spring Framework
draft: false
lang: zh_CN
---

从 Spring Boot 2.7 直接迁移到 4.x 意味着你需要跨越 **2.7 → 3.0 → 3.4+ → 4.0** 四个阶段，涉及 Jakarta EE 命名空间迁移、JDK 基线升级、模块化重构等重大变动。本文按迁移执行顺序组织，对所有破坏性变动（Breaking Change）以 ⚠️ 标记。

---

## 迁移路线总览

```
2.7.x ──①──→ 3.0.x ──②──→ 3.4.x+ ──③──→ 4.0.x
         JDK 17       修 deprecated    JDK 17+ / SF7
         javax→jakarta                 模块化 / Jackson3
         SF 6.0 / EE 10               EE 11 / Servlet 6.1
```

---

# 第一阶段：2.7 → 3.0

## ⚠️ JDK 17 基线

Spring Boot 3.0 要求 **Java 17+**，Java 8/11 不再支持。

## ⚠️ javax → jakarta 命名空间迁移

Jakarta EE 9+ 将所有 `javax.*` 包名改为 `jakarta.*`。这是此阶段**最广泛**的破坏性变动：

| 旧包名 | 新包名 |
|--------|--------|
| `javax.servlet` | `jakarta.servlet` |
| `javax.persistence` | `jakarta.persistence` |
| `javax.validation` | `jakarta.validation` |
| `javax.annotation` | `jakarta.annotation` |
| `javax.inject` | `jakarta.inject` |
| `javax.transaction` | `jakarta.transaction` |

**迁移工具**：
- [OpenRewrite Jakarta 迁移配方](https://docs.openrewrite.org/recipes/java/migrate/jakarta/javaxmigrationtojakarta)
- IntelliJ IDEA 内置迁移支持
- `spring-boot-properties-migrator` 依赖（临时添加，迁移完移除）

## ⚠️ Spring Framework 6.0

- ⚠️ 尾部斜杠匹配默认关闭：`GET /some/greeting/` 不再匹配 `@GetMapping("/some/greeting")`
- ⚠️ `spring.factories` 中 `EnableAutoConfiguration` key 不再支持，改用 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
- Spring Boot 3.0 使用 **Hibernate 6.1**，groupId 变为 `org.hibernate.orm`
- Spring Boot 3.0 使用 **Flyway 9.0**、**Liquibase 4.17+**

## ⚠️ Spring Security 6.0

- ⚠️ 默认对所有 dispatch type 应用授权（可通过 `spring.security.filter.dispatcher-types` 配置）
- ⚠️ `spring.security.saml2.relyingparty.registration.{id}.identity-provider` 属性移除，改用 `.asserting-party`
- 建议先升级到 Spring Security 5.8 过渡

## ⚠️ Spring Batch 5.0

- ⚠️ `@EnableBatchProcessing` 不再推荐使用，应移除以让 Boot 自动配置生效
- ⚠️ 多 Job 并行运行不再支持，需用 `spring.batch.job.name` 指定

## 其他 Breaking Changes（3.0）

| 变动 | 说明 |
|------|------|
| ⚠️ 图片 Banner 移除 | `banner.gif/jpg/png` 不再生效，改用 `banner.txt` |
| ⚠️ 日志日期格式变更 | 默认改为 ISO-8601：`yyyy-MM-dd'T'HH:mm:ss.SSSXXX` |
| ⚠️ `@ConstructorBinding` 不再需要类型级声明 | 仅多构造函数时用于标记 |
| ⚠️ Elasticsearch 高级 REST Client 移除 | 改用新 Java Client |
| ⚠️ MySQL 驱动坐标变更 | `mysql:mysql-connector-java` → `com.mysql:mysql-connector-j` |
| ⚠️ Apache ActiveMQ 移除 | 不再提供自动配置 |
| ⚠️ Atomikos 移除 | 不再提供自动配置 |
| ⚠️ EhCache 2 移除 | 改用 EhCache 3 (jakarta) |
| ⚠️ 嵌入式 MongoDB (Flapdoodle) 移除 | 改用 Testcontainers |
| `httptrace` 端点重命名 | → `httpexchanges` |
| Actuator 端点默认全脱敏 | `/env` 和 `/configprops` 默认所有值掩码 |
| `server.max-http-header-size` 弃用 | 改用 `server.max-http-request-header-size` |
| Cassandra 属性前缀迁移 | `spring.data.cassandra.*` → `spring.cassandra.*` |
| Redis 属性前缀迁移 | `spring.redis.*` → `spring.data.redis.*` |
| Jetty 不兼容 Servlet 6.0 | 需降级 Servlet API 到 5.0 |

---

# 第二阶段：3.0 → 3.4+（过渡准备）

此阶段目标：清理所有 deprecated API，确保在 3.4+ 上稳定运行。

1. 升级到 **3.4.x 或 3.5.x**（3.5.x 是迁移到 4.0 的推荐基线）
2. 逐一修复编译器 deprecation 警告
3. 确保所有第三方依赖兼容 Spring Boot 3.4+

---

# 第三阶段：3.4+ → 4.0

## ⚠️ Jakarta EE 11 / Servlet 6.1 基线

Spring Boot 4.0 基于 Jakarta EE 11，要求 **Servlet 6.1**。这意味着：

- ⚠️ **Undertow 被移除**（不兼容 Servlet 6.1），无法再使用 Undertow 作为嵌入式服务器
- 需使用 Tomcat 11+ 或 Jetty 12.1+

## ⚠️ 模块化重构

Spring Boot 4.0 进行了**全面模块化**，这是最大的破坏性变动之一：

**模块命名规则**：
- 模块：`spring-boot-<technology>`
- 根包：`org.springframework.boot.<technology>`
- Starter：`spring-boot-starter-<technology>`
- Test Starter：`spring-boot-starter-<technology>-test`

**⚠️ Starter 重命名**：

| 旧 Starter | 新 Starter |
|-----------|-----------|
| `spring-boot-starter-web` | `spring-boot-starter-webmvc` |
| `spring-boot-starter-web-services` | `spring-boot-starter-webservices` |
| `spring-boot-starter-aop` | `spring-boot-starter-aspectj` |
| `spring-boot-starter-oauth2-authorization-server` | `spring-boot-starter-security-oauth2-authorization-server` |
| `spring-boot-starter-oauth2-client` | `spring-boot-starter-security-oauth2-client` |
| `spring-boot-starter-oauth2-resource-server` | `spring-boot-starter-security-oauth2-resource-server` |

**⚠️ Flyway / Liquibase 现在需要 Starter**：

之前只需添加第三方依赖即可，现在必须使用 `spring-boot-starter-flyway` 或 `spring-boot-starter-liquibase`。

**过渡方案**：可先使用 `spring-boot-starter-classic` + `spring-boot-starter-test-classic` 快速启动，再逐步迁移到精确 Starter。

## ⚠️ Jackson 3

Spring Boot 4.0 默认使用 **Jackson 3**，这是影响面极广的破坏性变动：

**⚠️ 包名 / GroupId 变更**：
- `com.fasterxml.jackson` → `tools.jackson`（`jackson-annotations` 例外，仍用 `com.fasterxml.jackson.core`）

**⚠️ 类重命名**：

| 旧类 | 新类 |
|------|------|
| `JsonObjectSerializer` | `ObjectValueSerializer` |
| `JsonValueDeserializer` | `ObjectValueDeserializer` |
| `Jackson2ObjectMapperBuilderCustomizer` | `JsonMapperBuilderCustomizer` |
| `@JsonComponent` | `@JacksonComponent` |
| `@JsonMixin` | `@JacksonMixin` |

**⚠️ 配置属性迁移**：
- `spring.jackson.read.*` → `spring.jackson.json.read.*`
- `spring.jackson.write.*` → `spring.jackson.json.write.*`

**Jackson 2 兼容方案**：
- 设置 `spring.jackson.use-jackson2-defaults=true` 对齐旧默认值
- 添加 `spring-boot-jackson2` 模块（⚠️ 已 deprecated，仅作过渡）
- Jersey 4.0 不支持 Jackson 3，需搭配 `spring-boot-jackson2`

## ⚠️ Spring Framework 7.0

### ⚠️ spring-jcl 模块移除
- 替换为 Apache Commons Logging 1.3.0，大部分应用无感

### ⚠️ javax.annotation / javax.inject 注解支持移除
- 必须迁移到 `jakarta.annotation` / `jakarta.inject`

### ⚠️ HttpHeaders 不再实现 MultiValueMap
- 使用 `HttpHeaders#asMultiValueMap()` 过渡

### ⚠️ Null Safety 迁移到 JSpecify
- ⚠️ `org.springframework.lang` 包的 nullable 注解弃用，改用 [JSpecify](https://jspecify.dev/)
- ⚠️ Kotlin 项目可能因 nullability 差异导致**编译失败**
- Actuator 端点参数需从 `org.springframework.lang.Nullable` 迁移到 `org.jspecify.annotations.Nullable`

### ⚠️ RestTemplate 正式标记为 Deprecated
- 建议迁移到 `RestClient`（6.1 引入）

### ⚠️ Jackson 2.x 支持弃用
- Spring Framework 7.0 默认 Jackson 3.x，7.1 将禁用 2.x 自动发现，7.2 将移除

### ⚠️ JUnit 4 支持弃用
- `SpringRunner`、`SpringClassRule` 等弃用，迁移到 JUnit 5 的 `SpringExtension`

### 弹性特性内置
- `@Retryable`、`RetryTemplate` 合并到 `spring-core`（`org.springframework.core.retry`）
- 新增 `@ConcurrencyLimit`，通过 `@EnableResilientMethods` 开启
- 响应式方法自动适配 Reactor retry

### API Versioning
- Spring MVC / WebFlux 一等公民级 API 版本控制支持

## ⚠️ @MockBean / @SpyBean 移除

- ⚠️ 替换为 `@MockitoBean` 和 `@MockitoSpyBean`
- ⚠️ 新注解**不允许在 `@Configuration` 类上使用**，需在 test class 上声明

## ⚠️ @SpringBootTest 不再自动提供测试工具

| 旧行为 | 新行为 |
|--------|--------|
| 自动提供 `MockMvc` | 需添加 `@AutoConfigureMockMvc` |
| 自动提供 `WebClient` | 需添加 `@AutoConfigureWebClient` |
| 自动提供 `TestRestTemplate` | 需添加 `@AutoConfigureTestRestTemplate` + 依赖 |

## ⚠️ Spring Retry 依赖管理移除

Spring Retry 已合并到 Spring Framework 7.0 核心中。如果仍需独立 `spring-retry`，需显式指定版本。

迁移方式：
```java
// 旧
@EnableRetry
// 新
@EnableResilientMethods

// 旧 import
import org.springframework.retry.annotation.Retryable;
// 新 import
import org.springframework.core.retry.annotation.Retryable;
```

## ⚠️ Spring Authorization Server 合并入 Spring Security

- 不再作为独立项目，成为 Spring Security 7.0 的一部分
- ⚠️ `spring-authorization-server.version` 属性移除，改用 `spring-security.version`

## 其他 Breaking Changes（4.0）

| 变动 | 说明 |
|------|------|
| ⚠️ Pulsar Reactive 移除 | auto-configuration 被移除 |
| ⚠️ Executable Uber Jar Launch Scripts 移除 | Unix "fully executable" jar 支持移除 |
| ⚠️ Spring Session Hazelcast 移除 | 转由 Hazelcast 团队维护 |
| ⚠️ Spring Session MongoDB 移除 | 转由 MongoDB 团队维护 |
| ⚠️ Spock 集成移除 | Spock 不支持 Groovy 5 |
| ⚠️ Classic Uber-Jar Loader 移除 | 需从 build 配置中移除 `CLASSIC` loader implementation |
| ⚠️ HttpMessageConverters 弃用 | 改用 `ClientHttpMessageConvertersCustomizer` / `ServerHttpMessageConvertersCustomizer` |
| ⚠️ DevTools Live Reload 默认禁用 | 需设 `spring.devtools.livereload.enabled=true` |
| ⚠️ Liveness/Readiness Probes 默认启用 | 不需要可用 `management.endpoint.health.probes.enabled=false` 关闭 |
| ⚠️ MongoDB 属性迁移 | `spring.data.mongodb.*` → `spring.mongodb.*`（不依赖 Spring Data 的部分） |
| ⚠️ Elasticsearch RestClient → Rest5Client | customizer 需改为 `Rest5ClientBuilderCustomizer` |
| ⚠️ Spring Batch 默认内存模式 | 需改用 `spring-boot-starter-batch-jdbc` 恢复数据库存储 |
| ⚠️ Tomcat WAR 部署 | 需切换到 `spring-boot-starter-tomcat-runtime` |
| `spring.dao.exceptiontranslation.enabled` 移除 | 改用 `spring.persistence.exceptiontranslation.enabled` |
| Logback 默认 charset | 改为 UTF-8 |
| Kafka Retry | 从 Spring Retry 迁移到 Spring Framework core retry |
| AMQP Retry | 同上，引入 `RabbitTemplateRetrySettingsCustomizer` / `RabbitListenerRetrySettingsCustomizer` |

---

# 迁移检查清单

## 第一阶段：2.7 → 3.0

- [ ] 升级 JDK 到 17+
- [ ] 升级到 Spring Boot 2.7.x 最新版本
- [ ] 执行 `javax` → `jakarta` 包名迁移（OpenRewrite / IDE 工具）
- [ ] 更新 `spring.factories` → `AutoConfiguration.imports`
- [ ] 处理尾部斜杠匹配变更
- [ ] 迁移 MySQL 驱动坐标
- [ ] 迁移 Elasticsearch 高级 REST Client → 新 Java Client
- [ ] 移除 `@ConstructorBinding` 类型级声明
- [ ] 迁移 Spring Security 到 5.8 → 6.0
- [ ] 移除 `@EnableBatchProcessing`（Spring Batch 5）
- [ ] 更新配置属性（`spring-boot-properties-migrator` 辅助）
- [ ] 处理所有 deprecated API

## 第二阶段：3.0 → 3.4+

- [ ] 升级到 3.4.x / 3.5.x
- [ ] 修复所有 deprecated 警告
- [ ] 确保第三方依赖兼容

## 第三阶段：3.4+ → 4.0

- [ ] 升级 Spring Framework 到 7.x
- [ ] 迁移 Jackson 2 → Jackson 3（或使用 `spring-boot-jackson2` 过渡）
- [ ] 更新 Starter 命名（`web` → `webmvc`，`aop` → `aspectj` 等）
- [ ] 添加缺失 Starter（Flyway / Liquibase 现需 Starter）
- [ ] 迁移 `@MockBean` → `@MockitoBean`，`@SpyBean` → `@MockitoSpyBean`
- [ ] 添加 `@AutoConfigureMockMvc` / `@AutoConfigureWebClient` 等测试注解
- [ ] 迁移 `@EnableRetry` → `@EnableResilientMethods`
- [ ] 迁移 Spring Retry import 到 `org.springframework.core.retry`
- [ ] 迁移 Null Safety 注解到 JSpecify
- [ ] 移除 Undertow（改用 Tomcat 11 / Jetty 12.1）
- [ ] 移除 Classic Uber-Jar Loader 配置
- [ ] 更新 MongoDB / Elasticsearch / Kafka / AMQP 属性和 API
- [ ] 处理 Spring Batch 默认内存模式变更
- [ ] 处理 `HttpMessageConverters` 弃用
- [ ] 更新 Security OAuth Starter 命名

---

## 总结

从 Spring Boot 2.7 到 4.x 是一条跨越 Jakarta EE 9/11、JDK 17+、模块化重构、Jackson 3 四大变革的迁移之路。关键策略：

1. **分步走**：不要从 2.7 直接跳到 4.0，按 2.7 → 3.0 → 3.5 → 4.0 逐步升级
2. **先修 deprecated**：在每个版本上清零 deprecated 警告
3. **善用工具**：OpenRewrite、`spring-boot-properties-migrator`、IDE 迁移支持
4. **过渡 Starter**：4.0 的 `spring-boot-starter-classic` 帮你快速启动
5. **Jackson 2 桥接**：`spring-boot-jackson2` 模块给足迁移时间
