---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - Rust GUI实践之Rust-Qt模块
date: 2023-04-13 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Rust-Qt]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Rust-Qt 是 Rust 语言的一个 Qt 绑定库，它允许 Rust 开发者使用 Qt 框架来创建跨平台的图形界面应用程序。Qt 是一个跨平台的应用程序框架，它提供了一系列的工具和库，可以帮助开发者创建高质量的应用程序，包括图形界面、网络、数据库等方面。

Rust-Qt 的优势在于 Rust 语言的安全性和高性能，以及 Qt 框架的强大功能和跨平台性。使用 Rust-Qt 可以让开发者更加轻松地创建跨平台的图形界面应用程序。

## 基础用法

### 创建一个简单的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    window.show();
    app.exec();
}
```

这个示例演示了如何使用 Rust-Qt 创建一个简单的窗口，并设置窗口的标题和大小。

### 创建一个带有按钮的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::push_button::PushButton;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut button = PushButton::new(&qt_core::string::String::from("Click me!"));
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    button.move_2a(50, 50);
    button.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个按钮，并设置按钮的文本和位置。

### 创建一个带有标签的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::push_button::PushButton;
use qt_widgets::label::Label;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut button = PushButton::new(&qt_core::string::String::from("Click me!"));
    let mut label = Label::new(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    button.move_2a(50, 50);
    label.move_2a(50, 100);
    button.set_parent(&mut window);
    label.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个标签，并设置标签的文本和位置。

### 创建一个带有文本框的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::push_button::PushButton;
use qt_widgets::line_edit::LineEdit;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut button = PushButton::new(&qt_core::string::String::from("Click me!"));
    let mut line_edit = LineEdit::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    button.move_2a(50, 50);
    line_edit.move_2a(50, 100);
    button.set_parent(&mut window);
    line_edit.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个文本框，并设置文本框的位置。

### 创建一个带有菜单的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::menu::Menu;
use qt_widgets::menu_bar::MenuBar;
use qt_widgets::action::Action;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut menu_bar = MenuBar::new(&mut window);
    let mut file_menu = Menu::new(&qt_core::string::String::from("File"), &mut menu_bar);
    let mut exit_action = Action::new(&qt_core::string::String::from("Exit"), &mut window);
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    file_menu.add_action(&mut exit_action);
    menu_bar.add_menu(&mut file_menu);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个菜单，并设置菜单的选项。

### 创建一个带有复选框的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::check_box::CheckBox;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut check_box = CheckBox::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    check_box.move_2a(50, 50);
    check_box.set_text(&qt_core::string::String::from("Check me!"));
    check_box.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个复选框，并设置复选框的文本和位置。

### 创建一个带有单选框的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::radio_button::RadioButton;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut radio_button = RadioButton::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    radio_button.move_2a(50, 50);
    radio_button.set_text(&qt_core::string::String::from("Select me!"));
    radio_button.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个单选框，并设置单选框的文本和位置。

### 创建一个带有滑块的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::slider::Slider;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut slider = Slider::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    slider.move_2a(50, 50);
    slider.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个滑块，并设置滑块的位置。

## 进阶用法

### 创建一个带有表格的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::table_widget::TableWidget;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut table_widget = TableWidget::new_2a(4, 2, &mut window);
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    table_widget.move_2a(50, 50);
    table_widget.set_item(0, 0, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("Name")));
    table_widget.set_item(0, 1, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("Age")));
    table_widget.set_item(1, 0, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("Tom")));
    table_widget.set_item(1, 1, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("20")));
    table_widget.set_item(2, 0, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("Jerry")));
    table_widget.set_item(2, 1, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("30")));
    table_widget.set_item(3, 0, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("Bob")));
    table_widget.set_item(3, 1, &qt_widgets::table_widget_item::TableWidgetItem::new(&qt_core::string::String::from("25")));
    table_widget.set_parent(&mut window);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个表格，并设置表格的内容。

### 创建一个带有进度条的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::progress_bar::ProgressBar;
use std::thread;
use std::time::Duration;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut progress_bar = ProgressBar::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    progress_bar.move_2a(50, 50);
    progress_bar.set_range(0, 100);
    progress_bar.set_value(0);
    progress_bar.set_parent(&mut window);
    window.show();
    thread::spawn(move || {
        for i in 0..=100 {
            progress_bar.set_value(i);
            thread::sleep(Duration::from_millis(50));
        }
    });
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个进度条，并设置进度条的范围和初始值。

### 创建一个带有标签页的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::tab_widget::TabWidget;
use qt_widgets::widget::WidgetTrait;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut tab_widget = TabWidget::new(&mut window);
    let mut tab1 = Widget::new().into_raw();
    let mut tab2 = Widget::new().into_raw();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    tab_widget.move_2a(50, 50);
    tab_widget.set_parent(&mut window);
    tab_widget.add_tab_2a(tab1, &qt_core::string::String::from("Tab 1"));
    tab_widget.add_tab_2a(tab2, &qt_core::string::String::from("Tab 2"));
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个标签页，并设置标签页的选项。

### 创建一个带有滚动条的窗口

```rust
use qt_widgets::application::Application;
use qt_widgets::widget::Widget;
use qt_widgets::window::Window;
use qt_widgets::scroll_area::ScrollArea;
use qt_widgets::label::Label;
use qt_gui::pixmap::Pixmap;
use qt_gui::image::Image;

fn main() {
    let mut app = Application::new();
    let mut window = Window::new();
    let mut scroll_area = ScrollArea::new(&mut window);
    let mut label = Label::new(&mut scroll_area);
    let mut pixmap = Pixmap::new();
    let mut image = Image::new();
    window.set_title(&qt_core::string::String::from("Hello, Rust-Qt!"));
    window.resize_2a(400, 300);
    pixmap.load_2a(&qt_core::string::String::from("image.jpg"), &qt_core::string::String::from("JPG"));
    image.set_pixmap(&pixmap);
    label.set_pixmap(&pixmap);
    scroll_area.set_widget(&mut label);
    scroll_area.move_2a(50, 50);
    scroll_area.set_widget(&mut label);
    scroll_area.set_widget_resizable(true);
    scroll_area.set_widget(&mut label);
    window.show();
    app.exec();
}
```

这个示例演示了如何在窗口中添加一个滚动条，并设置滚动条的内容。

## 最佳实践

- 尽可能使用 Rust-Qt 提供的 Rust 风格的 API，而不是直接使用 Qt 的 C++ 风格的 API。
- 在创建窗口之前，先创建应用程序对象 `Application`。
- 使用 `set_parent` 方法将控件添加到父控件中。
- 在创建菜单和工具栏时，使用 `Action` 类来创建菜单项和工具栏项。
- 在使用 Qt 的图形界面设计器时，将生成的代码放在单独的模块中，以便进行修改和维护。

## 结论

Rust-Qt 是一个强大的 Rust 语言的 Qt 绑定库，它允许开发者使用 Rust 语言来创建跨平台的图形界面应用程序。本教程提供了 Rust-Qt 的基础用法和进阶用法的示例，以及最佳实践建议，帮助开发者更加轻松地使用 Rust-Qt 创建高质量的应用程序。