---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 避免Panic程序崩溃
date: 2023-03-20 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Panic]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在Rust语言中，当发生一些不可修复的错误时，程序会崩溃并停止运行。这种崩溃被称为"panic"，其中包含了出现问题的文件名和行号等信息。

Panic是一种紧急情况，并且它们应该尽可能地被避免。尽管它们可能是不可避免的，但是在编写代码时我们应该尝试处理尽可能多的错误。

## 如何使用Panic？

在Rust中，可以使用`panic!`宏来引发panic。此时，程序将停止运行并打印出错误信息，这些信息通常包括出错的文件名称和行号等信息。同时，也可以使用环境变量来获取更多的栈跟踪信息。

```rust
struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Animal {
        if age < 1 {
            panic!("Age cannot be less than 1.");
        }
        Animal { name, age }
    }
}

fn main() {
    let animal = Animal::new(String::from("Tom"), 0);
    println!("The animal's name is {} and age is {}.", animal.name, animal.age);
}
```

在上述的示例代码中，我们定义了一个结构体`Animal`，并为它添加了一个函数`new`，该函数接受一个名称和一定年龄的参数。接着在`new`
函数中，我们加入了一行代码，以检查年龄是否小于1，如果小于1，则触发panic。最后在`main`函数中，我们创建了一个名为`animal`
的实例，并输出其名称和年龄。但是由于我们传递的年龄小于1，所以当运行到这里时，程序就会发生panic。

当运行这段代码时，输出如下信息：

```
thread 'main' panicked at 'Age cannot be less than 1.', src/main.rs:9:13
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

这个信息告诉我们，在执行`new`函数时，程序崩溃，并指出出错的源代码文件和行号。同时，它还为我们建议了一个环境变量，以获取更详细的栈跟踪信息。

## 如何避免Panic？

对于大多数情况而言，应该尽可能少使用panic。在开始一个新的项目时，首先要考虑的是如何处理错误而不是如何处理成功的情况。

### Result类型

在Rust中，可以使用`Result`类型来避免panic。`Result`类型包括两个枚举值：`Ok`和`Err`。当一个函数返回`Result`
类型时，它要么返回一个包含成功结果数据的`Ok`，要么返回一个包含错误信息的`Err`。这样，调用者就可以选择如何处理错误。

```rust
struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Result<Animal, String> {
        if age < 1 {
            return Err(String::from("Age cannot be less than 1."));
        }
        Ok(Animal { name, age })
    }
}

fn main() {
    let animal_result = Animal::new(String::from("Tom"), 0);
    match animal_result {
        Ok(animal) => {
            println!("The animal's name is {} and age is {}.", animal.name, animal.age);
        }
        Err(error) => {
            println!("{}", error);
        }
    }
}
```

在上面的代码中，我们对`new`函数进行了修改，使其返回`Result`类型。如果年龄小于1，则返回一个包含错误信息的`Err`
。如果年龄大于等于1，则返回一个包含动物实例的`Ok`。

在`main`函数中，我们创建了一个名为`animal_result`的变量，并将其设置为调用`Animal`结构体中的`new`
函数的返回值。我们使用`match`表达式来处理`animal_result`，如果成功，则输出动物实例的名称和年龄，否则则输出错误信息。

### unwrap和expect方法

在Rust中的`Result`类型中，还有两个用于从`Ok`值中提取值的方法：`unwrap`和`expect`
。这两个方法都可以用于快速编写测试代码，并且在这种情况下，panic可能是可以接受的。但是在实际生产代码中，应该避免使用这两个方法，因为它们会利用panic而不是正确处理错误。

```rust
fn main() {
    let animal = Animal::new(String::from("Tom"), 1).unwrap();
    println!("The animal's name is {} and age is {}.", animal.name, animal.age);

    let animal = Animal::new(String::from("Tom"), 0).expect("Failed to create animal instance.");
    println!("The animal's name is {} and age is {}.", animal.name, animal.age);
}
```

在上述示例中，我们在创建`animal`实例时使用了`unwrap`和`expect`方法。在使用`unwrap`方法时，如果返回值是`Ok`，则返回`Ok`
类型的值，否则触发panic。而使用`expect`方法时，同样是如果返回值是`Ok`，则返回`Ok`类型的值，并输出指定的错误信息，否则触发panic。

## 总结

Rust语言的panic是一种程序崩溃的情况，应该尽可能地避免它的发生。为了避免panic，我们应该尽量使用`Result`
类型，并且在返回错误时返回一个包含错误信息的`Err`。在测试代码中，可以使用`unwrap`和`expect`方法，但是在实际生产代码中应该避免它们的使用。