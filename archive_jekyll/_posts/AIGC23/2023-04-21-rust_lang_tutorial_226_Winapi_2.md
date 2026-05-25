---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 零基础入门Win32 API开发(下)
date: 2023-04-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, winapi]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust 语言是一种快速、安全、并发的系统编程语言。它的设计目标是为了提供更好的内存安全和线程安全，同时保持高性能。而 winapi 模块则是 Rust 语言的一个重要组成部分，它提供了与 Windows 操作系统 API 的交互能力。本教程将介绍 winapi 模块的基础用法和进阶用法，以及最佳实践。

上一篇 `Rust语言从入门到精通系列 - 零基础入门Win32 API开发(上)` 介绍了 Win32 API 的一些基础用法，本篇主要介绍一些进阶用法。

## 进阶用法

### 使用 Rust 风格的 COM 组件

```rust
use std::ptr::null_mut;
use winapi::um::combaseapi::{CoInitializeEx, CoCreateInstance, CoUninitialize};
use winapi::um::objbase::COINIT_APARTMENTTHREADED;
use winapi::um::winuser::MessageBoxW;
use winapi::Interface;

#[com_interface("87654321-4321-4321-4321-434343434343")]
trait IMyInterface {
    fn my_method(&self);
}

#[com_class("12345678-1234-1234-1234-123412341234", IMyInterface)]
struct MyClass;

impl IMyInterface for MyClass {
    fn my_method(&self) {
        MessageBoxW(
            null_mut(),
            "My method is called!".to_wide_null().as_ptr(),
            "Success\0".to_wide_null().as_ptr(),
            0,
        );
    }
}

fn main() {
    unsafe {
        CoInitializeEx(null_mut(), COINIT_APARTMENTTHREADED);
        let mut p_my_interface: *mut IMyInterface = null_mut();
        let hr = CoCreateInstance(
            &MyClass::uuidof(),
            null_mut(),
            winapi::um::combaseapi::CLSCTX_INPROC_SERVER,
            &IMyInterface::uuidof(),
            &mut p_my_interface as *mut _ as *mut *mut _,
        );
        if hr == winapi::S_OK {
            (*p_my_interface).my_method();
            (*p_my_interface).release();
        }
        CoUninitialize();
    }
}
```

### 打印屏幕截图

以下代码使用 winapi 模块的函数和结构体，实现在 Windows 操作系统下截取屏幕并打印。

```rust
use winapi::um::winuser::{GetDC, GetSystemMetrics, ReleaseDC, CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, BitBlt, DeleteDC, DeleteObject, SM_CXSCREEN, SM_CYSCREEN, SRCCOPY};
use winapi::um::wingdi::{BITMAPINFO, BITMAPINFOHEADER, BI_RGB, RGBQUAD, GetDIBits, SetDIBitsToDevice};
use winapi::shared::windef::{HDC, HWND, HBITMAP, RECT};
use winapi::shared::minwindef::{DWORD, UINT};
use std::ptr::null_mut;
use std::mem::{size_of, zeroed};

fn main() {
    let mut rect: RECT = unsafe { zeroed() };
    unsafe {
        let hwnd = GetDesktopWindow();
        GetWindowRect(hwnd, &mut rect);
        let hdc_screen = GetDC(null_mut());
        let hdc = CreateCompatibleDC(hdc_screen);
        let hbitmap = CreateCompatibleBitmap(hdc_screen, rect.right, rect.bottom);
        let hbitmap_old = SelectObject(hdc, hbitmap as *mut _);
        BitBlt(hdc, 0, 0, rect.right, rect.bottom, hdc_screen, 0, 0, SRCCOPY);
        SelectObject(hdc, hbitmap_old as *mut _);
        DeleteDC(hdc);
        ReleaseDC(null_mut(), hdc_screen);

        let mut bmi: BITMAPINFO = zeroed();
        bmi.bmiHeader.biSize = size_of::<BITMAPINFOHEADER>() as DWORD;
        bmi.bmiHeader.biWidth = rect.right;
        bmi.bmiHeader.biHeight = -rect.bottom;
        bmi.bmiHeader.biPlanes = 1;
        bmi.bmiHeader.biBitCount = 32;
        bmi.bmiHeader.biCompression = BI_RGB;
        bmi.bmiHeader.biSizeImage = 0;
        bmi.bmiHeader.biXPelsPerMeter = 0;
        bmi.bmiHeader.biYPelsPerMeter = 0;
        bmi.bmiHeader.biClrUsed = 0;
        bmi.bmiHeader.biClrImportant = 0;

        let mut bits = Vec::with_capacity(rect.right as usize * rect.bottom as usize);
        GetDIBits(
            hdc_screen,
            hbitmap,
            0,
            rect.bottom as UINT,
            bits.as_mut_ptr() as *mut _,
            &mut bmi,
            DIB_RGB_COLORS,
        );
        bits.set_len(rect.right as usize * rect.bottom as usize);
        SetDIBitsToDevice(
            hdc_screen,
            0,
            0,
            rect.right,
            rect.bottom,
            0,
            0,
            0,
            rect.bottom,
            bits.as_ptr() as *mut _,
            &bmi,
            DIB_RGB_COLORS,
        );
        DeleteObject(hbitmap as *mut _);
    }
}
```

上述代码使用了许多 winapi 模块中的函数和结构体，包括 GetDC、GetSystemMetrics、ReleaseDC、CreateCompatibleDC、CreateCompatibleBitmap、SelectObject、BitBlt、DeleteDC、DeleteObject、BITMAPINFO、BITMAPINFOHEADER、BI_RGB、RGBQUAD、GetDIBits、SetDIBitsToDevice、GetDesktopWindow、GetWindowRect、SRCCOPY、DIB_RGB_COLORS 等。

### 获取硬件信息

以下代码使用 winapi 模块的函数和结构体，实现在 Windows 操作系统下获取硬件信息。

```rust
use winapi::um::winbase::{GetSystemFirmwareTable, SYSTEM_FIRMWARE_TABLE_PROVIDER_ACPI, SYSTEM_FIRMWARE_TABLE_ACPI, SYSTEM_FIRMWARE_TABLE_ACTION_READ};
use winapi::um::winnt::{HANDLE, PVOID, ULONG};
use std::ptr::null_mut;
use std::mem::size_of;

fn main() {
    let mut buffer_size: ULONG = 0;
    let mut buffer: Vec<u8> = Vec::new();
    unsafe {
        GetSystemFirmwareTable(
            SYSTEM_FIRMWARE_TABLE_PROVIDER_ACPI,
            SYSTEM_FIRMWARE_TABLE_ACPI,
            null_mut(),
            0,
        );
        buffer_size = GetSystemFirmwareTable(
            SYSTEM_FIRMWARE_TABLE_PROVIDER_ACPI,
            SYSTEM_FIRMWARE_TABLE_ACPI,
            null_mut(),
            0,
        );
        buffer = Vec::with_capacity(buffer_size as usize);
        GetSystemFirmwareTable(
            SYSTEM_FIRMWARE_TABLE_PROVIDER_ACPI,
            SYSTEM_FIRMWARE_TABLE_ACPI,
            buffer.as_mut_ptr() as PVOID,
            buffer_size,
        );
        buffer.set_len(buffer_size as usize);
        println!("ACPI table size: {}", buffer_size);
    }
}
```

上述代码使用了 winapi 模块中的函数和结构体，包括 GetSystemFirmwareTable、SYSTEM_FIRMWARE_TABLE_PROVIDER_ACPI、SYSTEM_FIRMWARE_TABLE_ACPI、SYSTEM_FIRMWARE_TABLE_ACTION_READ、HANDLE、PVOID 和 ULONG 等。

### 获取系统信息

以下代码使用 winapi 模块的函数和结构体，实现在 Windows 操作系统下获取系统信息。

```rust
use winapi::um::sysinfoapi::{GetSystemInfo, SYSTEM_INFO};
use std::mem::zeroed;

fn main() {
    let mut system_info: SYSTEM_INFO = unsafe { zeroed() };
    unsafe {
        GetSystemInfo(&mut system_info);
        println!("Number of processors: {}", system_info.dwNumberOfProcessors);
        println!("Page size: {}", system_info.dwPageSize);
        println!("Processor architecture: {}", system_info.wProcessorArchitecture);
    }
}
```

上述代码使用了 winapi 模块中的函数和结构体，包括 GetSystemInfo 和 SYSTEM_INFO 等。

### 获取网络信息

以下代码使用 winapi 模块的函数和结构体，实现在 Windows 操作系统下获取网络信息。

```rust
use winapi::um::iphlpapi::{GetAdaptersInfo, PIP_ADAPTER_INFO};
use std::ptr::null_mut;
use std::mem::size_of;

fn main() {
    let mut adapter_info: PIP_ADAPTER_INFO = null_mut();
    let mut buffer_size: u32 = 0;
    unsafe {
        GetAdaptersInfo(null_mut(), &mut buffer_size);
        adapter_info = std::mem::zeroed();
        GetAdaptersInfo(adapter_info, &mut buffer_size);
        println!("Adapter name: {:?}", std::ffi::CStr::from_ptr((*adapter_info).AdapterName.as_ptr() as *const i8));
    }
}
```

上述代码使用了 winapi 模块中的函数和结构体，包括 GetAdaptersInfo 和 PIP_ADAPTER_INFO 等。

### 使用 Windows API 发送邮件

发送邮件是一种常见的网络操作，可以用于发送电子邮件、短信等。下面是一个使用 winapi 模块发送邮件的示例：

```rust
use winapi::um::mapi::{MAPISendMailW, MapiMessage, MapiFileDesc, MapiRecipDesc, MAPI_LOGON_UI, MAPI_DIALOG};
use std::os::windows::ffi::OsStrExt;
use std::ffi::OsStr;
use std::ptr::null_mut;
use std::mem::MaybeUninit;

fn main() {
    let mut msg: MapiMessage = MaybeUninit::uninit().assume_init();
    msg.lpszSubject = OsStr::new("Test Email").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    msg.lpszNoteText = OsStr::new("This is a test email.").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    msg.nRecipCount = 1;
    let mut recip: MapiRecipDesc = MaybeUninit::uninit().assume_init();
    recip.ulRecipClass = 1;
    recip.lpszName = OsStr::new("John Smith").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    recip.lpszAddress = OsStr::new("john.smith@example.com").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    msg.lpRecips = &mut recip as *mut MapiRecipDesc;
    msg.nFileCount = 1;
    let mut file: MapiFileDesc = MaybeUninit::uninit().assume_init();
    file.nPosition = 0xFFFFFFFF;
    file.lpszPathName = OsStr::new("test.txt").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    file.lpszFileName = OsStr::new("test.txt").encode_wide().chain(Some(0)).collect::<Vec<_>>().as_ptr();
    msg.lpFiles = &mut file as *mut MapiFileDesc;
    unsafe {
        let result = MAPISendMailW(null_mut(), null_mut(), &mut msg as *mut MapiMessage, MAPI_LOGON_UI | MAPI_DIALOG, 0);
        if result != 0 {
            println!("Error: {}", result);
        }
    }
}
```

在这个示例中，我们使用了 mapi 模块中的 MAPISendMailW 函数发送邮件。该函数的参数包括邮件消息、登录标志和对话框标志等。我们创建了一个 MapiMessage 结构体 msg，并设置了邮件主题、正文和收件人等信息。我们还创建了一个 MapiRecipDesc 结构体 recip，并设置了收件人姓名和地址。最后，我们创建了一个 MapiFileDesc 结构体 file，并设置了附件的路径和文件名。

接着，我们将 msg.lpRecips 和 msg.lpFiles 分别设置为&mut recip 和&mut file，以便将收件人和附件信息添加到邮件消息中。最后，我们使用 MAPISendMailW 函数发送邮件，并使用 println!函数打印出错误信息（如果有）。
