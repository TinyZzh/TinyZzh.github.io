---
layout: post
read_time: true
show_date: true
img: images/2023-04/python-logo-big.png
title: Python 3.x从基础到实战 - 检查内存可用大小
date: 2023-04-27 12:00:00 +0800
categories: [python3]
tags: [python3, python]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-04/python-logo-big.png)

在Linux服务器管理中，内存是一个非常重要的资源。如果服务器的内存不足，可能会导致服务器崩溃或者无法正常工作。因此，检查Linux服务器内存可用大小是非常必要的。本文将介绍如何使用Python 3实现检查Linux服务器内存可用大小的方法，包括使用Python标准库实现和使用Linux命令实现两种方式。

### 使用 `psutil` 标准库实现

Python标准库中有一个`psutil`模块，它提供了一个跨平台的API，可以用来获取系统信息，包括CPU、内存、磁盘、网络等。我们可以使用`psutil`模块来获取Linux服务器的内存信息。

首先，我们需要安装`psutil`模块。在Linux服务器上，可以使用以下命令来安装：

```bash
pip3 install psutil
```

安装完成后，我们可以开始编写Python代码。以下是一个示例代码，它可以获取Linux服务器的内存信息，并计算可用内存的大小：

```python
import psutil

# 获取内存信息
mem = psutil.virtual_memory()

# 计算可用内存大小
available_mem = mem.available / (1024 * 1024)

# 打印可用内存大小
print("可用内存大小：%.2f MB" % available_mem)
```

在上面的代码中，我们使用`psutil.virtual_memory()`函数来获取内存信息。这个函数返回一个`namedtuple`对象，包含了各种内存信息，包括总内存、可用内存、已使用内存、缓冲区等。我们可以通过访问这个对象的属性来获取相应的内存信息。

在上面的示例代码中，我们获取了可用内存的大小，然后将其转换为MB单位，并打印出来。

### 使用Linux `free` 命令实现

除了使用Python标准库外，我们还可以使用Linux命令来获取Linux服务器的内存信息。Linux系统中有一个`free`命令，可以用来查看内存使用情况。我们可以使用Python的`subprocess`模块来执行`free`命令，并解析命令的输出结果来获取内存信息。

以下是一个示例代码，它可以使用`free`命令获取Linux服务器的内存信息，并计算可用内存的大小：

```python
import subprocess

# 执行free命令，获取内存信息
output = subprocess.check_output(["free", "-m"]).decode()

# 解析输出结果，获取可用内存大小
for line in output.split("\n"):
    if "Mem" in line:
        mem_info = line.split()
        total_mem = int(mem_info[1])
        used_mem = int(mem_info[2])
        free_mem = int(mem_info[3])
        available_mem = free_mem + int(mem_info[6])
        break

# 打印可用内存大小
print("可用内存大小：{} MB".format(available_mem))
```

在上面的代码中，我们使用`subprocess.check_output()`函数执行`free -m`命令，并将命令的输出结果转换为字符串类型。然后，我们遍历输出结果的每一行，找到包含`Mem`关键字的行，解析这一行的内容，获取总内存、已使用内存、空闲内存、可用内存等信息。最后，我们计算可用内存的大小，并打印出来。

### 总结

本文介绍了两种方法，使用Python 3实现检查Linux服务器内存可用大小。第一种方法是使用Python标准库中的`psutil`模块，它提供了一个跨平台的API，可以用来获取系统信息。第二种方法是使用Linux命令`free`，并使用Python的`subprocess`模块来执行命令并解析命令的输出结果。无论是哪种方法，都可以方便地获取Linux服务器的内存信息，并计算可用内存的大小。
