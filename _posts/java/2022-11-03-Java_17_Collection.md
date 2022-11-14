---
layout: post
read_time: true
show_date: true
img: images/2022-10/jvm-logo.jpg
title: 详解Java的 不可变集合工厂方法of()
date: 2022-11-03 12:16:00 +0800
categories: [JAVA, Collection]
tags: [JAVA, Collection]
toc: yes
image_scaling: true
---


从 **Java 9** 开始针对 **List，Map，Set** 引入一组新的静态工厂方法 **of()** 用来简化创建 **不可变集合**。


## Java 9 以前

**java.util.Collections** 是Java集合的常用工具，内置提供了很多集合相关的有用方法。

```java
Collections.unmodifiableList();
Collections.unmodifiableCollection();
Collections.unmodifiableMap();
Collections.unmodifiableSet();
Collections.unmodifiableSortedSet();
Collections.unmodifiableNavigableMap();
Collections.unmodifiableNavigableSet();
Collections.unmodifiableSortedMap();
```

Collections提供的 unmodifiable 前缀的一系列方法实现原理是通过装饰器模式，屏蔽掉全部变动相关的接口。

## Java 17的不可变集合

在Java 9以前unmodifiable虽然修饰了屏蔽掉修改方法。但是由于是装饰器模式，所以原始集合是可以修改的, 当原始集合的变动会反馈到不可变包装的集合的显示。而Java 9通过重写并实现了一整套的不可变集合，解决了原始集合的问题。

新的不可变集合在元素数量小于等于**2**时，采用了很精简的结构，**降低了内存开销**。

```java
//  List
static final class List12<E> extends AbstractImmutableList<E>
        implements Serializable {

    @Stable
    private final E e0;

    @Stable
    private final Object e1;

    List12(E e0) {
        this.e0 = Objects.requireNonNull(e0);
        // Use EMPTY as a sentinel for an unused element: not using null
        // enables constant folding optimizations over single-element lists
        this.e1 = EMPTY;
    }

    List12(E e0, E e1) {
        this.e0 = Objects.requireNonNull(e0);
        this.e1 = Objects.requireNonNull(e1);
    }

    @Override
    public int size() {
        return e1 != EMPTY ? 2 : 1;
    }
}
//  Map
static final class Map1<K,V> extends AbstractImmutableMap<K,V> {
    @Stable
    private final K k0;
    @Stable
    private final V v0;

    Map1(K k0, V v0) {
        this.k0 = Objects.requireNonNull(k0);
        this.v0 = Objects.requireNonNull(v0);
    }
}
```

第二点由于是不可变集合，且字段使用finnal修饰，所以**是线程安全**的


### 创建不可变列表

List.of()

```java
@Test
public void testListOf() {
    System.out.println(List.of());
    System.out.println(List.of(1));
    System.out.println(List.of(1,2));
    System.out.println(List.of(1,2,3));
    System.out.println(List.of(1,2,3,4));
    System.out.println(List.of(1,2,3,4,5,6,7,8,9, 10, 11,12));
}

//  []
//  [1]
//  [1, 2]
//  [1, 2, 3]
//  [1, 2, 3, 4]
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

### 创建不可变映射

Map.of()

```java
@Test
public void testMapOf() {
    System.out.println(Map.of());
    System.out.println(Map.of(1, 2));
    System.out.println(Map.of(1,2,3, 4));
    System.out.println(Map.of(1,2,3,4));
    System.out.println(Map.of(1,2,3,4,5,6,7,8,9, 10, 11,12));
    System.out.println(Map.ofEntries(new Map.Entry<Integer, Integer>() {
        @Override
        public Integer getKey() {
            return 1;
        }

        @Override
        public Integer getValue() {
            return 2;
        }

        @Override
        public Integer setValue(Integer value) {
            throw  new UnsupportedOperationException();
        }
    }));
}

//  {}
//  {1=2}
//  {3=4, 1=2}
//  {3=4, 1=2}
//  {5=6, 7=8, 9=10, 11=12, 1=2, 3=4}
//  {1=2}
```

### 创建不可变集

Set.of()

```java
@Test
public void testSetOf() {
    System.out.println(Set.of());
    System.out.println(Set.of(1));
    System.out.println(Set.of(1,2));
    System.out.println(Set.of(1,2,3));
    System.out.println(Set.of(1,2,3,4));
    System.out.println(Set.of(1,2,3,4,5,6,7,8,9, 10, 11,12));
}

//  []
//  [1]
//  [2, 1]
//  [1, 2, 3]
//  [1, 2, 3, 4]
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

## 序列化/反序列化

值得注意的一点是，新的不可变集合序列化/反序列化和普通的**java.util.ArrayList, java.util.HashMap, java.util.HashSet**有很大不同。 不可变集合本身**不支持直接反序列化**，是通过使用 **CollSer** 来实现。

```java
static final class List12<E> extends AbstractImmutableList<E>
        implements Serializable {
    @java.io.Serial
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        throw new InvalidObjectException("not serial proxy");
    }

    @java.io.Serial
    private Object writeReplace() {
        if (e1 == EMPTY) {
            return new CollSer(CollSer.IMM_LIST, e0);
        } else {
            return new CollSer(CollSer.IMM_LIST, e0, e1);
        }
    }
}
```

CollSer将集合转换为数据更紧凑的数组结构，更利于序列化/反序列化。源码如下：

```java
final class CollSer implements Serializable {
    @java.io.Serial
    private static final long serialVersionUID = 6309168927139932177L;

    static final int IMM_LIST       = 1;
    static final int IMM_SET        = 2;
    static final int IMM_MAP        = 3;
    static final int IMM_LIST_NULLS = 4;

    /**
     * Indicates the type of collection that is serialized.
     * The low order 8 bits have the value 1 for an immutable
     * {@code List}, 2 for an immutable {@code Set}, 3 for
     * an immutable {@code Map}, and 4 for an immutable
     * {@code List} that allows null elements.
     *
     * Any other value causes an
     * {@link InvalidObjectException} to be thrown. The high
     * order 24 bits are zero when an instance is serialized,
     * and they are ignored when an instance is deserialized.
     * They can thus be used by future implementations without
     * causing compatibility issues.
     *
     * <p>The tag value also determines the interpretation of the
     * transient {@code Object[] array} field.
     * For {@code List} and {@code Set}, the array's length is the size
     * of the collection, and the array contains the elements of the collection.
     * Null elements are not allowed. For {@code Set}, duplicate elements
     * are not allowed.
     *
     * <p>For {@code Map}, the array's length is twice the number of mappings
     * present in the map. The array length is necessarily even.
     * The array contains a succession of key and value pairs:
     * {@code k1, v1, k2, v2, ..., kN, vN.} Nulls are not allowed,
     * and duplicate keys are not allowed.
     *
     * @serial
     * @since 9
     */
    private final int tag;

    /**
     * @serial
     * @since 9
     */
    private transient Object[] array;


    CollSer(int t, Object... a) {
        tag = t;
        array = a;
    }

    /**
     * Reads objects from the stream and stores them
     * in the transient {@code Object[] array} field.
     *
     * @serialData
     * A nonnegative int, indicating the count of objects,
     * followed by that many objects.
     *
     * @param ois the ObjectInputStream from which data is read
     * @throws IOException if an I/O error occurs
     * @throws ClassNotFoundException if a serialized class cannot be loaded
     * @throws InvalidObjectException if the count is negative
     * @since 9
     */
    @java.io.Serial
    private void readObject(ObjectInputStream ois) throws IOException, ClassNotFoundException {
        ois.defaultReadObject();
        int len = ois.readInt();

        if (len < 0) {
            throw new InvalidObjectException("negative length " + len);
        }

        SharedSecrets.getJavaObjectInputStreamAccess().checkArray(ois, Object[].class, len);
        Object[] a = new Object[len];
        for (int i = 0; i < len; i++) {
            a[i] = ois.readObject();
        }

        array = a;
    }

    /**
     * Writes objects to the stream from
     * the transient {@code Object[] array} field.
     *
     * @serialData
     * A nonnegative int, indicating the count of objects,
     * followed by that many objects.
     *
     * @param oos the ObjectOutputStream to which data is written
     * @throws IOException if an I/O error occurs
     * @since 9
     */
    @java.io.Serial
    private void writeObject(ObjectOutputStream oos) throws IOException {
        oos.defaultWriteObject();
        oos.writeInt(array.length);
        for (int i = 0; i < array.length; i++) {
            oos.writeObject(array[i]);
        }
    }

    private Object readResolve() throws ObjectStreamException {
        try {
            if (array == null) {
                throw new InvalidObjectException("null array");
            }

            // use low order 8 bits to indicate "kind"
            // ignore high order 24 bits
            switch (tag & 0xff) {
                case IMM_LIST:
                    return List.of(array);
                case IMM_LIST_NULLS:
                    return ImmutableCollections.listFromTrustedArrayNullsAllowed(
                            Arrays.copyOf(array, array.length, Object[].class));
                case IMM_SET:
                    return Set.of(array);
                case IMM_MAP:
                    if (array.length == 0) {
                        return ImmutableCollections.EMPTY_MAP;
                    } else if (array.length == 2) {
                        return new ImmutableCollections.Map1<>(array[0], array[1]);
                    } else {
                        return new ImmutableCollections.MapN<>(array);
                    }
                default:
                    throw new InvalidObjectException(String.format("invalid flags 0x%x", tag));
            }
        } catch (NullPointerException|IllegalArgumentException ex) {
            InvalidObjectException ioe = new InvalidObjectException("invalid object");
            ioe.initCause(ex);
            throw ioe;
        }
    }
}
```







