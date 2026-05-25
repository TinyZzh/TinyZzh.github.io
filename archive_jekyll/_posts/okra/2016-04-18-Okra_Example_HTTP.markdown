---
layout: post
title: Okra框架(三) 搭建HTTP服务器
date: 2016-04-18 20:58:00 +0800
categories: [Okra]
tags: [Okra框架]
---

Okra 通过封装成熟高效的框架以简化应用程序服务器构建的过程。上一篇介绍了使用 Okra 快速搭建 Socket 服务器。
本篇承接上一篇，介绍快速搭建简单高性能的 Http 服务器。

这里需要说明一下 Okra 框架**不适用**于 web 服务器。Okra 的通信是基于 Netty 框架的，而 Netty 本身不提供强有力的 web 相关功能支持。
但是作为 app 或者是网页游戏的短连接服务器，Okra 还是绰绰有余的。

### 1. 创建 Executor

和 Socket 服务器搭建流程类似。首先实现一个简单的 HttpRequestExecutor，用于处理 Http 请求:

```java
public class HttpRequestExecutor implements Executor {

    private static final Logger LOG = LogManager.getLogger(HttpRequestExecutor.class);

    protected Session session;
    protected FullHttpRequest request;

    public HttpRequestExecutor(Session session, FullHttpRequest request) {
        this.session = session;
        this.request = request;
    }

    @Override
    public void onExecute() {
        if (null == request) {
            throw new NullPointerException("request");
        }
        try {
            QueryStringDecoder decoder = new QueryStringDecoder(request.getUri());
            switch (decoder.path()) {
                case "/test":
                    response(session.ctx(), "{state:0}");
                    return;
                case "/favicon.ico":
                    break;
            }
            simple(session.ctx().channel(), HttpResponseStatus.FORBIDDEN);
        } catch (Exception e) {
            session.ctx().close();
            LOG.info("HTTP Api throw exception : ", e);
        }
    }

    private static void simple(Channel channel, HttpResponseStatus status) {
        ChannelFuture channelFuture = channel.writeAndFlush(new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status));
        channelFuture.addListener(ChannelFutureListener.CLOSE);
    }

    private static void response(ChannelHandlerContext ctx, String msg) {
        HttpResponse response;
        if (msg != null) {
            ByteBuf byteBuf = Unpooled.wrappedBuffer(msg.getBytes());
            response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK, byteBuf);
        } else {
            response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK);
        }
        ChannelFuture channelFuture = ctx.channel().writeAndFlush(response);
        channelFuture.addListener(ChannelFutureListener.CLOSE);
    }

    @Override
    public void release() {
        this.session = null;
        this.request = null;
    }
}
```

Okra 提供了封装好的 Disruptor 桥用于 Netty 结合 Disruptor。Okra 通过 Executor 工厂让用户可以便捷灵活的定制特殊的处理者.
继承 DisruptorAdapterBy41xHandler（依赖于**Netty4.1.x**）或者 DisruptorAdapterHandler（**依赖于 Netty4.0.x**）实现创建 HttpRequestExecutor 的 Executor 工厂。

```java
public class ExampleApiHandler extends DisruptorAdapterBy41xHandler<FullHttpRequest> {
    @Override
    protected Executor newExecutor(Session session, FullHttpRequest msg) {
        return new HttpRequestExecutor(session, msg);
    }
}
```

### 2. 创建 Server

然后创建一个 Server 继承 TcpProtocolServer 实现自己的服务器类. 增加 Handler 处理

```java
public class HttpServer extends TcpProtocolServer {

    public HttpServer(int port) {
        setPort(port);
    }

    @Override
    protected ChannelHandler newChannelInitializer() {
        return new ChannelInitializer<NioSocketChannel>() {
            @Override
            protected void initChannel(NioSocketChannel ch) throws Exception {
                ChannelPipeline cp = ch.pipeline();
                cp.addLast("decoder", new HttpRequestDecoder());
                cp.addLast("encoder", new HttpResponseEncoder());
                cp.addLast("aggregator", new HttpObjectAggregator(1048576));
                cp.addLast("handler", new ExampleApiHandler());
            }
        };
    }
}
```

### 3. 启动服务器

假如你的项目中使用了 Spring 框架，那么只需要在配置如下 bean 就可以启动:

```xml
<!-- Http protocol server -->
<bean id="httpServer" class="org.ogcs.okra.example.http.HttpServer" init-method="start" destroy-method="stop">
    <constructor-arg name="port" value="${http.port}"/>
</bean>
```

普通 Java 程序:

```java
HttpServer server = new HttpServer(9005);
server.start();
```

只需要简短的两行代码就可以启动服务器了。

### 4. 总结

和搭建 Socket 服务器基本类似。更换了处理协议的 Handler 和处理并发任务的 Executor。基本结构并无太大变更（感谢 Netty 框架，呦吼！）
本文介绍了使用 Okra 快速搭建高可用，高性能，可扩展，高并发服务器的示例。Okra 通过封装，简化了服务器搭建过程。
