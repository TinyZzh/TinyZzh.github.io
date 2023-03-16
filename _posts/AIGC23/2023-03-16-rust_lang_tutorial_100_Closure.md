---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Closure 闭包
date: 2023-03-16 01:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Closure]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_100_Closure.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言的闭包是一种可以捕获外部变量并在需要时执行的匿名函数。闭包在Rust中是一等公民，它们可以像其他变量一样传递、存储和使用。闭包可以捕获其定义范围内的变量，并在必要时访问它们。这使得闭包在许多场景下非常有用，例如迭代器、异步编程和并发编程。


闭包与函数的区别在于，闭包可以捕获它所定义的环境中的变量。这意味着，当闭包中使用变量时，它可以访问该变量的值。在Rust中，闭包被设计为可以自动推断变量的类型，因此可以方便地使用。

> Rust闭包概念和python中Lambda表达式，Java的Lambda表达式很类似，可以帮助理解和应用。

## 闭包的应用场景

闭包在Rust语言中被广泛应于许多场景。例如，在多线程编程中，闭包可以用来定义线程任务。在Web开发中，闭包可以用来定义路由处理函数。在数据处理领域，闭包可以用来定义数据转换和过滤函数等等。
下面，我们以`Animal`为例，演示如何使用闭包实现一些常见的数据处理和转换操作。

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Animal {
    name: String,
    species: String,
    age: i32,
}


impl Animal {
    fn new(name: &str, species: &str, age: i32) -> Self {
        Animal {
            name: name.to_owned(),
            species: species.to_owned(),
            age,
        }
    }
}

impl Display for Animal {
    fn fmt(&self, f: &mut Formatter) -> Result {
        write!(f, "Animal info name {}, species:{}, age:{}", self.name, self.species, self.age)
    }
}

fn main() {
    let animals = vec![
        Animal::new("Tom", "Cat", 2),
        Animal::new("Jerry", "Mouse", 1),
        Animal::new("Spike", "Dog", 3),
    ];

    // 计算所有动物的平均年龄
    let total_age = animals.iter().map(|a| a.age).sum::<i32>();
    let average_age = total_age as f32 / animals.len() as f32;
    println!("Average age: {:.2}", average_age);

    // 统计每个物种的数量
    let mut species_count = HashMap::new();
    for animal in &animals {
        let count = species_count.entry(animal.species.clone()).or_insert(0);
        *count += 1;
    }
    println!("Species count: {:?}", species_count);

    // 找出所有年龄大于2岁的动物
    let old_animals: Vec<_> = animals.iter().filter(|a| a.age > 2).collect();
    println!("Old animals: {:?}", old_animals);

    // 将所有动物的名字转换成大写
    let upper_names: Vec<_> = animals.iter().map(|a| a.name.to_uppercase()).collect(); 
    println!("Upper case names {:?}", upper_names);
}
//    输出结果：
// Average age: 2.00
// Species count: {"Dog": 1, "Cat": 1, "Mouse": 1}
// Old animals: [Animal { name: "Spike", species: "Dog", age: 3 }]
// Upper case names ["TOM", "JERRY", "SPIKE"]
```

在上面的代码中，我们定义了一个`Animal`结构体，其中包含了动物的名称、物种和年龄信息。我们使用`Vec`类型来存储所有动物的信息。接下来，我们使用包对这些动物进行了一些常见的数据处理和转换操作。

首先，我们计算了所有动物的平均年龄。我们使用`iter()`方法对`Vec`进行迭代，并使用`map()`方法将每个动物的年龄提取出来。然后，我们使用`sum()`方法将所有的年龄相加，并将其转换为`i32`类型。最后，我们将总年龄除以动物数量，得到平均年龄。

接下来，我们统计了每个物种的数量。我们使用`HashMap`类型来存储物种和数量的映射关系。我们使用`entry`方法获取每个物种的数量，如果该物种不存在，则插入一个新的映射关系，并将数量初始化为0。最后，我们使用`filter()`方法和闭包找出了所有年龄大于2岁的动物。我们使用`map()`方法和闭包将所有动物的名字转换成大写，然后使用`collect()`方法将它们收集到一个新的`Vec`中。最后，我们使用`map()`方法和闭包将所有动物的名字转换成大写。

在上面的示例中，我们可以看到闭包的强大之处。使用闭包，我们可以轻松地对数据进行转换和处理，而不必定义大量的函数。此外，闭包还可以捕获外部环境中的变量，使得代码更加灵活和可读。

## 闭包的语法

包的语法形式如下：

```rust
|arg1, arg2, ...| body
```

其中，`arg1`、`arg2`...表示闭包参数，`body`表示闭包函数体。闭包可以有多个参数，也可以没有参数。如果闭包没有参数，则可以省略`|`和`|`之间的内容。

无参数闭包示例：
```rust
fn main() {
    let greet = || println!("Hello, World!");
    greet();
}
//    输出结果:
//    Hello, World!
```

闭包的函数体可以是任意有效的Rust代码，包括表达式、语句和控制流结构等。在闭包中，我们可以使用外部作用域中的变量。这些变量被称为闭包的自由变量，因为它们不是闭包参数，但是在闭包中被引用了。

闭包的自由变量示例如下：
```rust
fn main() {
    let x = 3;
    let y = 5;
    //  在这里y，就是闭包的自由变量  
    let add = |a, b| a + b + y;
    
    println!("add_once_fn: {}", add(x,y));
}
//    输出结果:
//    13
```

在上面的示例中，我们定义了一个闭包`add`，没用指定参数的具体类型，这里是使用到了Rust语言的闭包类型推导特性，编译器会在调用的地方进行类型推导。这里值得注意的几点小技巧**定义的闭包必须要有使用，否则编译器缺少类型推导的上下文。当编译器推导出一种类型后，它就会一直使用该类型，和泛型有本质的区别。**

```rust
//    1. 将上面例子的pringln!注释掉， 相当于add闭包没用任何引用，编译报错
error[E0282]: type annotations needed
  --> src/main.rs:13:16
   |
13 |     let add = |a, b| a + b + y;
   |                ^
   |
help: consider giving this closure parameter an explicit type
   |
13 |     let add = |a: /* Type */, b| a + b + y;
   |                 ++++++++++++
//    2. 新增打印 println!("add_once_fn: {}", add(0.5,0.6));

error[E0308]: arguments to this function are incorrect
  --> src/main.rs:16:33
   |
16 |     println!("add_once_fn: {}", add(0.5,0.6));
   |                                 ^^^ --- --- expected integer, found floating-point number
   |                                     |
   |                                     expected integer, found floating-point number
   |
note: closure defined here
  --> src/main.rs:13:15
   |
13 |     let add = |a, b| a + b + y;
   |               ^^^^^^
```

闭包可以使用三种方式之一来捕获自由变量：

- `move`关键字：将自由变量移动到闭包内部，使得闭包拥有自由变量的所有权。这意味着，一旦自由变量被移动，部作用域将无法再次使用它。
- `&`引用：使用引用来访问自由变量。这意味着，外部作用域仍然拥有自由变量的所有权，并且可以在闭包之后继续使用它。
- `&mut`可变引用：使用可变引用来访问自由变量。这意味着，外部作用域仍然拥有自由变量的所有权，并且可以在闭包之后继续使用它。但是，只有一个可变引用可以存在于任意给定的时间。如果闭包中有多个可变引用，编译器将无法通过。

下面是具有不同捕获方式的闭包示例：

```rust
fn main() {
    let x = 10;
    let y = 20;
    
    // 使用move关键字捕获自由变量
    let add = move |a:i32, b:i32| a + b + x;
    
    // 使用引用捕获自由变量
    let sub = |a:i32, b:i32| a - b - y;
    
    // 使用可变引用捕获自由变量
    let mut z = 30;
    let mut mul = |a:i32, b:i32| {
        z += 1;
        a * b * z
    };
    println!("add {}", add(x, y))
    println!("sub {}", sub(x, y))
    println!("mul {}", mul(x, y))
}
//    输出结果:
// add 40
// sub -30
// mul 6200
```

在上面的示例中，我们定义了三个闭包：`add`、`sub`和`mul`。
 - `add`使用`move`关键字捕获了自由变量`x`，因此它拥有`x`的所有权。
 - `sub`使用引用捕获了自由变量`y`，因此它只能访问`y`的值，而不能修改它。
 - `mul`使用可变引用捕获了自由变量`z`，因此它可以修改`z`的值。在这种情况下，我们需要使用`mut`关键字来声明可变引用。

## 闭包的类型

在Rust语言中，闭包是一种特殊的类型，被称为`Fn`、`FnMut`和`FnOnce`。这些类型用于区分闭包的捕获方式和参数类型。

- `Fn`：表示闭包只是借用了自由变量，不会修改它们的值。这意味着，闭包可以在不拥有自由变量所有权的情况下访问它们。
- `FnMut`：表示闭包拥有自由变量的可变引用，并且可能会修改它们的值。这意味着，闭包必须拥有自由变量的所有权，并且只能存在一个可变引用。
- `FnOnce`：表示闭包拥有自由变量的所有权，并且只能被调用一次。这意味着，闭包必须拥有自由变量的所有权，并且只能在调用之后使用它们。

在闭包类型之间进行转换是非常简单的。只需要在闭包的参数列表中添加相应的trait限定，即可将闭包转换为特定的类型。例如，如果我们有一个`Fn`类型的闭包，但是需要将它转换为`FnMut`类型，只需要在参数列表中添加`mut`关键字，如下所示：

```rust
fn main() {
    let x = 3;
    let y = 5;
    let add = |a:i32, b:i32| a + b;
    let mut add_mut = |a:i32, b:i32| {
        let result = a + b;
        println!("Result: {}", result);
        result
    };
    
    let add_fn: fn(i32, i32) -> i32 = add;
    let add_mut_fn: fn(i32, i32) -> i32 = add_mut;
    let add_once_fn: fn(i32, i32) -> i32 = |a:i32, b:i32| a + b + 10;
    println!("add_fn: {}", add_fn(x,y));
    println!("add_mut_fn: {}", add_mut_fn(x,y));
    println!("add_once_fn: {}", add_once_fn(x,y));
}
//    输出结果：
// add_fn: 8
// Result: 8
// add_mut_fn: 8
// add_once_fn: 18
```

在上面的示例中，我们定义了三个闭包：`add`、`add_mut`和`add_once`。`add`和`add_mut`都是`Fn`类型的闭包，但是`add_mut`使用了可变引用，因此它也是`FnMut`类型闭包。我们使用`fn`关键字将闭包转换为函数类型，并指定参数和返回值的类型。在这种情况下，我们使用`i32`作为参数和返回值的类型。

## 闭包的应用与实践

闭包在Rust语言中广泛应用于函数式编程、迭代器和多线程等领域。在函数式编程中，闭包常常用于实现高阶函数，如`map()`、`filter()`和`reduce()`等。这些函数可以接受一个闭包作为参数，然后对集合中的每个元素进行转换、过滤和归约等操作。

以下是一个使用闭包实现`map()`和`filter()`函数的示例：

```rust
fn map<T, F>(source: Vec<T>, mut f: F) -> Vec>
where
    F:Mut(T) -> T,
{
    let mut result = Vec::new();
    for item in source {
        result.push(f(item));
    }
    result
}

fn filter<T, F>(source: Vec<T>, mut f: F) -> Vec<T>
where
    F: FnMut(&T) -> bool,
{
    let mut result = Vec::new();
    for item in source {
        if f(&item) {
            result.push(item);
        }
    }
    result
}
```

在上面的示例中，我们定义了`map()`和`filter()`函数，它们接受一个闭包作为参数，并对集合中的每个元素进行转换和过滤操作。`map()`函数将集合中的每个元素传递给闭包进行转换，并将转换后的结果收集到一个新的`Vec`中。`filter()`函数将集合中的每个元素传递给闭包进行过滤，并将通过过滤的元素收集到一个新的`Vec`中。

以下是一个使用闭包实现多线程的示例：

```rust
use std::thread;

fn main() {
    let mut handles = Vec::new();
    for i in 0..10 {
        let handle = thread::spawn(move || {
            println!("Thread {}: Hello, world!", i);
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
}
//    输出结果：
// Thread 1: Hello, world!
// Thread 7: Hello, world!
// Thread 8: Hello, world!
// Thread 9: Hello, world!
// Thread 6: Hello, world!
// Thread 5: Hello, world!
// Thread 4: Hello, world!
// Thread 3: Hello, world!
// Thread 2: Hello, world!
// Thread 0: Hello, world!
```

在上面的示例中，我们使用`thread::spawn()`函数创建了10个新线程，并使用闭包将每个线程的编号传递给它们。在闭包中，我们使用`move`关键字将`i`移动到闭包内部，以便在创建线程之后，`i`的所有权被转移
给了闭包。然后，我们将每个线程的句柄存储在一个`Vec`中，并使用`join()`函数等待每个线程完成。

## 总结

Rust语言中的闭包是一种非常强大的特性，可以用于实现高阶函数、函数式编程、迭代器和多线程等领域。闭包具有捕获自由变量的能力，并且可以在闭包后继续使用它们。在Rust语言中，闭包是一种特殊的类型，被称为`Fn`、`FnMut`和`Once`，用于区闭包的捕获方式和参数类型。闭包可以通过实现这些trait来进行类型转换。

尽管闭包在Rust语言中非常强大和灵活，但是使用它们时需要谨慎。闭包的捕获方式和参数类型可能会导致所有权和可变性的问题，尤其是在多线程环境中。因此，我们应该在使用闭包时仔细思考，并遵循Rust语言的所有权和可变性规则。

总之，闭包是一种非常有用的特性，可以帮助我们编写更加灵活和高效的代码。如果您还没有使用过闭包，请尝试在您的项目中使用它们，并体验闭包带来的便利和效率。

## 参考资料

- [The Rust Programming Language](https://doc.rust-lang.org/book/ch13-01-closures.html)
- [Rust by Example](https://doc.rust-lang.org/stable/rust-by-example/fn/closures.html)
- [Rustonomicon](https://doc.rust-lang.org/nomicon/closures.html)
- [Rust Reference](https://doc.rust-lang.org/reference/expressions/closure-expr.html)