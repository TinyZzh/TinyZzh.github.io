---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 玩转“策略模式”
date: 2023-03-20 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, 策略模式]
toc: yes
image_scaling: true
mermaid: true
output:
  word_document:
    path: /pandoc_outputs/rust_lang_tutorial_203_file_operation.docx
    highlight: "zenburn"
    pandoc_args: ["--toc", "--toc-depth=2"]
---

![](/images/2023-03/rust_tutorial_logo.png)

策略模式是面向对象编程中的一种设计模式，在该模式中，算法可以被独立于使用它的客户端和变化。该模式通过定义一个算法族，分别封装起来，使得它们之间可以互相替换，此模式让算法的变化独立于使用算法的客户。

在Rust中，策略模式可以用于替代函数指针的使用。在本文中，我们将通过讲解常用用法和示例，进阶用法，最佳实践等几个方面探讨Rust中的策略模式实践。

## 常用用法和示例

在Rust中，我们可以将策略模式应用于以下两种场景：

- 能够在运行时动态地选择实现的功能。
- 通过实现不同的功能来清晰地描述某种实体的不同行为。

接下来，我们分别介绍这两种场景对应的示例。

### 运行时动态选择实现的功能

假设我们正在构建一个程序，该程序可以计算几个数字之间的最大值。然而，我们希望用户能够自由地选择用来计算最大值的算法。我们可以通过策略模式实现这一目标。

首先，我们需要定义一个`MaxStrategy` trait，该trait定义了求最大值的方法：

```rust
trait MaxStrategy {
    /// 求一组数字的最大值
    fn find_max(&self, nums: &[i32]) -> i32;
}
```

然后，我们可以实现几种不同的求最大值的算法，如下所示：

```rust
// 使用快速排序求最大值
struct QuickSortStrategy;
impl MaxStrategy for QuickSortStrategy {
    fn find_max(&self, nums: &[i32]) -> i32 {
        let mut nums = nums.to_vec();
        nums.sort();
        *nums.last().unwrap()
    }
}

// 使用选择排序求最大值
struct SelectionSortStrategy;
impl MaxStrategy for SelectionSortStrategy {
    fn find_max(&self, nums: &[i32]) -> i32 {
        let mut nums = nums.to_vec();
        for i in 0..nums.len() {
            let max_index = (i..nums.len()).max_by_key(|&j| nums[j]).unwrap();
            nums.swap(i, max_index);
        }
        *nums.last().unwrap()
    }
}
```

现在，我们可以编写一个程序，该程序允许用户选择在运行时使用哪种算法来计算最大值。实现如下：

```rust
fn main() {
    // 读取用户输入
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: ./max <strategy>");
        std::process::exit(1);
    }

    // 根据用户输入选择算法
    let strategy: Box<dyn MaxStrategy> = match args[1].as_str() {
        "qs" => Box::new(QuickSortStrategy),
        "ss" => Box::new(SelectionSortStrategy),
        _ => {
            eprintln!("Invalid strategy");
            std::process::exit(1);
        }
    };

    // 读取一组数字，计算最大值
    let nums: Vec<i32> = read_line().split_whitespace().map(|x| x.parse().unwrap()).collect();
    let max = strategy.find_max(&nums);
    println!("Max: {}", max);
}
```

这个程序允许用户在运行时选择最大值的计算方法。用户可以执行以下命令来选择计算方法：

```
./max qs 1 2 3 4 5
```

该命令使用快速排序计算最大值。您也可以将`qs`替换为`ss`来使用选择排序。

### 通过实现不同的功能来清晰地描述实体的不同行为

假设我们正在为一个游戏编写一个AI模块，该模块可以让NPC根据当前情况进行不同的操作。在这个游戏中，有两种可供选择的操作：战斗和逃跑。我们可以通过策略模式实现这个AI。

首先，我们需要定义一个`CombatStrategy` trait和一个`FleeStrategy` trait来描述战斗和逃跑的操作：

```rust
trait CombatStrategy {
    fn execute(&self);
}

trait FleeStrategy {
    fn execute(&self);
}
```

然后，我们可以实现不同的战斗和逃跑策略：

```rust
struct NormalAttackStrategy;
impl CombatStrategy for NormalAttackStrategy {
    fn execute(&self) {
        println!("Performing normal attack");
    }
}

struct HeavyAttackStrategy;
impl CombatStrategy for HeavyAttackStrategy {
    fn execute(&self) {
        println!("Performing heavy attack");
    }
}

struct RunAwayStrategy;
impl FleeStrategy for RunAwayStrategy {
    fn execute(&self) {
        println!("Running away");
    }
}

struct HideStrategy;
impl FleeStrategy for HideStrategy {
    fn execute(&self) {
        println!("Hiding");
    }
}
```

现在，我们可以实现一个`AI`结构体，该结构体包含了一个战斗策略和一个逃跑策略。这个AI结构体可以通过选择战斗和逃跑策略来适应不同的游戏情境：

```rust
struct AI<T: CombatStrategy, U: FleeStrategy> {
    combat_strategy: T,
    flee_strategy: U,
}

impl<T: CombatStrategy, U: FleeStrategy> AI<T, U> {
    fn new(combat_strategy: T, flee_strategy: U) -> Self {
        Self {
            combat_strategy,
            flee_strategy,
        }
    }

    fn attack(&self) {
        self.combat_strategy.execute();
    }

    fn flee(&self) {
        self.flee_strategy.execute();
    }
}
```

现在，我们可以创建不同的AI实例，该实例可以根据当前情况执行不同的操作：

```rust
fn main() {
    // 创建一个能够攻击并逃跑的AI let ai1 = AI::new(NormalAttackStrategy, RunAwayStrategy);
    ai1.attack();
    ai1.flee();

    // 创建一个能够进行重型攻击并隐藏的AI
    let ai2 = AI::new(HeavyAttackStrategy, HideStrategy);
    ai2.attack();
    ai2.flee();
}
```

## 进阶用法

在本节中，我们将介绍一些高级用法，以提高策略模式的可定制性和代码的重用性。

### 使用associated type

在Rust中，我们可以将associated type用于定义策略模式的实现。通过关联类型，我们可以让实现具有更高的灵活性（可以定义impl中的任何类型）。

使用associated type，我们可以将上面的`MaxStrategy` trait改写成如下的形式：

```rust
trait MaxStrategy {
    /// 计算一组数字的最大值
    type Output;
    fn find_max(&self, nums: &[i32]) -> Self::Output;
}
```

我们可以在每个实现中定义Associated Type的类型别名：

```rust
struct QuickSortStrategy;
impl MaxStrategy for QuickSortStrategy {
    type Output = i32;
    fn find_max(&self, nums: &[i32]) -> Self::Output {
        let mut nums = nums.to_vec();
        nums.sort();
        *nums.last().unwrap()
 }
}

struct SelectionSortStrategy;
impl MaxStrategy for SelectionSortStrategy {
    type Output = i32;
    fn find_max(&self, nums: &[i32]) -> Self::Output {
        let mut nums = nums.to_vec();
        for i in 0..nums.len() {
            let max_index = (i..nums.len()).max_by_key(|&j| nums[j]).unwrap();
            nums.swap(i, max_index);
        }
        *nums.last().unwrap()
    }
}
```

### 使用泛型

Rust中的策略模式还可以使用泛型来提高代码的灵活性和可重用性。例如，在上面的战斗和逃跑的示例中，我们可以将`AI`结构体改写成以下的形式：

```rust
struct AI<T> {
    combat_strategy: T,
}

impl<T: CombatStrategy> AI<T> {
    fn new(combat_strategy: T) -> Self {
        Self {
            combat_strategy,
        }
    }

    fn execute_strategy(&self) {
        self.combat_strategy.execute();
    }
}
```

现在，我们只需要一个`CombatStrategy` trait来定义所有的AI操作。这使得对于AI而言，战斗和逃跑等操作可以相互替换。

## 最佳实践

在使用策略模式时，为了实现代码的可维护性和可读性，需要遵循一些最佳实践：

1. 将策略模式的变量作为trait对象使用，而不是作为struct实例使用。
2. 提高使用associated type定义的trait的灵活性。
3. 对于涉及到多个策略的情况，需要使用泛型。
4. 对于每个策略，使用单独的模块定义该策略的实现，以提高代码的可维护性。
5. 尽量避免过度使用策略模式。

## 结论

Rust中的策略模式是一种非常灵活和可定制的设计模式，可以用于在运行时动态地选择实现、或者通过实现不同的功能来清晰地描述某种实体的不同行为。在实现策略模式时，我们可以使用associated type和泛型来增强策略模式的可定制性和代码的重用性。如果你想将这些概念应用于实际项目中，请根据最佳实践编写代码，以提高代码的可读性和可维护性。
