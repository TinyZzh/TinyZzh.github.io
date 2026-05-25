---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 玩转“代理模式”
date: 2023-03-24 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 代理模式]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

代理模式是一种结构型设计模式，它允许通过代理对象控制对其它对象的访问。代理对象可以拦截对原始对象的访问，同时也可附加一些额外的操作，如对访问进行缓存、权限控制等。

代理模式常用于以下场景：

- 远程代理：将客户端请求转发至远程对象处理，如远程方法调用（RPC）、远程数据库访问等。
- 虚拟代理：在访问对象时，代理对象会根据需要创建真实对象，如大文件的加载、大图片的渲染等。
- 安全代理：代理对象可以控制对真实对象的访问权限，如只允许具有某种权限的用户访问真实对象。
- 智能引用：代理对象可以在真实对象被访问时附加一些额外的操作，如记录对象访问次数、对象访问时间等。

## 实现代理模式

在 Rust 中实现代理模式，可以通过 trait 或结构体来实现。以下是一个简单的实现示例。

```rusttrait Subject {
    fn request(&self);
}

struct RealSubject {}

impl Subject for RealSubject {
 fn request(&self) {
        println!("RealSubject handling request");
    }
}

struct Proxy {
    real_subject: RealSubject
}

impl Subject for Proxy {
    fn request(&self) {
        self.before_request();
        self.real_subject.request();
        self.after_request();
 }
}

impl Proxy {
    fn new(real_subject: RealSubject) -> Self {
        return Self { real_subject };
    }
    
    fn before_request(&self) {
        println!("Proxy handling request before RealSubject");
    }
    
    fn after_request(&self) {
        println!("Proxy handling request after RealSubject");
    }
}
```

在上面的示例中，我们定义了一个名为 `Subject` 的 trait，用于规定代理对象和真实对象需要实现的方法。然后，我们定义了一个名为 `RealSubject` 的结构体，用于实现 `Subject` trait 并实现其方法。

接着，我们定义了一个名为 `Proxy` 的结构体，用于代理 `RealSubject`，实现 `Subject` trait 并实现其方法。在 `Proxy` 的 `request` 方法中，我们先调用 `before_request` 方法进行一些前置操作，再调用真实对象的 `request` 方法，最后调用 `after_request` 方法进行一些后续操作。

## 进阶用法

在代理模式的进阶用法中，可以使用静态编译时代理和动态运行时代理。

### 静态编译时代理

在 Rust 中，可以使用宏来实现静态编译时代理。宏允许在编译时生成代码，这样可以减少对象的运行时开销，并且可以提高代码的可读性和可维护性。

```rust
macro_rules! subject {
    () => (pub trait Subject {
        fn request(&self);
    });
}

macro_rules! real_subject {
    () => (pub struct RealSubject {}

    impl Subject for RealSubject {
        fn request(&self) {
            println!("RealSubject handling request");
        }
    });
}

macro_rules! proxy {
    () => (pub struct Proxy<T: Subject> {
        real_subject: T
    }

 impl<T: Subject> Proxy<T> {
        pub fn new(real_subject: T) -> Self {
            return Self { real_subject };
 }
        
        fn before_request(&self) {
            println!("Proxy handling request before RealSubject");
        }
        
        fn after_request(&self) {
            println!("Proxy handling request after RealSubject");
        }
    }

    impl<T: Subject> Subject for Proxy<T> {
        fn request(&self) {
            self.before_request();
            self.real_subject.request();
            self.after_request();
        }
    });
}

subject! {}
real_subject! {}
proxy! {}
```

在上面的示例中，我们使用宏来定义了代理模式中的 `Subject`、`RealSubject` 和 `Proxy`，使用时只需引用定义的宏即可。这样我们就可以在编译时生成代理对象，将对象生成代码嵌入到编译后的程序中，减少运行时代理的开销，并且可以提高代码的可读性和可维护性。

### 动态运行时代理

在 Rust 中，可以使用类型参数和 trait 对象来实现动态运行时代理。这种方法允许在运行时生成代理对象，并且可以使用不同类型的代理对象。

```rust
struct RealSubject {}

impl RealSubject {
    fn new() -> Self {
        return Self {};
    }
    fn handle_request(&self) {
        println!("RealSubject handling request");
    }
}

trait Subject {
    fn request(&self);
}

struct Proxy<T: Subject> {
    real_subject: T
}

impl<T: Subject> Proxy<T> {
    fn new(real_subject: T) -> Self {
        return Self { real_subject };
    }
 fn before_request(&self) {
        println!("Proxy handling request before RealSubject");
    }
    
    fn after_request(&self) {
        println!("Proxy handling request after RealSubject");
    }
}

impl<T: Subject> Subject for Proxy<T> {
    fn request(&self) {
        self.before_request();
        self.real_subject.request();
        self.after_request();
    }
}

impl Subject for RealSubject {
    fn request(&self) {
        self.handle_request();
    }
}

fn main() {
 let real_subject = RealSubject::new();
    let proxy = Proxy::new(real_subject);
    proxy.request();
    
    let real_subject = RealSubject::new();
    let proxy: Box<dyn Subject> = Box::new(Proxy::new(real_subject));
    proxy.request();
}
```

在上面的示例中，我们定义了一个 `RealSubject` 结构体，用于实现真实对象的处理函数。然后，我们定义了一个名为 `Subject` 的 trait，用于规定代理对象和真实对象需要实现的方法。

接着，我们定义了一个泛型结构体 `Proxy<T: Subject>`，它包含了一个泛型类型参数 `T`，该参数应该实现了 `Subject` trait。并且，我们实现了 `Proxy` 的 `request` 方法，先调用 `before_request` 方法进行一些前置操作，然后调用真实对象的 `request` 方法，最后调用 `after_request` 方法进行一些后续操作。

最后，在 `main` 函数中，我们实例化了一个 `RealSubject` 对象，并将其传递给 `Proxy` 进行代理操作。然后，我们又实例化了一个 `RealSubject` 对象，并将其转换为 `dyn Subject` 类型的 trait 对象，传递给 `Proxy` 进行代理操作。这种方法允许我们可以使用不同类型的代理对象，使代码更加灵活。

## 最佳实践

在实现代理模式时，我们需要考虑以下几个最佳实践：

- 尽量使用静态编译时代理：使用宏来生成代码可以减少运行时代理的开销，并且可以提高代码的可读性和可维护性。
- 使用类型参数和 trait 对象来实现动态运行时代理：这种方法可以使用不同类型的代理对象，使代码更加灵活。
- 尽量避免使用代理模式：代理模式会引入额外的复杂度，使代码更加难以理解和维护。如果没有必要，尽量避免使用代理模式。

## 结论

代理模式是一种结构型设计模式，它允许通过代理对象控制对其它对象的访问。在 Rust 中，可以使用 trait 和结构体来实现代理模式，并使用宏来生成静态编译时代理，使用类型参数和 trait 对象来实现动态运行时代理。在使用代理模式时，需要考虑最佳实践，如尽量使用静态编译时代理、使用类型参数和 trait 对象来实现动态运行时代理，以及避免使用代理模式等。