---
title: "Rust 2026 经验谈 - 嵌入式 Rust 概览"
published: 2026-07-09
description: "no_std 世界、cortex-m 生态（PAC/SVD/HAL 三层）、embassy 异步框架、defmt 零成本日志、probe-rs 工具链、嵌入式项目模板选型。"
image: "/images/rust-2026/8.jpg"
tags: [Rust, Rust 2026, 嵌入式, no_std, embassy, cortex-m]
category: Rust
draft: false
lang: zh_CN
---

![生态与架构实战](/images/rust-2026/8.jpg)

嵌入式开发是 Rust 最激动人心的前沿阵地之一。从 `no_std` 的裸机启动到 `embassy` 的异步运行时，从 `defmt` 的零成本日志到 `probe-rs` 的现代工具链，嵌入式 Rust 在 2024-2026 年间已经从实验走向生产。本文覆盖 no_std 基础、cortex-m 生态、embassy 异步框架、defmt 日志、probe-rs 工具链、项目模板选型六大主题。

## no_std 世界

### 入口点与最小可运行程序

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    // 嵌入式程序永不返回
    let dp = pac::Peripherals::take().unwrap();
    // 配置硬件...
    loop {
        // 主循环
    }
}

// panic handler：嵌入式没有 std，必须自己提供
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    cortex_m::asm::bkpt(); // 断点
    loop {}
}
```

### alloc crate：堆上的嵌入式

如果需要动态分配，可以启用 `alloc` crate 并提供全局分配器：

```rust
#![no_std]
#![no_main]
extern crate alloc;

use alloc::boxed::Box;
use alloc::vec::Vec;

// bump 分配器：适合嵌入式的简单堆
use bumpalo::Bump;

// 或 linked-list 分配器
use linked_list_allocator::LockedHeap;

#[global_allocator]
static HEAP: LockedHeap = LockedHeap::empty();

fn init_heap() {
    // 从 RAM 中划分堆区域
    unsafe extern "C" {
        static __heap_start: u32;
        static __heap_end: u32;
    }
    unsafe {
        let start = &__heap_start as *const u32 as usize;
        let end = &__heap_end as *const u32 as usize;
        HEAP.lock().init(start as *mut u8, end - start);
    }
}

#[entry]
fn main() -> ! {
    init_heap();

    // 现在可以用 Box 和 Vec 了
    let v: Vec<u32> = alloc::vec![1, 2, 3];
    let b = Box::new(42u32);

    loop {}
}
```

### 踩坑：std 与 no_std 的边界

```rust
// ❌ 在 no_std 中不小心用了 std 特性
#![no_std]

fn bad() {
    // println! 需要 std::io
    // String 需要 alloc
    // Vec::new() 需要 alloc
    // std::thread::spawn 需要 OS
}

// ✓ 条件编译：同时支持 std 和 no_std
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use std::collections::HashMap;

#[cfg(not(feature = "std"))]
use heapless::FnvIndexMap as HashMap; // no_std 的 map

pub fn process() {
    // 根据特性选择不同的实现
}
```

```toml
# Cargo.toml
[features]
default = ["std"]
std = []

[dependencies]
heapless = { version = "0.8", optional = true }
```

### 核心库子集

```
no_std 下可用的：
  core::*          — 所有核心类型
  alloc::*         — 需要 extern crate alloc + 全局分配器
  heapless         — 无堆容器（Vec、String、Map）
  static_cell      — 静态可变引用（安全地获取 &'static mut）

no_std 下不可用的：
  std::io          — 文件系统
  std::net         — 网络
  std::thread      — 线程
  std::time        — 系统时钟（用 embassy 的时钟替代）
  std::sync::Arc   — 引用计数（用 heapless 或 static 替代）
  std::process     — 进程
```

## cortex-m 生态：PAC / SVD / HAL 三层

### 第一层：PAC（Peripheral Access Crate）

PAC 是从 SVD（System View Description）文件自动生成的最底层寄存器访问：

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use stm32f4::pac::GPIOD; // PAC：最小封装

#[entry]
fn main() -> ! {
    let dp = stm32f4::pac::Peripherals::take().unwrap();

    // PAC 层：直接操作寄存器
    // 启用 GPIOD 时钟
    dp.RCC.ahb1enr.write(|w| w.gpioden().set_bit());

    // 设置 PD12 为输出
    dp.GPIOD.moder.write(|w| w.moder12().output());

    // 设置 PD12 高电平
    dp.GPIOD.odr.write(|w| w.odr12().set_bit());

    loop {}
}
```

**PAC 的特点**：类型安全的寄存器访问，但无抽象——每个操作都是"设置这个寄存器的那个位"。

### 第二层：HAL（Hardware Abstraction Layer）

HAL 在 PAC 之上提供面向对象的接口：

```toml
[dependencies]
stm32f4xx-hal = { version = "0.22", features = ["stm32f407"] }
```

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use stm32f4xx_hal::{
    pac,
    prelude::*,
    gpio::{Output, PushPull},
};

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.sysclk(84.MHz()).freeze();

    let gpioa = dp.GPIOA.split();
    let mut led = gpioa.pa5.into_push_pull_output();

    // HAL 层：高级抽象
    led.set_high();
    led.set_low();
    led.toggle();

    loop {}
}
```

### 第三层：SVD → PAC 生成

```bash
# 从 SVD 文件生成 PAC
cargo install svd2rust
svd2rust -i STM32F407.svd --target cortex-m

# 生成代码结构
# src/lib.rs        — PAC 入口
# src/generic.rs    — 通用寄存器抽象
# src/{peripheral}.rs — 各外设
```

### 三层对比

| 维度 | SVD | PAC | HAL |
|------|-----|-----|-----|
| 来源 | 芯片厂商 XML | svd2rust 自动生成 | 人工编写 |
| 抽象级 | 描述文档 | 寄存器级 | 外设级 |
| 类型安全 | 无 | 寄存器位级 | 接口级 |
| 可移植性 | 无 | 芯片特定 | 芯片特定 |
| 学习难度 | — | 高 | 中 |
| 灵活性 | — | 最高 | 受限 |
| 推荐场景 | — | 寄存器级调试 | 日常开发 |

### 踩坑：HAL 的所有权模型

```rust
// ❌ 重复使用已移动的外设
fn bad(gpioa: GPIOA) {
    let led = gpioa.pa5.into_push_pull_output(); // gpioa 被部分移动
    let button = gpioa.pa0.into_floating_input(); // 编译错误！gpioa 已部分移动
}

// ✓ 一次性拆分所有引脚
fn good(gpioa: GPIOA) {
    let gpioa = gpioa.split(); // 拆分成独立引脚
    let led = gpioa.pa5.into_push_pull_output();
    let button = gpioa.pa0.into_floating_input(); // ✓ 各引脚独立
}
```

## embassy 异步框架

`embassy` 是嵌入式 Rust 的异步运行时——它让嵌入式代码像服务器代码一样用 `async/await`，而无需 OS 支持。

### Executor

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_stm32::Config;

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let config = Config::default();
    let p = embassy_stm32::init(config);

    // 启动异步任务
    spawner.spawn(blink_led(p.PA5)).ok();
    spawner.spawn(read_button(p.PC13)).ok();
}

#[embassy_executor::task]
async fn blink_led(pin: embassy_stm32::gpio::AnyPin) {
    use embassy_stm32::gpio::{Level, Output};
    let mut led = Output::new(pin, Level::Low, embassy_stm32::gpio::Speed::Low);

    loop {
        led.set_high();
        embassy_time::Timer::after_millis(500).await;
        led.set_low();
        embassy_time::Timer::after_millis(500).await;
    }
}

#[embassy_executor::task]
async fn read_button(pin: embassy_stm32::gpio::AnyPin) {
    use embassy_stm32::gpio::{Input, Pull};
    let button = Input::new(pin, Pull::Up);

    loop {
        if button.is_low() {
            defmt::info!("Button pressed!");
        }
        embassy_time::Timer::after_millis(10).await;
    }
}
```

### wait：异步等待外设

```rust
use embassy_stm32::usart::{Config, Uart};
use embassy_stm32::mode::Async;

#[embassy_executor::task]
async fn uart_task(
    tx: embassy_stm32::usart::Tx<'static, Async>,
    rx: embassy_stm32::usart::Rx<'static, Async>,
) {
    let config = Config::default();
    let mut uart = Uart::new(peri, rx, tx, irqs, config);

    loop {
        // 异步读取——不阻塞其他任务
        let mut buf = [0u8; 64];
        match uart.read(&mut buf).await {
            Ok(n) => {
                defmt::info!("Received {} bytes", n);
                // Echo back
                uart.write(&buf[..n]).await.ok();
            }
            Err(e) => {
                defmt::error!("UART error: {:?}", e);
            }
        }
    }
}
```

### 中断驱动

```rust
use embassy_stm32::interrupt::InterruptExt;

// embassy 的中断驱动模式：中断唤醒 executor
#[embassy_executor::task]
async fn spi_task(
    spi: embassy_stm32::spi::Spi<'static, Async>,
) {
    let mut spi = spi;

    // SPI 读写自动挂起当前任务，直到中断触发
    let mut buf = [0u8; 32];
    spi.read(&mut buf).await.ok();
    spi.write(&buf).await.ok();
}

// 配置中断
fn setup_interrupts() {
    use embassy_stm32::interrupt::SPI1;
    SPI1::set_priority(embassy_stm32::interrupt::Priority::P3);
}
```

### embassy 的定时器与通道

```rust
use embassy_sync::channel::Channel;
use embassy_time::Timer;

static CHANNEL: Channel<CriticalSectionRawMutex, u32, 1> = Channel::new();

#[embassy_executor::task]
async fn producer() {
    let mut counter = 0u32;
    loop {
        CHANNEL.send(counter).await;
        defmt::info!("Sent: {}", counter);
        counter += 1;
        Timer::after_secs(1).await;
    }
}

#[embassy_executor::task]
async fn consumer() {
    loop {
        let value = CHANNEL.receive().await;
        defmt::info!("Received: {}", value);
    }
}
```

### 踩坑：embassy 的栈大小

```rust
// ❌ 默认栈大小可能不够
#[embassy_executor::task]
async fn complex_task() {
    let big_array = [0u64; 128]; // 1KB 栈空间！
    // ...
}

// ✓ 指定更大的栈大小
#[embassy_executor::task(pool_size = 4, stack_size = 4096)]
async fn complex_task() {
    let big_array = [0u64; 128];
    // ...
}
```

## defmt：零成本日志

`defmt` 使用编译时格式化，将格式字符串存放在 ROM 的专用段中，运行时只传输参数——极大地减少闪存和 RAM 占用：

```toml
[dependencies]
defmt = "0.3"
panic-probe = { version = "0.3", features = ["print-defmt"] }

# 在 Cargo.toml 中设置日志级别
[features]
default = ["defmt-default"]
defmt-default = []
defmt-trace = []
defmt-debug = []
```

### 基本用法

```rust
use defmt::{info, warn, error, trace, debug};

fn process_sensor(value: u16) {
    trace!("Entering process_sensor");  // 零运行时开销（如果编译时过滤掉）

    if value > 1000 {
        warn!("Sensor value high: {}", value); // 只传输 value 的 2 字节
    }

    info!("Sensor reading: {}", value);

    if value == 0 {
        error!("Sensor failure!");
    }
}
```

### defmt 与 tracing 的格式差异

```rust
// defmt 的格式化语法与 std 不同
// ✓ defmt 使用 {=u8}、{=?} 等显式类型标注
defmt::info!("Value: {=u8}, Hex: {=u8:#x}", value, value);

// ✓ 实现 Format trait 自定义格式
use defmt::Format;

#[derive(Format)]
struct SensorData {
    id: u8,
    value: u16,
    timestamp: u32,
}

defmt::info!("Sensor: {:?}", SensorData { id: 1, value: 42, timestamp: 1000 });
```

### defmt 的开销对比

```
传统日志（rtt/semihosting）：
  闪存：格式字符串 + 参数 = 数百字节/条
  RAM：格式化缓冲区
  带宽：完整字符串传输

defmt：
  闪存：参数 = 数字节/条（格式字符串在专用段共享）
  RAM：几乎为零
  带宽：只传输参数值（2-4 字节/条）

典型节省：闪存 50-80%，带宽 90-99%
```

### 踩坑：defmt 与 std 格式不兼容

```rust
// ❌ defmt 宏不支持 std::fmt 语法
defmt::info!("Pi is {:.2}", std::f64::consts::PI); // 编译错误

// ✓ defmt 有自己的格式规范
defmt::info!("Pi is {=f64}", std::f64::consts::PI); // 无精度控制

// ❌ 混用 write! 和 defmt
// ✓ 如果需要兼容两者，用 defmt 底层接口 + 条件编译
#[cfg(feature = "defmt")]
impl defmt::Format for MyType {
    fn format(&self, f: defmt::Formatter) {
        defmt::write!(f, "MyType {{ id: {=u8} }}", self.id);
    }
}
```

## probe-rs 工具链

`probe-rs` 是 Rust 生态的现代烧录和调试工具——替代 OpenOCD + GDB：

```bash
# 安装
cargo install probe-rs-tools

# 列出连接的调试探针
probe-rs list

# 烧录固件
probe-rs run --chip STM32F407VGT6 target/thumbv7em-none-eabihf/release/my-app

# 只烧录不运行
probe-rs flash --chip STM32F407VGT6 target/thumbv7em-none-eabihf/release/my-app

# 附加调试
probe-rs attach --chip STM32F407VGT6 target/thumbv7em-none-eabihf/release/my-app

# 重置芯片
probe-rs reset --chip STM32F407VGT6
```

### cargo-embed：集成的嵌入式运行器

```bash
cargo install cargo-embed
```

```toml
# Embed.toml
[default]
protocol = "Swd"
speed = 12000

[default.flashing]
enabled = true
restore_unwritten_bytes = false
do_chip_erase = false

[default.reset]
enabled = true
halt_afterwards = false

[default.rtt]
enabled = true
channels = [
    { up = 0, name = "defmt", format = "Defmt" },
]
```

```bash
# 一键编译 + 烧录 + 查看 RTT 输出
cargo embed --release
```

### VS Code 集成

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "probe-rs-debug",
            "request": "launch",
            "name": "Debug (probe-rs)",
            "chip": "STM32F407VGT6",
            "flashingConfig": {
                "flashingEnabled": true,
                "resetAfterFlashing": true
            },
            "coreConfigs": [
                {
                    "programBinary": "target/thumbv7em-none-eabihf/debug/my-app"
                }
            ]
        }
    ]
}
```

### 踩坑：探针驱动

```
常见问题：
  1. Windows 上 ST-Link 驱动冲突
     → 安装 Zadig，替换 ST-Link 的 WinUSB 驱动
     → 或用 CMSIS-DAP 探针（免驱动）

  2. Linux 上权限不足
     → 添加 udev 规则：
     sudo cp probe-rs/udev/70-probe-rs.rules /etc/udev/rules.d/
     sudo udevadm control --reload

  3. macOS 上无需额外驱动

  4. 多探针同时连接
     → probe-rs list 查看序列号
     → probe-rs run --probe <serial> --chip ...
```

## 嵌入式项目模板选型

### cortex-m-rtic（传统中断驱动框架）

```toml
[dependencies]
cortex-m-rtic = "1.1"
```

```rust
#![no_std]
#![no_main]

use rtic::app;

#[app(device = stm32f4xx_hal::pac, peripherals = true)]
mod app {
    use stm32f4xx_hal::{
        prelude::*,
        gpio::{Output, PushPull, PA5},
        timer::Timer,
    };

    #[shared]
    struct Shared {
        counter: u32,
    }

    #[local]
    struct Local {
        led: PA5<Output<PushPull>>,
    }

    #[init]
    fn init(cx: init::Context) -> (Shared, Local, init::Monotonics) {
        let dp = cx.device;
        let rcc = dp.RCC.constrain();
        let clocks = rcc.cfgr.sysclk(84.MHz()).freeze();
        let gpioa = dp.GPIOA.split();
        let led = gpioa.pa5.into_push_pull_output();

        // 启动定时器中断
        let mut timer = Timer::new(dp.TIM2, &clocks);
        timer.start(1.Hz());
        timer.listen();

        (Shared { counter: 0 }, Local { led }, init::Monotonics())
    }

    #[task(binds = TIM2, shared = [counter], local = [led])]
    fn timer_tick(cx: timer_tick::Context) {
        cx.shared.counter.lock(|c| *c += 1);
        cx.local.led.toggle();
    }
}
```

### embassy 模板

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_stm32::Config;

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_stm32::init(Config::default());
    spawner.spawn(led_task(p.PA5)).ok();
}

#[embassy_executor::task]
async fn led_task(pin: embassy_stm32::gpio::AnyPin) {
    use embassy_stm32::gpio::{Level, Output};
    let mut led = Output::new(pin, Level::Low, embassy_stm32::gpio::Speed::Low);
    loop {
        led.set_high();
        embassy_time::Timer::after_millis(500).await;
        led.set_low();
        embassy_time::Timer::after_millis(500).await;
    }
}
```

### 选型对比

| 维度 | cortex-m-rtic | embassy |
|------|--------------|---------|
| 编程模型 | 中断驱动 | async/await |
| 学习曲线 | 中（需要理解 RTIC 宏） | 低（与服务器 Rust 类似） |
| 代码风格 | 声明式宏 | 过程式 async |
| 任务通信 | shared/local + lock | Channel + Signal |
| 时序保证 | 静态优先级分析 | 优先级 executor |
| 生态 | 成熟 | 快速成长 |
| HAL 依赖 | 任何 HAL | embassy-stm32 等 |
| 异步支持 | 有限 | 原生 |
| 推荐场景 | 硬实时、已有 RTIC 代码 | 新项目、复杂 I/O |

### 踩坑：嵌入式项目的 .cargo/config.toml

```toml
# .cargo/config.toml
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F407VGT6"

[build]
target = "thumbv7em-none-eabihf"

# 优化配置
[profile.dev]
opt-level = "s"  # 即使 dev 也需要优化（否则太慢/太大）

[profile.release]
opt-level = "s"   # 优化大小（嵌入式闪存有限）
lto = true
codegen-units = 1
debug = 2          # 保留调试信息
strip = false
```
