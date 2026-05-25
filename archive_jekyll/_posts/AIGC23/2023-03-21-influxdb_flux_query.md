---
layout: post
read_time: true
show_date: true
img: images/2023-03/influxdb_2x_flux.png
title: InfluxDB Flux
date: 2023-03-21 21:00:00 +0800
categories: [InfluxDB]
tags: [InfluxDB, Flux, Flux语法]
toc: yes
image_scaling: true
mermaid: true
---

InfluxDB是一款开源的时间序列数据库，它的数据模型和查询语言都是针对时间序列数据进行优化的。而Flux语法则是InfluxDB 2.0版本中的全新查询语言，它的设计目标是提供更加灵活、强大的查询能力。
本文将介绍Flux语法的基本语法和一些常用的操作符，同时提供一些示例代码，帮助读者更好地理解和使用Flux语法。

## Flux基本语法

### 数据源

Flux查询的第一步是指定数据源，可以使用from关键字来指定数据源。例如：
```csharp
from(bucket: "my-bucket")
```

这个查询语句指定了数据源为名为my-bucket的桶。
### 过滤器

Flux查询中可以使用过滤器来筛选出符合条件的数据。过滤器使用filter()函数来实现，可以传入一个Lambda表达式作为参数，该表达式用于对数据进行过滤。例如：
```csharp
from(bucket: "my-bucket")
  |> filter(fn: (r) => r._measurement == "cpu")
```

这个查询语句指定了数据源为my-bucket桶，并使用filter()函数来筛选出_measurement字段等于cpu的数据。
### 转换器

Flux查询中可以使用转换器对数据进行转换和处理。转换器使用map()函数来实现，可以传入一个Lambda表达式作为参数，该表达式用于对数据进行转换。例如：
```csharp
from(bucket: "my-bucket")
  |> filter(fn: (r) => r._measurement == "cpu")
  |> map(fn: (r) => ({ r with _value: r._value * 2.0 }))
```

这个查询语句指定了数据源为my-bucket桶，并使用filter()函数筛选出_measurement字段等于cpu的数据，然后使用map()函数将_value字段的值乘以2.0。
### 聚合器

Flux查询中可以使用聚合器对数据进行聚合计算。聚合器使用aggregateWindow()函数来实现，可以传入一个Lambda表达式作为参数，该表达式用于指定聚合计算的方式。例如：
```csharp
from(bucket: "my-bucket")
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
```

这个查询语句指定了数据源为my-bucket桶，并使用filter()函数筛选出_measurement字段等于cpu的数据，然后使用aggregateWindow()函数对数据进行聚合计算，每分钟计算一次平均值。
### 排序器

Flux查询中可以使用排序器对数据进行排序。排序器使用sort()函数来实现，可以传入一个Lambda表达式作为参数，该表达式用于指定排序方式。例如：
```csharp
from(bucket: "my-bucket")
  |> filter(fn: (r) => r._measurement == "cpu")
  |> sort(columns: ["_time"], desc: true)
```

这个查询语句指定了数据源为my-bucket桶，并使用filter()函数筛选出_measurement字段等于cpu的数据，然后使用sort()函数对数据按照_time字段进行降序排序。
## 常用操作符

### 数学操作符

Flux语法支持常见的数学操作符，例如加减乘除和取模等。例如：
```csharp
x + y
x - y
x * y
x / y
x % y
```

### 逻辑操作符

Flux语法支持常见的逻辑操作符，例如与、或和非等。例如：
```csharp
x and y
x or y
not x
```

### 比较操作符

Flux语法支持常见的比较操作符，例如等于、不等于、大于、小于、大于等于和小于等于等。例如：
```csharp
x == y
x != y
x > y
x < y
x >= y
x <= y
```

### 字符串操作符

Flux语法支持常见的字符串操作符，例如连接和分割等。例如：
```csharp
x + y
strings.split(v: "x,y,z", t: ",")
```

### 时间操作符

Flux语法支持常见的时间操作符，例如时间加减和时间格式化等。例如：
```csharp
time + duration(v: 1h)
time - duration(v: 1h)
time |> formatTime(fmt: "2006-01-02T15:04:05Z07:00")
```

## Flux 常用函数

InfluxDB Flux语法是InfluxDB 2.0版本中的全新查询语言，它的设计目标是提供更加灵活、强大的查询能力。在实际应用中，我们可以通过灵活使用Flux语法，优化查询性能，提高数据处理效率。
以下是一些实践经验，帮助童鞋们更好地理解和使用Flux语法。
### 使用range()函数限制查询时间范围

在查询数据时，我们通常只需要查询指定时间范围内的数据。Flux语法中可以使用range()函数来限制查询时间范围。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据。
### 使用filter()函数筛选数据

在查询数据时，我们通常需要筛选出符合条件的数据。Flux语法中可以使用filter()函数来筛选数据。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
  |> filter(fn: (r) => r._measurement == "cpu")
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出_measurement字段等于cpu的数据。
### 使用map()函数对数据进行转换

在查询数据时，我们通常需要对数据进行转换和处理。Flux语法中可以使用map()函数对数据进行转换。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
  |> filter(fn: (r) => r._measurement == "cpu")
  |> map(fn: (r) => ({ r with _value: r._value * 2.0 }))
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出_measurement字段等于cpu的数据，最后使用map()函数将_value字段的值乘以2.0。
### 使用aggregateWindow()函数对数据进行聚合计算

在查询数据时，我们通常需要对数据进行聚合计算。Flux语法中可以使用aggregateWindow()函数对数据进行聚合计算。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出_measurement字段等于cpu的数据，最后使用aggregateWindow()函数对数据进行聚合计算，每分钟计算一次平均值。
### 使用group()函数对数据进行分组

在查询数据时，我们通常需要对数据进行分组。Flux语法中可以使用group()函数对数据进行分组。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
  |> group(columns: ["_field"])
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出_measurement字段等于cpu的数据，最后使用aggregateWindow()函数对数据进行聚合计算，每分钟计算一次平均值，最后使用group()函数对数据按照_field字段进行分组。

### 使用sort()函数对数据进行排序

在查询数据时，我们通常需要对数据进行排序。Flux语法中可以使用sort()函数对数据进行排序。例如：
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h, stop: now())
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
  |> sort(columns: ["_value"], desc: true)
```

这个查询语句指定了数据源为my-bucket桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出_measurement字段等于cpu的数据，最后使用aggregateWindow()函数对数据进行聚合计算，每分钟计算一次平均值，最后使用sort()函数对数据按照_value字段进行降序排序。

### 使用join()函数连接多个数据源

在查询数据时，我们通常需要连接多个数据源。Flux语法中可以使用join()函数连接多个数据源。例如：
```csharp
from(bucket: "my-bucket")
|> range(start: -1h, stop: now())
|> filter(fn: (r) => r._measurement == "cpu")
|> aggregateWindow(every: 1m, fn: mean)
|> join(tables: {
other_table: from(bucket: "my-bucket-2")
|> range(start: -1h, stop: now())
|> filter(fn: (r) => r._measurement == "memory")
|> aggregateWindow(every: 1m, fn: mean)
}, on:["_time"])
```

这个查询语句指定了数据源为`my-bucket`桶，并使用range()函数限制查询时间范围为最近一小时内的数据，然后使用filter()函数筛选出`_measurement`字段等于`cpu`的数据，最后使用aggregateWindow()函数对数据进行聚合计算，每分钟计算一次平均值。同时，使用join()函数连接了另一个数据源`my-bucket-2`，并对其进行类似的处理，然后按照`_time`字段进行连接。

以上是一些Flux的常用函数用法示例，希望能够对读者理解和使用Flux语法有所帮助。

## Flux 实战进阶示例

以下是一些示例代码，帮助读者更好地理解和使用Flux语法。

查询最近10分钟的CPU使用率

```csharp
from(bucket: "my-bucket")
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
```

查询最近一小时内CPU使用率最高的前5台服务器
```csharp
from(bucket: "my-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> aggregateWindow(every: 1m, fn: mean)
  |> group(columns: ["_field"])
  |> sort(columns: ["_value"], desc: true)
  |> limit(n: 5)
```

查询某个标签的所有值

```csharp
from(bucket: "my-bucket")
  |> range(start: -1h)
  |> keys()
  |> filter(fn: (r) => r._field == "tag_name")
  |> group(columns: ["_value"])
```

对数据进行归一化处理

```csharp
from(bucket: "my-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> map(fn: (r) => ({ r with _value: (r._value - 50.0) / 10.0 }))
```


## 总结

本文介绍了InfluxDB Flux语法的基本语法和常用操作符，并提供了一些示例代码。Flux语法是InfluxDB 2.0版本中的全新查询语言，相比于之前的查询语言，它更加灵活、强大，可以帮助用户更好地处理和分析时间序列数据。读者可以根据本文提供的内容，深入学习和使用Flux语法，从而更好地利用InfluxDB进行时间序列数据处理和分析。

