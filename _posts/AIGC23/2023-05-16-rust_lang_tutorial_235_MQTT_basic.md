---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 物联网消息传输协议MQTT(入门)
date: 2023-05-16 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, MQTT]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

MQTT（Message Queuing Telemetry Transport）是一种轻量级的消息传输协议，用于在低带宽和不稳定的网络环境中传输消息。MQTT协议基于发布/订阅模式，包含了许多特性，如QoS，保留消息，遗嘱消息等，使得它非常适合物联网设备之间的通信。

Rust是一种系统级编程语言，具有内存安全和高性能的特性。Rust语言的主要目标是提供一种安全、并发、实用的编程语言，使得开发者可以轻松地编写高性能的系统级应用程序。本教程将介绍如何使用Rust语言和rumqttc模块来实现MQTT协议的基础应用和进阶应用。

## rumqttc模块简介

rumqttc是一个基于Rust语言实现的MQTT客户端库，它提供了连接MQTT服务器、订阅主题、发布消息等基本功能，并支持TLS加密连接。rumqttc的API简单易用，适合初学者和中级开发者使用。

在Cargo.toml文件中添加rumqtt模块依赖, 示例配置如下：

```toml
[dependencies]
rumqttc = "0.21.0"
```

## 应用实践

### 连接MQTT服务器

使用rumqttc连接MQTT服务器非常简单，只需要指定服务器地址和端口号即可。以下是一个连接到本地MQTT服务器的示例代码：

```rust
use rumqttc::{Client, MqttOptions};

fn main() {
    let mqtt_options = MqttOptions::new("test-1", "localhost", 1883);
    let (mut client, _) = Client::new(mqtt_options, 10);
    client
        .connect()
        .expect("Failed to connect to MQTT server");
    // ...
}
```

其中，`test-1`是客户端ID，可以自行定义。`10`是消息队列的大小，表示可以同时处理的未确认消息数量。

### 订阅主题

订阅MQTT主题可以接收来自其他客户端的消息。使用rumqttc订阅主题也非常简单，只需要指定主题名称和消息处理函数即可。以下是一个订阅主题的示例代码：

```rust
use rumqttc::{Client, MqttOptions, QoS};

fn main() {
    let mqtt_options = MqttOptions::new("test-2", "localhost", 1883);
    let (mut client, mut connection) = Client::new(mqtt_options, 10);
    client
        .subscribe("test/topic", QoS::AtLeastOnce)
        .expect("Failed to subscribe to topic");
    for message in connection.iter() {
        if let Ok(message) = message {
            println!("{}", message.payload_str());
        }
    }
}
```

其中，`test/topic`是要订阅的主题名称，`QoS::AtLeastOnce`表示消息至少被处理一次，即使出现网络故障或客户端宕机也不会丢失。`connection.iter()`返回一个迭代器，可以用来不断接收来自服务器的消息。

### 发布消息

发布MQTT消息可以向其他客户端发送数据。使用rumqttc发布消息也非常简单，只需要指定主题名称和消息内容即可。以下是一个发布消息的示例代码：

```rust
use rumqttc::{Client, MqttOptions, QoS, ReconnectOptions, Transport};

fn main() {
    let mqtt_options = MqttOptions::new("test-3", "localhost", 1883);
    let (mut client, mut connection) = Client::new(mqtt_options, 10);
    let reconnection_options = ReconnectOptions::Always(10);
    client
        .publish("test/topic", QoS::AtLeastOnce, false, "Hello, world!")
        .expect("Failed to publish message");
}
```

其中，`"Hello, world!"`是要发送的消息内容，可以是字符串、字节流或其他数据类型。

### 保留消息

这个示例演示如何使用rumqttc模块发送和接收保留消息。

```rust
use rumqttc::{Client, MqttOptions, QoS};

fn main() {
    let mqtt_options = MqttOptions::new("test-retain", "localhost", 1883);

    let (mut client, _) = Client::new(mqtt_options, 10);

    client
        .publish("test/topic", QoS::AtLeastOnce, true, "hello world".to_owned())
        .unwrap();

    let message = client.get_retained("test/topic").unwrap();
    println!("Received message: {:?}", message);
}
```

这个示例中，我们创建了一个MQTT客户端，连接到本地的MQTT服务器，然后发送了一条保留消息到`test/topic`主题。在调用`publish`方法时，我们指定了消息的QoS为AtLeastOnce，表示消息至少要被传输一次，但不保证只传输一次。第三个参数表示消息是否为保留消息。

然后我们使用`client.get_retained("test/topic")`方法获取到保留消息，这个方法会返回最新的保留消息。

### 断开连接

使用完rumqttc后，需要手动断开与MQTT服务器的连接。以下是一个断开连接的示例代码：

```rust
use rumqttc::{Client, MqttOptions};

fn main() {
    let mqtt_options = MqttOptions::new("test-4", "localhost", 1883);
    let (mut client, _) = Client::new(mqtt_options, 10);
    client
        .connect()
        .expect("Failed to connect to MQTT server");
    // ...
    client.disconnect().expect("Failed to disconnect from MQTT server");
}
```

### 使用Last Will和Testament

这个示例演示如何使用rumqttc模块设置Last Will和Testament。

```rust
use rumqttc::{Client, LastWill, MqttOptions, QoS};

fn main() {
    let mqtt_options = MqttOptions::new("test-lwt", "localhost", 1883);

    let last_will = LastWill::new("test/topic", QoS::AtLeastOnce, "offline".to_owned());

    let (mut client, _) = Client::new(mqtt_options, 10);

    client.set_last_will(last_will).unwrap();

    // Do something here
}
```

这个示例中，我们创建了一个MQTT客户端，连接到本地的MQTT服务器。然后我们使用`LastWill::new`方法创建了一个Last Will和Testament，指定了主题、QoS和消息内容。最后我们使用`client.set_last_will`方法设置了Last Will和Testament。

### TLS加密连接

为了保护MQTT通信的安全性，可以使用TLS加密连接。使用rumqttc实现TLS加密连接也非常简单，只需要指定证书和私钥即可。以下是一个使用TLS加密连接的示例代码：

```rust
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use rumqttc::{Client, MqttOptions, SecurityOptions};

fn main() {
    let mqtt_options = MqttOptions::new("test-5", "localhost", 8883);
    let security_options = SecurityOptions::with_ca(File::open(Path::new("ca.crt")).unwrap())
        .with_client_cert(File::open(Path::new("client.crt")).unwrap(), File::open(Path::new("client.key")).unwrap());
    let (mut client, _) = Client::new(mqtt_options, 10);
    client
        .set_security_opts(security_options)
        .connect()
        .expect("Failed to connect to MQTT server");
    // ...
}
```

其中，`ca.crt`是CA证书，`client.crt`和`client.key`是客户端证书和私钥。

### 多线程处理消息

使用多线程可以提高消息处理的效率和并发性。以下是一个使用多线程处理消息的示例代码：

```rust
use std::thread;
use rumqttc::{Client, MqttOptions, QoS};

fn main() {
    let mqtt_options = MqttOptions::new("test-6", "localhost", 1883);
    let (mut client, mut connection) = Client::new(mqtt_options, 10);
    client
        .subscribe("test/topic", QoS::AtLeastOnce)
        .expect("Failed to subscribe to topic");
    for message in connection.iter() {
        if let Ok(message) = message {
            let payload = message.payload.clone();
            let topic = message.topic.clone();
            thread::spawn(move || {
                println!("Received message: {} from topic: {}", payload, topic);
            });
        }
    }
}
```

其中，`thread::spawn()`创建一个新线程来处理消息，可以使用闭包来捕获消息的内容。


## 总结

rumqttc模块是一个非常方便的MQTT客户端库，它提供了一系列API，可以方便地实现MQTT协议的功能。本教程提供了几个常见的基础应用示例，希望对您有所帮助。
