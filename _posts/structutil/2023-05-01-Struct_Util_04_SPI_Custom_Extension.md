---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 通过 SPI 实现自定义扩展
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营、策划三方实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

## SPI 扩展

Struct Util 提供了 `Converters`, `Converter`, `StructFactoryBean`, `StructHandler`四个扩展点，允许用户进行功能扩展。

### EnhancedServiceLoader

相比于 JDK 内置的 SPI 功能解决了加载异常处理，懒加载等问题。核心加载代码如下：

```java
void handleDefinitionFile(String dir, ClassLoader classLoader, List<ExtensionDefinition> output) throws IOException {
    String fileName = dir + this.service.getName();
    Enumeration<URL> urls = classLoader != null
            ? classLoader.getResources(fileName)
            : ClassLoader.getSystemResources(fileName);
    while (urls.hasMoreElements()) {
        URL url = urls.nextElement();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream(), StandardCharsets.UTF_8))) {
            String line = null;
            while (null != (line = reader.readLine())) {
                line = line.trim();
                if (line.length() > 0) {
                    try {
                        output.add(this.createExtensionDefinition(line, classLoader));
                    } catch (LinkageError | ClassNotFoundException e) {
                        LOGGER.warn("load [{}] class failure. {}", line, e.getMessage());
                    }
                }
            }
        } catch (Throwable e) {
            LOGGER.warn("handle extension definition file error.", e);
        }
    }
}

ExtensionDefinition createExtensionDefinition(String clzName, ClassLoader loader) throws ClassNotFoundException {
    Class<?> clzOfService = Class.forName(clzName, true, loader);
    String name = null;
    int order = 0;
    SPI anno = AnnotationUtils.findAnnotation(SPI.class, clzOfService);
    if (anno != null) {
        name = anno.name();
        order = anno.order();
    }
    return new ExtensionDefinition(name, clzOfService, order);
}
```

### 自定义 Converter

```java
public class StringToArrayConverter implements Converter {

    @Override
    public Object convert(Object originValue, Class<?> targetType) {
        if (!targetType.isArray() || String.class != originValue.getClass()) {
            return null;
        }
        String content = (String) originValue;
        Class<?> componentType = targetType.getComponentType();
        String[] data = content.split(separator);
        if (exceptBlank) {
            data = Arrays.stream(data)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toArray(String[]::new);
        }
        Object array = Array.newInstance(componentType, data.length);
        for (int i = 0; i < data.length; i++) {
            Array.set(array, i, ConverterUtil.covert(data[i], componentType));
        }
        return array;
    }
}
```
