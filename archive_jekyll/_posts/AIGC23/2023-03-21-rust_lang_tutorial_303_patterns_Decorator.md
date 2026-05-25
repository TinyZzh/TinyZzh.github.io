---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 玩转“装饰器模式”
date: 2023-03-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 装饰器模式]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

装饰器模式（Decorator Pattern）是一种结构型设计模式，提供了一种动态地给对象添加功能的方式，比继承更加灵活。

## 装饰器模式常用业务场景

当需要给一个类添加额外的功能或者修改其原有的行为时，可以使用装饰器模式。典型的应用场景有：

- 日志记录：在不影响原有业务逻辑的情况下，记录对象的操作日志；
- 缓存：为一个类添加缓存机制，优化其性能；
- 认证：为一个类添加认证机制，限制访问权限；
- 数据验证：为一个类添加数据验证机制，确保存储的数据符合要求；

## 装饰器模式应用场景示例

下面通过一个订单管理系统的实例来说明装饰器模式在业务场景中的应用。

```rust
trait Order {
    fn get_price(&self) -> f64;
}

struct BaseOrder {
    price: f64,
}

impl BaseOrder {
    fn new(price: f64) -> Self {
        Self { price }
    }
}

impl Order for BaseOrder {
    fn get_price(&self) -> f64 {
        self.price }
}

struct DiscountOrder<'a> {
    order: &'a dyn Order,
    discount: f64,
}

impl<'a> DiscountOrder<'a> {
    fn new(order: &'a dyn Order, discount: f64) -> Self {
        Self { order, discount }
    }
}

impl<'a> Order for DiscountOrder<'a> {
    fn get_price(&self) -> f64 {
        self.order.get_price() * self.discount
    }
}

struct AddTaxOrder<'a> {
    order: &'a dyn Order,
    tax: f64,
}

impl<'a> AddTaxOrder<'a> {
    fn new(order: &'a dyn Order, tax: f64) -> Self {
        Self { order, tax }
    }
}

impl<'a> Order for AddTaxOrder<'a> {
    fn get_price(&self) -> f64 {
        self.order.get_price() * (1.0 + self.tax)
    }
}

fn main() {
    let order = BaseOrder::new(100.0);
    let discount_order = DiscountOrder::new(&order, 0.9);
    let tax_order = AddTaxOrder::new(&discount_order, 0.1);
    println!("Order Price: {}", tax_order.get_price());
}
```

在该实例中，`BaseOrder`是订单的基本类，它实现了`Order` trait，提供了一个`get_price`方法，返回订单的价格。

`DiscountOrder`和`AddTaxOrder`是装饰器类，它们也实现了`Order` trait，并且拥有一个内部变量`order`，该变量指向被装饰的类。装饰器类在调用`get_price`方法时，会对被装饰的类的返回结果进行处理，并添加额外的业务逻辑。

上述实例中，订单的价格为100元，按照9折优惠后再加上10%的税费，最终价格为99元。如果需要在原有逻辑的基础上添加其他业务逻辑，例如记录订单的日志、验证订单的数据合法性等，只需要增加一个装饰器类即可。装饰器模式保证了原有类的不变性，同时为类添加了灵活的功能扩展方式。

## 装饰器模式进阶用法：嵌套装饰器

在某些情况下，多个装饰器需要同时应用于一个类。这时候，就需要使用嵌套装饰器的方式。

```rust
struct AddFooterOrder<'a> {
    order: &'a dyn Order,
    footer: String,
}

impl<'a> AddFooterOrder<'a> {
    fn new(order: &'a dyn Order, footer: String) -> Self {
        Self { order, footer }
    }
}

impl<'a> Order for AddFooterOrder<'a> {
    fn get_price(&self) -> f64 {
        self.order.get_price()
    }
}

struct AddHeaderOrder<'a> {
    order: &'a dyn Order,
    header: String,
}

impl<'a> AddHeaderOrder<'a> {
    fn new(order: &'a dyn Order, header: String) -> Self {
        Self { order, header }
    }
}

impl<'a> Order for AddHeaderOrder<'a> {
    fn get_price(&self) -> f64 {
        self.order.get_price()
    }
}

fn main() {
    let order = BaseOrder::new(100.0);
    let discount_order = DiscountOrder::new(&order, 0.9);
    let tax_order = AddTaxOrder::new(&discount_order, 0.1);
    let header_order = AddHeaderOrder::new(&tax_order, "OrderHeader".to_string());
    let footer_order = AddFooterOrder::new(&header_order, "OrderFooter".to_string());
    println!("Order Price: {}", footer_order.get_price());
}
```

在上述实例中，`AddFooterOrder`类为订单添加了页脚信息，`AddHeaderOrder`类为订单添加了页眉信息，使用嵌套装饰器的方式，同时应用两个装饰器，构成一个最终的订单类。

## 装饰器模式最佳实践

在使用装饰器模式时，需要注意以下几点：

- 装饰器类必须实现被装饰的类实现的所有接口；
- 装饰器类应当保证原有类的不变性；
- 装饰器类应当提供简洁的接口，避免使用者的接口复杂度过高。

另外，在使用装饰器模式时，我们可以使用链式调用的方式，增加代码的可读性。

```rust
trait OrderDecorate {
    fn discount(self, discount: f64) -> DiscountOrder<Self>
    where
        Self: Sized,
    {
        DiscountOrder::new(&self, discount)
    }

    fn add_tax(self, tax: f64) -> AddTaxOrder<Self>
    where Self: Sized,
    {
        AddTaxOrder::new(&self, tax)
    }

    fn add_header(self, header: String) -> AddHeaderOrder<Self>
    where
        Self: Sized,
    {
        AddHeaderOrder::new(&self, header)
    }

    fn add_footer(self, footer: String) -> AddFooterOrder<Self>
    where
        Self: Sized,
    {
        AddFooterOrder::new(&self, footer)
    }
}

impl<T> OrderDecorate for T where T: Order {}

fn main() {
    let order = BaseOrder::new(100.0);
    let price = order .discount(0.9)
        .add_tax(0.1)
        .add_header("OrderHeader".to_string())
        .add_footer("OrderFooter".to_string())
        .get_price();
    println!("Order Price: {}", price);
}
```

在该实例中，我们给`Order` trait增加了一个`OrderDecorate` trait，其中提供了链式调用的四个装饰器方法。使用者可以通过简单的链式调用，快速地构建出自己所需要的订单类。

## 总结

在本文中，我们介绍了Rust语言中的装饰器模式，并且以订单管理系统为例，演示了装饰器模式在业务场景中的应用。我们还介绍了装饰器模式的嵌套用法和最佳实践。装饰器模式是一种很有用的模式，适用于需要灵活扩展功能的场景。在实践中，我们可以根据业务需求，结合链式调用、泛型等技术，进一步提高代码的可读性和可维护性。
