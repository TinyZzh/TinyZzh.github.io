---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 单元测试
date: 2023-04-02 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 单元测试]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

单元测试是软件开发过程中的重要环节，用于测试代码的小部分是否正常工作。Rust语言拥有一个丰富的测试框架，可以轻松编写并运行测试用例。本教程将介绍如何在Rust项目中编写单元测试，并提供示例代码。

## 单元测试

单元测试是软件测试的一个重要部分，它的主要目的是验证代码单元（如函数、模块或类）是否按照预期工作。与手动测试相比，自动化单元测试能够快速、可靠地检测代码问题，避免了大量的手动测试工作。

在Rust中，单元测试是通过`test`属性来实现的。每个符合规范的测试函数都必须使用特殊的宏`assert!`来验证其结果是否正确。

## 编写单元测试

以下是一个简单的Rust代码示例：

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("{}", add(1, 2));
}
```

这个程序定义了一个名为`add`的函数，该函数接受两个`i32`类型的参数并返回它们的和。我们可以使用单元测试来验证这个函数是否正确。

首先，在`add`函数的上面添加一个`#[test]`属性，告诉编译器这是一个测试函数：

```rust
#[test]
fn test_add() {
    assert_eq!(add(1, 2), 3);
}
```

在这个测试函数中，我们使用`assert_eq!`宏来检查`add`函数是否返回了我们期望的结果。如果运行测试失败，则会输出错误消息，否则测试通过。

## 运行单元测试

在Rust中，我们使用命令`cargo test`来运行所有的测试。当我们运行这个命令时，编译器会自动查找所有带有`#[test]`属性的函数，并且运行他们。

下面是一个运行测试的示例，我们将上述代码保存在`src/main.rs`文件中：

```
$ cargo test
   Compiling rust-unit-test v0.1.0 (/path/to/rust-unit-test)
    Finished test [unoptimized + debuginfo] target(s) in 0.29s
     Running target/debug/deps/rust_unit_test-xxxxxxxxxxxxxxxx

running 1 test
test test_add ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

从输出结果可以看出，我们的测试已经通过了。

## 单元测试进阶

除了使用`assert!`宏来验证测试结果之外，Rust还提供了一些其他的工具来帮助我们编写更完整的测试。

### 使用`assert_eq!`

`assert_eq!`宏可以用来比较两个值是否相等。它还可以比较各种类型的值，包括字符串和浮点数，而不只是数字类型。

```rust
#[test]
fn test_add() {
    assert_eq!(add(1, 2), 3);
    assert_eq!(add(-1, -2), -3);
}
```

### 使用`assert_ne!`

`assert_ne!`宏可以用来比较两个值是否不相等。

```rust
#[test]
fn test_add() {
    assert_ne!(add(1, 2), 4);
    assert_ne!(add(-1, -2), -4);
}
```

### 使用`panic!`断言

有时候，我们需要在测试中引发一个错误（如输入错误的参数等），以测试程序是否能够正确处理这个错误。这时，我们可以使用`panic!`宏来抛出一个错误。

```rust
#[test]
#[should_panic(expected = "attempt to divide by zero")]
fn test_divide_by_zero() {
    divide(10, 0);
}

fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("attempt to divide by zero");
    }
    a / b
}
```

在这个例子中，我们测试了一个除以零的函数。我们使用`should_panic`属性指示编译器检测`panic!`宏是否被正确执行，并且预期的错误信息是否匹配。

### 使用`assert_approx_eq!`

当我们需要比较浮点数时，由于舍入误差等原因，直接使用`assert_eq!`宏并不能得到正确的结果。这时，我们可以使用`assert_approx_eq!`宏来比较两个浮点数是否近似相等。

```rust
#[test]
fn test_approx_pi() {
    assert_approx_eq!(22.0 / 7.0, std::f64::consts::PI, 0.01);
}
```

### 使用`assert!(result.is_ok())`验证结果

对于返回值是`Result`类型的函数，我们可以使用`assert!(result.is_ok())`宏来验证结果是否成功。

```rust
#[test]
fn test_parse_int() {
      let result = "123".parse::<i32>();
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 123);
}
```

## 进阶示例

下面是一个稍微复杂一点的例子，它演示了如何测试一个可能会出错的函数，以及如何使用上面提到的所有宏进行测试。

```rust
#[test]
#[should_panic(expected = "attempt to divide by zero")]
fn test_divide_by_zero() {
    divide(10, 0);
}

#[test]
fn test_add() {
    assert_eq!(add(1, 2), 3);
    assert_eq!(add(-1, -2), -3);
    assert_ne!(add(1, 2), 4);
    assert_ne!(add(-1, -2), -4);
}

#[test]
fn test_approx_pi() {
    assert_approx_eq!(22.0 / 7.0, std::f64::consts::PI, 0.01);
}

#[test]
fn test_parse_int() {
    let result = "123".parse::<i32>();
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 123);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("attempt to divide by zero");
    }
    a / b
}
```

### 测试私有函数

Rust 允许在测试模块中测试私有函数。为了做到这一点，我们将测试模块放在包含私有函数的模块之内，并使用 #[cfg(test)] 和 #[test] 属性将测试函数标记为测试。

```rust
mod foo {
    #[cfg(test)]
    mod tests {
        use super::private_function;

        #[test]
        fn test_private_function() {
            assert_eq!(private_function(), 3);
        }
    }

    fn private_function() -> i32 {
        3
    }
}
```

在上面的示例中，我们定义了一个名为 foo 的模块，并在其中添加了一个私有函数 private_function。在模块内部，我们定义了一个测试模块，并添加了一个测试函数，该函数使用 assert_eq! 断言来验证 private_function 的结果是否正确。

## 结论

Rust提供了非常好用的单元测试框架，使得我们能够轻松地编写、运行和调试测试代码。本教程介绍了一些基本的测试宏和示例代码，希望能够对学习和使用Rust单元测试有所帮助。
