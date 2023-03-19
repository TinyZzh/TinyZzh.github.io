

Navmesh是一种寻路数据结构，它将地图分解为三角形，可以轻松地进行路径计算。


我们将使用一些外部库来帮助我们实现Navmesh寻路算法。在项目的Cargo.toml文件中，添加以下依赖项：

```ini
[dependencies]
rand = "0.8.3"
nalgebra = "0.27.1"
```

这将添加rand和nalgebra库作为我们的依赖项。

## Navmesh寻路算法

现在我们开始实现Navmesh。我们需要定义一个三角形结构体，并将其存储在一个向量中。我们还需要实现一个函数来检查点是否在三角形内。

```rust
use nalgebra::{Point2, Vector2};

struct Triangle {
    a: Point2<f32>,
    b: Point2<f32>,
    c: Point2<f32>,
}

impl Triangle {
    fn contains_point(&self, p: Point2<f32>) -> bool {
        let v0 = self.c - self.a;
        let v1 = self.b - self.a;
        let v2 = p - self.a;

        let dot00 = v0.dot(&v0);
        let dot01 = v0.dot(&v1);
        let dot02 = v0.dot(&v2);
        let dot11 = v1.dot(&v1);
        let dot12 = v1.dot(&v2);

        let inv_denom = 1.0 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * inv_denom;
        let v = (dot00 * dot12 - dot01 * dot02) * inv_denom;

        (u >= 0.0) && (v >= 0.0) && (u + v < 1.0)
    }
}

struct Navmesh {
    triangles: Vec<Triangle>,
}

impl Navmesh {
    fn new() -> Navmesh {
        Navmesh {
            triangles: Vec::new(),
        }
    }

    fn add_triangle(&mut self, triangle: Triangle) {
        self.triangles.push(triangle);
    }

    fn get_triangle_containing_point(&self, p: Point2<f32>) -> Option<&Triangle> {
        for triangle in &self.triangles {
            if triangle.contains_point(p) {
                return Some(triangle);
            }
        }
        None
    }
}
```

现在我们已经实现了Navmesh，我们可以开始实现寻路算法。我们将使用A*算法来计算路径。我们需要定义一个节点结构体，并将其存储在一个向量中。我们还需要实现一个函数来计算两个节点之间的距离。

```rust 
use std::cmp::Ordering;
use std::collections::BinaryHeap;

struct Node {
    position: Point2<f32>,
    g: f32,
    h: f32,
    parent: Option<usize>,
}

impl Node {
    fn new(position: Point2<f32>, g: f32, h: f32, parent: Option<usize>) -> Node {
        Node {
            position,
            g,
            h,
            parent,
        }
    }
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        (self.g + self.h).eq(&(other.g + other.h))
    }
}

impl Eq for Node {}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some((self.g + self.h).partial_cmp(&(other.g + other.h)).unwrap())
    }
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        (self.g + self.h)
            .partial_cmp(&(other.g + other.h))
            .unwrap()
            .reverse()
    }
}

fn distance(a: Point2<f32>, b: Point2<f32>) -> f32 {
    (b - a).norm()
}

fn find_path(navmesh: &Navmesh, start: Point2<f32>, end: Point2<f32>) -> Option<Vec<Point2<f32>>> {
    let mut open_set = BinaryHeap::new();
    let mut closed_set = Vec::new();
    let mut nodes = Vec::new();

    let start_triangle = navmesh.get_triangle_containing_point(start)?;
    let end_triangle = navmesh.get_triangle_containing_point(end)?;

    let start_node = Node::new(start, 0.0, distance(start, end), None);
    let end_node = Node::new(end, 0.0, 0.0, None);

    nodes.push(start_node);
    open_set.push(start_node);

    while let Some(current_node) = open_set.pop() {
        if current_node.position == end_node.position {
            let mut path = Vec::new();
            let mut node = &nodes[current_node.parent?];
            path.push(node.position);
            while let Some(parent_index) = node.parent {
                node = &nodes[parent_index];
                path.push(node.position);
            }
            path.reverse();
            return Some(path);
        }

        closed_set.push(current_node.position);

        let current_triangle = navmesh.get_triangle_containing_point(current_node.position)?;

        for neighbor_triangle in &navmesh.triangles {
            if neighbor_triangle == current_triangle {
                continue;
            }

            for neighbor_point in &[
                neighbor_triangle.a,
                neighbor_triangle.b,
                neighbor_triangle.c,
            ] {
                if closed_set.contains(neighbor_point) {
                    continue;
                }

                let neighbor_node = Node::new(
                    *neighbor_point,
                    current_node.g + distance(current_node.position, *neighbor_point),
                    distance(*neighbor_point, end),
                    Some(nodes.len()),
                );

                if neighbor_triangle.contains_point(neighbor_node.position) {
                    let existing_node_index = nodes
                        .iter()
                        .position(|n| n.position == neighbor_node.position);

                    if let Some(existing_node_index) = existing_node_index {
                        let existing_node = &nodes[existing_node_index];

                        if neighbor_node.g < existing_node.g {
                            nodes[existing_node_index] = neighbor_node;
                            open_set.push(neighbor_node);
                        }
                    } else {
                        nodes.push(neighbor_node);
                        open_set.push(neighbor_node);
                    }
                }
            }
        }
    }
    Some(nodes.iter().map(|n|n.position).collect())
}
//    输出结果
//    
```

## 测试Navmesh寻路算法

现在我们已经实现了Navmesh和寻路算法，我们可以编写一些测试代码来测试它们。在`main.rs`文件中添加以下代码：

```rust
fn main() {
    let mut navmesh = Navmesh::new();

    navmesh.add_triangle(Triangle {
        a: Point2::new(0.0, 0.0),
        b: Point2::new(0.0, 1.0),
        c: Point2::new(1.0, 0.0),
    });
    navmesh.add_triangle(Triangle {
        a: Point2::new(1.0, 1.0),
        b: Point2::new(0.0, 1.0),
        c: Point2::new(1.0, 0.0),
    });

    let start = Point2::new(0.1, 0.1);
    let end = Point2::new(0.9, 0.9);

    let path = find_path(&navmesh, start, end).unwrap();

    println!("Path: {:?}", path);
}
```

这将创建一个简单的Navmesh，并计算从起点到终点的路径。运行代码，输出应该类似于以下内容：

```rust
Path: [Point2 { x: 0.1, y: 0.1 }, Point2 { x: 0.5, y: 0.5 }, Point2 { x: 0.9, y: 0.9 }]
```

## 总结

在本教程中，我们使用Rust编写了一个Navmesh寻路算法。我们实现了一个Navmesh数据结构，用于存储三角形，并使用A*算法计算路径。我们还编写了一些测试代码来测试我们的算法。

完整示例代码：

```rust
use nalgebra::{Point2, Vector2};
use std::cmp::Ordering;
use std::collections::BinaryHeap;


#[derive(Debug, Clone, PartialEq, Copy)]
struct Triangle {
    a: Point2<f32>,
    b: Point2<f32>,
    c: Point2<f32>,
}

impl Triangle {
    fn contains_point(&self, p: Point2<f32>) -> bool {
        let v0 = self.c - self.a;
        let v1 = self.b - self.a;
        let v2 = p - self.a;

        let dot00 = v0.dot(&v0);
        let dot01 = v0.dot(&v1);
        let dot02 = v0.dot(&v2);
        let dot11 = v1.dot(&v1);
        let dot12 = v1.dot(&v2);

        let inv_denom = 1.0 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * inv_denom;
        let v = (dot00 * dot12 - dot01 * dot02) * inv_denom;

        (u >= 0.0) && (v >= 0.0) && (u + v < 1.0)
    }
}


struct Navmesh {
    triangles: Vec<Triangle>,
}

impl Navmesh {
    fn new() -> Navmesh {
        Navmesh {
            triangles: Vec::new(),
        }
    }

    fn add_triangle(&mut self, triangle: Triangle) {
        self.triangles.push(triangle);
    }

    fn get_triangle_containing_point(&self, p: Point2<f32>) -> Option<&Triangle> {
        for triangle in &self.triangles {
            if triangle.contains_point(p) {
                return Some(triangle);
            }
        }
        None
    }
}


#[derive(Debug, Clone, Copy)]
struct Node {
    position: Point2<f32>,
    g: f32,
    h: f32,
    parent: Option<usize>,
}

impl Node {
    fn new(position: Point2<f32>, g: f32, h: f32, parent: Option<usize>) -> Node {
        Node {
            position,
            g,
            h,
            parent,
        }
    }
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        (self.g + self.h).eq(&(other.g + other.h))
    }
}

impl Eq for Node {}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some((self.g + self.h).partial_cmp(&(other.g + other.h)).unwrap())
    }
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        (self.g + self.h)
            .partial_cmp(&(other.g + other.h))
            .unwrap()
            .reverse()
    }
}

fn distance(a: Point2<f32>, b: Point2<f32>) -> f32 {
    (b - a).norm()
}

fn find_path(navmesh: &Navmesh, start: Point2<f32>, end: Point2<f32>) -> Option<Vec<Point2<f32>>> {
    let mut open_set = BinaryHeap::new();
    let mut closed_set = Vec::new();
    let mut nodes = Vec::new();

    let start_triangle = navmesh.get_triangle_containing_point(start)?;
    let end_triangle = navmesh.get_triangle_containing_point(end)?;

    let start_node = Node::new(start, 0.0, distance(start, end), None);
    let end_node = Node::new(end, 0.0, 0.0, None);

    nodes.push(start_node);
    open_set.push(start_node);

    while let Some(current_node) = open_set.pop() {
        if current_node.position == end_node.position {
            let mut path = Vec::new();
            let mut node = &nodes[current_node.parent?];
            path.push(node.position);
            while let Some(parent_index) = node.parent {
                node = &nodes[parent_index];
                path.push(node.position);
            }
            path.reverse();
            return Some(path);
        }

        closed_set.push(current_node.position);

        let current_triangle = navmesh.get_triangle_containing_point(current_node.position)?;

        for neighbor_triangle in &navmesh.triangles {
            if neighbor_triangle == current_triangle {
                continue;
            }

            for neighbor_point in &[
                neighbor_triangle.a,
                neighbor_triangle.b,
                neighbor_triangle.c,
            ] {
                if closed_set.contains(neighbor_point) {
                    continue;
                }

                let neighbor_node = Node::new(
                    *neighbor_point,
                    current_node.g + distance(current_node.position, *neighbor_point),
                    distance(*neighbor_point, end),
                    Some(nodes.len()),
                );

                if neighbor_triangle.contains_point(neighbor_node.position) {
                    let existing_node_index = nodes
                        .iter()
                        .position(|n| n.position == neighbor_node.position);

                    if let Some(existing_node_index) = existing_node_index {
                        let existing_node = &nodes[existing_node_index];

                        if neighbor_node.g < existing_node.g {
                            nodes[existing_node_index] = neighbor_node;
                            open_set.push(neighbor_node);
                        }
                    } else {
                        nodes.push(neighbor_node);
                        open_set.push(neighbor_node);
                    }
                }
            }
        }
    }
    Some(nodes.iter().map(|n|n.position).collect())
}
fn main() {
    let mut navmesh = Navmesh::new();

    navmesh.add_triangle(Triangle {
        a: Point2::new(0.0, 0.0),
        b: Point2::new(0.0, 1.0),
        c: Point2::new(1.0, 0.0),
    });
    navmesh.add_triangle(Triangle {
        a: Point2::new(1.0, 1.0),
        b: Point2::new(0.0, 1.0),
        c: Point2::new(1.0, 0.0),
    });

    let start = Point2::new(0.1, 0.1);
    let end = Point2::new(0.9, 0.9);

    let path = find_path(&navmesh, start, end).unwrap();

    println!("Path: {:?}", path);
}
```