---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 零基础入门Win32 API开发(上)
date: 2023-04-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, winapi]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust语言是一种快速、安全、并发的系统编程语言。它的设计目标是为了提供更好的内存安全和线程安全，同时保持高性能。而winapi模块则是Rust语言的一个重要组成部分，它提供了与Windows操作系统API的交互能力。本教程将介绍winapi模块的基础用法和进阶用法，以及最佳实践。

> 本篇主要介绍Win32 API基础用法，进阶相关的内容在 `Rust语言从入门到精通系列 - 零基础入门Win32 API开发(下)` 

## 基础用法

Cargo.toml文件引入依赖。

```toml
[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3.9", features = ["winuser"] }
```

### 获取系统错误信息

```rust
use winapi::um::errhandlingapi::GetLastError;

fn main() {
    let error_code = unsafe { GetLastError() };
    println!("Error code: {}", error_code);
}
```

### 获取桌面窗口句柄

```rust
use winapi::um::winuser::GetDesktopWindow;
use winapi::um::winuser::HWND;

fn main() {
    let hwnd: HWND = unsafe { GetDesktopWindow() };
    println!("{:?}", hwnd);
}
```

在代码中，使用GetDesktopWindow函数获取桌面窗口句柄。使用unsafe关键字调用该函数，因为该函数是一个裸指针函数，需要手动管理内存安全。

### 创建窗口

```rust
use std::ptr::null_mut;
use winapi::um::winuser::{CreateWindowExW, DefWindowProcW, RegisterClassW, CW_USEDEFAULT, MSG, WM_DESTROY, WNDCLASSW};

fn main() {
    let class_name = "MyWindowClass".to_wide_null();
    let window_name = "My Window".to_wide_null();
    let h_instance = unsafe { winapi::um::libloaderapi::GetModuleHandleW(null_mut()) };
    let wnd_class = WNDCLASSW {
        style: 0,
        lpfnWndProc: Some(DefWindowProcW),
        hInstance: h_instance,
        lpszClassName: class_name.as_ptr(),
        cbClsExtra: 0,
        cbWndExtra: 0,
        hIcon: null_mut(),
        hCursor: null_mut(),
        hbrBackground: null_mut(),
        lpszMenuName: null_mut(),
    };
    let class_atom = unsafe { RegisterClassW(&wnd_class) };
    let hwnd = unsafe {
        CreateWindowExW(
            0,
            class_atom as *const _,
            window_name.as_ptr(),
            0,
            CW_USEDEFAULT,
            CW_USEDEFAULT,
            CW_USEDEFAULT,
            CW_USEDEFAULT,
            null_mut(),
            null_mut(),
            h_instance,
            null_mut(),
        )
    };
    let mut msg = MSG::default();
    loop {
        let ret = unsafe { winapi::um::winuser::GetMessageW(&mut msg, null_mut(), 0, 0) };
        if ret > 0 {
            unsafe {
                winapi::um::winuser::TranslateMessage(&msg);
                winapi::um::winuser::DispatchMessageW(&msg);
            }
        } else {
            break;
        }
    }
}
```

### 打开文件对话框

```rust
use std::ptr::null_mut;
use winapi::um::commdlg::{GetOpenFileNameW, OPENFILENAMEW};
use winapi::um::winuser::HWND;

fn main() {
    let mut ofn = OPENFILENAMEW {
        lStructSize: std::mem::size_of::<OPENFILENAMEW>() as u32,
        hwndOwner: HWND(null_mut()),
        lpstrFilter: "Text Files\0*.txt\0All Files\0*.*\0\0".to_wide_null().as_ptr(),
        lpstrFile: [0; 260].as_mut_ptr(),
        nMaxFile: 260,
        Flags: 0,
        lpstrDefExt: "txt\0".to_wide_null().as_ptr(),
        ..Default::default()
    };
    let ret = unsafe { GetOpenFileNameW(&mut ofn) };
    if ret != 0 {
        let file_name = ofn.lpstrFile.to_string_lossy();
        println!("Selected file: {}", file_name);
    }
}
```

### 读取注册表

```rust
use std::ptr::null_mut;
use winapi::um::winreg::{RegCloseKey, RegOpenKeyExW, HKEY_LOCAL_MACHINE, KEY_READ, LPDWORD, REG_SZ};
use widestring::U16CString;

fn main() {
    let sub_key = "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion".to_wide_null();
    let mut h_key = null_mut();
    let ret = unsafe { RegOpenKeyExW(HKEY_LOCAL_MACHINE, sub_key.as_ptr(), 0, KEY_READ, &mut h_key) };
    if ret == 0 {
        let mut buffer = [0u16; 1024];
        let mut buffer_size = (buffer.len() * 2) as u32;
        let mut value_type = REG_SZ;
        let ret = unsafe {
            winapi::um::winreg::RegQueryValueExW(
                h_key,
                "ProductName".to_wide_null().as_ptr(),
                null_mut(),
                &mut value_type,
                buffer.as_mut_ptr() as *mut _,
                &mut buffer_size,
            )
        };
        if ret == 0 {
            let value = U16CString::from_vec_with_nul(&buffer[..(buffer_size as usize)]).unwrap();
            println!("Product name: {}", value.to_string_lossy());
        }
        unsafe { RegCloseKey(h_key) };
    }
}
```

### 注册热键

```rust
use winapi::um::winuser::{RegisterHotKey, UnregisterHotKey};
use winapi::um::winuser::{HWND, WM_HOTKEY};

fn main() {
    let hwnd: HWND = std::ptr::null_mut();
    let id: i32 = 1;
    let modifiers: u32 = 0x0002; // MOD_CONTROL
    let vk: u32 = 0x43; // 'C'
    let result: i32 = unsafe { RegisterHotKey(hwnd, id, modifiers, vk) };
    if result == 0 {
        println!("Failed to register hotkey.");
        return;
    }
    loop {
        let mut msg = std::mem::zeroed();
        let result = unsafe { winapi::um::winuser::GetMessageW(&mut msg, hwnd, 0, 0) };
        if result == -1 {
            println!("Failed to get message.");
            break;
        }
        if msg.message == WM_HOTKEY {
            println!("Hotkey pressed.");
            break;
        }
        unsafe { winapi::um::winuser::TranslateMessage(&msg) };
        unsafe { winapi::um::winuser::DispatchMessageW(&msg) };
    }
    unsafe { UnregisterHotKey(hwnd, id) };
}
```

在代码中，使用RegisterHotKey函数注册一个热键，当用户按下Ctrl+C时，会收到WM_HOTKEY消息。使用GetMessageW函数获取消息，使用TranslateMessage函数翻译消息，使用DispatchMessageW函数分发消息。使用UnregisterHotKey函数注销热键。

### 创建进程

在Windows系统中，可以使用CreateProcess函数创建一个进程。使用winapi模块可以方便地调用CreateProcess函数。

```rust
use winapi::um::processthreadsapi::CreateProcessA;
use winapi::um::winbase::CREATE_NEW_CONSOLE;
use winapi::um::winnt::{PROCESS_INFORMATION, STARTUPINFOA};
use std::ffi::CString;
use std::mem::{size_of, zeroed};
use std::ptr::null_mut;

fn main() {
    let command_line = CString::new("notepad.exe").unwrap();
    let mut startup_info: STARTUPINFOA = unsafe { zeroed() };
    startup_info.cb = size_of::<STARTUPINFOA>() as u32;
    let mut process_info: PROCESS_INFORMATION = unsafe { zeroed() };
    let result = unsafe {
        CreateProcessA(
            null_mut(),
            command_line.as_ptr() as *mut _,
            null_mut(),
            null_mut(),
            0,
            CREATE_NEW_CONSOLE,
            null_mut(),
            null_mut(),
            &mut startup_info,
            &mut process_info,
        )
    };
    if result == 0 {
        println!("Failed to create process");
    } else {
        println!("Process created successfully");
    }
}
```

上述代码中，首先使用CString将字符串转换为C类型的字符串，然后使用CreateProcessA函数创建进程。CreateProcessA函数的第一个参数是可执行文件的路径，第二个参数是命令行参数，第三个参数是进程的安全属性，第四个参数是主线程的安全属性，第五个参数是是否继承句柄，第六个参数是创建进程的标志，第七个参数是环境变量，第八个参数是当前目录，第九个参数是启动信息，第十个参数是进程信息。在这个示例中，使用了null_mut()表示不设置进程和主线程的安全属性，使用了CREATE_NEW_CONSOLE表示创建一个新的控制台窗口。如果CreateProcessA函数返回0，则说明创建进程失败。否则，创建进程成功。


### 创建线程

```rust
use std::ptr::null_mut;
use std::thread;
use winapi::um::processthreadsapi::{CreateThread, GetCurrentThreadId, GetExitCodeThread, TerminateThread};
use winapi::um::synchapi::WaitForSingleObject;
use winapi::um::winbase::{INFINITE, WAIT_OBJECT_0};

fn thread_proc() -> u32 {
    println!("Thread ID: {}", unsafe { GetCurrentThreadId() });
    0
}

fn main() {
    let handle = unsafe { CreateThread(null_mut(), 0, Some(thread_proc), null_mut(), 0, null_mut()) };
    let ret = unsafe { WaitForSingleObject(handle, INFINITE) };
    if ret == WAIT_OBJECT_0 {
        let mut exit_code = 0;
        unsafe { GetExitCodeThread(handle, &mut exit_code) };
        println!("Exit code: {}", exit_code);
    }
    unsafe { TerminateThread(handle, 0) };
}
```

### 创建共享内存

```rust
use std::ptr::null_mut;
use winapi::um::handleapi::{CloseHandle, INVALID_HANDLE_VALUE};
use winapi::um::memoryapi::{MapViewOfFile, UnmapViewOfFile, CreateFileMappingW, FILE_MAP_ALL_ACCESS};
use winapi::um::winnt::{HANDLE, PAGE_READWRITE, SECTION_ALL_ACCESS};

fn main() {
    let file_name = "Global\\MySharedMemory".to_wide_null();
    let file_size = 4096;
    let h_file_mapping = unsafe {
        CreateFileMappingW(
            INVALID_HANDLE_VALUE,
            null_mut(),
            PAGE_READWRITE,
            0,
            file_size,
            file_name.as_ptr(),
        )
    };
    let mut p_shared_memory = null_mut();
    if !h_file_mapping.is_null() {
        p_shared_memory = unsafe {
            MapViewOfFile(
                h_file_mapping,
                FILE_MAP_ALL_ACCESS,
                0,
                0,
                file_size,
            )
        };
    }
    if !p_shared_memory.is_null() {
        let p_data = p_shared_memory as *mut u8;
        for i in 0..file_size {
            unsafe { *p_data.offset(i as isize) = i as u8 };
        }
        unsafe { UnmapViewOfFile(p_shared_memory) };
    }
    if !h_file_mapping.is_null() {
        unsafe { CloseHandle(h_file_mapping) };
    }
}
```

### 获取系统时间

获取系统时间是一个常见的操作，可以用于记录日志或计算时间差等。下面是一个使用winapi模块获取系统时间的示例：

```rust
use winapi::um::sysinfoapi::GetSystemTime;
use winapi::um::winbase::SYSTEMTIME;

fn main() {
    unsafe {
        let mut st: SYSTEMTIME = std::mem::zeroed();
        GetSystemTime(&mut st as *mut SYSTEMTIME);
        println!("{}-{}-{} {}:{}:{}", st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond);
    }
}
```

在这个示例中，我们使用了sysinfoapi模块中的GetSystemTime函数来获取系统时间。该函数的参数为一个SYSTEMTIME结构体指针，用于存储系统时间。我们使用std::mem::zeroed()创建了一个空的SYSTEMTIME结构体，然后将其地址传递给GetSystemTime函数。最后，我们将获取到的系统时间打印出来。

### 使用COM组件

```rust
use std::ptr::null_mut;
use winapi::um::combaseapi::{CoInitializeEx, CoCreateInstance, CoUninitialize};
use winapi::um::objbase::COINIT_APARTMENTTHREADED;
use winapi::um::objidl::ISequentialStream;
use winapi::um::unknwnbase::IUnknown;
use winapi::um::winnt::{HRESULT, S_OK};
use winapi::um::winuser::MessageBoxW;
use winapi::Interface;

const CLSID_XMLHTTPREQUEST: winapi::CLSID = winapi::CLSID {
    Data1: 0xED8C108E,
    Data2: 0x4349,
    Data3: 0x11D2,
    Data4: [0x91, 0xA4, 0x00, 0xC0, 0x4F, 0x79, 0xF8, 0x06],
};

const IID_IUNKNOWN: winapi::IID = winapi::IID {
    Data1: 0x00000000,
    Data2: 0x0000,
    Data3: 0x0000,
    Data4: [0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46],
};

fn main() {
    unsafe {
        CoInitializeEx(null_mut(), COINIT_APARTMENTTHREADED);
        let mut p_xml_http_request: *mut IUnknown = null_mut();
        let hr = CoCreateInstance(
            &CLSID_XMLHTTPREQUEST,
            null_mut(),
            winapi::um::combaseapi::CLSCTX_INPROC_SERVER,
            &IID_IUNKNOWN,
            &mut p_xml_http_request as *mut _ as *mut *mut _,
        );
        if hr == S_OK {
            let mut p_stream: *mut ISequentialStream = null_mut();
            let hr = (*p_xml_http_request).QueryInterface(
                &ISequentialStream::uuidof(),
                &mut p_stream as *mut _ as *mut *mut _,
            );
            if hr == S_OK {
                let message = "Hello, world!".to_wide_null();
                let mut bytes_written = 0;
                let hr = (*p_stream).Write(
                    message.as_ptr() as *const _,
                    (message.len() * 2) as u32,
                    &mut bytes_written as *mut _,
                );
                if hr == S_OK {
                    MessageBoxW(
                        null_mut(),
                        "Data written successfully!".to_wide_null().as_ptr(),
                        "Success\0".to_wide_null().as_ptr(),
                        0,
                    );
                }
            }
            (*p_stream).Release();
        }
        (*p_xml_http_request).Release();
        CoUninitialize();
    }
}
```

## 结论

本教程介绍了winapi模块的基础用法和进阶用法，并提供了示例代码。在使用winapi模块时，需要注意数据类型、结构体、常量和指针类型的正确使用。通过使用winapi模块，Rust程序可以访问Windows操作系统的核心功能，实现更加丰富的功能。
