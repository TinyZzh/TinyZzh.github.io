---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - 支持WASM的高性能绘图库Plotters
date: 2023-04-23 00:00:00 +0800
categories: [Rust]
tags: [Rust, 从入门到精通, Plotters]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-03/rust_tutorial_logo.png)

Plotters 是一个基于 Rust 语言的绘图库，由 Eonil 和其他贡献者开发。它的目标是提供一个简单易用的 API，可以轻松地创建各种类型的图表，并支持多种输出格式。Plotters 使用 Rust 语言的强类型系统和高性能，可以生成高质量的图表。

Plotters 提供了多种类型的图表，包括线图、柱状图、散点图等等。它还支持多种输出格式，包括 PNG、SVG、PDF 等等。使用 Plotters 可以轻松地创建高质量的图表，同时还可以自定义图表的样式和布局。

## 用法实战

### 安装 Plotters

在使用 Plotters 之前，需要安装 Plotters。可以通过以下命令安装 Plotters：

```bash
cargo install plotters
```

### 绘制折线图

下面是一个简单的例子，演示如何使用 Plotters 绘制折线图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("折线图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    chart.draw_series(LineSeries::new(
        vec![(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9)]
            .iter()
            .map(|x| (*x, *x)),
        &BLUE,
    ))?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`LineSeries`对象绘制了一条折线。`LineSeries`对象需要一个元组列表作为输入，每个元组包含一个 x 坐标和一个 y 坐标。在这个例子中，我们绘制了一条从(0,0)到(9,9)的折线。

### 绘制柱状图

下面是一个简单的例子，演示如何使用 Plotters 绘制柱状图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("柱状图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    chart.draw_series(
        Histogram::vertical(&chart)
            .margin(5)
            .style(GREEN.filled())
            .data(vec![2, 3, 4, 5, 6, 7, 8, 9]),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`Histogram`对象绘制了一组柱状。`Histogram`对象需要一个整数向量作为输入，每个整数表示一个柱状的高度。在这个例子中，我们绘制了一组高度为 2 到 9 的柱状。

### 绘制散点图

下面是一个简单的例子，演示如何使用 Plotters 绘制散点图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("散点图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    chart.draw_series(
        PointSeries::of_element(
            [(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9)],
            5,
            &BLUE,
            &|c, s, st| {
                return EmptyElement::at(c) + Circle::new((0, 0), s, st.filled());
            },
        ),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`PointSeries`对象绘制了一组散点。`PointSeries`对象需要一个元组列表作为输入，每个元组包含一个 x 坐标和一个 y 坐标。在这个例子中，我们绘制了一组从(0,0)到(9,9)的散点。

### 绘制饼图

下面是一个简单的例子，演示如何使用 Plotters 绘制饼图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let data = vec![("A", 10), ("B", 20), ("C", 30), ("D", 40)];

    let sum = data.iter().map(|(_, v)| v).sum::<i32>() as f64;

    let mut chart = ChartBuilder::on(&root)
        .caption("饼图", ("sans-serif", 30))
        .build_ranged(0.0..1.0, 0.0..1.0)?;

    chart.draw_series(
        data.iter()
            .map(|(label, value)| {
                let value = *value as f64 / sum;
                Sector::new(
                    (0.5, 0.5),
                    value,
                    (0.0, 0.0),
                    (HSLColor(0.0, 1.0, 0.5), BLACK),
                )
                .label(label)
                .legend(move |(x, y)| {
                    Rectangle::new([(x - 5, y - 5), (x + 5, y + 5)], HSLColor(0.0, 1.0, 0.5).filled())
                })
            })
            .collect::<Vec<_>>(),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题。最后，我们使用`Sector`对象绘制了一组扇形。`Sector`对象需要一个位置、角度、半径、颜色和标签等参数。在这个例子中，我们绘制了一组占比为 10%、20%、30%和 40%的扇形。

### 绘制等高线图

下面是一个简单的例子，演示如何使用 Plotters 绘制等高线图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("等高线图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let data = (0..=100).map(|i| {
        let x = i as f64 / 10.0;
        let y = i as f64 / 10.0;
        (x, y, (x * x + y * y).sin())
    });

    chart.draw_series(
        ContourSeries::new(
            data,
            (0..=10).map(|i| i as f64),
            (0..=10).map(|i| i as f64),
            &Palette::viridis(),
        )
        .levels(20),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`ContourSeries`对象绘制了一组等高线。`ContourSeries`对象需要一个元组列表作为输入，每个元组包含一个 x 坐标、一个 y 坐标和一个高度。在这个例子中，我们绘制了一个以(0,0)为中心的高斯分布等高线。

### 绘制热力图

下面是一个简单的例子，演示如何使用 Plotters 绘制热力图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("热力图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let data = (0..=100).map(|i| {
        let x = i as f64 / 10.0;
        let y = i as f64 / 10.0;
        (x, y, (x * x + y * y).sin())
    });

    chart.draw_series(
        Heatmap::new(data, &Palette::viridis())
            .x_label("X")
            .y_label("Y"),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`Heatmap`对象绘制了一个热力图。`Heatmap`对象需要一个元组列表作为输入，每个元组包含一个 x 坐标、一个 y 坐标和一个高度。在这个例子中，我们绘制了一个以(0,0)为中心的高斯分布热力图。

### 绘制箱线图

下面是一个简单的例子，演示如何使用 Plotters 绘制箱线图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("箱线图", ("sans-serif", 30))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let data = vec![
        ("A", vec![2, 3, 4, 5, 6, 7, 8, 9]),
        ("B", vec![3, 4, 5, 6, 7, 8, 9, 10]),
        ("C", vec![4, 5, 6, 7, 8, 9, 10, 11]),
        ("D", vec![5, 6, 7, 8, 9, 10, 11, 12]),
    ];

    chart.draw_series(
        data.iter()
            .enumerate()
            .map(|(i, (label, values))| {
                BoxPlot::new_horizontal(
                    values.iter().map(|&v| (v - 2) as f64),
                    i as f64,
                    &BLACK,
                )
                .label(label)
            })
            .collect::<Vec<_>>(),
    )?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题、坐标轴标签和网格线。最后，我们使用`BoxPlot`对象绘制了一组箱线。`BoxPlot`对象需要一个浮点数向量作为输入，每个浮点数表示一个箱线的高度。在这个例子中，我们绘制了一组包含四个箱线的箱线图。

### 绘制极坐标图

下面是一个简单的例子，演示如何使用 Plotters 绘制极坐标图：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("极坐标图", ("sans-serif", 30))
        .build_cartesian_2d(-1.2..1.2, -1.2..1.2)?;

    chart.configure_mesh().draw()?;

    chart.draw_series(LineSeries::new(
        (-100..=100)
            .map(|i| {
                let t = i as f64 / 100.0 * std::f64::consts::PI * 2.0;
                (t.cos(), t.sin())
            })
            .take(101),
        &RED,
    ))?;

    Ok(())
}
```

这个例子中，我们首先创建了一个`BitMapBackend`对象，用于输出 PNG 格式的图片。然后，我们创建了一个`ChartBuilder`对象，用于构建图表。在`ChartBuilder`对象上，我们设置了标题。最后，我们使用`LineSeries`对象绘制了一条极坐标线。`LineSeries`对象需要一个元组列表作为输入，每个元组包含一个角度和一个半径。在这个例子中，我们绘制了一条从 0 度到 360 度的极坐标线。

### 自定义样式

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("plot.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("Custom Style Chart", ("sans-serif", 20))
        .x_label_area_size(30)
        .y_label_area_size(30)
        .build_cartesian_2d(0f32..10f32, 0f32..10f32)?;

    chart.configure_mesh().draw()?;

    chart
        .draw_series(LineSeries::new(
            (0..10).map(|x| (x as f32, (x as f32).powf(2.0))),
            &RED.stroke_width(2),
        ))?
        .label("y=x^2");

    chart
        .draw_series(LineSeries::new(
            (0..10).map(|x| (x as f32, (x as f32).powf(2.0) + 2.0)),
            &BLUE.stroke_width(2),
        ))?
        .label("y=x^2+2");

    chart
        .configure_series_labels()
        .background_style(&WHITE.mix(0.8))
        .border_style(&BLACK)
        .draw()?;

    Ok(())
}
```

这个示例创建了一个自定义样式的图表。我们使用`stroke_width`方法设置了线段的宽度，使用`mix`方法设置了标签的背景色。我们还使用`border_style`方法设置了标签的边框颜色。

### 使用 CSV 文件绘制线图

下面是一个使用 CSV 文件绘制线图的示例代码：

```rust
use plotters::prelude::*;
use std::fs::File;
use std::io::{BufRead, BufReader};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("line_csv.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("Line Chart with CSV", ("sans-serif", 40))
        .set_label_area_size(LabelAreaPosition::Left, 50)
        .set_label_area_size(LabelAreaPosition::Bottom, 50)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let file = File::open("data.csv").unwrap();
    let reader = BufReader::new(file);

    let data: Vec<(i32, i32)> = reader
        .lines()
        .map(|line| {
            let line = line.unwrap();
            let parts: Vec<&str> = line.split(',').collect();
            let x = parts[0].parse::<i32>().unwrap();
            let y = parts[1].parse::<i32>().unwrap();
            (x, y)
        })
        .collect();

    chart.draw_series(LineSeries::new(data, &RED))?;

    Ok(())
}
```

在上述代码中，我们首先创建了一个`BitMapBackend`对象，用于指定输出格式和大小。然后，我们创建了一个`ChartBuilder`对象，用于指定图表的标题和坐标轴等属性。接着，我们读取了一个名为`data.csv`的 CSV 文件，并将其转换为一个包含`(i32, i32)`元组的向量。最后，我们通过`chart.draw_series`方法将线图绘制到图表中。

### 绘制带有标签的散点图

下面是一个绘制带有标签的散点图的示例代码：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("scatter.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("Scatter Chart with Labels", ("sans-serif", 40))
        .set_label_area_size(LabelAreaPosition::Left, 50)
        .set_label_area_size(LabelAreaPosition::Bottom, 50)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let data = [
        ("A", (1, 2)),
        ("B", (2, 3)),
        ("C", (3, 4)),
        ("D", (4, 5)),
        ("E", (5, 6)),
    ];

    chart.draw_series(
        data.iter()
            .map(|(label, (x, y))| {
                Circle::new((*x, *y), 5, BLUE.filled())
                    .label(*label)
                    .legend(*label)
            })
            .collect::<Vec<_>>(),
    )?;

    chart
        .configure_series_labels()
        .background_style(&WHITE.mix(0.8))
        .border_style(&BLACK)
        .draw()?;

    Ok(())
}
```

在上述代码中，我们首先创建了一个`BitMapBackend`对象，用于指定输出格式和大小。然后，我们创建了一个`ChartBuilder`对象，用于指定图表的标题和坐标轴等属性。接着，我们创建了一个包含标签的散点数据，并使用`Circle`对象绘制散点图。最后，我们通过`chart.configure_series_labels`方法绘制标签。

### 绘制堆叠柱状图

下面是一个绘制堆叠柱状图的示例代码：

```rust
use plotters::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = BitMapBackend::new("stacked_bar.png", (640, 480)).into_drawing_area();
    root.fill(&WHITE)?;

    let mut chart = ChartBuilder::on(&root)
        .caption("Stacked Bar Chart", ("sans-serif", 40))
        .set_label_area_size(LabelAreaPosition::Left, 50)
        .set_label_area_size(LabelAreaPosition::Bottom, 50)
        .build_cartesian_2d(0..10, 0..10)?;

    chart.configure_mesh().draw()?;

    let data = vec![
        ("A", vec![2, 3, 1, 4, 2]),
        ("B", vec![1, 4, 3, 2, 1]),
        ("C", vec![3, 2, 4, 1, 3]),
    ];

    chart.draw_series(
        data.iter()
            .enumerate()
            .map(|(i, (label, values))| {
                let color = Palette99::pick(i);
                let values = values.iter().map(|v| *v as i64).collect::<Vec<_>>();
                let sum = values.iter().sum::<i64>();
                let offset = if i == 0 { 0 } else { data[i - 1].1.iter().sum::<i32>() };
                let data = values.iter().enumerate().map(|(j, v)| (j as i32 + offset, *v)).collect::<Vec<_>>();
                BarChart::new(data, 0.5)
                    .style(color.filled())
                    .label(label)
                    .legend(format!("{} ({}%)", label, v as f64 / sum as f64 * 100.0))
            })
            .collect::<Vec<_>>(),
    )?;

    chart
        .configure_series_labels()
        .background_style(&WHITE.mix(0.8))
        .border_style(&BLACK)
        .draw()?;

    Ok(())
}
```

在上述代码中，我们首先创建了一个`BitMapBackend`对象，用于指定输出格式和大小。然后，我们创建了一个`ChartBuilder`对象，用于指定图表的标题和坐标轴等属性。接着，我们创建了一个包含堆叠柱状数据，并使用`BarChart`对象绘制堆叠柱状图。最后，我们通过`chart.configure_series_labels`方法绘制标签。

## 总结

Plotters 是一个强大的绘图库，可以用于创建各种类型的图表。它提供了易于使用的 API，可以轻松地创建高质量的图表，并支持多种输出格式。在使用 Plotters 时，我们可以遵循最佳实践，以提高代码的可读性和可维护性。
