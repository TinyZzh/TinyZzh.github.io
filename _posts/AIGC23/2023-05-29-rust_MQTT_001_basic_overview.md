---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - paho-mqtt模块实战(入门)
date: 2023-05-29 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, MQTT]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

MQTT（Message Queuing Telemetry Transport）是一种轻量级的消息传输协议，它被设计用于低带宽和不稳定网络环境下的物联网设备通信。Rust是一种安全、并发和高效的编程语言，它在系统编程和网络编程方面有着很好的表现。在本教程中，我们将介绍如何使用Rust语言和paho-mqtt模块实现MQTT协议的应用。

> 前面写过3篇介绍 `rumqttc` 的教程，本篇开始使用 `paho-mqtt` 模块是c库的封装, 支持v5协议，qos 2等更复杂的特性。 

## 环境准备

我们需要先安装好相关的开发环境。在Cargo.toml中添加依赖：

```toml
paho-mqtt = "0.12.1"
```

### 连接MQTT服务器

在使用MQTT协议之前，我们需要先连接到MQTT服务器。以下是连接MQTT服务器的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);
}
```

在上面的示例代码中，我们首先创建了一个MQTT客户端对象，并指定了MQTT服务器的地址。然后，我们创建了一个连接选项对象，并设置了心跳间隔和会话清除标志。最后，我们使用连接选项对象连接到MQTT服务器，并打印连接响应信息。

### 发布MQTT消息

在连接到MQTT服务器之后，我们可以使用MQTT客户端对象来发布消息。以下是发布MQTT消息的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);

    let topic = "test/topic";
    let payload = "Hello, MQTT!";
    let message = mqtt::MessageBuilder::new()
        .topic(topic)
        .payload(payload)
        .qos(mqtt::QOS_1)
        .finalize();
    let response = cli.publish(message).unwrap();
    println!("Published MQTT message: {:?}", response);
}
```

在上面的示例代码中，我们首先连接到MQTT服务器，然后创建了一个MQTT消息对象，并设置了消息主题、消息负载和消息服务质量等级。最后，我们使用MQTT客户端对象来发布消息，并打印发布响应信息。

### 订阅MQTT主题

在使用MQTT协议之前，我们需要先订阅MQTT主题。以下是订阅MQTT主题的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);

    let topic = "test/topic";
    let qos = mqtt::QOS_1;
    let response = cli.subscribe(topic, qos).unwrap();
    println!("Subscribed to MQTT topic: {:?}", response);
}
```

在上面的示例代码中，我们首先连接到MQTT服务器，然后创建了一个MQTT订阅对象，并设置了订阅主题和服务质量等级。最后，我们使用MQTT客户端对象来订阅主题，并打印订阅响应信息。

### 同时发布和订阅MQTT消息

在使用MQTT协议时，我们通常需要同时发布和订阅MQTT消息。以下是同时发布和订阅MQTT消息的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);

    let topic = "test/topic";
    let qos = mqtt::QOS_1;
    let response = cli.subscribe(topic, qos).unwrap();
    println!("Subscribed to MQTT topic: {:?}", response);

    let payload = "Hello, MQTT!";
    let message = mqtt::MessageBuilder::new()
        .topic(topic)
        .payload(payload)
        .qos(mqtt::QOS_1)
        .finalize();
    let response = cli.publish(message).unwrap();
    println!("Published MQTT message: {:?}", response);

    for message in cli.start_consuming() {
        println!("Received MQTT message: {:?}", message);
    }
}
```

在上面的示例代码中，我们首先连接到MQTT服务器，然后创建了一个MQTT订阅对象，并设置了订阅主题和服务质量等级。接着，我们创建了一个MQTT消息对象，并使用MQTT客户端对象来发布消息。最后，我们使用MQTT客户端对象来接收消息，并打印接收到的消息。

### 断开MQTT服务器连接

在使用MQTT协议之后，我们需要断开与MQTT服务器的连接。以下是断开MQTT服务器连接的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);

    cli.disconnect(None).unwrap();
    println!("Disconnected from MQTT server.");
}
```

在上面的示例代码中，我们首先连接到MQTT服务器，然后使用MQTT客户端对象来断开与MQTT服务器的连接，并打印断开连接信息。

## 进阶使用

在本节中，我们将介绍如何使用Rust语言和paho-mqtt模块实现MQTT协议的进阶应用。我们将提供2个示例，分别是：

1. 使用SSL/TLS连接MQTT服务器
2. 使用认证机制连接MQTT服务器

### 使用SSL/TLS连接MQTT服务器

在使用MQTT协议时，我们通常需要使用SSL/TLS协议来保证通信安全。以下是使用SSL/TLS连接MQTT服务器的示例代码：

```rust
extern crate paho_mqtt as mqtt;
extern crate rustls;

use std::fs::File;
use std::io::BufReader;
use std::sync::Arc;

fn main() {
    let host = "ssl://localhost:8883";
    let cli = mqtt::Client::new(host).unwrap();

    let mut config = rustls::ClientConfig::new();
    let cert_file = &mut BufReader::new(File::open("cert.pem").unwrap());
    config.root_store.add_pem_file(cert_file).unwrap();
    let tls = Arc::new(rustls::ClientSession::new(&Arc::new(config), host));

    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .ssl_options(mqtt::SslOptionsBuilder::new()
            .ssl_version(mqtt::SslVersion::TlsV1_2)
            .server_name_indication(host)
            .build(tls))
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);
}
```

在上面的示例代码中，我们首先创建了一个MQTT客户端对象，并指定了使用SSL/TLS协议连接MQTT服务器的地址。然后，我们创建了一个SSL/TLS配置对象，并从PEM文件中加载证书。接着，我们创建了一个SSL/TLS会话对象，并使用SSL/TLS配置对象和MQTT服务器地址来初始化会话对象。最后，我们创建了一个连接选项对象，并设置了心跳间隔、SSL/TLS选项和会话清除标志。我们使用连接选项对象连接到MQTT服务器，并打印连接响应信息。

### 使用认证机制连接MQTT服务器

在使用MQTT协议时，我们通常需要使用认证机制来保证通信安全。以下是使用认证机制连接MQTT服务器的示例代码：

```rust
extern crate paho_mqtt as mqtt;

fn main() {
    let host = "tcp://localhost:1883";
    let cli = mqtt::Client::new(host).unwrap();

    let username = "user";
    let password = "password";
    let conn_opts = mqtt::ConnectOptionsBuilder::new()
        .keep_alive_interval(std::time::Duration::from_secs(20))
        .user_name(username)
        .password(password)
        .clean_session(false)
        .finalize();
    let response = cli.connect(conn_opts).unwrap();
    println!("Connected to MQTT server: {:?}", response);
}
```

在上面的示例代码中，我们首先创建了一个MQTT客户端对象，并指定了MQTT服务器的地址。然后，我们创建了一个连接选项对象，并设置了心跳间隔、用户名、密码和会话清除标志。我们使用连接选项对象连接到MQTT服务器，并打印连接响应信息。

## 总结

在本教程中，我们介绍了如何使用Rust语言和paho-mqtt模块实现MQTT协议的应用。我们提供了几个基础应用的示例代码，包括连接MQTT服务器、发布MQTT消息、订阅MQTT主题、同时发布和订阅MQTT消息和断开MQTT服务器连接。


