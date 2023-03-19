---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: Rust语言从入门到精通系列 - A*寻路算法
date: 2023-03-18 03:00:00 +0800
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
A*算法是一种启发式搜索算法，常用于寻路问题。它的基本思路是从起点开始，每次选择一个最优的节点进行扩展，直到找到终点或者无法继续扩展。A*算法的优点是可以通过启发式函数来指导搜索方向，从而提高搜索效率。

## A*算法

A*算法的基本流程如下：

1. 将起点加入open列表中。
2. 从open列表中找出f值最小的节点，将其作为当前节点。
3. 如果当前节点是终点，则搜索结束。
4. 否则，将当前节点从open列表中移除，加入close列表中。
5. 对当前节点的邻居节点进行扩展，计算其f值，并将其加入open列表中。
6. 重复步骤2-5，直到找到终点或者open列表为空。

A*算法的启发式函数通常使用曼哈顿距离或欧几里得距离，具体实现可以根据具体问题进行调整。

## Rust实现A*算法

下面是使用Rust语言实现A*算法的代码，代码中使用了一个二维数组来表示地图，0表示可以通过的格子，1表示障碍物，起点和终点分别用S和E表示。

```rust
use std::collections::BinaryHeap;
use std::cmp::Ordering;

#[derive(Clone, Copy, Eq, PartialEq)]
struct Node {
    x: usize,
    y: usize,
    f: usize,
    g: usize,
    h: usize,
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        other.f.cmp(&self.f)
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn a_star(map: &Vec<Vec<i32>>, start: (usize, usize), end: (usize, usize)) -> Option<Vec<(usize, usize)>> {
    let mut open_list = BinaryHeap::new();
    let mut close_list = vec![vec![false; map[0].len()]; map.len()];
    let mut parent = vec![vec![(0, 0); map[0].len()]; map.len()];
    let mut g_score = vec![vec![usize::MAX; map[0].len()]; map.len()];
    let mut f_score = vec![vec![usize::MAX; map[0].len()]; map.len()];
    let (start_x, start_y) = start;
    let (end_x, end_y) = end;

    g_score[start_x][start_y] = 0;
    f_score[start_x][start_y] = manhattan_distance(start_x, start_y, end_x, end_y);

    open_list.push(Node { x: start_x, y: start_y, f: f_score[start_x][start_y], g: 0, h: f_score[start_x][start_y] });

    while let Some(current) = open_list.pop() {
        if current.x == end_x && current.y == end_y {
            let mut path = vec![];
            let mut current = (end_x, end_y);
            while current != (start_x, start_y) {
                path.push(current);
                current = parent[current.0][current.1];
            }
            path.push((start_x, start_y));
            path.reverse();
            return Some(path);
        }

        close_list[current.x][current.y] = true;

        //    四方向坐标系寻路, 可以根据需求改写扩展为8方向
        for (dx, dy) in &[(-1, 0), (1, 0), (0, -1), (0, 1)] {
            let x = current.x as i32 + dx;
            let y = current.y as i32 + dy;

            //    判断坐标是否超出地图边界
            if x < 0 || x >= map.len() as i32 || y < 0 || y >= map[0].len() as i32 {
                continue;
            }

            let x = x as usize;
            let y = y as usize;

            //    判断是否可以通行，可以通过扩展类型实现更多的地图场景效果
            if map[x][y] == 1 || close_list[x][y] {
                continue;
            }

            let tentative_g_score = g_score[current.x][current.y] + 1;
            if tentative_g_score < g_score[x][y] {
                parent[x][y] = (current.x, current.y);
                g_score[x][y] = tentative_g_score;
                f_score[x][y] = tentative_g_score + manhattan_distance(x, y, end_x, end_y);
                if !open_list.iter().any(|node| node.x == x && node.y == y) {
                    open_list.push(Node { x: x, y: y, f: f_score[x][y], g: g_score[x][y], h: manhattan_distance(x, y, end_x, end_y) });
                }
            }
        }
    }

    None
}

//    曼哈顿距离算法
fn manhattan_distance(x1: usize, y1: usize, x2: usize, y2: usize) -> usize {
    let dx = if x1 > x2 { x1 - x2 } else { x2 - x1 };
    let dy = if y1 > y2 { y1 - y2 } else { y2 - y1 };
    (dx + dy) * 10
}

fn main() {
    let map = vec![
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
        vec![0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        vec![0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        vec![0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        vec![0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    ];

    let start = (6, 1);
    let end = (3, 8);

    if let Some(path) = a_star(&map, start, end) {
        for row in 0..map.len() {
            for col in 0..map[0].len() {
                if (row, col) == start {
                    print!("S");
                } else if (row, col) == end {
                    print!("E");
                } else if path.contains(&(row, col)) {
                    print!("*");
                } else if map[row][col] == 1 {
                    print!("X");
                } else {
                    print!(".");
                }
            }
            println!();
        }
    } else {
        println!("No path found!");
    }
}
//    输出结果：
// ..........
// ..........
// ..........
// .*******E.
// .*........
// .*..XXXXX.
// .S..X...X.
// ....X...X.
// ....X...X.
// ....X.....
```
这个示例中，我们定义了起点和终点，以及一10x10的地图。最后，我们调用a_star函数，得到一条最短路径。

## A*最佳实践

在实际应用中，A*算法的性能可能会受到一些限制，例如地图过大、起点和终点距离过远等。为了提高算法的性能，可以考虑以下优化措施：

- 使用更高效的数据结构，例如B+树、哈希表等。
- 对地图进行预处理，例如生成格子图、缩小地图等。
- 使用并行计算或GPU加速等技术。
- 对算法进行剪枝或启发式搜索等优化。

## 总结

本文介绍了如何使用Rust编写一个A*寻路算法。A*算法是一种启发式搜索算法，它可以在图中找到两个点之间的最短路径。我们使用了一个节点结构体、一个地图二维向量、一个open_list和close_list，以及一个估价函数来实现A*算法。最后，我们给出了一个使用示例。
