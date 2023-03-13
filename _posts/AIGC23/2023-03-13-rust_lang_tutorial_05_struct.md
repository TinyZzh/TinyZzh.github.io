---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 结构体Struct
date: 2023-03-13 19:01:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_05_struct.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

在Rust语言中，struct是一种自定义类型，类似于Java或者C#语言中Class类概念，它允许我们将多个相关的数据项组合在一起。struct是Rust中的一种复合类型，它可以包含多个数据项，这些数据项可以是不同的类型，例如整数、浮点数、字符串、布尔值等。在这篇教程中，我们将学习如何定义和使用Rust语言中的struct。

## 定义Struct

在Rust语言中，使用关键字struct来定义一个struct。下面是一个定义animal对象的示例：
```rust
struct Animal {
    name: String,
    age: u8,
    is_male: bool,
    species: String,
    weight: f32,
}
```

在上面的示例中，我们定义了一个名为Animal的struct，它包含了5个数据项，分别是name、age、is_male、species和weight。其中，name和species是字符串类型，age是一个8位无符号整数，is_male是一个布尔值，weight是一个浮点数。
在定义struct时，我们可以为每个数据项指定一个类型。在上面的示例中，我们使用了不同的类型来表示不同的数据项。我们还可以在定义struct时使用泛型来表示数据项的类型，例如：
```rust
struct Pair<T> {
    first: T,
    second: T,
}
```

在上面的示例中，我们定义了一个名为Pair的struct，它包含了两个数据项，分别是first和second，它们的类型都是泛型类型T。这意味着我们可以在创建Pair对象时指定T的具体类型，例如：
```rust
let pair_of_ints = Pair { first: 1, second: 2 };
let pair_of_strings = Pair { first: "hello".to_string(), second: "world".to_string() };
```

在上面的示例中，我们创建了两个Pair对象，一个存储了两个整数，另一个存储了两个字符串。

## 实例化Struct

在Rust语言中，我们可以使用花括号{}来初始化一个struct对象。下面是一个初始化animal对象的示例：
```rust
let animal = Animal {
    name: "Tommy".to_string(),
    age: 3,
    is_male: true,
    species: "cat".to_string(),
    weight: 4.5,
};
```

在上面的示例中，我们创建了一个名为animal的Animal对象，并为它的每个数据项指定了一个值。注意，我们必须使用to_string()方法将字符串字面量转换为String类型，因为在Rust中，字符串字面量是不可变的。
我们还可以使用结构体更新语法来初始化一个struct对象。结构体更新语法允许我们从一个已有的struct对象中创建一个新的struct对象，并可以修改其中的一些数据项。下面是一个使用结构体更新语法初始化animal对象的示例：
```rust
let mut animal = Animal {
    name: "Tommy".to_string(),
    age: 3,
    is_male: true,
    species: "cat".to_string(),
    weight: 4.5,
};

let new_animal = Animal {
    name: "Jerry".to_string(),
    age: 2,
//    从animal复制数据
    ..animal
};
```

在上面的示例中，我们首先创建了一个名为animal的Animal对象，然后使用结构体更新语法创建了一个名为new_animal的新的Animal对象。在结构体更新语法中，我们使用..来指定从哪个已有的struct对象中复制数据项，然后可以修改其中的一些数据项。在上面的示例中，我们将name和age数据项修改为新的值，其他数据项保持不变。

## 访问Struct的数据项

在Rust语言中，我们可以使用 "**.**" 操作符来访问struct对象的数据项。下面是一个访问animal对象数据项的示例：
```rust
let animal = Animal {
    name: "Tommy".to_string(),
    age: 3,
    is_male: true,
    species: "cat".to_string(),
    weight: 4.5,
};

println!("Name: {}", animal.name);
println!("Age: {}", animal.age);
println!("Is male: {}", animal.is_male);
println!("Species: {}", animal.species);
println!("Weight: {}", animal.weight);
```

在上面的示例中，我们首先创建了一个名为animal的Animal对象，然后使用.操作符访问了它的每个数据项，并打印出了它们的值。

## 在Struct定义方法

在Rust语言中，我们可以为struct对象定义方法。方法是一种与struct相关的函数，它可以访问struct对象的数据项，并可以对其进行操作。下面是一个定义animal对象方法的示例：
```rust
impl Animal {
    //    定义eat方法
    fn eat(&mut self, food_weight: f32) {
        self.weight += food_weight;
    }

    //    定义sleep方法
    fn sleep(&self) {
        println!("{} is sleeping", self.name);
    }
}
```

在上面的示例中，我们为Animal对象实现了两个方法，分别是eat和sleep。在eat方法中，我们传入一个food_weight参数，然后将它加到weight数据项上。注意，我们必须将self参数标记为可变引用&mut self，因为我们要修改weight数据项的值。
在sleep方法中，我们只是简单地打印出name数据项的值，表示该Animal对象正在睡觉。
我们可以在创建Animal对象后调用这些方法。下面是一个调用eat和sleep方法的示例：
```rust
let mut animal = Animal {
    name: "Tommy".to_string(),
    age: 3,
    is_male: true,
    species: "cat".to_string(),
    weight: 4.5,
};

animal.eat(0.5);
animal.sleep();
```

在上面的示例中，我们首先创建了一个名为animal的Animal对象，然后调用了它的eat方法，并传入了0.5作为food_weight参数。最后，我们调用了sleep方法，打印出name数据项的值。

## Struct的关联函数

关联函数有点类似于Java中静态方法或者类方法，rust中常常用于返回一个结构体的新实例。

在Rust语言中，我们还可以为struct对象实现关联函数。关联函数是一种与struct相关的函数，但它不需要访问struct对象的数据项。关联函数通常用于创建新的struct对象。下面是一个实现animal对象关联函数的示例：
```rust
impl Animal {
    fn create(name: String, age: u8, is_male: bool, species: String, weight: f32) -> Animal {
        Animal {
            name,
            age,
            is_male,
            species,
            weight,
        }
    }
}
```

在上面的示例中，我们为Animal对象实现了一个关联函数create。在create函数中，我们传入了5个参数，分别是name、age、is_male、species和weight，然后创建了一个新的Animal对象，并将这些参数作为数据项的值。注意，我们可以使用简写语法，将参数名作为数据项名，而不需要写成name: name的形式。
我们可以使用关联函数来创建新的Animal对象。下面是一个使用关联函数创建Animal对象的示例：
```rust
let animal = Animal::create("Tommy".to_string(), 3, true, "cat".to_string(), 4.5);
```

在上面的示例中，我们使用Animal::create语法调用了create函数，并传入了5个参数。create函数返回一个新的Animal对象，我们将它赋值给animal变量。

附上完整的代码示例：

```rust
struct Animal {
    name: String,
    weight: f32
}
impl Animal {
    //    定义eat方法
    fn eat(&mut self, food_weight: f32) {
        self.weight += food_weight;
    }

    //    定义sleep方法
    fn sleep(&self) {
        println!("{} is sleeping", self.name);
    }
    
    fn create(name:String, weight:f32) -> Animal {
        Animal {name, weight}
    }
}

fn main() {
    let mut s1 = Animal::create("ABC".to_string(), 0.0);
    s1.eat(100.0);
    println!(" {}", s1.weight);
}
```

## 总结

在本教程中，我们学习了如何定义和使用Rust语言中的struct。我们学习了如何定义struct、初始化struct、访问struct的数据项、实现struct的方法和关联函数。struct是Rust语言中非常重要的一个概念，它允许我们将多个相关的数据项组合在一起，并且可以为它们实现方法和关联函数。通过学习本教程，相信你已经掌握了Rust语言中struct的基本用法。

