---
title: "Rust 2026 经验谈 - const generics 与编译期计算"
published: 2026-06-27
description: "const generics 现状与限制、const fn 能力边界、典型应用、与 C++ constexpr 对比、const generics 发展路线。"
image: "/images/rust-2026/6.jpg"
tags: [Rust, Rust 2026, const generics, const fn, 编译期计算]
category: Rust
draft: false
lang: zh_CN
---

![元编程与宏](/images/rust-2026/6.jpg)

const generics 是 Rust 类型系统的重大扩展——它允许在泛型参数中使用常量值，而非仅类型和生命周期。这让数组泛型化、维度约束、类型级计算成为可能。但 const generics 的能力边界比很多人想象的要窄，`const fn` 也有诸多限制。本文从实战出发，系统梳理 const generics 与编译期计算的现状、限制和典型应用。

## const generics 现状与限制

### 基本语法

```rust
struct Array<T, const N: usize> {
    data: [T; N],
}

let arr: Array<i32, 3> = Array { data: [1, 2, 3] };
let arr2: Array<i32, 5> = Array { data: [1, 2, 3, 4, 5] };
// Array<i32, 3> 和 Array<i32, 5> 是不同类型
```

const泛型参数用 `const NAME: Type` 声明，目前只支持以下类型作为 const 参数：

| 类型 | 支持 | 示例 |
|------|------|------|
| `usize` / `u8` / `u16` / ... | 支持 | `struct Foo<const N: usize>` |
| `isize` / `i8` / `i16` / ... | 支持 | `struct Bar<const N: i32>` |
| `bool` | 支持 | `struct Flag<const B: bool>` |
| `char` | 支持 | `struct Ch<const C: char>` |
| `&str` | 不支持 | 不能用字符串做 const 参数 |
| 浮点数 | 不支持 | 不能用 `f32`/`f64` 做 const 参数 |
| 自定义类型 | 不支持（Nightly 实验中） | `struct Point; const P: Point` |

### 核心限制一：不支持 const fn 作为泛型参数

```rust
// 不可能：用 const fn 做泛型参数
struct Matrix<T, const M: usize, const N: usize, const INIT: fn() -> T>;
// error: `fn() -> T` is not a valid const parameter type

// 变通方案：用策略类型
struct Matrix<T, const M: usize, const N: usize, I: Init<T>> {
    data: [[T; N]; M],
    _init: std::marker::PhantomData<I>,
}

trait Init<T> {
    fn init() -> T;
}

struct ZeroInit;
impl Init<i32> for ZeroInit {
    fn init() -> i32 { 0 }
}

let m: Matrix<i32, 3, 3, ZeroInit> = Matrix::new();
```

### 核心限制二：const 表达式中的泛型参数受限

```rust
struct Foo<T, const N: usize> {
    data: [T; N],
}

// 可以：N 是 const 参数，可以在类型位置使用
impl<T, const N: usize> Foo<T, N> {
    fn len(&self) -> usize { N }
}

// 不可以（稳定版）：在类型位置中使用 const 表达式
// impl<T, const N: usize> Foo<T, N> {
//     fn double_len(&self) -> usize { N * 2 }  // OK：值位置中 N * 2 可以
//     fn split(&self) -> &[T; N / 2] { ... }   // 错误：类型位置中不能用 N / 2
// }

// 变通方案：用另一个 const 参数
impl<T, const N: usize> Foo<T, N> {
    fn as_slice(&self) -> &[T] {
        &self.data
    }
}

// 需要双倍长度时，另定义一个泛型
struct DoubleLen<T, const N: usize, const DOUBLE: usize> {
    data: [T; DOUBLE],
}
// 注意：调用者需确保 DOUBLE == N * 2，编译器不会自动验证
```

### 核心限制三：const 泛型默认值需要花括号包裹表达式

```rust
// 可以：简单默认值
struct Vec2<T, const N: usize = 2> {
    data: [T; N],
}

// 可以：表达式默认值（Rust 1.59+ 支持）
struct Buffer<T, const N: usize = { 1024 * 1024 }> {
    data: [T; N],
}

// 更早版本的变通：用常量定义
// const MB: usize = 1024 * 1024;
// struct Buffer<T, const N: usize = MB> {
//     data: [T; N],
// }
```

## const fn 能力边界

### const fn 的意义

`const fn` 是可以在编译期求值的函数。当它被用于 const 上下文（`const`、`static`、数组长度、const 泛型参数）时，编译器在编译期执行它。

```rust
const fn factorial(n: u64) -> u64 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}

const FACTORIAL_10: u64 = factorial(10);
// FACTORIAL_10 在编译期求值为 3628800

let arr: [u8; factorial(5) as usize] = [0; 120];
// 数组长度可以在编译期计算
```

### const fn 允许的操作（stable 1.96.0）

| 操作 | 支持 | 示例 |
|------|------|------|
| 算术运算 | 支持 | `a + b`, `a * b` |
| 条件分支 | 支持 | `if / else` |
| 循环 | 支持 | `while`, `loop`, `for` |
| 匹配 | 支持 | `match` |
| 函数调用 | 支持（被调函数也必须是 const fn） | `const_fn_a()` |
| 元组构造 | 支持 | `(a, b)` |
| 数组构造 | 支持 | `[a, b, c]` |
| 结构体构造 | 支持（字段类型满足条件） | `Point { x, y }` |
| 枚举构造 | 支持 | `Some(v)` |
| 读取 union 字段 | Nightly | 需要 `#![feature(const_union)]` |
| 堆分配 | 不支持 | `Box::new()` 不在 const fn 中 |
| trait 方法调用 | Nightly | `x.method()` 其中 method 来自 trait |
| 可变引用 | 支持（1.83+） | `&mut x` |

### const fn 不支持的语法

```rust
// 1. 不支持 trait bound 中的 const fn 调用
// const fn max<T: Ord>(a: T, b: T) -> T {
//     if a < b { b } else { a }  // error: trait 方法调用在 const fn 中不支持
// }

// 变通：为具体类型实现
const fn max_u32(a: u32, b: u32) -> u32 {
    if a < b { b } else { a }  // OK：u32 的 < 是内建的
}

// 2. 不支持动态分发
// const fn via_dyn(x: &dyn ToString) -> String { ... }  // 错误

// 3. 不支持 panic（编译期 panic = 编译错误）
const fn div(a: u32, b: u32) -> u32 {
    if b == 0 { panic!("division by zero") }  // 编译期调用时 panic = 编译错误
    a / b
}

const RESULT: u32 = div(10, 0);  // 编译错误：evaluation of `div(10, 0)` failed

// 4. 不支持格式化
// const fn to_string(n: u32) -> String { format!("{}", n) }  // 错误
```

### const fn 的稳定性演进

```rust
// Rust 1.46：const fn 支持 if/else 和 match
// Rust 1.57：const fn 支持循环（while/loop/for）
// Rust 1.61：const fn 支持从引用到引用的类型转换
// Rust 1.65：const fn 支持可变引用
// Rust 1.83：const fn 支持可变引用指向可变数据

// 利用这些特性，可以写更复杂的 const fn
const fn is_prime(n: u64) -> bool {
    if n < 2 { return false; }
    if n < 4 { return true; }
    if n % 2 == 0 { return false; }
    let mut i = 3;
    while i * i <= n {
        if n % i == 0 { return false; }
        i += 2;
    }
    true
}

const CHECK: bool = is_prime(97);  // 编译期验证 97 是质数
const _: () = assert!(CHECK);  // 编译期断言：如果 CHECK 为 false 则编译失败
```

### 踩坑：const fn 的执行时间限制

const fn 在编译期执行有时间限制。如果执行时间过长，编译器会报错：

```rust
const fn slow_compute(n: u64) -> u64 {
    let mut result = 0u64;
    let mut i = 0;
    while i < n {
        result = result.wrapping_add(i);
        i += 1;
    }
    result
}

// const RESULT: u64 = slow_compute(1_000_000_000);
// error: evaluation time limit exceeded
// 变通：分步计算，或减少迭代次数
```

可以通过 `#![feature(const_eval_limit)]` 增大限制（Nightly）。

## 典型应用

### 应用一：数组操作泛型化

这是 const generics 最常见的应用——让函数接受任意长度的数组：

```rust
fn sum<T, const N: usize>(arr: &[T; N]) -> T
where
    T: std::ops::Add<Output = T> + Default + Copy,
{
    let mut total = T::default();
    for &item in arr {
        total = total + item;
    }
    total
}

let arr = [1, 2, 3, 4, 5];
assert_eq!(sum(&arr), 15);

let arr2 = [1.0, 2.0, 3.0];
assert_eq!(sum(&arr2), 6.0);
// 无需为不同长度写不同函数
```

### 应用二：类型级自然数

利用 const generics 实现类型级自然数，可以在类型系统中做算术约束：

```rust
struct Peano<const N: usize>;

trait Nat {
    const VALUE: usize;
}

impl<const N: usize> Nat for Peano<N> {
    const VALUE: usize = N;
}

trait Add<Rhs> {
    type Output;
}

impl<const A: usize, const B: usize> Add<Peano<B>> for Peano<A> {
    type Output = Peano<{ A + B }>;
}

// 编译期验证：1 + 2 = 3
fn _verify_add()
where
    Peano<1>: Add<Peano<2>, Output = Peano<3>>,
{}
```

**踩坑**：类型级计算受 const 表达式限制。`{ A + B }` 在泛型默认值中可能不支持，需要用 where 子句或 const 定义变通。

### 应用三：矩阵维度约束

```rust
struct Matrix<T, const ROWS: usize, const COLS: usize> {
    data: [[T; COLS]; ROWS],
}

impl<T: Default + Copy, const R: usize, const C: usize> Matrix<T, R, C> {
    fn zero() -> Self {
        Matrix { data: [[T::default(); C]; R] }
    }

    fn get(&self, row: usize, col: usize) -> Option<&T> {
        if row < R && col < C {
            Some(&self.data[row][col])
        } else {
            None
        }
    }
}

// 矩阵乘法：A(M×K) × B(K×N) = C(M×N)
impl<T, const M: usize, const K: usize, const N: usize> Matrix<T, M, K>
where
    T: std::ops::Mul<Output = T> + std::ops::Add<Output = T> + Default + Copy,
{
    fn mul(&self, other: &Matrix<T, K, N>) -> Matrix<T, M, N> {
        let mut result = Matrix::<T, M, N>::zero();
        for i in 0..M {
            for j in 0..N {
                let mut sum = T::default();
                for k in 0..K {
                    sum = sum + self.data[i][k] * other.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        result
    }
}

let a: Matrix<i32, 2, 3> = Matrix::zero();
let b: Matrix<i32, 3, 4> = Matrix::zero();
let c = a.mul(&b);  // 类型：Matrix<i32, 2, 4>
// 维度不匹配的乘法直接编译错误！
// let d: Matrix<i32, 2, 2> = Matrix::zero();
// a.mul(&d);  // error: expected `3`, found `2`
```

### 应用四：编译期验证的缓冲区

```rust
struct RingBuffer<T, const CAP: usize> {
    data: [std::mem::MaybeUninit<T>; CAP],
    head: usize,
    tail: usize,
    len: usize,
}

impl<T, const CAP: usize> RingBuffer<T, CAP> {
    fn new() -> Self {
        RingBuffer {
            data: [std::mem::MaybeUninit::uninit(); CAP],
            head: 0,
            tail: 0,
            len: 0,
        }
    }

    fn capacity(&self) -> usize { CAP }

    fn push(&mut self, val: T) -> Result<(), T> {
        if self.len == CAP {
            return Err(val);
        }
        self.data[self.tail].write(val);
        self.tail = (self.tail + 1) % CAP;
        self.len += 1;
        Ok(())
    }

    fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }
        let val = unsafe { self.data[self.head].assume_init_read() };
        self.head = (self.head + 1) % CAP;
        self.len -= 1;
        Some(val)
    }
}

// 编译期确定容量，无堆分配
let mut buf: RingBuffer<u8, 64> = RingBuffer::new();
assert_eq!(buf.capacity(), 64);
```

### 应用五：SIMD 友好的定长类型

```rust
#[repr(C, align(16))]
struct SimdVec<T, const N: usize> {
    data: [T; N],
}

impl SimdVec<f32, 4> {
    fn dot(&self, other: &Self) -> f32 {
        self.data[0] * other.data[0]
            + self.data[1] * other.data[1]
            + self.data[2] * other.data[2]
            + self.data[3] * other.data[3]
    }
}

impl SimdVec<f32, 8> {
    fn dot(&self, other: &Self) -> f32 {
        let mut sum = 0.0;
        for i in 0..8 {
            sum += self.data[i] * other.data[i];
        }
        sum
    }
}
```

## 与 C++ constexpr 对比

| 特性 | Rust const fn | C++ constexpr |
|------|--------------|---------------|
| 首次引入 | Rust 1.31（2018） | C++11 |
| 条件分支 | 支持 | 支持（C++14） |
| 循环 | 支持 | 支持（C++14） |
| 堆分配 | 不支持 | 支持（C++26 `constexpr new`） |
| 虚函数调用 | 不支持 | 不支持 |
| IO 操作 | 不支持 | 不支持 |
| 字符串操作 | 不支持（无 String） | 有限支持（C++20） |
| 容器 | 不支持（无 Vec） | 有限支持（C++20 `constexpr vector`） |
| 编译期执行失败 | 编译错误 | 编译错误 |
| 逐步放宽 | 编译器自动推断 | 需要手动标记 `constexpr` |

### C++ 能做而 Rust 做不到的

```cpp
// C++20：constexpr 中的 vector
constexpr int sum_up_to(int n) {
    std::vector<int> v;
    for (int i = 1; i <= n; ++i) {
        v.push_back(i);
    }
    int sum = 0;
    for (int x : v) sum += x;
    return sum;
}
static_assert(sum_up_to(10) == 55);
```

```rust
// Rust：做不到——const fn 中不能 Vec
// const fn sum_up_to(n: u32) -> u32 {
//     let mut v = Vec::new();  // 错误！
//     ...
// }

// 变通：用固定大小数组或纯数学
const fn sum_up_to(n: u32) -> u32 {
    n * (n + 1) / 2
}
const RESULT: u32 = sum_up_to(10);
```

### Rust 的优势：自动推断

C++ 中，`constexpr` 函数是否在编译期求值取决于调用上下文。Rust 中，`const fn` 在 `const` 上下文中一定在编译期求值，语义更清晰：

```rust
const fn double(n: u32) -> u32 { n * 2 }

const COMPILE_TIME: u32 = double(21);  // 一定编译期求值
let run_time: u32 = double(21);         // 可能运行时求值（但允许编译期优化）
```

## const generics 的发展路线

### 已稳定（stable 1.96.0）

- 基本整数/布尔/字符类型作为 const 参数
- const fn 中的 if/else/while/loop/match
- const 泛型参数的简单默认值
- 单一 crate 中的 const 泛型使用

### Nightly 实验中

```rust
#![feature(generic_const_exprs)]

// 允许 const 表达式作为泛型参数
struct Array<T, const N: usize> {
    data: [T; N],
}

impl<T, const N: usize> Array<T, N> {
    // 错误：泛型表达式 {N * 2} 需要 generic_const_exprs
    // fn double(&self) -> Array<T, {N * 2}> {
    //     ...
    // }
}

// 变通方案：用多个 const 参数
struct DoubleArray<T, const N: usize, const M: usize> {
    data: [T; M],
}

// 使用时手动传入 M = N * 2
let arr: DoubleArray<i32, 3, 6> = DoubleArray { data: [0; 6] };
```

### 未来方向

1. **`adt_const_params`**：允许自定义类型作为 const 参数
   ```rust
   // 未来可能支持
   struct Color;
   struct Pixel<const C: Color>;
   ```

2. **`generic_const_exprs`**：允许 const 表达式作为泛型参数
   ```rust
   // 未来可能支持
   impl<T, const N: usize> Array<T, N> {
       fn split(&self) -> ([T; N / 2], [T; N / 2]) { ... }
   }
   ```

3. **const trait bounds**：允许 `T: const Trait`
   ```rust
   // 未来可能支持
   const fn max<T: const Ord>(a: T, b: T) -> T {
       if a < b { b } else { a }
   }
   ```

4. **堆分配在 const fn 中**：`const fn` 中使用 `Box`/`Vec`
   - 这是最大的开放问题之一
   - 涉及编译期堆分配的语义

### 踩坑：min_const_generics vs generic_const_exprs

Rust 目前稳定的是 `min_const_generics`——最小化 const generics。它有意限制了很多能力：

```rust
// min_const_generics（稳定）：
// - const 参数只能是整数/布尔/字符
// - const 表达式中不能有泛型参数
// - 不能用 {N * 2} 作为类型参数

// generic_const_exprs（Nightly）：
// - 允许 {N * 2}, {N / 2}, {N + M} 等
// - 允许 where 子句中的 const 断言
// - 更强大但也更复杂，暂无稳定时间表
```

**经验**：如果需要 `generic_const_exprs` 的特性，考虑：
1. 用多个 const 参数代替表达式（如 `M` 代替 `N * 2`）
2. 用 `const { assert!(...) }` 做编译期断言（stable，Rust 1.79+）
3. 用宏生成特定值的代码

## 实战经验总结

### 1. 用 const generics 代替硬编码大小

```rust
// 不好：硬编码
fn process_4(data: [u8; 4]) { ... }
fn process_8(data: [u8; 8]) { ... }
fn process_16(data: [u8; 16]) { ... }

// 好：const generics
fn process<const N: usize>(data: [u8; N]) { ... }
```

### 2. const fn 的文档要标注可用的上下文

```rust
/// 计算阶乘。可在编译期求值。
///
/// # 编译期用法
/// ```ignore
/// const FACT_5: u64 = factorial(5);
/// ```
///
/// # 运行时用法
/// ```ignore
/// let fact = factorial(5);
/// ```
pub const fn factorial(n: u64) -> u64 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}
```

### 3. const fn 的测试要覆盖编译期和运行时

```rust
#[test]
fn test_factorial_runtime() {
    assert_eq!(factorial(5), 120);
}

// 编译期测试用 const 断言
const _: () = assert!(factorial(5) == 120);
```

### 4. 避免过度使用 const generics

const generics 会让错误信息更难读：

```rust
fn foo<T, const N: usize, const M: usize>(x: &Matrix<T, N, M>) { ... }

// 错误信息可能包含很长的类型签名
// error: mismatched types
// expected `&Matrix<i32, 3, 4>`
//    found `&Matrix<i32, 4, 3>`
```

如果 N 和 M 的含义不明确，用类型别名：

```rust
type Mat3x4<T> = Matrix<T, 3, 4>;
type Mat4x3<T> = Matrix<T, 4, 3>;
```

### 5. 善用编译期断言

```rust
struct SortedArray<T, const N: usize> {
    data: [T; N],
}

impl<T: Ord + Copy, const N: usize> SortedArray<T, N> {
    fn new(data: [T; N]) -> Self {
        // 运行时验证——因为 const fn 中不能做 sort 验证
        let mut sorted = data;
        sorted.sort();
        SortedArray { data: sorted }
    }
}

// 编译期验证大小至少为 1（需要 Nightly generic_const_exprs）
// 稳定版变通：用 const 断言 + 运行时检查
impl<T, const N: usize> SortedArray<T, N> {
    fn first(&self) -> &T {
        const { assert!(N >= 1, "N must be at least 1"); }
        &self.data[0]
    }
}
```
