---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 开发你的专属输入法
date: 2023-04-21 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, winapi, 键盘]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

在本文中，我们将介绍如何使用 Rust 编程语言和 WinAPI 库来获取鼠标光标的位置并监听键盘事件。我们将在 Windows 操作系统上实现这个功能，并且将使用 Rust 的 winapi 模块来访问 Windows API。

我们将首先介绍如何获取鼠标光标的位置，然后我们将介绍如何监听键盘事件。最后，我们将把这些知识结合起来，实现在光标位置接收用户输入的功能。

## 获取鼠标光标位置

要获取鼠标光标的位置，需要使用 Windows API 函数 GetCursorPos。该函数返回一个 POINT 结构体，其中包含鼠标光标的 x 和 y 坐标。以下是获取鼠标光标位置的示例代码：

```rust
use winapi::um::winuser::GetCursorPos;
use winapi::shared::windef::POINT;

fn main() {
    let mut point = POINT { x: 0, y: 0 };
    unsafe {
        GetCursorPos(&mut point);
    }
    println!("x: {}, y: {}", point.x, point.y);
}
```

在上面的代码中，我们首先导入了 winapi 模块中的 GetCursorPos 函数和 POINT 结构体。然后，我们创建了一个 POINT 结构体实例，并将其传递给 GetCursorPos 函数。最后，我们打印出鼠标光标的 x 和 y 坐标。

## 监听键盘事件

在 Rust 语言中，可以使用 winapi 模块中的 SetWindowsHookEx 函数来监听键盘事件。该函数的定义如下：

```rust
pub fn SetWindowsHookExW(
    idHook: c_int,
    lpfn: Option<unsafe extern "system" fn(c_int, WPARAM, LPARAM) -> LRESULT>,
    hmod: HINSTANCE,
    dwThreadId: DWORD,
) -> HHOOK;
```

该函数的参数 idHook 表示要监听的事件类型，可以使用 WH_KEYBOARD_LL 常量来表示监听键盘事件。lpfn 是一个回调函数，用于处理键盘事件。hmod 表示当前模块的句柄，可以使用 GetModuleHandleW 函数获取。dwThreadId 表示要监听的线程 ID，可以使用 0 表示监听所有线程。

在回调函数中，可以使用 GetAsyncKeyState 函数获取键盘状态。该函数的定义如下：

```rust
pub fn GetAsyncKeyState(vKey: c_int) -> SHORT;
```

该函数的参数 vKey 表示要查询的键盘键码，返回值为 SHORT 类型，表示键盘状态。如果返回值的最高位为 1，表示键盘按键处于按下状态，否则表示键盘按键处于弹起状态。

钩子函数是一个回调函数，用于处理截获的事件。在 Rust 中，我们可以使用 extern "system" 语法来定义钩子函数。这个语法用于指定函数的调用约定，以便它可以与 Windows API 进行交互。我们将在下面的代码中看到它的用法。
使用 winapi::um::winuser 模块中的 SetWindowsHookEx 函数来调用 Windows API。代码如下：

```rust
use winapi::um::winuser::{SetWindowsHookExW, UnhookWindowsHookEx, CallNextHookEx};
use winapi::shared::windef::HHOOK;
use winapi::shared::minwindef::{LPARAM, WPARAM, LRESULT, DWORD};

unsafe extern "system" fn keyboard_proc(nCode: i32, wParam: WPARAM, lParam: LPARAM) -> LRESULT {
    if nCode >= 0 {
        println!("Key pressed: {}", wParam);
    }
    CallNextHookEx(0 as HHOOK, nCode, wParam, lParam)
}

fn main() {
    unsafe {
        let hook = SetWindowsHookExW(
            winapi::um::winuser::WH_KEYBOARD_LL,
            Some(keyboard_proc),
            std::ptr::null_mut(),
            0
        );
        loop {
            let msg = winapi::um::winuser::GetMessageW(std::ptr::null_mut(), 0, 0, 0);
            if msg == 0 {
                break;
            } else {
                winapi::um::winuser::TranslateMessage(&msg);
                winapi::um::winuser::DispatchMessageW(&msg);
            }
        }
        UnhookWindowsHookEx(hook);
    }
}
```

在上面的代码中，我们首先定义了一个钩子函数 keyboard_proc。它接受三个参数：nCode、wParam 和 lParam。nCode 是一个钩子代码，用于指示事件类型。如果 nCode 大于等于 0，则表示该事件是一个键盘输入事件。wParam 是一个 WPARAM 类型的参数，用于指示按下或释放的键的虚拟键码。lParam 是一个 LPARAM 类型的参数，用于指示键盘状态和扫描码。

在钩子函数中，我们首先检查 nCode 是否大于等于 0。如果是，我们打印出按下的键的虚拟键码。然后我们调用 CallNextHookEx 函数，将事件传递给下一个钩子或目标窗口过程。

在 main 函数中，我们首先调用 SetWindowsHookExW 函数，将钩子函数注册到 WH_KEYBOARD_LL 钩子类型上。然后我们进入一个无限循环，等待消息。在每次循环中，我们调用 GetMessageW 函数来获取消息。如果 GetMessageW 函数返回 0，则表示程序应该退出。否则，我们调用 TranslateMessage 函数和 DispatchMessageW 函数，以便将消息传递给窗口过程。最后，我们调用 UnhookWindowsHookEx 函数，将钩子函数从 WH_KEYBOARD_LL 钩子类型上注销。

## 在光标位置接收用户输入

现在我们已经知道如何获取鼠标光标的位置和监听键盘事件。我们可以将这些知识结合起来，实现在光标位置接收用户输入的功能。具体来说，我们将在光标位置创建一个文本框，并在用户输入时将其添加到文本框中。

在 Windows 操作系统中，我们可以使用 CreateWindowEx 函数来创建一个窗口。这个函数的原型如下：

```c
HWND CreateWindowExW(
  DWORD     dwExStyle,
  LPCWSTR   lpClassName,
  LPCWSTR   lpWindowName,
  DWORD     dwStyle,
  int       x,
  int       y,
  int       nWidth,
  int       nHeight,
  HWND      hWndParent,
  HMENU     hMenu,
  HINSTANCE hInstance,
  LPVOID    lpParam
);
```

在 Rust 中，我们可以使用 winapi::um::winuser 模块中的 CreateWindowEx 函数来调用 Windows API。

然后我们可以使用以下代码来创建一个文本框：

```rust
use winapi::um::winuser::{CreateWindowExW, DefWindowProcW, RegisterClassW, WS_EX_CLIENTEDGE, WS_CHILD, WS_VISIBLE, WM_SIZE, WM_DESTROY, WM_SETFOCUS, WM_CHAR, HWND, HMENU, HINSTANCE, WNDCLASSW, MSG};
use winapi::shared::windef::{HWND__, RECT};
use winapi::shared::minwindef::{UINT, WPARAM, LPARAM, LRESULT, DWORD};
use winapi::um::libloaderapi::GetModuleHandleW;
use std::ffi::OsStr;
use std::iter::once;
use std::os::windows::ffi::OsStrExt;

unsafe extern "system" fn wnd_proc(hwnd: HWND, msg: UINT, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    match msg {
        WM_SIZE => {
            let mut rect: RECT = std::mem::zeroed();
            winapi::um::winuser::GetClientRect(hwnd, &mut rect);
            let edit_hwnd = winapi::um::winuser::GetDlgItem(hwnd, 100);
            winapi::um::winuser::SetWindowPos(edit_hwnd, std::ptr::null_mut(), rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top, 0);
        },
        WM_DESTROY => {
            winapi::um::winuser::PostQuitMessage(0);
        },
        WM_SETFOCUS => {
            let edit_hwnd = winapi::um::winuser::GetDlgItem(hwnd, 100);
            winapi::um::winuser::SetFocus(edit_hwnd);
        },
        WM_CHAR => {
            let edit_hwnd = winapi::um::winuser::GetDlgItem(hwnd, 100);
            let mut text: [u16; 2] = [0; 2];
            let len = winapi::um::winuser::GetWindowTextW(edit_hwnd, text.as_mut_ptr(), 2);
            if len == 0 {
                winapi::um::winuser::SetWindowTextW(edit_hwnd, &wparam as *const _ as *const u16);
            } else {
                let mut buffer: Vec<u16> = Vec::with_capacity(len as usize + 1);
                buffer.set_len(len as usize);
                winapi::um::winuser::GetWindowTextW(edit_hwnd, buffer.as_mut_ptr(), len + 1);
                buffer.push(wparam as u16);
                winapi::um::winuser::SetWindowTextW(edit_hwnd, buffer.as_ptr());
            }
        },
        _ => return DefWindowProcW(hwnd, msg, wparam, lparam),
    }
    0
}

fn main() {
    unsafe {
        let hinstance = GetModuleHandleW(std::ptr::null());
        let class_name: Vec<u16> = OsStr::new("my_window_class").encode_wide().chain(once(0)).collect();
        let wndclass = WNDCLASSW {
            style: 0,
            lpfnWndProc: Some(wnd_proc),
            hInstance: hinstance,
            lpszClassName: class_name.as_ptr(),
            cbClsExtra: 0,
            cbWndExtra: 0,
            hIcon: std::ptr::null_mut(),
            hCursor: std::ptr::null_mut(),
            hbrBackground: winapi::um::winuser::COLOR_WINDOW as HINSTANCE,
            lpszMenuName: std::ptr::null_mut(),
        };
        RegisterClassW(&wndclass);
        let hwnd = CreateWindowExW(
            WS_EX_CLIENTEDGE,
            class_name.as_ptr(),
            OsStr::new("My Window").encode_wide().chain(once(0)).collect().as_ptr(),
            WS_CHILD | WS_VISIBLE,
            0,
            0,
            0,
            0,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            hinstance,
            std::ptr::null_mut(),
        );
        let edit_hwnd = CreateWindowExW(
            0,
            OsStr::new("EDIT").encode_wide().chain(once(0)).collect().as_ptr(),
            std::ptr::null_mut(),
            WS_CHILD | WS_VISIBLE | WS_BORDER | WS_VSCROLL | 0x800,
            0,
            0,
            0,
            0,
            hwnd,
            100 as HMENU,
            hinstance,
            std::ptr::null_mut(),
        );
        loop {
            let mut msg: MSG = std::mem::zeroed();
            if winapi::um::winuser::GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
                winapi::um::winuser::TranslateMessage(&msg);
                winapi::um::winuser::DispatchMessageW(&msg);
            } else {
                break;
            }
        }
    }
}
```

在上面的代码中，我们首先定义了一个窗口过程 wnd_proc。它接受四个参数：hwnd、msg、wparam 和 lparam。hwnd 是窗口句柄，msg 是消息类型，wparam 和 lparam 是消息参数。在窗口过程中，我们处理了四个消息：WM_SIZE、WM_DESTROY、WM_SETFOCUS 和 WM_CHAR。

在 WM_SIZE 消息中，我们获取客户区的大小，并将文本框的大小设置为与客户区相同。在 WM_DESTROY 消息中，我们调用 PostQuitMessage 函数，以便在窗口关闭时退出程序。在 WM_SETFOCUS 消息中，我们获取文本框的句柄，并将焦点设置为文本框。在 WM_CHAR 消息中，我们获取文本框的句柄，并将用户输入添加到文本框中。

在 main 函数中，我们首先获取模块句柄。然后我们定义一个 WNDCLASSW 结构体，并将其注册到系统中。这个结构体包含了窗口过程和窗口类名。然后我们调用 CreateWindowExW 函数，创建一个窗口。在这个窗口中，我们创建了一个文本框，并将其添加到窗口中。最后，我们进入一个无限循环，等待消息。在每次循环中，我们调用 GetMessageW 函数来获取消息。如果 GetMessageW 函数返回 0，则表示程序应该退出。否则，我们调用 TranslateMessage 函数和 DispatchMessageW 函数，以便将消息传递给窗口过程。

## 总结

在本文中，我们介绍了如何使用 Rust 编程语言和 WinAPI 库来获取鼠标光标的位置并监听键盘事件。我们首先介绍了如何获取鼠标光标的位置，然后我们介绍了如何监听键盘事件。最后，我们将这些知识结合起来，实现了在光标位置接收用户输入的功能。

这个功能可以用于许多应用程序，例如屏幕取词工具、虚拟键盘等。我们希望这篇文章能够帮助你了解如何在 Rust 中使用 WinAPI 库来实现这些功能。
