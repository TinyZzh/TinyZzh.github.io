---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 如何让Java的文件加载支持有BOM的文件？
date: 2022-10-15 16:32:00 +0800
categories: [JAVA, FileInputStream, BOM]
tags: [JAVA, FileInputStream, BOM]
toc: yes
image_scaling: true
---

Java的FileInputStream提供最基本的文件加载功能。**不支持BOM头**，直接使用会错误的将无意义的BOM信息当做正文内容加载进来。

本文旨在找到通用的方式处理BOM头，并以UTF系列编码为例。需要扩展支持GB 18030等其他字符编码规范定义的特殊BOM，可以自行扩展。

有很多开源库和工具支持UTF系列编码。例如：[Apache Commons-io](https://commons.apache.org/proper/commons-io)。但是不支持GB 18030或者其他编码的BOM，这也是为什么写本文重要原因之一。

```java
try (FileInputStream fis = new FileInputStream(file);
        BomInputStream bis = new BomInputStream(fis);
        BufferedReader reader = new BufferedReader(new InputStreamReader(bis, bis.getBomCharset()))) {
    reader.lines()
            .forEach(line -> /*...*/);
} catch (Exception e) {
    //    handle exception.
}
```

在BOM_PREFIX_ARRAY中定义你所需的BOM头格式。

详细的BomInputStream实现源码：

```java
public final class BomInputStream extends PushbackInputStream {

    private static final int MAX_BOM_SIZE = 4;

    private static final ByteOrderMark[] BOM_PREFIX_ARRAY = new ByteOrderMark[]{
            new ByteOrderMark(Charset.forName("UTF-32BE"), (byte) 0x00, (byte) 0x00, (byte) 0xFE, (byte) 0xFF),
            new ByteOrderMark(Charset.forName("UTF-32LE"), (byte) 0xFF, (byte) 0xFE, (byte) 0x00, (byte) 0x00),
            new ByteOrderMark(StandardCharsets.UTF_8, (byte) 0xEF, (byte) 0xBB, (byte) 0xBF),
            new ByteOrderMark(StandardCharsets.UTF_16BE, (byte) 0xFE, (byte) 0xFF),
            new ByteOrderMark(StandardCharsets.UTF_16LE, (byte) 0xFF, (byte) 0xFE)
    };

    private final Charset charset;

    public BomInputStream(InputStream in) throws IOException {
        super(in, MAX_BOM_SIZE);
        this.charset = this.checkAndSkipBom(in);
    }

    Charset checkAndSkipBom(InputStream in) throws IOException {
        // if file without BOM mark, unread all bytes
        Charset encoding = StandardCharsets.UTF_8;
        int n, unread;
        byte[] bom = new byte[MAX_BOM_SIZE];
        unread = n = in.read(bom, 0, bom.length);
        //
        for (ByteOrderMark mark : BOM_PREFIX_ARRAY) {
            boolean match = true;
            for (int i = 0; i < mark.bytes.length; i++) {
                if (mark.bytes[i] != bom[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                encoding = mark.charset;
                unread = n - mark.bytes.length;
                break;
            }
        }
        if (unread > 0)
            this.unread(bom, (n - unread), unread);
        return encoding;
    }

    public Charset getBomCharset() {
        return this.charset;
    }

    static class ByteOrderMark {

        private final Charset charset;
        private final byte[] bytes;

        public ByteOrderMark(Charset charset, byte... bytes) {
            this.charset = charset;
            this.bytes = bytes;
        }
    }
}
```


### [snakeyaml](https://github.com/snakeyaml/snakeyaml)

假如你的项目中使用**Spring Framework**，那么使用yaml内置的**UnicodeReader**是一个不错的选择。**支持UTF-16和UTF-8，不支持UTF-32的BOM头。** 

> 很多类库会提供UnicodeReader，

UnicodeReader核心方法如下：

```java
protected void init() throws IOException {
    if (this.internalIn2 == null) {
        byte[] bom = new byte[3];
        int n = this.internalIn.read(bom, 0, bom.length);
        Charset encoding;
        int unread;
        if (bom[0] == -17 && bom[1] == -69 && bom[2] == -65) {
            encoding = UTF8;
            unread = n - 3;
        } else if (bom[0] == -2 && bom[1] == -1) {
            encoding = UTF16BE;
            unread = n - 2;
        } else if (bom[0] == -1 && bom[1] == -2) {
            encoding = UTF16LE;
            unread = n - 2;
        } else {
            encoding = UTF8;
            unread = n;
        }

        if (unread > 0) {
            this.internalIn.unread(bom, n - unread, unread);
        }

        CharsetDecoder decoder = encoding.newDecoder().onUnmappableCharacter(CodingErrorAction.REPORT);
        this.internalIn2 = new InputStreamReader(this.internalIn, decoder);
    }
}
```


### [Apache Commons-io](https://commons.apache.org/proper/commons-io)

使用**BOMInputStream**替代。核心加载方法如下：

```java
public int read(byte[] buf, int off, int len) throws IOException {
    int firstCount = 0;
    int b = 0;

    while(len > 0 && b >= 0) {
        b = this.readFirstBytes();
        if (b >= 0) {
            buf[off++] = (byte)(b & 255);
            --len;
            ++firstCount;
        }
    }

    int secondCount = this.in.read(buf, off, len);
    return secondCount < 0 ? (firstCount > 0 ? firstCount : -1) : firstCount + secondCount;
}
```





