---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 部署Spring Boot Admin实现基础的服务器监控和告警
date: 2022-10-26 10:16:00 +0800
categories: [JAVA, SpringBootAdmin, SBA]
tags: [JAVA, SpringBootAdmin, SBA]
toc: yes
image_scaling: true
---

## Spring Boot Admin

Spring Boot Actuator模块提供了生产级别的功能，比如健康检查，审计，指标收集，HTTP 跟踪等，帮助我们监控和管理Spring Boot 应用。这个模块是一个采集应用内部信息暴露给外部的模块。支持HTTP和JMX两种方式访问。

Spring Boot Admin（SBA）是在Actuator模块的基础上实现的UI界面，提供直观的UI和仪表盘方便开发者观察应用状态和简单的健康监控。


## 启动Spring Boot Admin服务

build.grdle中依赖设置为最新的**Spring Boot 2.7.4**和**Spring Boot Admin 2.7.6**。

```xml
<!-- pom.xml -->
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-server</artifactId>
    <version>2.7.6</version>
</dependency>
```

```groovy
//  build.gradle
apply plugin: 'io.spring.dependency-management'

dependencies {
    implementation("org.springframework.boot:spring-boot:2.7.4")
    implementation("org.springframework.boot:spring-boot-starter:2.7.4")
    implementation("org.springframework.boot:spring-boot-starter-web:2.7.4")
    implementation("org.springframework.boot:spring-boot-starter-actuator:2.7.4")

    implementation("de.codecentric:spring-boot-admin-starter-server:2.7.6")
}
```

创建应用启动类MonitorApplication.class。

```java
@SpringBootApplication()
@EnableAdminServer()
public class MonitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(MonitorApplication.class, args);
    }
}
```

默认监听8080端口，启动之后通过 [http://127.0.0.1:8080](http://127.0.0.1:8080)查看面板。首页如下如所示：

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/sba_2-7-6-dashboard.png" alt="xx" class="image-click-scaling"/></div>


## 应用接入Spring Boot Admin

项目中接入SBA也很简单，启动时会自动注入配置并注册到SBA。

在应用程序目录中引入Client包。
```groovy
//  build.gradle
implementation("de.codecentric:spring-boot-admin-starter-client:2.7.6")
```

```xml
<!-- pom.xml -->
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
    <version>2.7.6</version>
</dependency>
```

设置启动配置和参数。一下提供基础的简单配置。更多配置见 **[Client Options](https://codecentric.github.io/spring-boot-admin/current/#spring-boot-admin-client)**

```shell
#===================================== Spring Boot Admin ======================================
spring.boot.admin.client.url=http://127.0.0.1:9005
spring.boot.admin.client.instance.prefer-ip=true
spring.boot.admin.client.instance.service-url=http://127.0.0.1:2789
spring.boot.admin.client.instance.metadata.tags.environment=services-my
# Spring Security
spring.boot.admin.client.instance.metadata.user.name=
spring.boot.admin.client.instance.metadata.user.password=
management.endpoints.web.exposure.include=*
```

启动测试程序。

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/sba_2-7-6-dashboard_first_app.png" alt="xx" class="image-click-scaling"/></div>

<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/sba_2-7-6-dashboard_first_app_detail.png" alt="xx" class="image-click-scaling"/></div>


## Spring Cloud服务发现

上例中通过引入client包并注册到SBA。本例主要演示通过Spring Cloud全家桶的服务发现自动注册到SBA。SBA支持全部Spring Cloud的服务发现组件。

首先确定你的项目中引入了Spring Cloud依赖。

```groovy
//  build.gradle
implementation("org.springframework.cloud:spring-cloud-starter:...")
```

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter</artifactId>
</dependency>
```

配置在application.yml文件即可。
```yml
spring:
  cloud:
    discovery:
      client:
        simple:
          instances:
            test:
              - uri: http://instance1.intern:8080
                metadata:
                  management.context-path: /actuator
              - uri: http://instance2.intern:8080
                metadata:
                  management.context-path: /actuator
```


## 健康状态告警

SBA内置许多通知方式，例如：**Microsoft Teams、邮件**。也允许用户自定义通知，通过继承实现 **AbstractEventNotifier**。本小节主要以**钉钉告警通知**为例，更多其他类型的告警通知配置见 **[Spring Boot Admin Notifications](https://codecentric.github.io/spring-boot-admin/2.7.6/#_notifications)**

相比于普罗米修斯这种重量级的监控和日志收集方案，**SBA无法追溯查看历史数据**，仅仅是针对状态变更的当前状态做一个告警和通知。作为重量级监控方案的补充，更灵活使用。

### [钉钉告警通知](https://codecentric.github.io/spring-boot-admin/2.6.6/#DingTalk-notifications)

|属性名|描述|缺省值
|:--|:--|:--|
|spring.boot.admin.notify.dingtalk.enabled|是否开启钉钉通知|true
|spring.boot.admin.notify.dingtalk.webhook-url|钉钉机器人的webhookUrl|
|spring.boot.admin.notify.dingtalk.secret|钉钉机器人的密钥|
|spring.boot.admin.notify.dingtalk.message|通知文本，支持SpEL表达式|"#{instance.registration.name} #{instance.id} is #{event.statusInfo.status}"

## 其他

SBA的另外一大亮点就是支持定义端点，允许嵌入外部网页。有助于用户扩展自定义的监控维度，也有助于支持各种各样的其他第三方库的监控管理后台，例如:Dubbo Admin。

## 参考资料
1. [Spring Boot Admin Reference Guide](https://codecentric.github.io/spring-boot-admin/current/)







