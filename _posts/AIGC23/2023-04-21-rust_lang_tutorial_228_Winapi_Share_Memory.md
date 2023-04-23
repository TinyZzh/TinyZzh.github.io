---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 深入理解进程间共享内存通信
date: 2023-04-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, winapi, IPC]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)


进程间通信（IPC）是操作系统中非常重要的一部分，它使得不同的进程可以在不同的计算机上进行通信。在Windows操作系统中，共享内存是一种常见的IPC机制，它可以在不同的进程之间共享数据，以便它们可以相互通信。在本教程中，我们将使用Rust语言的WinAPI模块来实现共享内存，以便两个进程可以进行通信。

## 共享内存的概念

共享内存是一种IPC机制，它允许不同的进程共享同一块内存区域。这样，一个进程可以将数据写入共享内存区域，而其他进程可以读取这些数据。共享内存通常比其他IPC机制（如管道或消息队列）更快，因为它不涉及操作系统内核的介入。

共享内存通常由以下三个部分组成：

- 内存区域：共享内存的实际数据存储区域。
- 锁：用于控制对共享内存的访问，以确保同一时间只有一个进程可以访问它。
- 信号量：用于通知其他进程共享内存中的数据已被修改。

在Windows操作系统中，共享内存是由内核对象来管理的。这些内核对象包括共享内存段、互斥体和信号量。

## Rust语言的WinAPI模块

Rust语言提供了一个WinAPI模块，它允许我们在Rust中使用Windows API。这个模块提供了许多函数和类型，可以用于创建Windows应用程序和系统级别的程序。

在本教程中，我们将使用WinAPI模块中的函数来创建共享内存段、互斥体和信号量。

## 创建共享内存段

在Windows操作系统中，共享内存段是由内核对象来管理的。我们可以使用WinAPI模块中的函数来创建共享内存段。

以下是创建共享内存段的步骤：

1. 使用`CreateFileMapping()`函数创建一个共享内存段。

```rust
use winapi::um::memoryapi::CreateFileMappingW;

let handle = unsafe {
    CreateFileMappingW(
        INVALID_HANDLE_VALUE,
        ptr::null_mut(),
        PAGE_READWRITE,
        0,
        size,
        name
    )
};
```

在这个函数中，我们传递了以下参数：

- `INVALID_HANDLE_VALUE`：表示使用系统页面文件作为物理存储器。
- `ptr::null_mut()`：表示不使用现有文件作为物理存储器。
- `PAGE_READWRITE`：表示共享内存段可读可写。
- `0`：表示共享内存段的大小。
- `name`：共享内存段的名称。

2. 使用`MapViewOfFile()`函数将共享内存段映射到进程的地址空间中。

```rust
use winapi::um::memoryapi::MapViewOfFile;

let ptr = unsafe {
    MapViewOfFile(
        handle,
        FILE_MAP_ALL_ACCESS,
        0,
        0,
        size
    )
};
```

在这个函数中，我们传递了以下参数：

- `handle`：共享内存段的句柄。
- `FILE_MAP_ALL_ACCESS`：表示进程可以读取和写入共享内存段。
- `0`：表示共享内存段的偏移量。
- `0`：表示共享内存段的起始地址。
- `size`：表示共享内存段的大小。

现在，我们已经创建了一个共享内存段，并将其映射到了进程的地址空间中。

## 创建互斥体

互斥体是一种同步原语，用于控制对共享资源的访问。在Windows操作系统中，互斥体是由内核对象来管理的。我们可以使用WinAPI模块中的函数来创建互斥体。

以下是创建互斥体的步骤：

1. 使用`CreateMutexW()`函数创建一个互斥体。

```rust
use winapi::um::synchapi::CreateMutexW;

let handle = unsafe {
    CreateMutexW(
        ptr::null_mut(),
        FALSE,
        name
    )
};
```

在这个函数中，我们传递了以下参数：

- `ptr::null_mut()`：表示使用默认的安全描述符。
- `FALSE`：表示互斥体未被占用。
- `name`：互斥体的名称。

2. 使用`WaitForSingleObject()`函数等待互斥体。

```rust
use winapi::um::synchapi::WaitForSingleObject;

let result = unsafe {
    WaitForSingleObject(
        handle,
        INFINITE
    )
};
```

在这个函数中，我们传递了以下参数：

- `handle`：互斥体的句柄。
- `INFINITE`：表示无限等待互斥体。

现在，我们已经创建了一个互斥体，并等待了它。

## 创建信号量

信号量是一种同步原语，用于控制对共享资源的访问。在Windows操作系统中，信号量是由内核对象来管理的。我们可以使用WinAPI模块中的函数来创建信号量。

以下是创建信号量的步骤：

1. 使用`CreateSemaphoreW()`函数创建一个信号量。

```rust
use winapi::um::synchapi::CreateSemaphoreW;

let handle = unsafe {
    CreateSemaphoreW(
        ptr::null_mut(),
        initial_count,
        max_count,
        name
    )
};
```

在这个函数中，我们传递了以下参数：

- `ptr::null_mut()`：表示使用默认的安全描述符。
- `initial_count`：表示信号量的初始计数。
- `max_count`：表示信号量的最大计数。
- `name`：信号量的名称。

2. 使用`WaitForSingleObject()`函数等待信号量。

```rust
use winapi::um::synchapi::WaitForSingleObject;

let result = unsafe {
    WaitForSingleObject(
        handle,
        INFINITE
    )
};
```

在这个函数中，我们传递了以下参数：

- `handle`：信号量的句柄。
- `INFINITE`：表示无限等待信号量。

现在，我们已经创建了一个信号量，并等待了它。

## 完整示例代码

下面是一个使用共享内存进行进程间通信的示例代码：

```rust
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::ptr;
use winapi::shared::minwindef::{FALSE, TRUE};
use winapi::um::handleapi::INVALID_HANDLE_VALUE;
use winapi::um::memoryapi::{CreateFileMappingW, MapViewOfFile};
use winapi::um::synchapi::{CreateMutexW, CreateSemaphoreW, ReleaseMutex, ReleaseSemaphore, WaitForSingleObject};
use winapi::um::winnt::{HANDLE, PAGE_READWRITE};

fn main() {
    let name: Vec<u16> = OsStr::new("MySharedMemory").encode_wide().chain(Some(0).into_iter()).collect();
    let size = 1024 * 1024; // 1MB

    // Create shared memory segment
    let handle = unsafe {
        CreateFileMappingW(
            INVALID_HANDLE_VALUE,
            ptr::null_mut(),
            PAGE_READWRITE,
            0,
            size,
            name.as_ptr()
        )
    };
    let ptr = unsafe {
        MapViewOfFile(
            handle,
            FILE_MAP_ALL_ACCESS,
            0,
            0,
            size
        )
    };

    // Create mutex
    let mutex_name: Vec<u16> = OsStr::new("MyMutex").encode_wide().chain(Some(0).into_iter()).collect();
    let mutex_handle = unsafe {
        CreateMutexW(
            ptr::null_mut(),
            FALSE,
            mutex_name.as_ptr()
        )
    };

    // Create semaphore
    let semaphore_name: Vec<u16> = OsStr::new("MySemaphore").encode_wide().chain(Some(0).into_iter()).collect();
    let semaphore_handle = unsafe {
        CreateSemaphoreW(
            ptr::null_mut(),
            0,
            1,
            semaphore_name.as_ptr()
        )
    };

    // Write data to shared memory
    let data = [1, 2, 3, 4, 5];
    unsafe {
        WaitForSingleObject(mutex_handle, INFINITE);
        ptr::copy_nonoverlapping(data.as_ptr() as *const _, ptr as *mut _, data.len());
        ReleaseMutex(mutex_handle);
        ReleaseSemaphore(semaphore_handle, 1, ptr::null_mut());
    }

    // Read data from shared memory
    let mut result = [0; 5];
    unsafe {
        WaitForSingleObject(semaphore_handle, INFINITE);
        ptr::copy_nonoverlapping(ptr as *const _, result.as_mut_ptr() as *mut _, result.len());
    }

    println!("{:?}", result);
}
```

在这个示例代码中，我们创建了一个名为"MySharedMemory"的共享内存段，并将其映射到了进程的地址空间中。我们还创建了一个名为"MyMutex"的互斥体和一个名为"MySemaphore"的信号量。

然后，我们将数据写入共享内存段，并使用互斥体来确保同一时间只有一个进程可以访问共享内存段。我们还使用信号量来通知另一个进程共享内存段中的数据已被修改。

最后，我们从共享内存段中读取数据，并使用信号量来等待另一个进程修改共享内存段中的数据。

## 常见问题及解决方法

在使用共享内存进行进程间通信时，可能会遇到以下常见问题：

 - 内存泄漏

在使用共享内存时，必须确保在不再需要它时释放共享内存。如果没有正确释放共享内存，可能会导致内存泄漏，这会降低系统的性能并可能导致系统崩溃。
使用共享内存时，应该确保在不再需要它时释放共享内存。可以使用`UnmapViewOfFile()`函数释放共享内存段，并使用`CloseHandle()`函数释放互斥体和信号量。

 - 竞争条件

在使用共享内存时，可能会发生竞争条件，这是由于多个进程同时访问共享内存而引起的。如果没有正确处理竞争条件，可能会导致数据损坏或其他问题。
使用互斥体来控制对共享内存的访问，以确保同一时间只有一个进程可以访问共享内存。可以使用信号量来通知其他进程共享内存中的数据已被修改。

 - 数据同步

在使用共享内存时，必须确保多个进程之间的数据同步。如果没有正确处理数据同步，可能会导致数据损坏或其他问题。
使用信号量来通知其他进程共享内存中的数据已被修改。可以使用互斥体来控制对共享内存的访问，以确保同一时间只有一个进程可以访问共享内存。

 - 安全性

在使用共享内存时，必须确保数据的安全性。如果没有正确处理数据的安全性，可能会导致数据泄露或其他安全问题。
使用安全描述符来控制对共享内存的访问。可以使用安全描述符来限制哪些进程可以访问共享内存，并限制它们可以执行的操作。

## 总结

在本教程中，我们使用Rust语言的WinAPI模块来实现共享内存，以便两个进程可以进行通信。我们学习了如何创建共享内存段、互斥体和信号量，并提供了示例代码。我们还总结了共享内存的常见问题以及如何避免和解决这些问题。

共享内存是一种非常有用的IPC机制，它可以在不同的进程之间共享数据。在使用共享内存时，必须确保正确处理内存泄漏、竞争条件、数据同步和安全性等问题。



