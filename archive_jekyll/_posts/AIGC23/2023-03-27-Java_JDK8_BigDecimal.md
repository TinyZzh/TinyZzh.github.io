---
layout: post
read_time: true
show_date: true
img: images/2023-03/rust_tutorial_logo.png
title: 一文读懂Java的BigDecimal
date: 2023-03-27 00:00:00 +0800
categories: [Java]
tags: [Java, BigDecimal]
toc: yes
image_scaling: true
mermaid: true
---

Java 8引入了新的日期时间API，包括DateTime、LocalDate、LocalDateTime、Instant、Period和Duration。这些新的API提供了更好的时间处理方式，使得日期时间处理更加简单、易用和可读。

## DateTime

DateTime是Java 8中最基本的日期时间类，它表示一个特定的日期和时间。它包含了年、月、日、时、分、秒和毫秒等信息。DateTime对象通常用于表示一个具体的日期和时间，例如2019年12月31日23点59分59秒。它可以用于计算两个日期之间的差值，或者将日期时间转换为不同的时区。

### 常用API和方法

- `of(int year, int month, int dayOfMonth, int hour, int minute, int second, int nanoOfSecond, ZoneId zone)`：创建一个DateTime对象，指定年、月、日、时、分、秒、毫秒和时区。
- `now()`：获取当前的DateTime对象。
- `getYear()`：获取年份。
- `getMonth()`：获取月份。
- `getDayOfMonth()`：获取日期。
- `getHour()`：获取小时。
- `getMinute()`：获取分钟。
- `getSecond()`：获取秒数。
- `getNano()`：获取纳秒数。
- `atZone(ZoneId zone)`：将DateTime对象转换为指定时区的ZonedDateTime对象。
- `format(DateTimeFormatter formatter)`：将DateTime对象格式化为指定格式的字符串。

## LocalDate

LocalDate是Java 8中的日期类，它表示一个特定的日期。它包含了年、月和日等信息。LocalDate对象通常用于表示一个具体的日期，例如2019年12月31日。它可以用于计算两个日期之间的差值，或者进行日期的加减运算。

### 常用API和方法

- `of(int year, int month, int dayOfMonth)`：创建一个LocalDate对象，指定年、月和日。
- `now()`：获取当前的LocalDate对象。
- `getYear()`：获取年份。
- `getMonth()`：获取月份。
- `getDayOfMonth()`：获取日期。
- `getDayOfWeek()`：获取星期几。
- `getDayOfYear()`：获取一年中的第几天。
- `plusDays(long daysToAdd)`：增加指定的天数。
- `minusDays(long daysToSubtract)`：减少指定的天数。
- `with(TemporalAdjuster adjuster)`：使用指定的TemporalAdjuster调整日期。


## LocalDateTime

LocalDateTime是Java 8中的日期时间类，它表示一个特定的日期和时间。它包含了年、月、日、时、分、秒和毫秒等信息。LocalDateTime对象通常用于表示一个具体的日期和时间，例如2019年12月31日23点59分59秒。它可以用于计算两个日期之间的差值，或者将日期时间转换为不同的时区。

### 常用API和方法

- `of(int year, int month, int dayOfMonth, int hour, int minute, int second, int nanoOfSecond)`：创建一个LocalDateTime对象，指定年、月、日、时、分、秒和毫秒。
- `now()`：获取当前的LocalDateTime对象。
- `getYear()`：获取年份。
- `getMonth()`：获取月份。
- `getDayOfMonth()`：获取日期。
- `getHour()`：获取小时。
- `getMinute()`：获取分钟。
- `getSecond()`：获取秒数。
- `getNano()`：获取纳秒数。
- `plusDays(long daysToAdd)`：增加指定的天数。
- `minusDays(long daysToSubtract)`：减少指定的天数。
- `with(TemporalAdjuster adjuster)`：使用指定的TemporalAdjuster调整日期。

## Instant

Instant是Java 8中的时间戳类，它表示一个特定的时间。它包含了秒数和纳秒数等信息。Instant对象通常用于表示一个特定的时间，例如2023年3月27日00点12分30秒。它可以用于计算两个时间之间的差值，或者将时间戳转换为不同的时区。

### 常用API和方法

- `ofEpochSecond(long epochSecond)`：创建一个Instant对象，指定秒数。
- `now()`：获取当前的Instant对象。
- `getEpochSecond()`：获取秒数。
- `getNano()`：获取纳秒数。
- `plusSeconds(long secondsToAdd)`：增加指定的秒数。
- `minusSeconds(long secondsToSubtract)`：减少指定的秒数。
- `isAfter(Instant otherInstant)`：判断当前时间是否在指定时间之后。
- `isBefore(Instant otherInstant)`：判断当前时间是否在指定时间之前。

## Period

Period是Java 8中的时间段类，它表示两个日期之间的时间差。它包含了年、月和日等信息。Period对象通常用于计算两个日期之间的时间差，例如2019年12月31日和2020年1月1日之间的时间差。它可以用于计算两个日期之间的差值，或者进行日期的加减运算。

### 常用API和方法

- `between(LocalDate startDateInclusive, LocalDate endDateExclusive)`：创建一个Period对象，表示两个日期之间的时间差。
- `getYears()`：获取年数。
- `getMonths()`：获取月数。
- `getDays()`：获取天数。


## Duration

Duration是Java 8中的时间段类，它表示两个时间之间的时间差。它包含了秒数和纳秒数等信息。Duration对象通常用于计算两个时间之间的时间差，例如2023年3月27日00点12分30秒和2023年3月27日00点13分30秒之间的时间差。它可以用于计算两个时间之间的差值，或者进行时间的加减运算。

### 常用API和方法

- `between(Instant startInclusive, Instant endExclusive)`：创建一个Duration对象，表示两个时间之间的时间差。
- `getSeconds()`：获取秒数。
- `getNano()`：获取纳秒数。


## 常见用法和示例

### 日期时间转换

在实际开发中，我们通常需要将日期时间转换为不同的格式或者不同的时区。下面是一些常见的日期时间转换场景。

#### 将日期时间转换为字符串

使用DateTimeFormatter类可以将日期时间转换为指定格式的字符串。例如，将2023年3月27日00点12分30秒转换为字符串：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
LocalDateTime dateTime = LocalDateTime.of(2023, 3, 27, 0, 12, 30);
String str = dateTime.format(formatter);
System.out.println(str); // 输出：2023-03-27 00:12:30
```

#### 将字符串转换为日期时间

使用DateTimeFormatter类可以将字符串转换为指定格式的日期时间。例如，将字符串"2023-03-27 00:12:30"转换为LocalDateTime对象：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String str = "2023-03-27 00:12:30";
LocalDateTime dateTime = LocalDateTime.parse(str, formatter);
System.out.println(dateTime); // 输出：2023-03-27T00:12:30
```

#### 将日期时间转换为指定时区的时间

使用ZonedDateTime类可以将日期时间转换为指定时区的时间。例如，将2023年3月27日00点12分30秒转换为美国纽约时区的时间：

```java
LocalDateTime dateTime = LocalDateTime.of(2023, 3, 27, 0, 12, 30);
ZoneId zoneId = ZoneId.of("America/New_York");
ZonedDateTime zonedDateTime = ZonedDateTime.of(dateTime, zoneId);
System.out.println(zonedDateTime); // 输出：2023-03-26T20:12:30-04:00[America/New_York]
```

### 时间计算

在实际开发中，我们通常需要对日期时间进行加减运算，或者计算两个日期时间之间的时间差。下面是一些常见的时间计算场景。

#### 计算两个日期之间的时间差

使用Period类可以计算两个日期之间的时间差。例如，计算2019年12月31日和2020年1月1日之间的时间差：

```java
LocalDate startDate = LocalDate.of(2019, 12, 31);
LocalDate endDate = LocalDate.of(2020, 1, 1);
Period period = Period.between(startDate, endDate);
System.out.println(period.getDays()); // 输出：1
```

#### 计算两个时间之间的时间差

使用Duration类可以计算两个时间之间的时间差。例如，计算2023年3月27日00点12分30秒和2023年3月27日00点13分30秒之间的时间差：

```java
Instant startInstant = Instant.parse("2023-03-27T00:12:30Z");
Instant endInstant = Instant.parse("2023-03-27T00:13:30Z");
Duration duration = Duration.between(startInstant, endInstant);
System.out.println(duration.getSeconds()); // 输出：60
```

#### 获取某个月份的最后一天

使用TemporalAdjusters类可以获取某个月份的最后一天。例如，获取2023年3月的最后一天：

```java
LocalDate date = LocalDate.of(2023, 3, 1);
LocalDate lastDayOfMonth = date.with(TemporalAdjusters.lastDayOfMonth());
System.out.println(lastDayOfMonth); // 输出：2023-03-31
```

#### 获取某个日期的下一个周一

使用TemporalAdjusters类可以获取某个日期的下一个周一。例如，获取2023年3月27日的下一个周一：

```java
LocalDate date = LocalDate.of(2023, 3, 27);
LocalDate nextMonday = date.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
System.out.println(nextMonday); // 输出：2023-04-03
```

### 最佳实践

在实际开发中，我们应该尽可能使用新的日期时间API，避免使用旧的Date和Calendar类。下面是一些最佳实践的建议。

 - 使用LocalDate代替Date

在Java 8之前，我们通常使用Date类表示日期。然而，Date类有很多问题，例如它是可变的、不是线程安全的、没有时区信息等等。因此，我们应该尽可能使用LocalDate代替Date。

 - 使用LocalDateTime代替Calendar

在Java 8之前，我们通常使用Calendar类表示日期时间。然而，Calendar类也有很多问题，例如它是可变的、不是线程安全的、没有时区信息等等。因此，我们应该尽可能使用LocalDateTime代替Calendar。

 - 使用Instant代替System.currentTimeMillis()

在Java 8之前，我们通常使用System.currentTimeMillis()方法获取当前时间戳。然而，它只能精确到毫秒级别，不够精确。因此，我们应该尽可能使用Instant类代替System.currentTimeMillis()方法。

## 总结

Java 8中的新日期时间API提供了更好的时间处理方式，使得日期时间处理更加简单、易用和可读。在实际开发中，我们应该尽可能使用新的日期时间API，避免使用旧的Date和Calendar类。