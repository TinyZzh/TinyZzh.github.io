---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Rust语言Redis实战
date: 2023-03-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Weak]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)


Redis是一款快速、开源、键值存储数据库，被广泛应用于缓存、发布/订阅系统、定时任务等场景中。Rust提供了很多Redis的客户端库，本教程将会介绍如何使用Rust连接Redis，以及如何通过Rust操作Redis。

## Redis依赖库

在Rust中有很多Redis的客户端库可以选择，这里我们选择使用redis-rs库。在Cargo.toml文件中添加依赖：

```
[dependencies]
redis = "0.22"
```

## Redis基础用法和示例

### 连接Redis

连接Redis非常简单，只需要使用redis::Client来创建一个连接即可，如下所示：

```
use redis::Client;

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();
    println!("Connected to Redis");
}
```

### 设置和获取key值

Redis是一款键值存储数据库，我们可以很方便地设置和获取key值。

```
use redis::{Client, Commands};

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

    // 设置key值
    let _: () = conn.set("key", "value").unwrap();

    // 获取key值
    let value: String = conn.get("key").unwrap();
    println!("Value: {}", value);
}
```

### 设置和获取Hash值

Hash是Redis中一种特殊的数据结构，可以将多个键值对存储到一个键中。在Redis中，Hash通常用于存储对象，比如用户信息、商品信息等。

```
use redis::{Client, Commands, RedisResult};

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

    // 设置Hash值
    let _: () = conn.hset("user:123", "name", "Alice").unwrap();
    let _: () = conn.hset("user:123", "age", 20).unwrap();

    // 获取Hash值
    let name: RedisResult<String> = conn.hget("user:123", "name");
    let age: RedisResult<i32> = conn.hget("user:123", "age");
    println!("Name: {:?}", name);
    println!("Age: {:?}", age);
}
```

### 设置和获取List值

List是一种可以按下标顺序访问的数据结构，可以在一端添加元素，在另一端删除元素，非常适合用于消息队列等场景。

```
use redis::{Client, Commands, RedisResult};

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

    // 设置List值
    let _: () = conn.rpush("queue", "A").unwrap();
    let _: () = conn.rpush("queue", "B").unwrap();
    let _: () = conn.rpush("queue", "C").unwrap();

    // 获取List值
    let item1: RedisResult<String> = conn.lpop("queue");
    let item2: RedisResult<String> = conn.lpop("queue");
    let item3: RedisResult<String> = conn.lpop("queue");
    println!("Item1: {:?}", item1);
    println!("Item2: {:?}", item2);
    println!("Item3: {:?}", item3);
}
```

## 进阶用法

### Reids连接池

在实际应用中，我们会创建多个Redis连接处理请求，为了避免频繁地创建和销毁连接，可以使用连接池来优化。

redis-rs库提供了一个连接池结构体ConnectionPool，它可以自动管理连接的创建和销毁。

```
use std::thread;
use redis::{Client, Commands, RedisResult, Connection, ConnectionInfo, IntoConnectionInfo};
use redis::aio::ConnectionLike;

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn_pool = client.get_connection_pool().unwrap();

    let mut handles = vec![];
    for i in 0..10 {
        let conn_pool = conn_pool.clone();
        let handle = thread::spawn(move || {
            let mut conn = conn_pool.get().unwrap();
            let _: () = conn.set(format!("key{}", i), format!("value{}", i)).unwrap();
        });
        handles.push(handle)
    }

 for handle in handles {
        handle.join().unwrap();
    }

    let conn = conn_pool.get().unwrap();
    let key0: RedisResult<String> = conn.get("key0");
    println!("Key0 {:?}", key0);
}
```

### 使用发布/订阅模式

Redis也支持发布/订阅模式，可以实现简单的消息队列、聊天室等功能。

在发布/订阅模式中，客户端可以订阅一个或多个频道，在有消息发布到这些频道时，客户端将会收到通知。

```
use redis::{Client, Commands, RedisResult};

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

    let mut pubsub = conn.as_pubsub();
    let _: () = pubsub.subscribe("channel").unwrap();

    let mut pubsub_thread = pubsub.into_on_message();
    let handle = std::thread::spawn(move || {
        loop {
 let msg = pubsub_thread.recv().unwrap();
            let payload: String = msg.get_payload().unwrap();
            println!("Received: {:?}", payload);
        }
    });

    let _: () = conn.publish("channel", "hello1").unwrap();
    let _: () = conn.publish("channel", "hello2").unwrap();
    let _: () = conn.publish("channel", "hello3").unwrap();

    std::thread::sleep_ms(1000);
    handle.join().unwrap();
}
```

### 设置过期时间

Redis是一款内存数据库，写入速度非常快，因此可以将Redis作为缓存来使用。在写入数据时，应该使用Redis提供的setex方法，将数据写入Redis中，并设置过期时间，这样可以减少内存占用。

```
use redis::{Client, Commands};

fn main() {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

 let key = "cache_key";
    let value = "cache_value";
    let expire_sec = 60;

    let _: () = conn.set_ex(key, expire_sec, value).unwrap();
}
```

### 错误处理

在Rust中，错误处理十分重要，使用Result枚举类型可以很好地处理错误。Redis库也提供了RedisResult类型用于处理Redis错误。

```
use redis::{Client, Commands, RedisResult};

fn main() -> RedisResult<()> {
    let client = Client::open("redis://127.0.0.1/").unwrap();
    let conn = client.get_connection().unwrap();

    let key = "cache_key";
    let value = "cache_value";
    let expire_sec = 60;

    let _: () = conn.set_ex(key, expire_sec, value)?;
    let result: RedisResult<String> = conn.get(key);
    match result {
        Ok(value) => println!("Value: {}", value),
        Err(e) => return Err(e),
    }

    Ok(())
}
```

## 总结

本教程介绍了如何使用Rust连接Redis，并提供了示例代码介绍了如何在Rust中操作Redis。在使用Redis时，应该考虑使用连接池和快速写入等最佳实践，并合理处理错误。使用Redis，可以提高应用程序的性能和可扩展性。