---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Iterator 迭代器
date: 2023-03-17 01:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Iterator]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_101_iterator.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

在Rust语言中，迭代器（Iterator）是一种极为重要的数据类型，它们用于遍历集合中的元素。Rust中的大多数集合类型都可转换为一个迭代器，使它们可以进行遍历，这包括数组、向量、哈希表等。

使用迭代器可以让代码更加简洁优雅，并且可以支持一些强大的操作，例如过滤、映射和折叠等。

在本文中，我们将探讨Rust语言中的迭代器的相关知识，并且以我们的老朋友Animal为例，提供相关的示例代码。

> 熟悉Java的Stream和Lambda的同学，学习本章节时，会格外的感觉“亲切”。

## 迭代器的基本概念

### 迭代器是什么？

在Rust中，迭代器是一个实现了Iterator trait的类型。该trait定义了一组行为，用于支持遍历集合中的元素。通过实现Iterator trait，类型可以被转换为一个迭代器，从而支持Iterate的操作。

### Iterator trait

Iterator trait 定义了迭代器的核心行为，它包含了next方法和一些其他方法。next方法返回集合中下一个元素的Option值，直到集合中所有的元素都被遍历完毕，返回None。

除了next方法之外，Iterator trait 还定义了其他许多有用的方法，比如map、filter等，这些方法可以对迭代器中的元素进行操作和转换。

```rust
pub trait Iterator {
      type Item;

    fn next(&mut self) -> Option<Self::Item>;

    //  多种内置实现方法, skip, map, reduce, collect
    //  和Java中的Stream内置方法非常类似.
}
```

## Animal示例

接下来我们探讨实现一个Animal迭代器，Animal实现Iterator trait，使其可以通过迭代器遍历Animal的各个属性。
以下是Animal类型的定义：

```rust
#[derive(Debug)]
struct Animal {
    name: String,
    age: u32,
    kind: String,
    i:i32,
}
```

我们可以在Animal上实现Iterator trait，使其可以通过for循环进行迭代。

```rust
impl Iterator for Animal {
      type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
          let next_attribute = match self.i {
            0 => Some(self.name.clone()),
            1 => Some(self.age.to_string()),
            2 => Some(self.kind.clone()),
            _ => None,
        };
        self.i += 1;
        next_attribute
    }
}
```

此时，我们已经将我们的类型转换为迭代器，我们就可以在它上面调用各种Iterator trait 的方法。例如，我们可以使用for循环遍历Animal对象的每一个属性：

```rust
#[derive(Debug)]
struct Animal {
    name: String,
    age: u32,
    kind: String,
    i:i32,
}

impl Iterator for Animal {
      type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
          let next_attribute = match self.i {
            0 => Some(self.name.clone()),
            1 => Some(self.age.to_string()),
            2 => Some(self.kind.clone()),
            _ => None,
        };
        self.i += 1;
        next_attribute
    }
}

fn main() {
    let mut animal = Animal {
        name: "Tom".to_string(),
        age : 15,
        kind: "cat".to_string(),
        i : 0
    };
    println!("Name: {}", animal.next().unwrap());
    println!("Age: {}", animal.next().unwrap());
    println!("Kind: {}", animal.next().unwrap());
}
//  输出结果：
// Name: Tom
// Age: 15
// Kind: cat
```

在上述代码中，我们定义了一个Animal类型的Iterator，并定义了一个名为i的内部状态变量。该变量用于追踪遍历的进度，并决定下一个迭代器值的内容。最终成功打印了animal的全部信息。

下面继续我们的学习，定一个Animal向量并遍历打印每一个Animal的所有属性：

```rust

fn print_all_attributes(animals: Vec<Animal>) {
    for mut animal in animals {
        println!("Name: {}", animal.next().unwrap());
        println!("Age: {}", animal.next().unwrap());
        println!("Kind: {}", animal.next().unwrap());
    }
}

fn main() {
    let animals = vec![Animal {
        name: "Tom".to_string(),
        age : 15,
        kind: "cat".to_string(),
        i : 0
    }];
    print_all_attributes(animals);
}
//  输出结果：
// Name: Tom
// Age: 15
// Kind: cat
```

在上述代码中，我们使用for循环来遍历所有的Animal对象，并逐一打印它们的属性。

## 迭代器的常见用法

### map方法

map方法是Iterator trait 中非常重要的一个方法，它可以让我们对迭代器中的每一个元素进行转换操作，并返回新的迭代器。例如：

```rust
fn main() {
    let animals = vec![Animal {
        name: "Tom".to_string(),
        age : 15,
        kind: "cat".to_string(),
        i : 0
    }, Animal {
        name: "Jerry".to_string(),
        age : 7,
        kind: "mouse".to_string(),
        i : 0
    }];
    let list: Vec<String> = animals
        .into_iter()
        .map(|ani| ani.name.clone())
        .collect();
    println!("{:?}", list)
}
// 输出 ["Tom", "Jerry"]
```

上述代码中，我们定义了一个包含2个的向量animals，并使用iter方法将其转换为一个迭代器。然后，我们使用map方法对这个迭代器中的Animal的name操作，返回一个新的迭代器，并使用collect方法将其转换为向量list。


### filter方法

假设我们现在想寻找年龄大于等于3岁的动物，我们可以使用filter方法来实现。

```rust
fn main() {
    let animals = vec![Animal {
        name: "Tom".to_string(),
        age : 15,
        kind: "cat".to_string(),
        i : 0
    }];
    let filtered_animals: Vec<Animal> = animals
        .into_iter()
        .filter(|animal| animal.age >= 3)
        .collect();
    println!("{:?}", filtered_animals)
}
//  输出结果：
//  [Animal { name: "Tom", age: 15, kind: "cat", i: 0 }]
```

在上述代码中，我们使用into_iter方法将Animal向量转换为迭代器，并使用filter方法过滤其中年龄大于等于3岁的动物，最终返回一个新的Animal向量。

### enumerate方法

enumerate方法会将一个迭代器中的元素和它们的索引配对，并返回一个新的迭代器。例如：

```rust
fn main() {
    let animals = vec![Animal {
        name: "Tom".to_string(),
        age : 15,
        kind: "cat".to_string(),
        i : 0
    }, Animal {
        name: "Jerry".to_string(),
        age : 7,
        kind: "mouse".to_string(),
        i : 0
    }];
    for (i, animal) in animals.iter().enumerate() {
        println!("{}: {:?}", i, animal);
    }
}
// 输出：
// 0: Animal { name: "Tom", age: 15, kind: "cat", i: 0 }
// 1: Animal { name: "Jerry", age: 7, kind: "mouse", i: 0 }
```

上述代码中，我们定义了一个包含2个Animal的向量animals，并使用iter方法将其转换为一个迭代器。然后，我们使用enumerate方法将每Animal与其索引配对，并在for循环中打印出来。

### flat_map方法

flat_map方法是Iterator trait 中比较少见的方法之一，它可以用于将嵌套的迭代器展开为单个迭代器。例如：

```rust
#[derive(Debug, Clone)]
struct Animal {
    name: String,
    age: u32,
    kind: String,
    i: i32,
}
fn main() {
    let cat = Animal {
        name: "Tom".to_string(),
        age: 15,
        kind: "cat".to_string(),
        i: 0,
    };
    let mouse = Animal {
        name: "Jerry".to_string(),
        age: 7,
        kind: "mouse".to_string(),
        i: 0,
    };
    let animals = vec![vec![cat], vec![mouse]];

    let list: Vec<Animal> = animals.iter().flat_map(|x| x.iter().cloned()).collect();
    println!("{:?}", list)
}
// 输出 [Animal { name: "Tom", age: 15, kind: "cat", i: 0 }, Animal { name: "Jerry", age: 7, kind: "mouse", i: 0 }]
```

上述代码中，我们定义了一个二维向量animals，并使用iter方法将它转换为迭代器。然后，我们使用flat_map方法将它展开为一个一维的迭代器，并使用collect方法将其转换为向量list。

### zip方法

如果我们需要同时遍历两个向量，我们可以使用zip方法进行配对。

```rust
fn main() {
    let names = vec!["Tom", "Jerry", "Bob"];
    let ages = vec![3, 4, 5];
    
    for (name, age) in names.iter().zip(ages.iter()) {
          println!("{} is {} years old.", name, age);
    }
}
//    输出结果：
// Tom is 3 years old.
// Jerry is 4 years old.
// Bob is 5 years old.
```

上述代码中，我们使用iter方法将names和ages向量转换为迭代器，并使用zip方法对它们进行配对。对于每一对元素，我们调用println!函数并打印它们。

### fold方法

fold方法在Rust中也十分重要，它可以接受一个初始值和一个闭包，遍历迭代器中的每一个元素，并将它们合并成单个值。例如：

```rust
fn main() {
    let cat = Animal {
        name: "Tom".to_string(),
        age: 15,
        kind: "cat".to_string(),
        i: 0,
    };
    let mouse = Animal {
        name: "Jerry".to_string(),
        age: 7,
        kind: "mouse".to_string(),
        i: 0,
    };
    let animals = vec![cat, mouse];

    let sum = animals.iter().fold(0, |t, ani| t + ani.age );
    println!("{}", sum)
}
// 输出 22
```

上述代码中，我们定义了一个包含2个Animal的向量animals，并使用iter方法将其转换为一个迭代器。然后，我们使用fold方法对这个迭代器中的age进行累加，并返回结果sum。

## 结论

迭代器是Rust语言中非常重要的数据类型，它们用于遍历集合中的元素，并支持各种操作。在本教程中，我们探讨了迭代器的基本概念和常见用法，以Animal为例子，提供了相应的演示代码。希望读者能够掌握Rust迭代器的相关内容，并且在实际编程中得到应用。