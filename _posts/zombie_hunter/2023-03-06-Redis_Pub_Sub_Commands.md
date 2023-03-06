---
layout: post
read_time: true
show_date: true
title: 详解Redis的发布订阅模式
date: 2023-03-06 22:22:00 +0800
categories: [rust, trait]
tags: [rust, trait]
toc: yes
image_scaling: true
---

Redis发布订阅（Pub/Sub）是Redis的一个功能，用于支持系统之间传递消息。它使用“订阅者”和“发布者”模式，允许发布者将消息发送到一组订阅者，而无需知道谁是订阅者。这种模式可以用来构建多个客户端的复杂的通信拓扑。

## Redis发布者和订阅者模式

Redis发布订阅（Pub/Sub）是Redis提供的一种消息传递机制，它使用“发布者-订阅者”（publisher-subscriber）模式来处理消息传递。在这种模式下，发布者将消息发布到一组订阅者中，而无需关心谁是订阅者，也不需要知道订阅者是否收到了消息。

发布者和订阅者模式允许多个客户端之间建立一个复杂的通信拓扑。在这种模式下，发布者可以发布消息到一个特定的主题，订阅者可以订阅一个或多个主题，并在发布者发布消息时收到消息。由于发布者和订阅者不必直接连接，因此发布者和订阅者可以完全独立地运行，只要它们都连接到Redis实例即可。

Redis发布订阅支持多种消息类型，包括文本、字节数组和数字等。 Redis还支持订阅者识别特定消息，通过模式匹配功能，可以基于主题模式或模式来检索消息。Redis还提供了许多API来帮助您实现发布/订阅模式，因此您可以使用Redis的发布/订阅功能来构建分布式应用程序。

以下列举几个比较常见业务场景：

 - 多用户即时消息：使用Redis的发布/订阅功能，可以实现多用户即时聊天服务。
 - 事件处理：Redis发布订阅可以用来处理应用程序中的事件，例如文件上传、数据库更新等。
 - 在线投票：Redis发布订阅可以用于在线投票，可以向所有投票者实时发送最新的投票结果。
 - 日志收集：Redis发布订阅可以用于收集日志，可以将日志信息发送到一个中央服务器，进行日志分析。
 - 分布式缓存：Redis发布订阅可以用于实现分布式缓存，可以在多台服务器之间共享缓存。

## Redis Pub/Sub 命令

Redis发布订阅（Pub/Sub）分为两种，**第一种基于频道(Channel)的发布/订阅。第二种基于模式(pattern)的发布/订阅**。相关的命令如下：

- **PUBLISH**：用于将消息发布到特定的主题。允许发布者将消息发送到一组订阅者中
- **SUBSCRIBE**：用于订阅一个或多个主题，并在发布者发布消息时收到消息。
- **UNSUBSCRIBE**：用于停止监听一个或多个主题。
- **PSUBSCRIBE**：用于使用模式订阅主题，它允许订阅者使用模式来识别特定消息，而不必直接订阅每个消息。
- **PUNSUBSCRIBE**：用于停止使用模式订阅主题。

**自Redis 7.x开始提供一套新的Sharded Pub/Sub功能，新增 SSUBSCRIBE, SUNSUBSCRIBE 和 SPUBLISH 三个命令。**

Sharded Pub/Sub是一种基于分片的发布/订阅模式，它允许将多个Redis服务器集群中的消息传递结合在一起，以便实现大规模消息传递。

Sharded Pub/Sub可以实现大规模消息传递，使用者可以根据自己的情况来指定要使用的Redis服务器数量，也可以指定不同的Redis服务器来处理不同的消息流。 Sharded Pub/Sub还可以支持多个Sharded实例，以支持跨多个Data Center或Region的消息传递。

另外，Sharded Pub/Sub还可以支持容错性，如果某个Redis服务器出现问题，其他Redis服务器可以继续处理消息。此外，Sharded Pub/Sub还可以支持动态负载平衡，可以自动将消息分发到不同的Redis集群服务器上，以最大限度地利用Redis服务器的性能。

## Redis客户端API实现Pub/Sub

使用Jedis库实现最基础的发布/订阅功能。

```java
// 创建Jedis实例
Jedis jedis = new Jedis("localhost:6379");

// 创建一个消息监听器
JedisPubSub listener = new JedisPubSub() {

    // 消息到来时调用onMessage
    @Override
    public void onMessage(String channel, String message) {
        System.out.println(message);
    }
};

// 订阅消息
jedis.subscribe(listener, "channel1");

// 发布消息
jedis.publish("channel1", "Hello World!");
```

使用Redission库的异步API，可以实现扩展性更好，吞吐量更高的发布/订阅功能。客户端和服务端的示例代码如下：

客户端代码：

```java
// 创建Redisson实例
Config config = new Config();
config.useSingleServer().setAddress("redis://127.0.0.1:6379");
RedissonClient redisson = Redisson.create(config);

// 订阅消息
RTopic<String> topic = redisson.getTopic("channel1");
topic.addListenerAsync((channel, msg) -> {
 System.out.println(msg);
});

// 用户输入消息并发送
Scanner scanner = new Scanner(System.in);
while (true) {
    String message = scanner.nextLine();
    if (message.equals("exit")) {
        break;
    }
    topic.publishAsync(message);
}

// 退出聊天
redisson.shutdown();
```

聊天服务端代码：

```java
// 创建Redisson实例
Config config = new Config();
config.useSingleServer().setAddress("redis://127.0.0.1:6379");
RedissonClient redisson = Redisson.create(config);

// 发布消息
RTopic<String> topic = redisson.getTopic("channel1");
topic.publishAsync("Welcome to the chat room!");

// 接收消息
topic.addListenerAsync((channel, msg) -> {
 System.out.println(msg);
});
```

## 总结

保证Redis服务器的性能，避免大量的客户端连接影响Redis的性能。
要尽量减少消息的大小，以减少网络传输所需的时间。
要注意处理消息的容错性，避免因网络问题而导致消息丢失。
如果要处理大量消息，可以考虑使用Sharded Pub/Sub技术，以提高性能和可用性。
