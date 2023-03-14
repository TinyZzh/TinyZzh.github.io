---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 标准库集合
date: 2023-03-14 19:01:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_05_collections.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 的标准集合库提供了最常见的通用编程数据结构的高效实现，帮助开发者快速实现存储和操作一系列值。在本教程中，我们将介绍Rust语言标准库中的集合类型，包括数组、向量、哈希表等。我们将详细介绍常用集合的用法，并提供代码示例，以便您更好地理解和学习。

## 集合

Rust 的集合可以分为四大类：

 - 有序集合：Vec, VecDeque, LinkedList
 - Map(键值对/字典)：HashMap, BTreeMap
 - Set：HashSet, BTreeSet
 - 其他：BinaryHeap

![](/images/2023-03/rust_lang_collections.svg)

Vec 和 VecDeque 都是序列容器，它们的主要区别在于内部实现的数据结构不同。Vec 是基于动态数组实现的，支持在尾部添加和删除元素，还支持在任意位置插入和删除元素。VecDeque 则是基于双端队列实现的，支持在头部和尾部添加和删除元素，但是插入和删除元素的时间复杂度会比 Vec 高一些。

LinkedList 是链表容器，它支持在任意位置插入和删除元素，但是访问元素的时间复杂度会比 Vec 和 VecDeque 高一些。

HashMap 和 BTreeMap 都是关联容器，它们都支持通过键来访问值。HashMap 是基于哈希表实现的，支持快速的插入、查找和删除操作，但是不保证元素的顺序。BTreeMap 则是基于 B 树实现的，支持有序的插入、查找和删除操作，但是相比于 HashMap，它的性能会略低一些。

HashSet 和 BTreeSet 都是集合容器，它们都支持快速的插入、查找和删除操作。HashSet 是基于哈希表实现的，不保证元素的顺序，而 BTreeSet 则是基于 B 树实现的，保证元素按照顺序排列。

BinaryHeap 是堆容器，它支持快速的插入和删除操作，并且保证堆的性质。堆是一种树形数据结构，每个节点的值都大于等于（或小于等于）它的子节点的值，因此可以用来实现优先队列等数据结构。

## 向量（Vec）

Vec是一种动态长度、存储相同类型元素的集合类型。在Rust中，Vec是通过以下语法定义的：
```rust
let vector: Vec<i32> = vec![1, 2, 3, 4, 5];
```

在这个例子中，我们定义了一个包含5个整数的向量。与数组不同，向量的长度可以在运行时改变。我们可以使用[]运算符来访问向量中的元素，例如：
```rust
let first = vector[0];
let second = vector[1];
```

我们还可以使用for循环遍历向量中的元素：
```rust
for element in &vector {
    println!("{}", element);
}
```

这将输出向量中的每个元素。

Rust标准库中的向量类型提供了许多有用的方法，用于操作向量中的元素。下面是一些常用的方法：

```rust
use std::vec::Vec;

fn main() {
    let vector = vec![1, 2, 3];
    //    push方法：将一个元素添加到向量的末尾。
    vector.push(4);
    //    pop方法：从向量的末尾移除一个元素，并返回该元素的值。
    let last = vector.pop();
    //    len方法：返回向量中元素的数量。
    let length = vector.len();
    //    is_empty方法：检查向量是否为空。
    let is_empty = vector.is_empty();
    //    contains方法：检查向量中是否包含指定的元素。
    let contains_two = vector.contains(&2);
    
    //    sort方法：对向量中的元素进行排序。
    let mut vector = vec![3, 2, 1];
    vector.sort();
}
```

### 数组(Array)

于Vec 有些类似的数组是一种**固定长度**、存储相同类型元素的集合类型。在Rust中，数组是通过以下语法定义的：
```rust
let array: [i32; 5] = [1, 2, 3, 4, 5];
```

在这个例子中，我们定义了一个包含5个整数的数组。注意，数组的长度是在定义时确定的，不能在运行时改变。我们可以使用[]运算符来访问数组中的元素，例如：
```rust
let first = array[0];
let second = array[1];
```

我们还可以使用for循环遍历数组中的元素：
```rust
for element in &array {
    println!("{}", element);
}
```

## 哈希表（HashMap）

哈希表是一种存储键值对的集合类型，其中每个键都必须是唯一的。在Rust中，哈希表是通过以下语法定义的：
```rust
let mut hashmap = HashMap::new();
hashmap.insert("key1", "value1");
hashmap.insert("key2", "value2");
```

在这个例子中，我们定义了一个包含两个键值对的哈希表。我们可以使用get方法来检索哈希表中的值，例如：
```rust
let value1 = hashmap.get("key1");
let value2 = hashmap.get("key2");
```

我们还可以使用for循环遍历哈希表中的键值对：
```rust
for (key, value) in &hashmap {
    println!("{}: {}", key, value);
}
```

这将输出哈希表中的每个键值对。
哈希表的常用方法

Rust标准库中的哈希表类型提供了许多有用的方法，用于操作哈希表中的键值对。下面是一些常用的方法：

```rust
use std::collections::HashMap;

fn main() {
    let mut hashmap = HashMap::new();
    //    insert方法：将一个键值对添加到哈希表中。
    hashmap.insert("key", "value");
    //    remove方法：从哈希表中移除指定的键值对。
    let removed_value = hashmap.remove("key");
    //    get方法：检索哈希表中指定键的值。
    let value = hashmap.get("key");
    //    contains_key方法：检查哈希表中是否包含指定的键。
    let contains_key = hashmap.contains_key("key");
    //    len方法：返回哈希表中键值对的数量。
    let length = hashmap.len();
    //    is_empty方法：检查哈希表是否为空。
    let is_empty = hashmap.is_empty();
}
```

## B树集合容器 (BTreeSet)

BTreeSet可以存储不重复的元素，并且可以快速地进行插入、删除和查找操作。BTreeSet内部使用B树来存储元素，因此可以支持快速的有序遍历。查询的时间复杂度为 O(log(n))。

BTreeSet中的元素必须实现Ord trait，这是因为BTreeSet需要对元素进行排序。如果要存储自定义类型的元素，也需要为该类型实现Ord trait。

```rust
use std::collections::BTreeSet;

fn main() {
    //    使用new方法来创建一个空的BTreeSet：
    let set: BTreeSet<i32> = BTreeSet::new();
    //    使用from_iter方法从一个可迭代的集合中创建BTreeSet：
    let set: BTreeSet<i32> = vec![1, 2, 3].into_iter().collect();
    //    向BTreeSet中插入元素，可以使用insert方法：
    let mut set = BTreeSet::new();
    set.insert(1);
    set.insert(2);
    set.insert(3);
    
    //    删除元素，可以使用remove方法：
    let mut set = BTreeSet::new();
    set.insert(1);
    set.insert(2);
    set.insert(3);
    set.remove(&2);
    
    //    使用contains方法查找是否存在某个元素：
    let set = vec![1, 2, 3].into_iter().collect::<BTreeSet<i32>>();
    assert!(set.contains(&2));
    
    //    BTreeSet支持快速的有序遍历。可以使用iter方法来获取一个迭代器，然后使用for循环来遍历BTreeSet中的元素：
    let set = vec![1, 2, 3].into_iter().collect::<BTreeSet<i32>>();
    for x in set.iter() {
        println!("{}", x);
    }
}
```

### 扩展阅读 - Ord 特征

在BTreeSet中我们提到了Ord Trait，本小节作为扩展阅读，进一步讲解Ord特征。仅对Rust 集合内容感兴趣的童鞋们，可以忽略本小节。

Ord trait是一种用于比较两个值的trait。它定义了一组方法，这些方法允许我们比较不同类型的值。使用Ord trait，我们可以比较数字、字符串、结构体等各种类型的值。

```rust
pub trait Ord: Eq + PartialOrd<Self> {
    fn cmp(&self, other: &Self) -> Ordering;

    fn max(self, other: Self) -> Self
    where
        Self: Sized,
    { ... }
    fn min(self, other: Self) -> Self
    where
        Self: Sized,
    { ... }
    fn clamp(self, min: Self, max: Self) -> Self
    where
        Self: Sized + PartialOrd<Self>,
    { ... }
}
```

查看Rust的Ord trait源码，它继承了Eq 和 PartialOrd trait。定义了一个方法cmp，它接受一个参数other，该参数是一个与self相同类型的引用。该方法返回一个Ordering类型的值，该值表示self和other之间的大小关系。

Ordering类型是一个枚举类型，定义了三个变量：Less、Equal和Greater。这些变量表示比较两个值时的大小关系。Ordering枚举源码如下：
```rust
pub enum Ordering {
    Less,
    Equal,
    Greater,
}
```

例如，如果我们比较两个整数a和b，并且a小于b，则比较结果为Less；如果a等于b，则比较结果为Equal；如果a大于b，则比较结果为Greater。


下面我进一步通过为类型实现Ord trait来定义该类型的大小关系。例如：
```rust
use std::cmp::Ordering;

#[derive(Debug)]
struct Person {
    name: String,
    age: u8,
}

impl Ord for Person {
    fn cmp(&self, other: &Self) -> Ordering {
        self.age.cmp(&other.age)
    }
}

impl PartialOrd for Person {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Eq for Person {}

impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.age == other.age
    }
}

fn main() {
    let alice = Person { name: String::from("Alice"), age: 30 };
    let bob = Person { name: String::from("Bob"), age: 25 };
    let charlie = Person { name: String::from("Charlie"), age: 30 };
    let people = vec![alice, bob, charlie];
    let mut sorted_people = people.clone();
    sorted_people.sort();
    println!("Sorted people: {:?}", sorted_people);
}
```

在这个例子中，我们定义了一个Person结构体，它有两个字段：name和age。我们为Person结构体实现了Ord trait、PartialOrd trait、Eq trait和PartialEq trait。这些trait定义了Person结构体的大小关系和相等性。
在Ord trait的实现中，我们比较了Person结构体的age字段。如果self.age小于other.age，则返回Ordering::Less；如果self.age等于other.age，则返回Ordering::Equal；如果self.age大于other.age，则返回Ordering::Greater。
在PartialOrd trait的实现中，我们调用了Ord trait的cmp方法，并将其结果包装在Some中返回。PartialOrd trait定义了Ord trait的部分实现，它允许我们比较可能不完全可排序的值。
在Eq trait的实现中，我们比较了Person结构体的age字段。如果self.age等于other.age，则返回true；否则返回false。
在PartialEq trait的实现中，我们调用了Eq trait的eq方法，并将其结果返回。PartialEq trait定义了Eq trait的部分实现，它允许我们比较可能不完全可比较的值。
在main函数中，我们创建了三个Person结构体，并将它们存储在一个Vec中。然后，我们克隆了该Vec并对其进行排序。在排序之后，我们打印了排序后的Vec。

在Rust中，我们还可以使用泛型来实现通用的比较函数。例如：
```rust
use std::cmp::Ordering;

fn max<T: Ord>(a: T, b: T) -> T {
    if a >= b {
        a
    } else {
        b
    }
}

fn main() {
    let a = 1;
    let b = 2;
    let c = max(a, b);
    println!("The maximum value is {}", c);
}
```

在这个例子中，我们传递了两个i32类型的参数a和b给max函数，并将返回值存储在变量c中。然后，我们打印了c的值。

下面是一个使用Ord trait和泛型的示例代码，它比较了两个字符串和两个整数的大小关系：
```rust
use std::cmp::Ord;

fn max<T: Ord>(a: T, b: T) -> T {
    if a >= b {
        a
    } else {
        b
    }
}

fn main() {
    let a = String::from("hello");
    let b = String::from("world");
    let c = max(a.clone(), b.clone());
    println!("The maximum value is {}", c);

    let x = 1;
    let y = 2;
    let z = max(x, y);
    println!("The maximum value is {}", z);
}
```

在这个例子中，我们创建了两个字符串a和b，并比较它们的大小关系。然后，我们创建了两个整数x和y，并比较它们的大小关系。在每个比较中，我们调用了max函数，并将结果打印到控制台。

## 总结

在本教程中，我们主要介绍Rust语言标准库中的集合类型，包括数组、向量、哈希表、B树Set, 并结合代码示例详细深入的探讨了Vec HashMap BTreeSet三个常用集合，最后延申扩展的讲解了Rust的Ord trait。希望本教程能够帮助您更好地掌握Rust语言中的集合类型。

