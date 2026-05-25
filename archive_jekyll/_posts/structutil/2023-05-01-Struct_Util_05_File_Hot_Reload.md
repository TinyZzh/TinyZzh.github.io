---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: Struct Util 权威指南 - 配置文件的热重载
date: 2023-05-01 00:29:00 +0800
categories: [JAVA, StructUtil]
tags: [JAVA, StructUtil]
toc: yes
image_scaling: true
---

Struct Util 是一个 Java 语言开发的结构化数据映射处理工具。Struct Util 主要解决两个方面的问题。第一个方面将*.xls, *.csv 等配置友好型数据源转换为业务侧友好型的 bean 结构，对配置数据和使用数据进行解耦，让开发和运营、策划三方实现共赢。第二方面解决了数据表热重载，数据有条件过滤，表结构跨表引用等等应用相关的问题。

> [StructUtil](https://github.com/TinyZzh/StructUtil)是博主个人作品, 稍微有自吹自擂的嫌疑, 欢迎:star:收藏。哈哈, 因为是个人作品，应该是足够"权威"了。嘻嘻~~

## WatchService 注册监听文件变动

在 WatchService 注册需要监听的目录路径或文件路径，并指定仅关注 ENTRY_MODIFY 事件，路径相关的全部变动的事件通过 WatchKey#pollEvents()方法获取。核心实现业务代码如下：

```java
public FileWatcherService register(String dir) throws IOException {
    return this.register(Paths.get(Objects.requireNonNull(dir, "dir")));
}

public FileWatcherService register(Path dir) throws IOException {
    Objects.requireNonNull(dir, "dir");
    WatchKey key = dir.register(ws, StandardWatchEventKinds.ENTRY_MODIFY);
    Path p = keys.putIfAbsent(key, dir);
    if (null == p) {
        LOGGER.info("Register file watcher service. path: {}", dir.toAbsolutePath());
    }
    return this;
}

public FileWatcherService registerAll(String path) throws IOException {
    return this.registerAll(Paths.get(path));
}

/**
    * Register the given directory, and all its sub-directories, with the
    * WatchService.
    */
public FileWatcherService registerAll(final Path start) throws IOException {
    Objects.requireNonNull(start, "start");
    // register directory and sub-directories
    Files.walkFileTree(start, new SimpleFileVisitor<>() {
        @Override
        public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
            register(dir);
            return FileVisitResult.CONTINUE;
        }
    });
    return this;
}
```

### 注册文件变动钩子

将路径和文件变动注册到 WatchService 之后，我们还可以注册自定义的 Hook，为了实现 StructStore 的 reload 热重载，我们再 Hook 中调用 reload，当然，也可以执行多个其他自定义方法。

```java

public FileWatcherService registerHook(String fileName, Runnable hook) {
    return this.registerHook(Paths.get(fileName), hook);
}

public FileWatcherService registerHook(Path path, Runnable hook) {
    List<Runnable> list = this.hooksMap.computeIfAbsent(path, p -> Collections.synchronizedList(new ArrayList<>()));
    list.add(hook);
    LOGGER.info("Register file hook. path: {}", path.toAbsolutePath());
    return this;
}

public FileWatcherService deregisterHook(String fileName) {
    return this.deregisterHook(Paths.get(fileName));
}

public FileWatcherService deregisterHook(Path path) {
    List<Runnable> l = this.hooksMap.remove(path);
    if (null != l) {
        LOGGER.info("Deregister file hook. path: {}", path.toAbsolutePath());
    }
    return this;
}
```

### 示例

```java
@Test
public void test() throws IOException {
    FileWatcherService service = FileWatcherService.newBuilder().setWatchService(mockMs)
            .setScheduleInitialDelay(10L)
            .setScheduleTimeUnit(TimeUnit.DAYS)
            .setScheduleDelay(999L)
            .setExecutor(Executors.newScheduledThreadPool(1, r -> new Thread(r, "test")))
            .build();
    service.bootstrap();
    service.register("./");

    service.registerHook("./", () -> {
    });
    // service.deregisterHook("./");
    service.run();
}
```

## 核心业务代码解析

实现热重载的第一步就是要监听文件的变动，在文件变动时，调用 reload 方法对 Struct 数据进行重加载。Struct Util 中使用 JDK 内置的 WatchService 实现对文件系统的监听。

```java
/**
* Schedule process the file watch events.
*/
private void process() {
    try {
        WatchKey key;
        Path dir;
        if ((key = ws.poll()) == null
                || (dir = keys.get(key)) == null) {
            LOGGER.debug("watch key not registered. key:{}", key);
            return;
        }
        for (WatchEvent<?> event : key.pollEvents()) {
            WatchEvent.Kind<?> kind = event.kind();
            if (kind == StandardWatchEventKinds.OVERFLOW) {
                continue;
            }
            WatchEvent<Path> ev = (WatchEvent<Path>) event;
            Path name = ev.context();
            Path child = dir.resolve(name);
            List<Runnable> l = hooksMap.get(child);
            if (l != null) {
                try {
                    l.forEach(Runnable::run);
                } catch (Exception e) {
                    LOGGER.error("process data file failure. file:{}", child.toAbsolutePath(), e);
                    throw e;
                }
            }
        }
        boolean valid = key.reset();
        if (!valid) {
            this.keys.remove(key);
        }
    } catch (Throwable e) {
        LOGGER.error("file watcher service throw an unknown exception.", e);
    }
}
```

WatchService 的 poll 方法拉取新的文件变动事件，假如没有我们注册的的 WatchKey 则退出。否则使用 WatchKey#pollEvents()获取文件变动事件。

StandardWatchEventKind 主要由四个事件组成，分别为：

- OVERFLOW：事件丢失或失去
- ENTRY_CREATE：目录内实体创建或本目录重命名
- ENTRY_MODIFY：目录内实体修改
- ENTRY_DELETE：目录内实体删除或重命名

OVERFLOW 基本上忽略不处理，主要处理 ENTRY_CREATE 和 ENTRY_MODIFY 两种文件变动事件，ENTRY_DELETE 在游戏行业处理的比较少。

## 总结

本文讲解了 StructUtil 使用 WatchService 实现文件和目录路径监听，并监听文件变动事件，注册文件变动 Hook，并使用 Hook 实现文件的业务热重载功能。
