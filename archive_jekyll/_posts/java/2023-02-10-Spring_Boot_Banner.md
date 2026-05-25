---
layout: post
read_time: true
show_date: true
img: images/2023-02/spring-boot-logo.png
title: 简析Spring Boot启动时控制台打印logo的实现原理
date: 2023-02-10 12:16:00 +0800
categories: [JAVA, SpringBoot, Banner]
tags: [JAVA, SpringBoot, Banner]
toc: yes
image_scaling: true
mermaid: true
---

Spring Boot应用程序启动之后都会在输出的日志中打印具有独特表示的logo和版本信息。示例如下：

```powershell
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v2.5.14)
```

那么它究竟是如何实现的呢？带着这种好奇和疑问，开始正文。


## Spring Boot实现方案

打印输出的核心关键工具类是**SpringBootBanner**。源码如下：

```java
class SpringBootBanner implements Banner {

	private static final String[] BANNER = { "", "  .   ____          _            __ _ _",
			" /\\\\ / ___'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\", "( ( )\\___ | '_ | '_| | '_ \\/ _` | \\ \\ \\ \\",
			" \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )", "  '  |____| .__|_| |_|_| |_\\__, | / / / /",
			" =========|_|==============|___/=/_/_/_/" };

	private static final String SPRING_BOOT = " :: Spring Boot :: ";

	private static final int STRAP_LINE_SIZE = 42;

	@Override
	public void printBanner(Environment environment, Class<?> sourceClass, PrintStream printStream) {
		for (String line : BANNER) {
			printStream.println(line);
		}
		String version = SpringBootVersion.getVersion();
		version = (version != null) ? " (v" + version + ")" : "";
		StringBuilder padding = new StringBuilder();
		while (padding.length() < STRAP_LINE_SIZE - (version.length() + SPRING_BOOT.length())) {
			padding.append(" ");
		}

		printStream.println(AnsiOutput.toString(AnsiColor.GREEN, SPRING_BOOT, AnsiColor.DEFAULT, padding.toString(),
				AnsiStyle.FAINT, version));
		printStream.println();
	}
}
```

### 自定义Spring Boot Banner


Spring Boot提供了 **spring.banner.location** 支持玩家自定义banner，支持图片格式（banner.gif, banner.jpg, banner.png），也支持文本格式(banner.txt)。

```yml
spring:
    banner:
        charset: utf-8
        location: classpath:banner.txt    # banner文本文件路径
        image:    # banner图片文件路径
            location: classpath:banner.png
            width: 80
            margin: 1
            invert: false
	main:
		banner-mode: "off"
```

可以通过[Banner生成器](https://devops.datenkollektiv.de/banner.txt/index.html) 在线生成想要的字符文字效果。

Banner中提供了几个变量占位符，用来丰富打印的数据内容。列表如下：

|变量|描述|
|:--:|:--:|
|${application.version}|应用程序的版本号|
|${application.formatted-version}||
|${spring-boot.version}|Spring Boot版本号|
|${spring-boot.formatted-version}||
|${Ansi.NAME} (or ${AnsiColor.NAME}, ${AnsiBackground.NAME}, ${AnsiStyle.NAME})|ANSI设置|
|${application.title}|应用程序标题|


Banner有一个输出模式的控制开关，内置三种模式 **OFF**(关闭)， **CONSOLE**(仅控制台), **LOG**(追加日志)

```java
public interface Banner {

	/**
	 * Print the banner to the specified print stream.
	 * @param environment the spring environment
	 * @param sourceClass the source class for the application
	 * @param out the output print stream
	 */
	void printBanner(Environment environment, Class<?> sourceClass, PrintStream out);

	/**
	 * An enumeration of possible values for configuring the Banner.
	 */
	enum Mode {

		/**
		 * Disable printing of the banner.
		 */
		OFF,

		/**
		 * Print the banner to System.out.
		 */
		CONSOLE,

		/**
		 * Print the banner to the log file.
		 */
		LOG

	}

}
//    通过SpringApplication设置定制的Banner实例
//    SpringApplication.setBanner(…​)
```

控制Banner输出的核心业务方法如下：

```java
private Banner printBanner(ConfigurableEnvironment environment) {
    if (this.bannerMode == Banner.Mode.OFF) {
        return null;
    }
    ResourceLoader resourceLoader = (this.resourceLoader != null) ? this.resourceLoader
            : new DefaultResourceLoader(null);
    SpringApplicationBannerPrinter bannerPrinter = new SpringApplicationBannerPrinter(resourceLoader, this.banner);
    if (this.bannerMode == Mode.LOG) {
        return bannerPrinter.print(environment, this.mainApplicationClass, logger);
    }
    return bannerPrinter.print(environment, this.mainApplicationClass, System.out);
}
```


## 定制个人项目的专属Banner

了解Spring Boot的实现方案后，我就可以在项目中实现自定义的Banner。

```java
public enum StructBanner {

    INSTANCE;

    private static final Logger LOGGER = LoggerFactory.getLogger(StructBanner.class);

    /**
     * font: doom
     * content: "*Struct>>>"
     */
    private static final String[] BANNER = {
            "    _    _____ _                   _  ______   ",
            " /\\| |/\\/  ___| |                 | | \\ \\ \\ \\  ",
            " \\ ` ' /\\ `--.| |_ _ __ _   _  ___| |_ \\ \\ \\ \\ ",
            "|_     _|`--. \\ __| '__| | | |/ __| __| > > > >",
            " / , . \\/\\__/ / |_| |  | |_| | (__| |_ / / / / ",
            " \\/|_|\\/\\____/ \\__|_|   \\__,_|\\___|\\__/_/_/_/  "
    };

    private static final String STRUCT_STORE_SERVICE = " :: Struct Store Service :: ";
    private static final String VERSION = loadVersionProperties();

    /**
     * Print struct store service banner.
     */
    public void print() {
        PrintStream ps = System.out;
        for (String line : BANNER) {
            ps.println(line);
        }
        ps.println(STRUCT_STORE_SERVICE + "    (" + getVersion() + ")");
    }

    /**
     * Get struct library version.
     *
     * @return Struct library version.
     */
    public String getVersion() {
        return VERSION;
    }

    static String loadVersionProperties() {
        Properties prop = new Properties();
        try (InputStream in = StructBanner.class.getResourceAsStream("/META-INF/maven/org.structutil/struct-spring/pom.properties")) {
            prop.load(in);
            return prop.getProperty("version", "Unknown");
        } catch (Throwable e) {
            LOGGER.error("");
        }
        return "Unknown";
    }

}
```

打印输出结果：

```powershell
    _    _____ _                   _  ______   
 /\| |/\/  ___| |                 | | \ \ \ \  
 \ ` ' /\ `--.| |_ _ __ _   _  ___| |_ \ \ \ \ 
|_     _|`--. \ __| '__| | | |/ __| __| > > > >
 / , . \/\__/ / |_| |  | |_| | (__| |_ / / / / 
 \/|_|\/\____/ \__|_|   \__,_|\___|\__/_/_/_/  
 :: Struct Store Service ::     (Unknown)
```









