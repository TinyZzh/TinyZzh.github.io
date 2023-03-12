---
layout: post
read_time: true
show_date: true
img: images/2023-03/linux-egrep-command.png
title: 简单的Golang泛型教程
date: 2023-03-10 12:00:00 +0800
categories: [golang, 泛型]
tags: [golang, 泛型]
toc: yes
image_scaling: true
mermaid: true
---


Golang泛型教程

Golang是一门比较年轻的编程语言，在经过长期的发展之后，其在各个领域都已经得到了广泛应用。Golang的1.17版本开始引入泛型特性的支持。

Golang泛型主要有以下几个方面的应用：

- 函数和方法的泛型声明
- 接口的泛型声明
- 结构体和嵌入的泛型

接下来，我们将会深入探究这些方面的内容，并且通过简单的示例代码来演示Golang泛型的用法。

## 函数和方法的泛型声明

在Golang 1.17之前，Golang的函数和方法中只支持使用具体类型进行声明，在函数内部也都只能使用特定类型的变量或参数。而引入泛型之后，Golang的函数和方法中就可以使用泛型类型进行声明了。

### 泛型函数

在函数中使用泛型类型进行声明的语法为：

```go
func 函数名[T any](参数列表) 返回值类型 {
    // 函数体
}
```

其中，`T`代表任意类型，可以在函数内部用于声明变量或参数。

下面是一个示例代码，演示了如何在函数中使用泛型：

```go
func Swap[T any](a, b *T) {
    *a, *b = *b, *a
}

func main() {
    // 使用泛型函数
    a := 1
    b := 2
    Swap(&a, &b)
    fmt.Println(a, b)
}
```

这段代码中，我们声明了一个名为`Swap`的泛型函数，该函数接收两个指向任意类型的变量的指针，并且使用`*`操作符进行变量内容的交换。在实际调用该函数的时候，我们传递了两个`int`类型的指针，使得`a`和`b`的值进行了交换。

### 泛型方法

对于方法而言，我们同样可以使用泛型类型进行声明。在方法中使用泛型类型进行声明的语法为：

```go
func (接收者类型) 方法名[T any](参数列表) 返回值类型 {
    // 函数体
}

```

其中，`T`代表任意类型，并且可以在方法内部用于声明变量或参数。

下面是一个示例代码，演示了如何在方法中使用泛型：

```go
type Stack[T any] []T

func (s *Stack[T]) Push(v T) {
    *s = append(*s, v)
}

func (s *Stack[T]) Pop() T {
    index := len(*s) - 1
    res := (*s)[index]
    *s = (*s)[:index]
    return res
}

func main() {
    // 使用泛型方法
    var s Stack[int]
    s.Push(1)
    s.Push(2)
    s.Push(3)
    fmt.Println(s.Pop())
    fmt.Println(s.Pop())
}
```

这段代码中，我们声明了一个名为`Stack`的泛型类型，并且在其中声明了两个泛型方法`Push`和`Pop`。这两个方法都使用了`T`作为自己的泛型类型，使得方法可以适用于任意类型。在实际使用的时候，我们通过`Stack[int]`来声明一个类型为`int`的栈，并且对其进行了相应的操作。

## 接口的泛型声明

在Golang 1.17后，我们还可以使用泛型类型来声明接口。在这种情况下，我们可以使用`type`关键字来定义一个代表任意类型的泛型类型，并且在接口中使用该类型来进行声明。

下面是一个示例代码，演示了如何在接口中使用泛型：

```go
type Container[T any] interface {
    Get() T
    Put(v T)
}

type Stack[T any] []T

func (s *Stack[T]) Push(v T) {
    *s = append(*s, v)
}

func (s *Stack[T]) Pop() T {
    index := len(*s) - 1
    res := (*s)[index]
    *s = (*s)[:index]
    return res
}

func (s *Stack[T]) Get() T {
    return s.Pop()
}

func (s *Stack[T]) Put(v T) {
    s.Push(v)
}

func main() {
    // 使用泛型接口
    var c Container[int] = new(Stack[int])
    c.Put(1)
    c.Put(2)
    fmt.Println(c.Get())
    fmt.Println(c.Get())
}
```

这段代码中，我们声明了一个名为`Container`的泛型接口，并且在其中声明了`Get`和`Put`两个方法，这两个方法都使用了`T`作为自己的泛型类型。而在`Stack`类型的实现中，我们同样实现了`Get`和`Put`方法，并且额外声明了一个方法`Pop`，用于从栈中获取元素。在实际使用中，我们通过`Container[int]`声明了一个类型为`int`的容器，并且使用`Stack[int]`实现了该容器。

## 结构体和嵌入的泛型

在Golang 1.17后，我们还可以在结构体和嵌入中使用泛型类型进行声明。这种情况下，我们可以使用与函数和方法类似的语法进行声明。

下面是一个示例代码，演示了如何在结构体和嵌入中使用泛型：

```go
type Pair[T any] struct {
    first T
    second T
}

type IntPair struct {
    Pair[int]
}

func main() {
    // 使用结构体和嵌入的泛型
    p := IntPair{Pair[int]{1, 2}}
    fmt.Println(p.first, p.second)
}
```

这段代码中，我们声明了一个名为`Pair`的泛型结构体，并且定义了一个包含两个成员变量`first`和`second`的结构体。在`IntPair`类型的定义中，我们嵌入了`Pair[int]`，使得`IntPair`类型包含了两个类型为`int`的成员变量。在实际使用中，我们通过`IntPair{Pair[int]{1, 2}}`来创建一个类型为`IntPair`的变量`p`，并且获取了其中的两个成员变量。

## 总结

到此为止，我们已经讲解了在Golang 1.17中泛型的主要应用场景，包括函数、方法、接口、结构体和嵌入。在实际开发中，我们可以使用这些泛型来提高程序的可扩展性和可重用性，从而让程序更加灵活和具有适应性。如果您还没有尝试过使用Golang中的泛型，那么不妨在接下来的代码中尝试一下吧！