---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 日志库
date: 2023-03-14 23:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_12_log.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust是一门系统级编程语言，因其安全性、高性能和并发性而备受欢迎。在Rust应用程序中，日志记录是一项非常重要的任务，因为它可以帮助开发人员了解应用程序的运行情况并解决问题。Rust的Log库提供了一种简单的方法来实现日志记录，本文将介绍如何使用Rust的Log库作为日志门面，并结合env_logger和log4rs两个日志库的实战用例进行深入探讨。

## Rust的Log库

Rust的Log库是一个轻量级的日志记录框架，它提供了一个简单的API，可以方便地记录日志。Log库允许您将日志消息发送到控制台、文件或任何其他自定义目标。Log库还提供了一些有用的功能，如日志级别、日志过滤器和日志格式化。

> 类似于Java语言中的Slf4j日志库，可以零开销的帮助开发者切换底层依赖的日志库实现。

### 引入Log库依赖

在本系列教程的Cargo篇，我们提到了管理依赖，我们就引入过log库，这里回顾一下。在Cargo.toml文件中添加以下依赖项, 引入Rust的Log库依赖，具体配置如下：

```ini
[dependencies]
log = "0.4.0"
##    引入env_logger库
env_logger = "0.9.0"
```

### 使用Log库

在使用Rust的Log库之前，您需要初始化日志记录系统。这可以通过调用 `log::set_logger()` 函数来完成，该函数将日志记录器注册到全局日志记录器中。
下面是通过简单的示例：

```rust
use log::{info, LevelFilter};
use std::io::Write;

fn main() {
    //    使用env_logger日志库，详细的时候后续会深入讲解
    env_logger::init();

    log::set_logger(&LOGGER).unwrap();
    log::set_max_level(LevelFilter::Info);

    info!("Hello, world!");
}
```

在这个示例中，我们使用了 `env_logger` 库来初始化日志记录系统。 `env_logger` 库是一个流行的Rust日志记录库，它提供了一个简单的方法来配置日志记录器。在这个示例中，我们将日志记录器注册到全局日志记录器中，并设置日志级别为 `info` 。最后，我们使用 `info!()` 宏来记录日志消息。

### 日志级别

Rust的Log库提供了五个日志级别，从最高到最低分别是：

- `Error`
- `Warn`
- `Info`
- `Debug`
- `Trace`

默认情况下，Log库将记录所有级别的日志消息。您可以通过调用 `log::set_max_level()` 函数来设置日志级别的阈值。例如，如果您只想记录 `warn` 级别及以上的日志消息，可以使用以下代码：

```rust
log::set_max_level(LevelFilter::Warn);
```

### 日志过滤器

Rust的Log库还提供了一种过滤器机制，可以根据日志记录器的名称和日志级别来过滤日志消息。过滤器可以通过调用 `log::set_logger()` 函数时传递给日志记录器。例如，如果您只想记录名为 `myapp::database` 的记录器的 `info` 级别及以上的日志消息，可以使用以下代码：

```rust
use log::{info, LevelFilter};
use std::io::Write;

fn main() {
    env_logger::init();

    let filter = log::FilterBuilder::new()
        .target("myapp::database")
        .level(LevelFilter::Info)
        .build();

    log::set_logger(&LOGGER).unwrap();
    log::set_max_level(LevelFilter::Info);

    info!("Hello, world!");
}
```

在这个示例中，我们使用了 `log::FilterBuilder` 来创建一个过滤器，该过滤器将仅记录名为 `myapp::database` 的记录器的 `info` 级别及以上的日志消息。

### 日志格式化

Rust的Log库允许您自定义日志消息的格式。默认情况下，Log库将使用 `{level} {message}` 格式化日志消息。您可以通过调用 `log::set_logger()` 函数时传递一个自定义的格式字符串来自定义日志消息的格式。例如，以下代码将使用自定义的格式字符串来格式化日志消息：

```rust
use log::{info, LevelFilter};
use std::io::Write;

fn main() {
    env_logger::init();

    let format = log::FormatBuilder::new()
        .format(|buf, record| {
            writeln!(buf, "{} [{}] - {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"), record.level(), record.args())
        })
        .build();

    log::set_logger(&LOGGER).unwrap();
    log::set_max_level(LevelFilter::Info);

    info!("Hello, world!");
}
```

在这个示例中，我们使用了 `log::FormatBuilder` 来创建一个自定义的格式化程序，该程序将在日志消息中包含时间戳。我们将自定义的格式化程序传递给 `log::set_logger()` 函数，以便在记录日志消息时使用它。

## log4rs库

log4rs是一个强大的日志记录库，它提供了许多高级功能，如多个日志记录器、多个输出目标和灵活的日志过滤器。log4rs库是基于Rust的Log库构建的，因此您可以使用Rust的Log库的所有功能以及log4rs库的高级功能。

> ps：假如你曾经接触过log4j, 那么你会发现log4rs很多概念和设计都和log4j相似。

### 引入log4rs依赖

要使用log4rs库，您需要在Cargo.toml文件中添加以下依赖项：

```ini
[dependencies]
log4rs = "1.2.0"
```

### 配置yaml

log4rs库使用YAML或JSON格式的配置文件来配置日志记录器。以下是一个简单的log4rs配置文件示例：

```yaml
refresh_rate: 30 seconds

appenders:
  stdout:
    kind: console
    encoder:
      pattern: "{d} [{l}] - {m}\n"
  file:
    kind: file
    path: "logs/myapp.log"
    encoder:
      pattern: "{d} [{l}] - {m}\n"

root:
  level: info
  appenders:
    - stdout
    - file

loggers:
  myapp::database:
    level: info
    appenders:
      - file
```

在这个示例中，我们定义了两个输出目标：一个是控制台，另一个是文件。我们还定义了一个名为 `myapp::database` 的记录器，它将日志消息发送到文件输出目标。最后，我们将根记录器配置为将日志消息发送到控制台和文件输出目标。

### 使用log4rs库

要使用log4rs库，您需要在应用程序中初始化日志记录器。以下是一个简单的示例：

```rust
use log::{info, LevelFilter};
use log4rs::config::{Config, ConfigHandle};

fn main() {
    let config: Config = log4rs::load_config_file("log4rs.yaml", Default::default()).unwrap();
    let handle: ConfigHandle = log4rs::init_config(config).unwrap();

    info!("Hello, world!");
}
```

在这个示例中，我们使用 `log4rs::load_config_file()` 函数从文件中加载配置文件。然后，我们使用 `log4rs::init_config()` 函数初始化日志记录器。最后，我们使用 `info!()` 宏来记录日志消息。

### log4rs日志过滤器

log4rs库提供了灵活的过滤器机制，可以根据记录器的名称、级别和其他属性来过滤日志消息。以下是一个示例配置文件，其中定义了一个过滤器，该过滤器将仅记录名为 `myapp::database` 的记录器的 `info` 级别及以上的日志消息：

```yaml
appenders:
  stdout:
    kind: console
    encoder:
      pattern: "{d} [{l}] - {m}\n"
  file:
    kind: file
    path: "logs/myapp.log"
    encoder:
      pattern: "{d} [{l}] - {m}\n"

root:
  level: info
  appenders:
    - stdout
    - file

loggers:
  myapp::database:
    level: info
    appenders:
      - file
    filters:
      - kind: threshold
        level: info
```

在这个示例中，我们定义了一个过滤器，该过滤器将仅记录名为 `myapp::database` 的记录器的 `info` 级别及以上的日志消息。

### log4rs日志格式化

log4rs库允许您自定义日志消息的格式。您可以通过在配置文件中设置输出目标的 `encoder.pattern` 属性来自定义日志消息的格式。例如，以下配置将使用自定义的格式字符串来格式化日志消息：

```yaml
appenders:
  stdout:
    kind: console
    encoder:
      pattern: "{d} [{l}] - {m}\n"
  file:
    kind: file
    path: "logs/myapp.log"
    encoder:
      pattern: "{d} [{l}] - {m}\n"
```

在这个示例中，我们在输出目标的 `encoder.pattern` 属性中使用了自定义的格式字符串。

## 扩展阅读 - tracing

一般来说，env_logger和log4rs已经能够满足绝大部门开发者的日志需求。但是在分布式应用，异步编程领域，log4rs输出的日志由于没有上下文环境信息，异步错落的日志输出，让我们排查问题变得很痛苦，这种情况下，log4rs就显得不太够专业了，而tracing恰恰就有了用武之地。

不过鉴于tracing日志库是一个非常庞杂的日志库，要讲透整个知识点需要先掌握分布式日志，链路追踪等等一些列的基础知识，所以博主先在这里提一句，挖个坑，后续针对tracing专门开一篇教程讲解。

## 总结

Rust的Log库和log4rs库都是非常有用的日志记录库，它们提供了许多功能，可以帮助开发人员了解应用程序的运行情况并解决问题。Rust的Log库是一个轻量级的日志记录框架，它提供了一个简单的API，可以方便地记录日志。Log库允许您将日志消息发送到控制台、文件或任何其他自定义目标。Log库还提供了一些有用的功能，如日志级别、日志过滤器和日志格式化。log4rs库是一个强大的日志记录库，它提供了许多高级功能，如多个日志记录器、多个输出目标和灵活的日志过滤器。log4rs库是基于Rust的Log库构建的，因此您可以使用Rust的Log库的所有功能以及log4rs库的高级功能。

使用Rust的Log库和log4rs库可以帮助您更好地了解应用程序的运行情况，更快地解决问题，并提高应用程序的可靠性和可维护性。
