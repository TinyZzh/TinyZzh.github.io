---
layout: post
read_time: true
show_date: true
img: images/2023-04/python-logo-big.png
title: Python 3.x从基础到实战 - 文件相关操作
date: 2023-05-06 12:00:00 +0800
categories: [python3]
tags: [python3, python]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-04/python-logo-big.png)
Python是一种高级编程语言，可以轻松地处理各种文件。在Python中，我们可以使用内置的文件操作函数和模块来读取、写入、追加、创建、替换等各种文件操作。本教程将为您提供Python文件操作的详细指南，包括with语句的代码示例以及文件的高级应用示例。


## open()函数

在Python中，我们使用open()函数来打开文件。open()函数返回一个文件对象，它可以用于读取、写入和追加文件。open()函数需要两个参数：文件名和模式。文件名是要打开的文件的名称和路径。模式是打开文件的方式，例如读取、写入、追加等。

- file: 可以是文件路径或文件对象。如果是文件路径，需要提供文件的完整路径和文件名，如果是文件对象，可以是一个已经打开的文件对象或者是一个文件流对象。
- mode: 打开文件的模式，可以是只读模式（'r'）、写入模式（'w'）、追加模式（'a'）、二进制模式（'b'）等。
- buffering: 缓冲区大小，可以设置为0表示不使用缓冲区，设置为1表示使用行缓冲，设置为大于1的整数表示使用指定大小的缓冲区。
- encoding: 文件编码，用于指定文件的编码格式，例如UTF-8、GBK等。
- errors: 编码错误处理方式，用于指定当读取文件时遇到编码错误时的处理方式，例如忽略错误、替换错误字符等。
- newline: 行结束符，用于指定写入文件时使用的行结束符，例如'\n'表示使用换行符作为行结束符。

mode模式的常用参数及注释。

| 模式 | 描述 |
| ---- | ---- |
| 'r' | 读取模式，打开文件用于读取（默认值） |
| 'w' | 写入模式，打开文件用于写入，如果文件已存在，将会覆盖文件 |
| 'x' | 独占模式，打开文件用于独占写入，如果文件已存在，会抛出FileExistsError异常 |
| 'a' | 追加模式，打开文件用于追加写入，如果文件不存在，将会创建文件 |
| 'b' | 二进制模式，打开文件用于二进制读取或写入 |
| 't' | 文本模式，打开文件用于文本读取或写入（默认值） |
| '+' | 读写模式，打开文件用于同时读取和写入 |


## 基础文件操作

### 读取文件

要读取文件，我们使用模式'r'来打开文件。在这种模式下，文件指针位于文件的开头。我们可以使用read()函数来读取文件的内容。read()函数返回文件的全部内容，或者如果指定了参数，则返回指定数量的字符。

```python
with open('file.txt', 'r') as file:
    data = file.read()
    print(data)
```

在上面的代码中，我们打开了一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用read()函数读取文件的全部内容，并将其赋值给变量'data'。最后，我们使用print()函数输出文件的内容。

### 写入文件

要写入文件，我们使用模式'w'来打开文件。在这种模式下，如果文件不存在，则会创建一个新文件。如果文件已经存在，则会覆盖文件的内容。我们可以使用write()函数将数据写入文件。

```python
with open('file.txt', 'w') as file:
    file.write('Hello, world!')
```

在上面的代码中，我们打开了一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用write()函数将字符串'Hello, world!'写入文件。

### 追加文件

要追加文件，我们使用模式'a'来打开文件。在这种模式下，文件指针位于文件的末尾。我们可以使用write()函数将数据追加到文件的末尾。

```python
with open('file.txt', 'a') as file:
    file.write('\nHello, again!')
```

在上面的代码中，我们打开了一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用write()函数将字符串'\nHello, again!'追加到文件的末尾。

### 创建文件

要创建文件，我们使用模式'x'来打开文件。在这种模式下，如果文件已经存在，则会引发FileExistsError异常。如果文件不存在，则会创建一个新文件。我们可以使用write()函数将数据写入文件。

```python
with open('file.txt', 'x') as file:
    file.write('Hello, world!')
```

在上面的代码中，我们打开了一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用write()函数将字符串'Hello, world!'写入文件。如果文件已经存在，则会引发FileExistsError异常。

## 关闭文件

在Python中，打开文件后，我们必须关闭文件，以释放资源并保存文件更改。我们可以使用close()函数来关闭文件。

```python
file = open('file.txt', 'r')
data = file.read()
file.close()
```

在上面的代码中，我们打开了一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用read()函数读取文件的全部内容，并将其赋值给变量'data'。最后，我们使用close()函数关闭文件。

但是，如果在使用文件后忘记关闭文件，则可能会导致资源泄漏和文件损坏。为了避免这种情况，我们可以使用with语句来自动关闭文件。

```python
with open('file.txt', 'r') as file:
    data = file.read()
```

在上面的代码中，我们使用with语句打开一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用read()函数读取文件的全部内容，并将其赋值给变量'data'。最后，with语句自动关闭文件。

## 文件相关场景用法

除了基本的文件读取、写入、追加和创建操作外，Python还提供了许多高级文件操作。在本节中，我们将介绍四个高级文件应用示例。

### 逐行读取文件

在Python中，我们可以使用for循环逐行读取文件。这对于大型文件非常有用，因为它允许我们一次只读取一行，而不是将整个文件读入内存。

```python
with open('file.txt', 'r') as file:
    for line in file:
        print(line)
```

在上面的代码中，我们使用with语句打开一个名为'file.txt'的文件，并将其赋值给变量'file'。然后，我们使用for循环逐行读取文件，并将每一行打印到屏幕上。

### 使用json格式读写文件

JSON是一种轻量级数据交换格式，通常用于Web应用程序的数据交换。在Python中，我们可以使用json模块来读取和写入JSON格式的文件。

```python
import json

# 写入JSON格式的文件
data = {'name': 'John', 'age': 30, 'city': 'New York'}
with open('data.json', 'w') as file:
    json.dump(data, file)

# 读取JSON格式的文件
with open('data.json', 'r') as file:
    data = json.load(file)
    print(data)
```

在上面的代码中，我们导入了json模块。然后，我们使用字典对象创建一个名为'data'的变量。接下来，我们使用json.dump()函数将'data'写入一个名为'data.json'的文件中。最后，我们使用json.load()函数从'data.json'文件中读取数据，并将其赋值给变量'data'。然后，我们使用print()函数输出变量'data'。

### 压缩和解压文件

在Python中，我们可以使用gzip模块来压缩和解压文件。gzip模块提供了GzipFile类，它允许我们打开压缩文件，并在其中读取和写入数据。

```python
import gzip

# 压缩文件
with open('file.txt', 'rb') as file_in:
    with gzip.open('file.txt.gz', 'wb') as file_out:
        file_out.write(file_in.read())

# 解压文件
with gzip.open('file.txt.gz', 'rb') as file_in:
    with open('file.txt', 'wb') as file_out:
        file_out.write(file_in.read())
```

在上面的代码中，我们导入了gzip模块。然后，我们使用with语句打开一个名为'file.txt'的文件，并将其赋值给变量'file_in'。接下来，我们使用with语句打开一个名为'file.txt.gz'的压缩文件，并将其赋值给变量'file_out'。然后，我们使用write()函数将'file_in'中的数据写入'file_out'中。最后，我们使用with语句打开一个名为'file.txt.gz'的压缩文件，并将其赋值给变量'file_in'。接下来，我们使用with语句打开一个名为'file.txt'的文件，并将其赋值给变量'file_out'。然后，我们使用write()函数将'file_in'中的数据写入'file_out'中。

### 使用CSV格式读写文件

CSV是一种常用的电子表格文件格式，通常用于数据交换。在Python中，我们可以使用csv模块来读取和写入CSV格式的文件。

```python
import csv

# 写入CSV格式的文件
data = [['name', 'age', 'city'], ['John', '30', 'New York'], ['Mary', '25', 'Los Angeles']]
with open('data.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(data)

# 读取CSV格式的文件
with open('data.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)
```

在上面的代码中，我们导入了csv模块。然后，我们使用一个名为'data'的列表对象创建一个CSV格式的数据。接下来，我们使用csv.writer()函数将'data'写入一个名为'data.csv'的文件中。注意，我们需要使用newline=''参数来避免在写入文件时出现空行。最后，我们使用csv.reader()函数从'data.csv'文件中读取数据，并使用for循环逐行打印数据。

## 结论

在本教程中，我们学习了Python文件操作的基础知识，包括打开、关闭、读取、写入、追加和创建文件。我们还介绍了with语句的使用，以及文件的高级应用示例，包括逐行读取文件、使用json格式读写文件、压缩和解压文件以及使用CSV格式读写文件。这些知识将帮助您在Python中处理各种文件，使您的编程更加高效和有趣。
