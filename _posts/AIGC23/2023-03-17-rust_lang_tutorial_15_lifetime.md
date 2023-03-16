---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 生命周期
date: 2023-03-17 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_15_lifetime.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust是一门系统级编程语言具备高效、安和并发等特，而生命周期是这门语言中比较重要的概念之一。在这篇教程中，我们会了解什么是命周期、为什么需要生命周期、如何使用生命周期，同时我们依然会使用老朋友Animal的代码示例。

## 生命周期

生命周期是Rust语言中的一个概念，用于决内存安全问题。我们在Rust中定义一个变量时，需要确定这个变量在内存中存储时长。这存储时长需要在编译时确定，而生命周期就是来描述这个存储长的。

在Rust中，所有变量都有一个生，生命周期描述了这个变量在存中存在的时长。一个变量都有一个命周期，这个生命周期定义这个变量在什时候被创建和销毁，以及在什么时候可以被访问和修改生命周期可以是显式也可以是隐式的，但是的生命周期都必须循一些规则，以确保代码的正确性和全性。

在C/C++等编语言中，内存管理是程序员需要自己负责的。在这些语言中，程序需要手动分配和放内存，这方式非常容易出现内存泄漏、内溢出等问题。而在Rust中，生命周期的引入使得内存安全问题得到了有效的解决。通过生命周期的束缚，Rust可以在编译时检查变量的存储时长是否合法，从而避免了许多内存安全问题。

## 生命周期的基本概念

在Rust中，生命周期的基本概念包括三个部分，分别是：**生命周期标注**、**生命周期参数**、**生命周期忽略**。

### 生命周期标注

生命周期标（lifetime annotation）是指在变量、函数结构体等
定义中入生命周期参数。命周期标注使用单引（**'**）表示。

```rust
&i32        // 一个引用
&'a i32     // 具有显式生命周期的引用
&'a mut i32 // 具有显式生命周期的可变引用
```

以Animal为例定义一个结构体, 示例如下：

```rust
#[derive(Debug)]
struct Animal<'a> {
    name: &'a str,
    age: i32
}
```

上述中，我们在Animal结构体中加入了生命周期标注表示Animal结构体中的字段的生命周期与结构体身的生命周期相同。

### 生命周期参数

生命周期参数（lifetime parameter是指在函数或结构定义中声明的生命周期参数。Rust中，生命周期参数使用单引号（**'**）表示，例如：

```rust
fn find_oldest<'a>(animals: &'a [Animal]) ->&'a Animal<'a> {
    let mut oldest = &animals[0];
    for animal in animals {
        if animal.age > oldest.age {
            oldest = animal;
        }
    }
    oldest
}
fn main() {
    let list = &vec![Animal{name:"x", age:1},];
    let animal = find_oldest(list);
    println!("{:?}", animal);
}
//  输出结果：
//  Animal { name: "x", age: 1 }
```

上述代码，我们在find_oldest函数定义中声明了一个生命周期参数'a，表示函数返回的Animal对象的生命周期与的动物列表的命周期相同。

### 生命周期省略

Rust设计了一套生命周期省略规则，允许开发者在某些情况下可以不显式地指定生命周期。这是通过对变量引用和函数参数等上下文的分析得出的结果。生命周期省略的规则复杂而严谨，可以极大地减少代码的书写量，同时又保证了程序的正确性。

需要注意的是，虽然生命周期省略允许省略生命周期注释，但对于某些特殊情况，为了保证代码的清晰和正确性，仍需要显式地指定生命周期。

Rust中的生命周期省略规则主要有三种情况：

1. 对于只有一个输入生命周期参数的函数：函数参数的生命周期将被赋予所有输出生命周期参数。

例如：

```rust
fn foo<'a>(x: &'a i32) -> &'a i32 { x }
```

这里定义了一个名为`foo`的函数，它只有一个输入生命周期参数`'a`。因此，在返回值中可以省略`'a`，因为`'a`是唯一的输入生命周期参数。因此，上述代码可以简化为：

```rust
fn foo(x: &i32) -> &i32 { x }
```

2. 对于方法：方法的所有输入生命周期参数都将被赋予方法的输出生命周期参数。

例如：

```rust
#[derive(Debug)]
struct Foo<'a> {
    x: &'a i32,
}
fn bar<'a>(foo: &'a Foo) -> &'a i32 {
    foo.x
}
fn main() {
    let v = 2;
    let f = Foo { 
        x: &v,
    };
    println!("{:?}, {:?}", f, bar(&f));
}
//    输出结果：
//  Foo { x: 2 }, 2
```

这里定义了一个名为`Foo`的结构体，并在其内部实现了一个方法`bar`。由于该结构体定义了生命周期参数`'a`，因此结构体的所有方法也需要使用相同的生命周期参数，生命周期省略规则允许我们在方法中不指定引用的生命周期。因此，上述代码可以简化为：

```rust
#[derive(Debug)]
struct Foo<'a> {
    x: &'a i32,
}
impl<'a> Foo<'a> {
    // 省略了生命周期参数'a'
    fn bar(&self) -> &i32 { self.x }  
}
```

3. 对于具有多个输入生命周期参数的函数或方法：输入生命周期参数中，一个引用类型参数的生命周期被赋予所有其他引用类型参数的生命周期。

例如：

```rust
fn foo<'a, 'b>(x: &'a i32, y: &'b i32) -> &i32 {
    if *x <*y { x } else { y }
}
```

这里定义了一个名为`foo`的函数，它有两个输入生命周期参数`'a`和`'b`。根据生命周期省略规则，当存在多个输入生命周期参数时，编译器会尝试寻找一条最短的路径来使所有引用的生命周期参数保持有效，而这一路径就是将引用的生命周期参数设为交集，即对于两个输入生命周期参数`'a`和`'b`，取它们的交集`'a & 'b`作为函数返回值的生命周期参数，因此，上述代码可以简化为：

```rust
// 省略了生命周期参数'a'和'b'
fn foo(x: &i32, y: &i32) -> &i32 {  
    if *x <*y { x } else { y }
}
```

## 生命周期消除


## 静态生命周期

在 Rust 中，静态生命周期（static lifetime）由 'static 来表示。它是一种特殊的生命周期，只有在程序运行时才会被初始化，而不是在执行函数时。一个拥有 'static 生命周期的变量可以在整个程序运行期间存在，因此它们需要分配在静态内存区域，直到程序终止才会被释放。


## 示例代码

下面是一个完整的示例代码，演示了生命周期在Zoo中的使用：

```rust
#[derive(Debug)]
struct Animal<'a> {
    name: &'a str,
    age: i32,
}

struct Zoo<'a> {
    animals: &'a [Animal<'a>],
}

impl<'a> Zoo<'a> {
    fn new(animals: &'a [Animal<'a>]) -> Zoo<'a> {
        Zoo { animals }
    }

    fn get_oldest(&self) -> &'a Animal<'a> {
        let mut oldest = &self.animals[0];
        for animal in self.animals {
            if animal.age > oldest.age {
                oldest = animal;
            }
        }
        oldest
    }
}

fn main() {
    let animal1 = Animal { name: "cat", age: 5 };
    let animal2 = Animal { name: "dog", age: 7 };
    let animal3 = Animal { name: "bird", age: 2 };

    let list = vec![animal1, animal2, animal3];
    let animal_list = Zoo::new(&list);
    let oldest_animal = animal_list.get_oldest();
    println!("The oldest animal is {} its age is {}", oldest_animal.name, oldest_animal.age);
}
//  输出
//  The oldest animal is dog its age is 7
```

在上述中，我们定义了Animal和Zoo两个结构体，分别表示物和动物列表。List中包含一个animals字段，类型为&'a [Animal<'a>]表示动物列表的生命周期与Zoo实例的生命周期相同。Zoo中，我们定义了两个方法：new和get_oldest。new通过传入的动物列表构造了一个Zoo实例。get_ol方法用于查找动物列表最大的年龄，并返回对应的动物对象。在main函数中，我们创建了三个Animal对象，并通过三个对象构造了一个Zoo实例接着，我们调用Zoo的get_oldest方法，得到了最大年龄的动物。最后，我们输出了这个动的名称和年龄。

## 总结

生命周期是Rust语言中重要的概念之一，用于描述引用的生命周期。函数中，我们可以使用生标注来描述参数和返回值的生命周期关系。在结构中，我们可以使用生命周期标注来描述字段的生命周期关系在某些情况下，我们可以通过生命周期省略来简化代码，提高可性。生命周期的正确使用是写出高效、可读性强Rust程序的关键之一。

希望本篇文章能帮助读者更好地理解Rust中的生命周期概念，以及如何在代码中正确使用和省略生命周期。同时，本文也给出了一个完整的示例代码希望读者能够通过实践加深对生命周期的理解。

在实际开发中，生命周期的正确使用非常重要的它不仅关系到代码的性，也关系到程序的性能和可读性。因，程序员需要认真习和掌握Rust中的命周期概念，正确使用生命周期来编写高效、可读性强的代码。

最后，如果读者还有关于本文没有回答的问题，欢迎在评论区留言。我会尽快回复您的问题。