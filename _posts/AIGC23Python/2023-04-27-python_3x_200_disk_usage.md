---
layout: post
read_time: true
show_date: true
img: images/2023-04/python-logo-big.png
title: Python 3.x从基础到实战 - 检查磁盘可用空间
date: 2023-04-27 12:00:00 +0800
categories: [python3]
tags: [python3, python]
toc: yes
image_scaling: true
mermaid: true
---

![](/images/2023-04/python-logo-big.png)

在 Linux 服务器上，磁盘空间的使用情况是一个非常重要的指标。如果服务器上的磁盘空间不足，可能会导致服务器崩溃，影响网站的正常运行。为了避免这种情况的发生，我们需要定期检查服务器上的磁盘空间，并及时清理不必要的文件。本文将介绍如何使用 Python 3脚本检查 Linux 服务器上的磁盘空间。

## 使用psutil模块实现

首先，我们需要安装`psutil`模块。`psutil`是一个跨平台的库，用于获取系统信息，包括磁盘使用情况、CPU使用情况等。我们可以使用以下命令来安装`psutil`：

```bash
pip3 install psutil
```

### 获取磁盘使用情况

我们将使用`psutil`模块来获取磁盘使用情况。以下是获取磁盘使用情况的示例代码：

```python
import psutil

# 获取磁盘使用情况
disk_usage = psutil.disk_usage('/')

# 打印磁盘使用情况
print(f"Total: {disk_usage.total / (1024*1024*1024):.2f} GB")
print(f"Used: {disk_usage.used / (1024*1024*1024):.2f} GB")
print(f"Free: {disk_usage.free / (1024*1024*1024):.2f} GB")
```

在这个示例中，我们使用`psutil.disk_usage()`函数来获取磁盘使用情况。该函数需要传递一个参数，即要获取使用情况的磁盘路径。在这个示例中，我们传递了根目录`/`作为参数。`psutil.disk_usage()`函数返回一个`namedtuple`对象，其中包含总容量、已用容量和可用容量等信息。

### 获取磁盘挂载点

在Linux系统中，磁盘可以挂载到不同的目录下。如果您的系统中有多个磁盘，您可能需要检查每个磁盘的可用空间。以下是获取磁盘挂载点的示例代码：

```python
import psutil

# 获取磁盘挂载点
disk_partitions = psutil.disk_partitions()

# 打印磁盘挂载点
for partition in disk_partitions:
    print(f"Device: {partition.device}")
    print(f"Mountpoint: {partition.mountpoint}")
    print(f"File system type: {partition.fstype}")
    print()
```

在这个示例中，我们使用`psutil.disk_partitions()`函数来获取磁盘挂载点。该函数返回一个列表，其中包含每个挂载点的信息，包括设备、挂载点和文件系统类型等。

### 检查磁盘可用空间

现在我们已经了解了如何获取磁盘使用情况和磁盘挂载点，让我们编写一个脚本来检查磁盘的可用空间。以下是检查磁盘可用空间的示例代码：

```python
import psutil
import os

# 获取磁盘挂载点
disk_partitions = psutil.disk_partitions()

# 遍历每个挂载点
for partition in disk_partitions:
    # 获取磁盘使用情况
    disk_usage = psutil.disk_usage(partition.mountpoint)

    # 计算磁盘可用空间的百分比
    free_percent = disk_usage.free / disk_usage.total * 100

    # 如果磁盘可用空间小于10%，发送警告邮件
    if free_percent < 10:
        # 获取主机名
        hostname = os.uname()[1]

        # 构造邮件内容
        subject = f"Disk space warning on {hostname}"
        message = f"The disk {partition.device} ({partition.mountpoint}) is running out of space ({free_percent:.2f}% free)."

        # 发送邮件
        send_email(subject, message)
```

在这个示例中，我们遍历了每个磁盘挂载点，并使用`psutil.disk_usage()`函数获取了每个挂载点的使用情况。然后，我们计算了每个挂载点的可用空间百分比，并检查了是否小于10%。如果是，我们将发送一封警告邮件。


## 使用 `du` 命令实现

### 使用 du 命令检查磁盘空间

du 命令是 Linux 系统中一个非常有用的命令，可以用来查看当前目录或文件的磁盘使用情况。在 Python 3 中，我们可以使用 subprocess 模块来执行 du 命令，并将其输出解析为 Python 对象。

以下是一个简单的 Python 3 脚本，用于检查服务器上特定目录的磁盘使用情况：

```python
import subprocess

def get_directory_size(path):
    """Return the total size of the files in the given directory and subdirectories."""
    cmd = ["du", "-sh", path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE)
    output = result.stdout.decode("utf-8").strip()
    size = output.split()[0]
    return size

# Example usage:
size = get_directory_size("/var/www/html")
print("Size of /var/www/html: {}".format(size))
```

在上面的示例中，我们定义了一个名为 `get_directory_size` 的函数，该函数接受一个路径作为参数，并返回该目录及其子目录中文件的总大小。该函数使用 `subprocess.run` 函数来执行 `du` 命令，并将其输出解析为 Python 对象。然后，我们从输出中提取出目录的大小，并将其作为字符串返回。

要使用此函数，只需调用 `get_directory_size` 并传递要检查的目录的路径即可。在上面的示例中，我们检查了 `/var/www/html` 目录的大小，并将结果打印到控制台上。

### 检查多个目录的磁盘空间

如果您需要检查多个目录的磁盘使用情况，可以使用一个简单的循环来遍历目录列表，并调用 `get_directory_size` 函数来获取每个目录的大小。以下是一个示例脚本，用于检查多个目录的磁盘使用情况：

```python
import subprocess

def get_directory_size(path):
    """Return the total size of the files in the given directory and subdirectories."""
    cmd = ["du", "-sh", path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE)
    output = result.stdout.decode("utf-8").strip()
    size = output.split()[0]
    return size

# List of directories to check
directories = ["/var/www/html", "/var/log", "/etc"]

# Loop through directories and print their sizes
for directory in directories:
    size = get_directory_size(directory)
    print("Size of {}: {}".format(directory, size))
```

在上面的示例中，我们定义了一个名为 `directories` 的列表，其中包含要检查的目录的路径。然后，我们使用一个简单的循环遍历该列表，并调用 `get_directory_size` 函数来获取每个目录的大小。

### 检查磁盘空间使用率

除了检查单个目录或多个目录的磁盘使用情况之外，我们还可以使用 Python 3 来检查整个磁盘的使用情况。以下是一个示例脚本，用于检查磁盘使用率：

```python
import subprocess

def get_disk_usage():
    """Return the disk usage of the root filesystem in percent."""
    cmd = ["df", "-h", "/"]
    result = subprocess.run(cmd, stdout=subprocess.PIPE)
    output = result.stdout.decode("utf-8").strip()
    usage = int(output.split("\n")[1].split()[4].replace("%", ""))
    return usage

# Example usage:
usage = get_disk_usage()
print("Disk usage: {}%".format(usage))
```

在上面的示例中，我们定义了一个名为 `get_disk_usage` 的函数，该函数返回根文件系统的磁盘使用率。该函数使用 `subprocess.run` 函数来执行 `df` 命令，并将其输出解析为 Python 对象。然后，我们从输出中提取出磁盘使用率，并将其作为整数返回。

要使用此函数，只需调用 `get_disk_usage` 并将其结果打印到控制台上即可。

## 发送邮件

在上面的示例中，我们调用了一个名为`send_email()`的函数来发送邮件。这个函数需要进行自定义实现。以下是一个简单的`send_email()`函数的示例代码：

```python
import smtplib
from email.mime.text import MIMEText
from email.header import Header

def send_email(subject, message):
    # 邮件发送者和接收者
    sender = 'sender@example.com'
    receiver = 'receiver@example.com'

    # 邮件主题和内容
    msg = MIMEText(message, 'plain', 'utf-8')
    msg['Subject'] = Header(subject, 'utf-8')

    # 发送邮件
    smtp = smtplib.SMTP('smtp.example.com')
    smtp.login(sender, 'password')
    smtp.sendmail(sender, receiver, msg.as_string())
    smtp.quit()
```

在这个示例中，我们使用`smtplib`模块来发送邮件。首先，我们指定了邮件发送者和接收者的地址。然后，我们使用`MIMEText`类创建了一个邮件对象，并指定了邮件的主题和内容。最后，我们使用`SMTP`类连接到邮件服务器，并使用`login()`方法进行身份验证。然后，我们使用`sendmail()`方法发送邮件，并使用`quit()`方法关闭连接。

## 结论

在这篇教程中，我们使用Python 3编写了一个脚本来检查Linux服务器的磁盘可用空间。我们使用了`psutil`和`os`模块来获取磁盘信息，并编写了一个简单的函数来发送警告邮件。这个脚本可以帮助您在磁盘空间不足时及时采取措施，避免系统崩溃。