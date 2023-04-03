---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - GRPC框架入门指北
date: 2023-04-03 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, grpc]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

gRPC是Google开源的高性能、通用的RPC框架，它采用了基于HTTP/2协议的二进制传输协议，支持多种语言，包括Rust。Rust语言GRPC模块是一个用于Rust语言的gRPC客户端和服务器实现，它提供了一个简单易用的API，可以方便地创建和使用gRPC服务。

## 基础用法

###   创建gRPC服务器

在Rust语言GRPC模块中，可以使用`ServerBuilder`结构体来创建gRPC服务器。下面是一个简单的示例：

```rust
use grpc::{Server, ServerBuilder};

fn main() {
    let mut server = ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.add_service(proto::greeter_server::GreeterServer::new_service_def(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();
    server.wait();
}

struct GreeterImpl {}

impl proto::greeter_server::Greeter for GreeterImpl {
    fn say_hello(&self, _m: grpc::RequestOptions, req: proto::HelloRequest) -> grpc::SingleResponse<proto::HelloReply> {
        let mut r = proto::HelloReply::new();
        r.set_message(format!("Hello, {}!", req.get_name()));
        grpc::SingleResponse::completed(r)
    }
}
```

这个示例中，我们创建了一个`ServerBuilder`对象，并通过`http`字段设置了服务器的端口号。然后我们使用`add_service`方法将我们实现的`Greeter`服务添加到服务器中。最后，我们通过`build`方法构建了服务器，并通过`start`方法启动了服务器。服务器启动后，我们通过`wait`方法等待客户端连接。

###   创建gRPC客户端

在Rust语言GRPC模块中，可以使用`Client`结构体来创建gRPC客户端。下面是一个简单的示例：

```rust
use grpc::{ChannelBuilder, Client};

fn main() {
    let ch = ChannelBuilder::new_plain();
    let client = Client::new(ch);
    let mut req = proto::HelloRequest::new();
    req.set_name("world".to_string());
    let resp = client.say_hello(grpc::RequestOptions::new(), req);
    println!("{}", resp.wait().unwrap().get_message());
}
```

这个示例中，我们创建了一个`ChannelBuilder`对象，并使用`Client`结构体创建了一个gRPC客户端。然后我们创建了一个`HelloRequest`对象，并设置了它的`name`字段。最后，我们使用`say_hello`方法向服务器发送请求，并通过`wait`方法等待响应。响应对象是一个`SingleResponse`对象，我们通过`unwrap`方法获取了它的值，并打印了它的`message`字段。

###   使用流式RPC

在Rust语言GRPC模块中，可以使用流式RPC来传输流数据。下面是一个简单的示例：

```rust
use grpc::{Client, ClientStreamingSink, Server, ServerBuilder, ServerStreamingSink, WriteFlags};

fn main() {
    let mut server = ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.add_service(proto::streaming::create_greeter_server(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();

    let ch = ChannelBuilder::new_plain();
    let client = Client::new(ch);

    let reqs = vec![
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
    ];

    let (mut tx, rx) = client.say_hello_stream(grpc::RequestOptions::new()).unwrap();
    for req in reqs {
        tx = tx.send((req, WriteFlags::default())).unwrap();
    }
    tx.close().unwrap();

    for resp in rx.wait() {
        println!("{}", resp.unwrap().get_message());
    }
}

struct GreeterImpl {}

impl proto::streaming::Greeter for GreeterImpl {
    fn say_hello_stream(&self, _m: grpc::RequestOptions, _stream: grpc::StreamingRequest<proto::HelloRequest>) -> grpc::StreamingResponse<proto::HelloReply> {
        let (tx, rx) = grpc::channel::mpsc::channel(0);
        std::thread::spawn(move || {
            for req in _stream.into_iter() {
                let mut r = proto::HelloReply::new();
                r.set_message(format!("Hello, {}!", req.get_name()));
                tx.send((r, WriteFlags::default())).unwrap();
            }
            tx.close().unwrap();
        });
        grpc::StreamingResponse::new(rx)
    }
}
```

这个示例中，我们创建了一个`Greeter`服务，并实现了一个`say_hello_stream`方法，该方法接收一个`StreamingRequest`对象，并返回一个`StreamingResponse`对象。在该方法中，我们使用`mpsc::channel`方法创建了一个通道，用于传输流数据。然后我们使用`std::thread::spawn`方法创建了一个线程，该线程会将接收到的请求转换成响应，并通过通道发送给客户端。最后，我们使用`StreamingResponse::new`方法将通道包装成一个`StreamingResponse`对象，并将其返回给客户端。

在客户端中，我们创建了一个`say_hello_stream`方法，并使用`send`方法向服务器发送请求。然后我们通过`wait`方法等待响应，并打印了响应的`message`字段。

###   使用双向流式RPC

在Rust语言GRPC模块中，可以使用双向流式RPC来传输双向流数据。下面是一个简单的示例：

```rust
use grpc::{Client, ClientStreamingSink, Server, ServerBuilder, ServerStreamingSink, StreamingSink, WriteFlags};

fn main() {
    let mut server = ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.add_service(proto::streaming::create_greeter_server(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();

    let ch = ChannelBuilder::new_plain();
    let client = Client::new(ch);

    let (mut tx, rx) = client.say_hello_bidi(grpc::RequestOptions::new()).unwrap();
    let reqs = vec![
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
    ];
    std::thread::spawn(move || {
        for req in reqs {
            tx = tx.send((req, WriteFlags::default())).unwrap();
            let resp = rx.into_future().wait().unwrap().0;
            println!("{}", resp.unwrap().get_message());
        }
        tx.close().unwrap();
    });
}

struct GreeterImpl {}

impl proto::streaming::Greeter for GreeterImpl {
    fn say_hello_bidi(&self, _m: grpc::RequestOptions, stream: grpc::StreamingRequest<proto::HelloRequest>) -> grpc::StreamingResponse<proto::HelloReply> {
        let (tx, rx) = grpc::channel::mpsc::channel(0);
        std::thread::spawn(move || {
            for req in stream.into_iter() {
                let mut r = proto::HelloReply::new();
                r.set_message(format!("Hello, {}!", req.get_name()));
                tx.send((r, WriteFlags::default())).unwrap();
            }
            tx.close().unwrap();
        });
        grpc::StreamingResponse::new(rx)
    }
}
```

这个示例中，我们创建了一个`Greeter`服务，并实现了一个`say_hello_bidi`方法，该方法接收一个`StreamingRequest`对象，并返回一个`StreamingResponse`对象。在该方法中，我们使用`mpsc::channel`方法创建了一个通道，用于传输流数据。然后我们使用`std::thread::spawn`方法创建了一个线程，该线程会将接收到的请求转换成响应，并通过通道发送给客户端。最后，我们使用`StreamingResponse::new`方法将通道包装成一个`StreamingResponse`对象，并将其返回给客户端。

在客户端中，我们使用`say_hello_bidi`方法向服务器发送请求，并通过`into_future`方法获取响应。然后我们通过`println`方法打印了响应的`message`字段。

## 进阶用法

###   使用tokio

在Rust语言GRPC模块中，可以使用tokio来实现异步RPC。下面是一个简单的示例：

```rust
use grpc::{Client, ClientStreamingSink, Server, ServerBuilder, ServerStreamingSink, StreamingSink, WriteFlags};

#[tokio::main]
async fn main() {
    let mut server = ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.add_service(proto::greeter_server::GreeterServer::new_service_def(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();

    let ch = ChannelBuilder::new_plain();
    let client = Client::new(ch);

    let mut req = proto::HelloRequest::new();
    req.set_name("world".to_string());
    let resp = client.say_hello_async(grpc::RequestOptions::new(), req).await.unwrap();
    println!("{}", resp.get_message());
}

struct GreeterImpl {}

impl proto::greeter_server::Greeter for GreeterImpl {
    fn say_hello(&self, _m: grpc::RequestOptions, req: proto::HelloRequest) -> grpc::SingleResponse<proto::HelloReply> {
        let mut r = proto::HelloReply::new();
        r.set_message(format!("Hello, {}!", req.get_name()));
        grpc::SingleResponse::completed(r)
    }
}
```

这个示例中，我们使用`tokio::main`宏来创建异步运行时。在服务器和客户端中，我们使用`async`关键字来定义异步函数。在客户端中，我们使用`await`关键字来等待异步响应。

### tokio使用流式RPC

下面是一个使用tokio和流式RPC的示例：

```rust
use grpc::{Client, ClientStreamingSink, Server, ServerBuilder, ServerStreamingSink, StreamingSink, WriteFlags};
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let mut server = ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.add_service(proto::streaming::create_greeter_server(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();

    let ch = ChannelBuilder::new_plain();
    let client = Client::new(ch);

    let (mut tx, rx) = mpsc::channel(10);
    let mut stream = client.say_hello_streaming(grpc::RequestOptions::new()).unwrap();
    tokio::spawn(async move {
        while let Some(req) = rx.recv().await {
            stream.send((req, WriteFlags::default())).unwrap();
        }
        stream.close().unwrap();
    });

    let reqs = vec![
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
        proto::HelloRequest::new(),
    ];
    for req in reqs {
        tx.send(req).await.unwrap();
    }

    for resp in stream.into_stream().await {
        println!("{}", resp.unwrap().get_message());
    }
}

struct GreeterImpl {}

impl proto::streaming::Greeter for GreeterImpl {
    fn say_hello_streaming(&self, _m: grpc::RequestOptions, _stream: grpc::StreamingRequest<proto::HelloRequest>) -> grpc::StreamingResponse<proto::HelloReply> {
        let (tx, rx) = grpc::channel::mpsc::channel(0);
        tokio::spawn(async move {
            for req in _stream.into_async_iter().await {
                let mut r = proto::HelloReply::new();
                r.set_message(format!("Hello, {}!", req.get_name()));
                tx.send((r, WriteFlags::default())).unwrap();
            }
            tx.close().unwrap();
        });
        grpc::StreamingResponse::new(rx)
    }
}
```

这个示例中，我们使用`tokio::sync::mpsc`库来创建一个通道，用于传输流数据。在客户端中，我们使用`say_hello_streaming`方法向服务器发送请求，并将请求通过通道发送给异步任务。在异步任务中，我们使用`into_async_iter`方法将请求流转换成异步迭代器，并将响应通过通道发送给客户端。在客户端中，我们使用`into_stream`方法将响应流转换成异步流，并等待响应。

###   使用TLS加密

在Rust语言GRPC模块中，可以使用TLS加密来保护通信安全。下面是一个简单的示例：

```rust
use grpc::{ChannelBuilder, Client};
use rustls::{Certificate, PrivateKey, ServerConfig};
use std::fs::File;
use std::io::BufReader;

fn main() {
    let mut config = ServerConfig::new(rustls::NoClientAuth::new());
    let cert_file = &mut BufReader::new(File::open("server.crt").unwrap());
    let key_file = &mut BufReader::new(File::open("server.key").unwrap());
    let cert_chain = rustls::internal::pemfile::certs(cert_file).unwrap();
    let mut keys = rustls::internal::pemfile::rsa_private_keys(key_file).unwrap();
    config.set_single_cert(cert_chain, keys.remove(0)).unwrap();
    let mut server = grpc_tls::ServerBuilder::new_plain();
    server.http.set_port(50051);
    server.http.set_tls(config);
    server.add_service(proto::greeter_server::GreeterServer::new_service_def(GreeterImpl {}));
    let server = server.build().unwrap();
    server.start();

    let mut config = rustls::ClientConfig::new();
    let cert_file = &mut BufReader::new(File::open("client.crt").unwrap());
    let key_file = &mut BufReader::new(File::open("client.key").unwrap());
    let cert_chain = rustls::internal::pemfile::certs(cert_file).unwrap();
    let mut keys = rustls::internal::pemfile::rsa_private_keys(key_file).unwrap();
    config.set_single_client_cert(cert_chain, keys.remove(0));
    let ch = ChannelBuilder::new_tls().rustls_config(config);
    let client = Client::new(ch);
    let mut req = proto::HelloRequest::new();
    req.set_name("world".to_string());
    let resp = client.say_hello(grpc::RequestOptions::new(), req);
    println!("{}", resp.wait().unwrap().get_message());
}

struct GreeterImpl {}

impl proto::greeter_server::Greeter for GreeterImpl {
    fn say_hello(&self, _m: grpc::RequestOptions, req: proto::HelloRequest) -> grpc::SingleResponse<proto::HelloReply> {
        let mut r = proto::HelloReply::new();
        r.set_message(format!("Hello, {}!", req.get_name()));
        grpc::SingleResponse::completed(r)
    }
}
```

这个示例中，我们使用`rustls`库来创建TLS配置，并使用`grpc_tls::ServerBuilder`和`ChannelBuilder::new_tls`方法来创建带有TLS加密的服务器和客户端。在服务器中，我们使用`set_single_cert`方法来设置服务器证书和私钥。在客户端中，我们使用`set_single_client_cert`方法来设置客户端证书和私钥。

## 总结

本教程介绍了GRPC的基础使用方法，并针对tokio结合GRPC的进阶使用进入入门级的探讨。希望能帮助同学们掌握Rust语言GRPC的应用。
