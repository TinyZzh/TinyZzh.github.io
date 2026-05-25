---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 智能指针
date: 2023-03-17 03:00:00 +0800
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

在 Rust 中，智能指针是一种数据结构，它类似于常规指针，但是它们具有额外的元数据和功能。智能指针通常用于管理内存，或者在编译时强制执行特定的所有权和借用规则。

与常规指针不同的是，智能指针通常实现了以下功能：

- `所有权管理`：智能指针可以确保只有一个所有者来管理资源。当所有者离开作用域时，这些指针会自动释放资源。
- `借用检查`：智能指针可以确保不会出现数据竞争，因为它们实现了 Rust 的借用规则。

在 Rust 中，有几种不同类型的智能指针，例如 Box、Rc、Arc、RefCell 等等。每种智能指针都有自己的用途和适用场景。


| 智能指针 | 描述 | 应用场景 |
| -------- | ---- | -------- |
| `Box<T>` | 拥有所有权并在堆上分配内存的指针 | 所有权转移和递归数据结构 |
| `Rc<T>` | 引用计数指针，多个所有者共享同一块内存 | 图形界面控件、缓存对象 |
| `Arc<T>` | 原子引用计数指针，多个线程共享同一块内存 | 并发编程、多线程任务 |
| `Cell<T>` | 可变单元，允许在不可变引用中修改值 | 状态机、并发编程 |
| `RefCell<T>` | 可变引用计数指针，允许在运行时进行借用检查 | 树形结构、有状态的解析器 |
| `Mutex<T>` | 互斥锁指针，保证同一时间只有一个线程能访问数据 | 并发编程、多线程任务 |
| `RwLock<T>` | 读写锁指针，多个线程能共享读取数据，但只有一个程能写入数据 | 并发编程、多线程任务 |
| `Ref<T>` | 不可变引用计数指针，允许在运行时进行借用检查 | 树形结构、有状态的解析器 |
| `RefMut<T>` | 可变引用计数指针，允许在运行时进行借用检查 | 树形结构、有状态的解析器 |
| `Pin<Box<T>>` | 固定在内存中的堆分配指针 | 异步编程、防止内存泄漏 |
| `Pin<&mut T>` | 固定在内存中的可变引用指针 | 异步编程、防止内存泄漏 |
| `Pin<&T>` | 固定在内存中的不可变引用指针 | 异步编程、防止内存泄漏 |
| `ManuallyDrop<T>` | 手动控制析构的指针 | 自定义内存管理、与C接口交互 |
| `NonNull<T>` | 非空指针，保证指向的内存不为空 | 与C接口交互、优化内存访问 |
| `PhantomData<T>` | 不占用空间的类型，用于表达泛型参数的不同 | 编译时类型推断、类型安全 |
| `Global<T>` | 全局变量指针，保证只有一个实例存在 | 状态共享、单例模式实现 |

> ps：以上应用场景仅为博主一家之言，仅供参考，实际应用场景可能更加广泛。

## Box

Box 是最简单的智能指针之一，它允许将数据放在堆上而不是栈上。Box 是一个指向堆上分配的值的指针，这使得它成为一种实现递归数据类型和确保不会在函数调用中移动的有效方法。

例如，我们可以使用 Box 来创建 Animal 结构体的实例：

```rust
struct Animal {
    name: String,
    age: u8,
}

fn main() {
    let animal = Box::new(Animal {
        name: String::from("Tom"),
        age: 2,
    });
}
```

在这里，我们使用 Box 来创建一个指向 Animal 结构体实例的指针。由于 Animal 是一个堆分配的数据类型，我们需要使用 Box 来将其放在堆上，以便在离开作用域时自动释放内存。

## Rc

Rc 是一个引用计数智能指针，它允许多个所有者共享相同的数据。当我们需要在多个位置上问同一份数据时，可以使用 Rc 来共享数据，而不需要进行复制。

例如，我们可以创建一个存储 Animal 结构体的 Rc 实例：

```rust
use std::rc::Rc;

struct Animal {
    name: String,
    age: u8,
}

fn main() {
    let animal = Rc::new(Animal {
        name: String::("Tom"),
        age: 2,
    });

    let animal1 = Rc::clone(&animal);
    let animal2 = Rc::clone(&animal);

    println!("Name: {}", animal.name);
    println!("Age: {}", animal.age);
}
```

在这里，我们创建了一个名为 animal 的 Rc 实例，它指向 Animal 结构体的实例。随后，我们使用 Rc::clone() 方法来创建 animal1 和 animal2，这些实例都指向同一份数据。最后，我们打印出 Animal 结构体实例的 name 和 age 字段。

需要注意的是，Rc 实例只能用于单线程环境，因为它**不是线程安全**的。如果需要在多线程环境中使用智能指针，可以使用 Arc。

## Arc

Arc 是一个原子引用计数智能指针，它与 Rc 的工作方式类似，但可以在多线程环境中安全地共享数据。

例如，我们可以创建一个存储 Animal 结构体的 Arc 实例：

```rust
use std::sync::Arc;

struct Animal {
    name: String,
    age: u8,
}

fn main() {
    let animal = Arc::new(Animal {
        name: String::from("Tom"),
        age: 2,
    });

    let animal1 = Arc::clone(&animal);
    let animal2 = Arc::clone(&animal);

    println!("Name: {}", animal.name);
    println!("Age: {}", animal.age);
}
```

在这里，我们创建了一个名为 animal 的 Arc 实例，它指向 Animal 结构体的实例。随后，我们使用 Arc::clone() 方法来创建 animal1 和 animal2，这些实例都指向同一份数据。最后，我们打印出 Animal 结构体实例的 name 和 age 字段。

需要注意的是，Arc 实例的 clone() 方法是原子的，这意味着它可以安全地在多个线程之间使用。这使得 Arc 成为一个非常有用的工具，可以用于在多线程应用程序中共享数据。

## RefCell

RefCell 是一个在运行时而不是编译时执行借用规则的智能指针。它允许创建一个可变和不可变引用的值，这在编译时是不允许的。RefCell 在运行时执行借用规则，这使得它成为一种用于实现内部可变性的有效方法。

例如，我们可以创建一个存储 Animal 结构体的 RefCell 实例：

```rust
use std::cell::RefCell;

struct Animal {
    name: RefCell<String>,
    age: u8,
}

fn main() {
    let animal = Animal {
        name: RefCell::new(String::from("Tom")),
        age: 2,
    };

    let mut name = animal.name.borrow_mut();
    *name = String::from("Jerry");

    println!("Name: {}", animal.name.borrow());
    println!("Age: {}", animal.age);
}
```

在这里，我们创建了一个名为 animal 的 Animal 实例，它包含一个 RefCell 类型的 name 字段。在随后的代码中，我们使用 RefCell 的 borrow_mut() 方法来获取一个可变的引用，然后使用 * 运算符更新 name 字段的值。最后，我们通过调用 borrow() 方法来获取不可变的引用，并打印 Animal 实例的 name 和 age 字段。

需要注意的是，RefCell 实例是在运行时执行借用规则的，这意味着它可能会导致运行时错误，例如死锁或数据竞争。因此，我们应该非常小心地使用RefCell，确保在使用它之前正确地理解所有权和借用规则。

## Cow

Cow（Clone On Write）是一个允许在必要时克隆数据的智能指针。当创建一个 Cow 实例时，它将始终包含一个对数据的引用。如果需要修改数据，Cow 将自动克隆数据，并将修改应用于副本。

例如，我们可以创建一个存储 Animal 结构体的 Cow 实例：

```rust
use std::borrow::Cow;

struct Animal {
    name: Cow<'static, str>,
    age: u8,
}

fn main() {
    let animal = Animal {
        name: Cow::Borrowed("Tom"),
        age: 2,
    };

    let animal1 = Animal {
        name: Cow::Owned(String::from("Jerry")),
        age: 3,
    };

    println!("Name: {}", animal.name);
    println!("Age: {}", animal.age);

    println!("Name: {}", animal1.name);
    println!("Age: {}", animal1.age);
}
```

在这里，我们创建了两个 Animal 实例，一个使用 Borrowed 变体创建 Cow 实例，另一个使用 Owned 变体创建 Cow 实例。在打印 Animal 实例的 name 和 age 字段时，Cow 将自动选择正确的变体，并输出正确的值。

需要注意的是，Cow 实例只能用于实现了 ToOwned trait 的类型。这意味着如果要使用 Cow ，必须确保 Animal 结构体实现了 ToOwned trait。

## Deref

Deref 是一个 trait，它允许我们将一个类型作为另一个类型的引用来使用。这使得我们可以将一个类型转换为另一个类型，而无需进行显式的转换。

例如，我们可以创建一个存储 Animal 结构体的 Box 实例，并使用 Deref trait 将其转换为 Animal 实例的引用：

```rust
struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_box = Box::new(Animal::new(String::from("Tom"), 2));
    let animal_ref: &Animal = animal_box.deref();

    println!("Name: {}", animal_ref.name);
    println!("Age: {}", animal_ref.age);
}
```

在这里，我们创建了一个名为 animal_box 的 Box 实例，它指向 Animal 结构体的实例。随后，我们使用 Deref trait 的 deref() 方法将 animal_box 转换为 Animal 实例的引用 animal_ref。最后，我们打印出 Animal 实例的 name 和 age 字段。

需要注意的是，Deref trait 是 Rust 中的一个非常强大的工具，它可以帮助我们编写更加简洁和易读的代码。但是，在使用 Deref trait 时，我们需要注意避免出现无限递归，因为在实现 Deref trait 时，我们可能会调用自身的 deref() 方法。

## Cell

Cell 是一个用于在不可变值中存储可变值的智能指针。它使用内部可变性的概念，允许我们在不改变不可变值的情况下修改它所包含的可变值。

例如，我们可以创建一个存储 Animal 结构体的 Cell 实例，并在其中存储一个可变的 name 字段：

```rust
use std::cell::Cell;

struct Animal {
    name: Cell<String>,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name: Cell::new(name), age }
    }

    fn set_name(&self, name: String) {
        self.name.set(name);
    }

    fn get_name(&self) -> &str {
        self.name.borrow()
    }
}

fn main() {
    let animal = Animal::new(String::from("Tom"), 2);

    println!("Name: {}", animal.get_name());
    println!("Age: {}", animal.age);

    animal.set_name(String::from("Jerry"));

    println!("Name: {}", animal.get_name());
    println!("Age: {}", animal.age);
}
```

在这里，我们创建了一个名为 animal 的 Animal 实例，它包含一个 Cell 类型的 name 字段。我们使用 Cell 的 set() 方法来修改 name 字段的值，并使用 borrow() 方法获取不可变的引用来访问 name 字段的值。最后，我们打印出 Animal 实例的 name 和 age 字段。

需要注意的是，Cell 实例可以用于实现内部可变性，但是它并不是线程安全的。如果需要在线程之间共享 Cell 实例，我们应该使用更安全的 RefCell 或 Mutex。

## Drop

Drop 是一个 trait，它定义了一个 drop() 方法，当一个值离开作用域时，这个方法将自动被调用。这使得我们可以在值离开作用域时执行一些清理工作，例如释放内存或关闭文件。

例如，我们可以创建一个存储 Animal 结构体的 Box 实例，并在 Animal 结构体的 drop() 方法中打印一条消息：

```rust
struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

impl Drop for Animal {
    fn drop(&mut self) {
        println!("Dropping animal {}", self.name);
    }
}

fn main() {
    let animal_box = Box::new(Animal::new(String::from("Tom"), 2));
}
```

在这里，我们创建了一个名为 animal_box 的 Box 实例，它指向 Animal 结构体的实例。当 animal_box离开作用域时，Box 的 drop() 方法将自动被调用，它又将调用 Animal 结构体的 drop() 方法，打印出一条消息。

需要注意的是，Drop trait 是 Rust 中的一个非常重要的工具，它使得我们可以在值离开作用域时执行一些清理工作。但是，在实现 Drop trait 时，我们需要注意避免出现死锁或内存泄漏等问题。


## 总结

在 Rust 中，智能指针是一种非常有用的工具，可以用于管理内存、实现所有权和借用规则、在多线程环境中共享数据等等。在本教程中，我们介绍了几种不同类型的智能指针，包括 Box、Rc、Arc、RefCell 和 Cow。每种智能指针都有自己的用途和适用场景，我们应该在使用它们时谨慎并确保正确理解所有权和

-------------------------
再深入讲解rust的Deref  Cell和Drop三个智能指针，不少于5000字。使用markdown语法，继续使用Animal为例，提供示例代码

## 总结

在 Rust 中，Deref、Cell 和 Drop 是三种非常有用的智能指针，它们可以帮助我们编写更加简洁和易读的代码，同时也可以实现一些高级的功能，例如在不可变值中存储可变值、在值离开作用域时执行一些清理工作等等。在本教程中，我们介绍了这三种智能指针的原理和用法，并提供了一些示例代码，希望能对您有所帮助。

-------------------------
列举其他更多rust的智能指针，并详细说明
除了 Deref、Cell 和 Drop，Rust 还提供了其他许多有用的智能指针。在本节中，我们将列举一些常见的智能指针，并详细说明它们的原理和用法。

### Rc

Rc 是一个引用计数智能指针，它允许我们在多个地方共享一个值。Rc 的实现基于引用计数，每当一个值被引用一次，它的引用计数就会增加一次。当引用计数减少到 0 时，这个值就会被自动释放。

例如，我们可以创建一个存储 Animal 结构体的 Rc 实例，并在多个地方共享它：

```rust
use std::rc::Rc;

struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_rc = Rc::new(Animal::new(String::from("Tom"), 2));

    let animal_ref1 = Rc::clone(&animal_rc);
    let animal_ref2 = Rc::clone(&animal_rc);

    println!("Name: {}", animal_rc.name);
    println!("Age: {}", animal_rc.age);
}
```

在这里，我们创建了一个名为 animal_rc 的 Rc 实例，它指向 Animal 结构体的实例。随后，我们使用 Rc 的 clone() 方法来创建 animal_ref1 和 animal_ref2 两个新的 Rc 实例，它们都指向 animal_rc 所指向的 Animal 实例。最后，我们打印出 Animal 实例的 name 和 age 字段。

需要注意的是，Rc 实例可以用于在多个地方共享一个值，但是它并不是线程安全的。如果需要在线程之间共享 Rc 实例，我们应该使用更安全的 Arc。

### Arc

Arc 是一个原子引用计数智能指针，它与 Rc 的功能类似，但是支持线程安全。Arc 的实
-------------------------
继续
现基于原子引用计数，因此多个线程可以同时访问一个 Arc 实例，而不需要担心竞争条件的问题。

例如，我们可以创建一个存储 Animal 结构体的 Arc 实例，并在多个线程之间共享它：

```rust
use std::sync::Arc;
use std::thread;

struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_arc = Arc::new(Animal::new(String::from("Tom"), 2));

    let animal_arc1 = Arc::clone(&animal_arc);
    let animal_arc2 = Arc::clone(&animal_arc);

    let handle1 = thread::spawn(move || {
        println!("Name: {}", animal_arc1.name);
        println!("Age: {}", animal_arc1.age);
    });

    let handle2 = thread::spawn(move || {
        println!("Name: {}", animal_arc2.name);
        println!("Age: {}", animal_arc2.age);
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

在这里，我们创建了一个名为 animal_arc 的 Arc 实例，它指向 Animal 结构体的实例。随后，我们使用 Arc 的 clone() 方法来创建 animal_arc1 和 animal_arc2 两个新的 Arc 实例，它们都指向 animal_arc 所指向的 Animal 实例。最后，我们在两个线程中分别访问 Animal 实例的 name 和 age 字段。

需要注意的是，Arc 实例是线程安全的，但是在并发访问时需要注意避免出现竞争条件的问题。

### Mutex

Mutex 是一个互斥锁智能指针，它允许我们在多个线程之间共享一个可变值。Mutex 的实现基于互斥锁，在一个线程获取锁时，其他线程将被阻塞，直到锁被释放为止。

例如，我们可以创建一个存储 Animal 结构体的 Mutex 实例，并在多个线程之间共享它：

```rust
use std::sync::Mutex;
use std::thread;

struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_mutex = Mutex::new(Animal::new(String::from("Tom"), 2));

    let animal_mutex1 = animal_mutex.lock().unwrap();
    let animal_mutex2 = animal_mutex.lock().unwrap();

    let handle1 = thread::spawn(move || {
        let mut animal_ref = animal_mutex1;
        animal_ref.age += 1;
        println!("Age: {}", animal_ref.age);
    });

    let handle2 = thread::spawn(move || {
        let mut animal_ref = animal_mutex2;
        animal_ref.age += 2;
        println!("Age: {}", animal_ref.age);
    });

    handle1.join().unwrap();
    handle2.join().unwrap();

    let animal_ref = animal_mutex.lock().unwrap();
    println!("Age: {}", animal_ref.age);
}
```

在这里，我们创建了一个名为 animal_mutex 的 Mutex 实例，它指向 Animal 结构体的实例。随后，我们使用 Mutex 的 lock() 方法来获取 animal_mutex1 和 animal_mutex2 两个新的 MutexGuard 实例，它们都指向 animal_mutex 所指向的 Animal 实例。在两个线程中，我们分别访问了 Animal 实例的 age 字段，并对其进行了修改。最后，我们再次获取 MutexGuard 实例，并打印出 Animal 实例的 age 字段。

需要注意的是，Mutex 实例是线程安全的，但是在并发访问时需要注意避免出现死锁或竞争条件的问题。

### RwLock

RwLock 是一个读写锁智能指针，它允许多个线程同时读取一个值，但是在写入时会阻塞其他读写操作。RwLock 的实现基于读写锁，在一个线程获取读锁时，其他线程可以继续获取读锁，但是在一个线程获取写锁时，其他线程将被阻塞，直到写锁被释放为止。

例如，我们可以创建一个存储 Animal 结构体的 RwLock 实例，并在多个线程之间共享它：

```rust
use std::sync::RwLock;
use std::thread;

struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_rwlock = RwLock::new(Animal::new(String::from("Tom"), 2));

    let animal_rwlock1 = animal_rwlock.read().unwrap();
    let animal_rwlock2 = animal_rwlock.read().unwrap();

    let handle1 = thread::spawn(move || {
        let animal_ref = animal_rwlock1;
        println!("Age: {}", animal_ref.age);
    });

    let handle2 = thread::spawn(move || {
        let animal_ref = animal_rwlock2;
        println!("Age: {}", animal_ref.age);
    });

    handle1.join().unwrap();
    handle2.join().unwrap();

    let mut animal_ref = animal_rwlock.write().unwrap();
    animal_ref.age += 1;
    println!("Age: {}", animal_ref.age);
}
```

在这里，我们创建了一个名为 animal_rwlock 的 RwLock 实例，它指向 Animal 结构体的实例。随后，我们使用 RwLock 的 read() 方法来获取 animal_rwlock1 和 animal_rwlock2 两个新的 RwLockReadGuard 实例，它们都指向 animal_rwlock 所指向的 Animal 实例。在两个线程中，我们分别访问了 Animal 实例的 age 字段。最后，我们使用 RwLock 的 write() 方法来获取 animal_ref 的写锁，并对 Animal 实例的 age 字段进行了修改。

需要注意的是，RwLock 实例支持多个线程同时读取一个值，但是在写入时需要阻塞其他读写操作。此外，RwLock 实例也需要注意避免出现死锁或竞争条件的问题。

### RefCell

RefCell 是一个引用计数智能指针，它允许我们在运行时动态地检借用规则，从而避免 Rust 编译器的静态借用检查器所限制的限制。RefCell 的实现基于内部可变性，它允许我们在不可变引用之内进行可变引用。

例如，我们可以创建一个存储 Animal 结构体的 RefCell 实例，并在单个线程中多次读取和修改它：

```rust
use std::cell::RefCell;

struct Animal {
    name: String,
    age: u8,
}

impl Animal {
    fn new(name: String, age: u8) -> Self {
        Animal { name, age }
    }
}

fn main() {
    let animal_refcell = RefCell::new(Animal::new(String::from("Tom"), 2));

    let animal_ref1 = animal_refcell.borrow();
    println!("Age: {}", animal_ref1.age);

    let mut animal_ref2 = animal_refcell.borrow_mut();
    animal_ref2.age += 1;
    println!("Age: {}", animal_ref2.age);

    let animal_ref3 = animal_refcell.borrow();
    println!("Age: {}", animal_ref3.age);
}
```

在这里，我们创建了一个名为 animal_refcell 的 RefCell 实例，它指向 Animal 结构体的实例。随后，我们使用 RefCell 的 borrow() 方法来获取 animal_ref1 和 animal_ref3 两个新的 RefCellRef 实例，它们都指向 animal_refcell 所指向的 Animal 实例，并读取其 age 字段。在中间，我们使用 RefCell 的 borrow_mut() 方法来获取 animal_ref2 的可变引用，并对 Animal 实例的 age 字段进行了修改。

需要注意的是，RefCell 实例允许我们在运行时动态地检借用规则，但是需要注意避免出现数据竞争的问题。

## 总结

智能指针是 Rust 中一种强大的工具，它们允许我们在不牺牲 Rust 的内存安全性和所有权模型的前提下，更好地管理内存和并发访问。在 Rust 中，有多种智能指针可用，每种指针都有不同的适用场景和特性。在使用智能指针时，需要根据具体情况选择合适的指针类型，并遵循 Rust 的所有权和借用规则，以保证代码的安全性和正确性。

除了本文中介绍的智能指针之外，Rust 还提供了其他一些智能指针，包括：

- Rc：一种引用计数智能指针，它允许多个所有者共享相同的值，但不允许可变引用。Rc 实例的所有者可以通过 clone() 方法来创建新的所有者，直到所有者数量为 0 时，值才会被释放。
- Arc：一种原子引用计数智能指针，它提供与 Rc 相同的功能，但可以安全地在多个线程之间共享。Arc 实例的所有者可以通过 clone() 方法来创建新的所有者，直到所有者数量为 0 时，值才会被释放。
- Mutex：一种互斥锁智能指针，它提供线程间互斥访问共享的值的机制。Mutex 实例的所有者可以通过 lock() 和 unlock() 方法来获取和释放锁，以保证多个线程之间的互斥访问。
- Barrier：一种屏障智能指针，它提供线程间同步的机制。Barrier 实例的所有者可以通过 wait() 方法来等待所有线程到达屏障点，以保证线程的同步执行。

在使用这些智能指针时，需要了解它们的特点和使用方法，并注意避免出现潜在的安全问题和性能问题。

希望本文能够帮助您更好地理解 Rust 中的智能指针，并为您的 Rust 编程提供参考。如果您有任何问题或建议，欢迎在评论区留言，我将尽力回答并改进文章。