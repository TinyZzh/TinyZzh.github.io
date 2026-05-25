---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 格式化输出
date: 2023-03-14 22:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_11_println_format.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust提供了许多方式来格式化输出。其中，最常用的方式是使用println!宏。该宏使用类似于C语言的格式字符串，允许使用占位符来表示输出的变量。

除了`println!`宏，Rust还提供了其他格式化输出的宏，如`print!`、`eprint!`、`format!`、`panic!`等。这些宏都支持类似于`println!`宏的格式字符串语法。

本篇文章我们将已Rust中println的格式化输出为例，和大家一起探讨学习使用格式字符串和占位符，以及如何格式化数字和日期时间。

## 格式化输出

### 格式字符串和占位符

在Rust中，格式化输出使用格式字符串和占位符。格式字符串是一个包含占位符的字符串，占位符指定了输出的格式。下面是一个简单的例子：

```rust
let name = "Alice";
let age = 30;
println!("My name is {} and I am {} years old.", name, age);
```

在这个例子中，我们使用了两个占位符 {}，它们分别对应变量 name 和 age。当程序运行时，println! 宏会将这些变量的值插入到占位符中，并输出结果。
占位符可以包含格式说明符，格式说明符指定了输出的格式。例如，我们可以使用 {:.2} 来指定输出浮点数的小数点后两位。下面是一个例子：

```rust
let pi = 3.14159265358979323846;
println!("Pi is approximately {:.2}", pi);
```

在这个例子中，我们使用了 {:.2} 来指定输出浮点数的小数点后两位。当程序运行时，println! 宏会将 pi 的值插入到占位符中，并输出结果。
除了浮点数，Rust还支持格式化输出整数、字符串和布尔值。下面列举了一些常用的占位符：
|占位符|类型|说明|
|:--:|:--:|:--:|
|{} |任意类型 |默认格式
|{:<N} |任意类型 |左对齐，总宽度为N
|{:>N} |任意类型 |右对齐，总宽度为N
|{:^N} |任意类型 |居中对齐，总宽度为N
|{:.N} |浮点数 |小数点后N位
|{:.0} |浮点数 |四舍五入取整
|{:+} 整数/|浮点数 |显示符号
|{:#b} |整数 |二进制
|{:#o} |整数 |八进制
|{:#x} |整数 |十六进制
|{:#X} |整数 |十六进制（大写）
|{} |布尔值 |默认格式
|{} |字符串 |默认格式
|{:<N} |字符串 |左对齐，总宽度为N
|{:>N} |字符串 |右对齐，总宽度为N
|{:^N} |字符串 |居中对齐，总宽度为N

结合代码示例动手尝试一下这些占位符。

```rust
let name = "Alice";
let age = 30;
println!("{:<10} | {:^10} | {:>10}", "Name", "Age", "Gender");
println!("{:<10} | {:^10} | {:>10}", name, age, "Female");

let pi = 3.14159265358979323846;
println!("Pi is approximately {:.2}", pi);

let x = 42;
println!("x = {:#x}", x);

let s = "Hello, world!";
println!("{:^20}", s);

//    输出结果如下：
// Name       |    Age     |     Gender
// Alice      |     30     |     Female
// Pi is approximately 3.14
// x = 0x2a
//    Hello, world!    
```

### 格式化整数

Rust中的整数默认使用十进制表示，但是也支持二进制、八进制和十六进制。可以使用 {:b}、\{:\o} 和 {:x} 来分别表示二进制、八进制和十六进制。例如：

```rust
let x = 42;
println!("x = {:#x}", x);
//  输出结果为：x = 0x2a
```

Rust还支持在占位符中指定整数的宽度和对齐方式。可以使用 {:N}、{:<N}、{:>N} 和 {:^N} 来分别表示总宽度为N的默认、左对齐、右对齐和居中对齐。例如：
```rust
let x = 42;
println!("{:<10} | {:^10} | {:>10}", "Name", "Age", "Gender");
println!("{:<10} | {:^10} | {:>10}", "Alice", x, "Female");
// 输出结果为：
// Name       |    Age    |     Gender
// Alice      |    42     |     Female
```

### 格式化浮点数

Rust中的浮点数默认使用科学计数法表示，但是也支持固定点表示法和十进制表示法。
可以使用 {:e}、{:E}、{:f} 和 {:a} 来分别表示科学计数法、科学计数法（大写）、固定点表示法和十六进制浮点数。例如：

```rust
let pi = 3.14159265358979323846;
println!("Pi is approximately {:.2}", pi);
// 输出结果为：
// Pi is approximately 3.14
```

Rust还支持在占位符中指定浮点数的小数点后的位数。可以使用 {:N} 来表示小数点后N位。例如：

```rust
let pi = 3.14159265358979323846;
println!("Pi is approximately {:.5}", pi);
// 输出结果为：
// Pi is approximately 3.14159
```

### 格式化日期时间

Rust中的日期时间格式化使用了 chrono 库。可以使用 {:?} 来表示日期时间。例如：
```rust
use chrono::prelude::*;

let dt = Utc::now();
println!("The current date and time is {:?}", dt);
// 输出结果为：
// The current date and time is 2023-03-14 01:27:43.123456 UTC
```

可以使用 {:?} 中的格式说明符来指定日期时间的格式。例如：
```rust
use chrono::prelude::*;

let dt = Utc::now();
println!("The current date is {:02}/{:02}/{}", dt.month(), dt.day(), dt.year());

// 输出结果为：
// The current date is 03/14/2023
```

### 格式化输出的实现原理

Rust中的格式化输出是通过`Formatter`实现的。`Formatter`是一个结构体，用于控制输出的格式和位置。`Formatter`提供了一系列方法，用于获取输出格式、设置输出宽度、精度和填充字符等。

以下是一些常用的`Formatter`方法：

- `width`：获取输出宽度。
- `precision`：获取浮点数输出精度。
- `fill`：获取填充字符。
- `align`：设置对齐方式。
- `sign_plus`：设置输出符号为正号。
- `alternate`：启用备用格式。

以下代码演示了如何使用`Formatter`方法来控制输出格式：

```rust
let pi = 3.14159265359;

println!("{:+010.3}", pi);
//    输出结果：
//    +003.142
```

以上代码中，`:+010.3`表示输出符号为正号，输出宽度为10个字符，小数点后保留3位，如果需要填充，则使用0填充。使用`println!`宏和参数`pi`输出结果。

### 自定义类型的格式化输出

在Rust中，除了使用内置的格式化选项和自定义格式化字符串外，Rust还支持自定义输出格式。自定义输出格式包括三个部分：实现`std::fmt::Display` 、`std::fmt::Debug` trait和定义输出格式。上面的章节讲解了内置定义的输出格式和实现原理，下面学习另外两种类型的自定义输出。

通过实现 **std::fmt::Display** 或 **std::fmt::Debug** trait 都可以实现自定义类型的格式化输出。区别就是Display trait 用于产生环境用户友好的输出，例如运行时错误，用户输入异常告警日志之类的，而 Debug trait 用于产生调试输出，主要是开发阶段，开发者打印信息帮助调试程序的问题。

下面是一个例子，演示如何实现 Display trait：
```rust
use std::fmt;

struct Person {
    name: String,
    age: u32,
}

impl fmt::Display for Person {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ({})", self.name, self.age)
    }
}

fn main() {
    let p = Person { name: String::from("Alice"), age: 30 };
    println!("Person: {}", p);
}
// 输出结果为：
// Person: Alice (30)
```

在这个例子中，我们定义了一个 Person 结构体，并实现了 Display trait。在 fmt 方法中，我们使用 write! 宏来将格式化后的字符串写入到 f 中。f 是一个 Formatter 类型的对象，它提供了很多方法来格式化输出。

类似地，我们也可以实现 Debug trait 来产生调试输出。下面是一个例子：
```rust
use std::fmt;

struct Person {
    name: String,
    age: u32,
}

impl fmt::Debug for Person {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Person")
         .field("name", &self.name)
         .field("age", &self.age)
         .finish()
    }
}

fn main() {
    let p = Person { name: String::from("Alice"), age: 30 };
    println!("Debug: {:?}", p);
}
// 输出结果为：
// Debug: Person { name: "Alice", age: 30 }
```

在这个例子中，我们实现了 Debug trait，并使用 debug_struct 方法来创建一个 DebugStruct 类型的对象。然后，我们使用 field 方法来添加字段，并使用 finish 方法来完成格式化输出。

## 结论

在这个教程中，我们介绍了Rust中的格式化输出，包括使用格式字符串和占位符，以及如何格式化数字和日期时间。我们还演示了如何自定义类型的格式化输出。希望这个教程能够帮助你更好地理解Rust中的格式化输出。

