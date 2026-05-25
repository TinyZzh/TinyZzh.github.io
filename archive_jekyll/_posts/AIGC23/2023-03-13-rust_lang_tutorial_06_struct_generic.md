---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Rust泛型
date: 2023-03-13 19:01:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_05_struct_generic.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)


泛型是一种非常强大的特性，它是现代编程语言中必不可少的特性之一。它允许我们最大限度的编写通用和可重用的代码。在本文中，我们将深入探讨Rust中Struct和泛型，并学习如何使用它们来创建更加灵活和可扩展的代码。

## Rust中的泛型

泛型是一种在编程语言中广泛使用的概念，它允许我们编写可以适用于多种不同类型的代码。在Rust中，我们可以使用泛型来编写更加通用和可重用的代码。
在Rust中，我们使用尖括号<>来指定泛型类型。下面是一个使用泛型的简单示例：
```rust
fn print<T>(x: T) {
    println!("{}", x);
}

fn main() {
    print(1);
    print("hello");
}
```

在上面的示例中，我们定义了一个名为print的函数，并使用泛型类型T来表示函数参数的类型。在函数体中，我们使用println!宏来打印出函数参数的值。在main函数中，我们分别调用了print函数，并传入了一个整数和一个字符串作为参数。由于print函数使用了泛型类型，因此它可以适用于任何类型的参数。
在Rust中，我们还可以使用泛型来定义**struct、enum和trait**。
下面回顾一下，我们上一篇中提到的泛型Pair结构体：
```rust
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let pair_of_ints = Pair { first: 1, second: 2 };
    let pair_of_strings = Pair { first: "hello".to_string(), second: "world".to_string() };
}
```

在上面的示例中，我们定义了一个名为Pair的struct，并使用泛型类型T来表示数据项的类型。在main函数中，我们分别创建了一个存储两个整数的Pair对象和一个存储两个字符串的Pair对象。

### 泛型约束

在Rust中，我们可以使用泛型约束来限制泛型类型的范围。泛型约束允许我们指定泛型类型必须满足的条件，例如实现了某个trait或者是某个特定类型。
下面是一个使用泛型约束的示例：
```rust
use std::fmt::Display;

fn print<T: Display>(x: T) {
    println!("{}", x);
}

fn main() {
    print(1);
    print("hello");
}
```

在上面的示例中，我们使用use语句导入了std::fmt::Display trait，然后在print函数中使用了泛型约束<T: Display>来表示函数参数必须实现Display trait。在函数体中，我们使用println!宏来打印出函数参数的值。在main函数中，我们分别调用了print函数，并传入了一个整数和一个字符串作为参数。由于整数和字符串都实现了Display trait，因此它们都可以作为参数传递给print函数。
在Rust中，我们还可以使用where关键字来指定泛型约束。
下面是一个使用where关键字的示例：
```rust
use std::fmt::Display;

fn print<T>(x: T)
where
    T: Display,
{
    println!("{}", x);
}

fn main() {
    print(1);
    print("hello");
}
```

在上面的示例中，我们使用where关键字来指定泛型约束，与使用<T: Display>的方式相同。使用where关键字的方式通常更加清晰和易读，特别是当我们需要指定多个泛型约束时。

### 常见的泛型结构体

在Rust中，我们可以使用泛型来编写更加通用和可重用的代码。下面是一些常见的泛型应用：

Vec<T>是Rust标准库中的一个动态数组类型，它可以存储任何类型的元素。下面是一个使用Vec<T>的示例：
```rust
let mut v: Vec<i32> = Vec::new();

v.push(1);
v.push(2);
v.push(3);

for i in &v {
    println!("{}", i);
}
```

在上面的示例中，我们首先创建了一个空的Vec<i32>对象，并使用push方法向其中添加了三个整数。然后，我们使用for循环遍历Vec对象中的每个元素，并打印出它们的值。

Option<T>是Rust标准库中的一个枚举类型，它可以表示一个值存在或不存在的情况。下面是一个使用Option<T>的示例：
```rust
let x: Option<i32> = Some(5);
let y: Option<i32> = None;

match x {
    Some(i) => println!("x is {}", i),
    None => println!("x is None"),
}
match y {
    Some(i) => println!("y is {}", i),
    None => println!("y is None"),
}
```

在上面的示例中，我们首先创建了一个存储整数`5`的`Some`对象，并将它赋值给变量`x`。然后，我们创建了一个`None`对象，并将它赋值给变量`y`。最后，我们使用`match`表达式来匹配`x`和`y`的值，并打印出相应的信息。

`Result<T, E>`是Rust标准库中的一个枚举类型，它可以表示一个操作成功或失败的情况，并可以携带一个成功的结果或一个错误信息。下面是一个使用`Result<T, E>`的示例：

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Failed to create file: {:?}", e),
            },
            other_error => panic!("Failed to open file: {:?}", other_error),
        },
    };
}
```

在上面的示例中，我们使用File::open函数来打开一个名为hello.txt的文件。如果文件存在，则返回一个Ok对象，其中包含文件的句柄；否则，返回一个Err对象，其中包含一个io::Error对象，表示文件不存在的错误。在match表达式中，我们使用ErrorKind::NotFound模式匹配来检查错误类型，并使用File::create函数来创建一个新文件。如果创建成功，则返回一个新的文件句柄；否则，使用panic!宏来抛出一个错误。如果文件存在或创建成功，则返回一个文件句柄。

### const 泛型

Const泛型，也称“常量泛型”，参数允许程序项在常量值上泛型化。const标识符为常量参数引入了一个名称，并且该程序项的所有实例必须用给定类型的值去实例化该参数。

常量参数类型值允许为：u8, u16, u32, u64, u128, usize, i8, i16, i32, i64, i128, isize, char 和 bool 这些类型。

### Animal泛型示例

现在，结合上一篇定义的Animal类。我们扩展它并将Animal扩展成一个通用抽象的结构体，并让这个类可以适用于任何类型的动物，它可以存储动物的名称、年龄、性别、物种和体重等信息。

首先，我们定义一个泛型类型T，用于表示动物的类型。然后，我们定义一个名为Animal的struct，并使用泛型类型T来表示动物的类型。在Animal struct中，我们定义了五个数据项，分别是名称、年龄、性别、物种和体重。我们还为Animal struct实现了一个new关联函数，用于创建一个新的Animal对象。在new函数中，我们传入五个参数，分别是名称、年龄、性别、物种和体重，并使用它们来创建一个新的Animal对象。
```rust
struct Animal<T> {
    name: String,
    age: u8,
    is_male: bool,
    species: String,
    weight: f32,
    animal_type: std::marker::PhantomData<T>,
}

impl<T> Animal<T> {
    fn new(name: String, age: u8, is_male: bool, species: String, weight: f32) -> Animal<T> {
        Animal {
            name,
            age,
            is_male,
            species,
            weight,
            animal_type: std::marker::PhantomData,
        }
    }
}
```

在上面的示例中，我们还使用了一个名为PhantomData的标记类型，用于表示泛型类型T的存在。由于Rust中的泛型是在编译时实现的，因此编译器需要知道泛型类型的存在，才能正确地生成代码。使用PhantomData标记类型可以告诉编译器，泛型类型T确实存在，从而使编译器能够正确地生成代码。
现在，我们可以使用Animal类来创建不同类型的动物对象。下面是一个使用Animal类创建猫和狗对象的示例：
```rust
struct Cat;
struct Dog;

fn main() {
    let cat = Animal::<Cat>::new("Tommy".to_string(), 3, true, "cat".to_string(), 4.5);
    let dog = Animal::<Dog>::new("Buddy".to_string(), 5, true, "dog".to_string(), 12.3);
}
```

在上面的示例中，我们首先定义了Cat和Dog两个类型，用于表示猫和狗。然后，我们使用Animal::<Cat>语法创建一个猫对象，并传入相应的参数。使用Animal::<Dog>语法创建一个狗对象，并传入相应的参数。由于Animal类使用了泛型类型T，因此它可以适用于任何类型的动物。

### 泛型约束和trait结合

泛型约束通常都是和trait一起使用的，用来限制泛型类型的范围。例如，我们可以使用std::fmt::Display trait来限制泛型类型必须实现Display trait。下面是一个使用泛型约束和trait的示例：
```rust
use std::fmt::Display;

struct Animal<T: Display> {
    name: String,
    age: u8,
    is_male: bool,
    species: String,
    weight: f32,
    animal_type: std::marker::PhantomData<T>,
}

impl<T: Display> Animal<T> {
    fn new(name: String, age: u8, is_male: bool, species: String, weight: f32) -> Animal<T> {
        Animal {
            name,
            age,
            is_male,
            species,
            weight,
            animal_type: std::marker::PhantomData,
        }
    }

    fn print_info(&self) {
        println!("Name: {}", self.name);
        println!("Age: {}", self.age);
        println!("Is male: {}", self.is_male);
        println!("Species: {}", self.species);
        println!("Weight: {}", self.weight);
    }
}

struct Cat;
struct Dog;

impl Display for Cat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "cat")
    }
}

impl Display for Dog {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "dog")
    }
}

fn main() {
    let cat = Animal::<Cat>::new("Tommy".to_string(), 3, true, Cat.to_string(), 4.5);
    let dog = Animal::<Dog>::new("Buddy".to_string(), 5, true, Dog.to_string(), 12.3);

    cat.print_info();
    dog.print_info();
}
```

在上面的示例中，我们使用<T: Display>泛型约束来限制泛型类型必须实现Display trait。然后，我们为Animal类实现了一个print_info方法，用于打印出动物的信息。在main函数中，我们首先定义了Cat和Dog两个类型，并为它们实现了Display trait。然后，我们使用Animal::<Cat>和Animal::<Dog>语法创建了一个猫对象和一个狗对象，并传入相应的参数。由于Cat和Dog类型都实现了Display trait，因此它们可以作为Animal类的类型参数。最后，我们分别调用了cat.print_info()和dog.print_info()方法，打印出它们的信息。

接下来，我们可以使用泛型特性来重新定义Zoo类和print_animals函数。首先，我们可以使用一个泛型类型T来表示动物的类型，如下所示：
```rust
struct Zoo<T> {
    animals: Vec<Animal<T>>,
}
```

这个Zoo类使用了一个泛型类型T，它表示动物的类型。这个类可以用来容纳不同种类的动物，例如：
```rust
let zoo1 = Zoo { animals: vec![cat, dog, elephant] };
let zoo2 = Zoo { animals: vec![elephant, dog, cat] };
```

接下来，我们定义支持使用泛型特性的print_animals函数，如下所示：
```rust
fn print_animals<T>(zoo: &Zoo<T>) {
    for animal in &zoo.animals {
        println!("{} ({}) is {} years old.", animal.name, animal.animal_type, animal.age);
    }
}
fn main() {
    let cat = Animal { name: "Tommy".to_string(), age: 3, animal_type: "Cat" };
    let dog = Animal { name: "Buddy".to_string(), age: 5, animal_type: "Dog" };
    let elephant = Animal { name: "Dumbo".to_string(), age: 10, animal_type: "Elephant" };

    let zoo1 = Zoo { animals: vec![cat, dog, elephant] };
    let zoo2 = Zoo { animals: vec![elephant, dog, cat] };

    print_animals(zoo1);
    print_animals(zoo2);
}

```

这个函数使用了一个泛型类型T，它表示动物的类型。这个函数可以遍历Zoo中的所有动物，并打印它们的名字、类型和年龄。
现在我们可以使用Animal和Zoo类的泛型特性来实现更加灵活和可复用的代码。例如，我们可以使用Animal<String>来定义字符串类型的动物，使用Animal<u32>来定义整数类型的动物，等等。同时，我们学习使用Zoo来容纳不同类型的动物。

通过这两个泛型示例，相信大家都已经掌握了泛型的使用。

## Rust泛型最佳实践

Rust 中泛型是零成本的抽象，意味着你在使用泛型时，完全不用担心性能上的问题。
因为是在编译阶段为泛型对应的多个类型，生成各自的代码，所以增加了编译耗时，增大了最终生成二进制文件的大小。

当我们需要在内存资源比较紧张的机器上允许rust时，可以尝试使用const泛型进行优化。

## 结论

在本文中，我们深入探讨了Rust中的泛型和struct，并学习了如何使用它们来创建更加灵活和可扩展的代码。我们还讨论了泛型约束和trait，以及如何使用它们来限制泛型类型的范围。最后，我们使用Animal类作为示例，演示了如何使用泛型和trait来创建通用的类，并限制类的类型参数必须满足某些条件。

