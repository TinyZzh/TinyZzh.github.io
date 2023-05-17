---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 物联网消息传输协议MQTT(进阶)
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

## 应用实践进阶

### 使用QoS2传输消息

这个示例演示如何使用rumqttc模块使用QoS2传输消息。

```rust
use rumqttc::{Client, MqttOptions, QoS};

fn main() {
    let mqtt_options = MqttOptions::new("test-qos2", "localhost", 1883);

    let (mut client, _) = Client::new(mqtt_options, 10);

    client
        .publish("test/topic", QoS::ExactlyOnce, false, "hello world".to_owned())
        .unwrap();
}
```

这个示例中，我们创建了一个MQTT客户端，连接到本地的MQTT服务器，然后发布了一条消息到`test/topic`主题。在调用`publish`方法时，我们指定了消息的QoS为ExactlyOnce，表示消息必须被传输一次，且只能被传输一次。

### 使用连接池

在实际应用中，我们通常需要同时处理多个MQTT客户端连接，这时候使用连接池可以提高性能和可靠性。rumqttc模块提供了一个`ConnectionPool`结构体，可以方便地管理多个MQTT客户端连接。

```rust
use rumqttc::{Client, ConnectionPool, MqttOptions};

fn main() {
    let mqtt_options = MqttOptions::new("test-pool", "localhost", 1883);

    let pool = ConnectionPool::new(mqtt_options, 10);

    let mut clients = Vec::new();

    for _ in 0..10 {
        let client = pool.connect().unwrap();
        clients.push(client);
    }

    // Do something here
}
```

这个示例中，我们创建了一个MQTT连接池，连接到本地的MQTT服务器。然后我们使用循环创建了10个MQTT客户端连接，这些连接会自动被管理和回收。

### 使用多线程

在实际应用中，我们通常需要同时处理多个MQTT消息，这时候使用多线程可以提高性能和可靠性。Rust语言的多线程非常方便，可以使用标准库中的`std::thread`模块来创建线程。

```rust
use rumqttc::{Client, MqttOptions, QoS};
use std::thread;

fn main() {
    let mqtt_options = MqttOptions::new("test-thread", "localhost", 1883);

    let (mut client, _) = Client::new(mqtt_options, 10);

    let handle = thread::spawn(move || {
        client
            .publish("test/topic", QoS::AtLeastOnce, false, "hello world".to_owned())
            .unwrap();
    });

    handle.join().unwrap();
}
```

这个示例中，我们创建了一个MQTT客户端，连接到本地的MQTT服务器。然后我们使用`std::thread::spawn`方法创建了一个新线程，这个线程会在后台发布一条消息到`test/topic`主题。


### 持久化存储消息

通过持久化存储可以保证消息不会因为程序崩溃或网络故障而丢失。以下是一个使用SQLite数据库持久化存储消息的示例代码：

```rust
use std::thread;
use rumqttc::{Client, MqttOptions, QoS, Event, Packet, Publish, Subscriptions, Qos};

fn main() {
    let mqtt_options = MqttOptions::new("test-7", "localhost", 1883);
    let (mut client, mut connection) = Client::new(mqtt_options, 10);
    let subscriptions = vec![Subscriptions::new("test/topic", QoS::AtLeastOnce)];
    client.subscribe(subscriptions).unwrap();
    let mut storage = Storage::new("mqtt.db").unwrap();
    for event in connection.iter() {
        match event.unwrap() {
            Event::Incoming(Packet::Publish(publish)) => {
                storage.insert_message(&publish).unwrap();
                println!("Received message: {} from topic: {}", publish.payload, publish.topic_name);
            },
            _ => {},
        }
    }
}

struct Storage {
    conn: rusqlite::Connection,
}

impl Storage {
    fn new(path: &str) -> rusqlite::Result<Self> {
        let conn = rusqlite::Connection::open(path)?;
        conn.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, topic TEXT, payload TEXT, qos INTEGER)", [])?;
        Ok(Self { conn })
    }

    fn insert_message(&mut self, publish: &Publish) -> rusqlite::Result<()> {
        let mut stmt = self.conn.prepare("INSERT INTO messages (topic, payload, qos) VALUES (?, ?, ?)")?;
        stmt.execute(&[&publish.topic_name, &publish.payload, &publish.qos as &i32])?;
        Ok(())
    }
}
```

其中，`Storage`结构体使用SQLite数据库来持久化存储消息。在`Event::Incoming(Packet::Publish(publish))`分支中，将接收到的消息插入到数据库中。

## 总结

rumqttc模块是一个非常方便的MQTT客户端库，它提供了一系列API，可以方便地实现MQTT协议的功能。本教程作为前一篇的进阶补充提供了常见的实际应用场景的应用示例，希望对您进一步深入的了解和掌握物联网传输协议MQTT有所帮助。