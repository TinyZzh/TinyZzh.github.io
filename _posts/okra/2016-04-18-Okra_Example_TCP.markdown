---
layout: page
title: Okra框架(二) 搭建Socket服务器
date: 2016-04-18 19:29:00 +0800
categories: [Okra]
tags: [Okra框架]
---

本文将介绍使用Okra框架帮助开发者快速搭建高性能应用程序Socket服务端。
博主接触的网络游戏（包含但不限于网页, 手机）的服务端通信使用的协议基本上就Socket，Http或是WebSocket三种方式。
本系列教程将介绍利用Okra框架这三种通信方式的示例。

### 1. 创建Executor

在通信过程中，我们可以把每一个消息可以当做是一个任务。Executor则是Okra中负责处理每一条消息的任务执行者。
同时，每一个Executor都是一个并发线程。
如下代码实现一个简单的示例ObjectExecutor:

```java
public class ObjectExecutor implements Executor {

    protected Session session;
    protected Object request;

    public ObjectExecutor(Session session, Object request) {
        this.session = session;
        this.request = request;
    }

    @Override
    public void onExecute() {
        if (null == request) {
            throw new NullPointerException("request");
        }
        // TODO: Just send message back, do some logic on real
        session.writeAndFlush(String.valueOf(request));
    }

    @Override
    public void release() {
        this.session = null;
        this.request = null;
    }
}
```

Okra提供了封装好的Disruptor桥用于Netty结合Disruptor。Okra通过Executor工厂让用户可以便捷灵活的定制特殊的处理者.

```java
public class ExampleSocketHandler extends DisruptorAdapterBy41xHandler<Object> {
    @Override
    protected Executor newExecutor(Session session, Object msg) {
        return new ObjectExecutor(session, msg);
    }
}
```

### 2. 创建Server

然后创建一个Server继承TcpProtocolServer实现自己的服务器类. 增加Handler处理

```java
public class TcpServer extends TcpProtocolServer {

    public TcpServer(int port) {
        setPort(port);
    }

    private static final ChannelHandler FRAME_PREPENDER = new LengthFieldPrepender(4, false);

    @Override
    protected ChannelHandler newChannelInitializer() {
        return new ChannelInitializer<NioSocketChannel>() {
            @Override
            protected void initChannel(NioSocketChannel ch) throws Exception {
                ChannelPipeline cp = ch.pipeline();
                cp.addLast("frame", new LengthFieldBasedFrameDecoder(Integer.MAX_VALUE, 0, 2, 0, 2));
                cp.addLast("prepender", FRAME_PREPENDER);
                // Any other useful handler
                cp.addLast("handler", new ExampleSocketHandler());
            }
        };
    }
}
```

### 3. 启动服务器

假如你的项目中使用了Spring框架，那么只需要在配置如下bean就可以启动:

```xml
<!-- Tcp server -->
<bean id="tcpServer" class="org.ogcs.okra.example.socket.TcpServer" init-method="start" destroy-method="stop">
    <constructor-arg name="port" value="${tcp.port}"/>
</bean>
```

普通Java程序:

```java
TcpServer server = new TcpServer(9005);
server.start();
```

只需要简短的两行代码就可以启动服务器了。

### 4. 总结
本文介绍了使用Okra快速搭建高可用，高性能，可扩展，高并发服务器的示例。Okra通过封装，简化了服务器搭建过程。

