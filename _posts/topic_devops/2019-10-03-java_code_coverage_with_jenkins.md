---
layout: page
title: DevOps - Java代码增量覆盖率工具
date: 2019-10-03 22:15:00 +0800
categories: [DevOps]
tags: [DevOps]
---

> 相比于全量代码单元测试覆盖率，增量代码单元测试覆盖率，粒度更小，可以帮助开发者精准的了解每个新特性、新功能甚至每次Commit的代码覆盖率。
>  

## 目录

 * [前言](#前言)
 * [1. Codecov](#1-codecov)
 * [2. "定制"测试覆盖率工具](#2-定制测试覆盖率工具)
   * [2.1. 使用JGit进行代码差异分析](#21-使用jgit进行代码差异分析)
   * [2.2. 根据差异统计代码覆盖率变化](#22-根据差异统计代码覆盖率变化)
 * [3. 集成到Jenkins](#3-集成到jenkins)
   * [3.1. 配置单元测试覆盖率插件](#31-配置单元测试覆盖率插件)
   * [3.2. 覆盖率报告图表解析](#32-覆盖率报告图表解析)
 * [4. 总结](#4-总结)


## 前言

今年开始，部门将代码的单元测试覆盖率纳入KPI考核范围。领导定了两个考核指标，一个是整个工程的单元测试覆盖率，另外一个是，每个特性需求的增量测试覆盖率。

## 1. Codecov

[Codecov](https://codecov.io/)是一个代码覆盖率分析网站，旨在通过各个维度和检测指标帮助开发者开发更加健壮的程序。
 
 * 粒度细。全量代码覆盖率报告，针对每个Commit，每个文件的有相对、绝对、增量覆盖率
 * 对GitHub开源项目免费。对GitHub工作流非常友好。集成非常方便。
 * 支持的测试覆盖率工具多。支持的报告种类多。

分析报告非常的详细，针对开源项目而言是不可多得的工具。假如你的项目是开源项目或者能使用此类第三方覆盖率检查报告的话？ **本文的后续内容对您没有任何帮助，可以直接忽略**

## 2. "定制"测试覆盖率工具

公司的老项目，不太方便开源。so没办法享受“免费”的午餐。

搜索Jenkins的测试覆盖率工具。对比如下：


|    | -[Codecov](https://codecov.io/)-   |   -[JaCoCo Plugin](https://github.com/jenkinsci/jacoco-plugin)-   |   -[Code-coverage-api](https://github.com/jenkinsci/code-coverage-api-plugin)-   |
| :----  |  ----: |  ----: |  ----: |
|价格|开源项目免费|免费|免费|
|全量代码覆盖率|  ✔  | ✔|✔|
|代码健康度告警|✔|✔|✔|
|代码覆盖率变化趋势|✔|✔|✔|
|支持的报告种类|非常多|仅JaCoCo|少|
|粒度|代码行|代码行|代码行|
|增量代码覆盖率|✖|✖|✖|
|扩展性|非常强|仅Java|可扩展|


最后选择code-coverage-api-plugin的，基于此插件扩展增量覆盖率的功能。由于新增了依赖，且功能依赖于Git作为版本控制工具，所以此特性被拒绝合并。对此我感到遗憾。所以fork了原仓库的代码，独立发布了此特性功能。言归正传，下面开始干货

### 2.1. 使用JGit进行代码差异分析

要统计本次提交的增量覆盖率首先要能分析代码的增量变化。
我们项目使用的时Git作为版本控制，Git提供了diff工具，可以对比文件的变化。详细参考"git diff"。在此不赘述。

根据git diff的结果进行差异分析。代码如下：

```java
try (Git git = Git.open(new File(gitRepoPath))) {
    Stream<DiffEntry> stream = getDifferentBetweenTwoCommit(git, oldCommit, newCommit);
    if (null == stream)
        return null;
    try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        DiffFormatter df = new DiffFormatter(out);
        // ignores all whitespace
        df.setDiffComparator(RawTextComparator.WS_IGNORE_ALL);
        df.setRepository(git.getRepository());

        List<SourceCodeFile> map = stream.map(diffEntry -> {
            try {
                FileHeader header = df.toFileHeader(diffEntry);
                //  analysis new add code block.
                List<SourceCodeBlock> list = header.getHunks().stream()
                        .flatMap((Function<HunkHeader, Stream<Edit>>) hunk -> hunk.toEditList().stream())
                        .filter(edit -> edit.getEndB() - edit.getBeginB() > 0)
                        .map(edit -> SourceCodeBlock.of(edit.getBeginB(), edit.getEndB()))
                        .collect(Collectors.toList());
                if (list.isEmpty())
                    return null;
                return new SourceCodeFile(diffEntry.getNewPath(), list);
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                out.reset();
            }
        })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        CACHE_MAP.put(cacheKey, map);
        return map;
    }
} catch (Exception e) {
    throw new RuntimeException(e);
}
```

### 2.2. 根据差异统计代码覆盖率变化

根据差异和当前JaCoCo报告做交叉对比。统计出增量代码覆盖率变化。代码如下：

```java
List<CoverageRelativeResultElement> list = report.getChildrenResults()
            .parallelStream()
            .filter(cr -> CoverageElement.FILE.equals(cr.getElement()))
            .filter(cr -> cr.getPaint() != null)
            .map(cr -> scbInfo.stream()
                    .filter(p -> p.getPath().endsWith(cr.getRelativeSourcePath()))
                    .limit(1)
                    .findAny()
                    .map(scf -> {
                        int[] lines = scf.getBlocks()
                                .stream()
                                .flatMapToInt(block -> IntStream.rangeClosed((int) (block.getStartLine() + 1), (int) block.getEndLine())
                                        .filter(line -> cr.getPaint().isPainted(line))
                                ).toArray();
                        //  absolute coverage
                        Map<CoverageElement, Ratio> results = new TreeMap<>();
                        Ratio crHitRatio = analysisLogicHitCoverage(cr.getPaint(), level, cr.getPaint().lines.keys());
                        results.put(CoverageElement.ABSOLUTE, crHitRatio);
                        //  newly code coverage
                        results.put(CoverageElement.RELATIVE, analysisLogicHitCoverage(cr.getPaint(), level, lines));
                        //  coverage change
                        CoverageResult pr = cr.getPreviousResult();
                        if (pr != null) {
                            Ratio prHitRatio = analysisLogicHitCoverage(pr.getPaint(), level, pr.getPaint().lines.keys());
                            if (prHitRatio.numerator != 0.0F) {
                                results.put(CoverageElement.CHANGE, Ratio.create(crHitRatio.getPercentageFloat() - prHitRatio.getPercentageFloat(), 100.0F));
                            }
                        }
                        return new CoverageRelativeResultElement(cr.getName(), cr.getRelativeSourcePath(), results);
                    })
                    .orElse(null)
            )
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
```

## 3. 集成到Jenkins

 checkout源码。编译打包生成hpi安装包。或者使用release版本[code-coverage-api.hpi](https://github.com/TinyZzh/code-coverage-api-plugin/releases/tag/code-coverage-api-releative)

在Jenkins中安装本地插件，选择下载的hpi安装包。

### 3.1. 配置单元测试覆盖率插件
Step 1: 新增Jacoco报告分析工具
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/20191003_1.png" alt="图1"/></div>
覆盖率报告文件路径配置为jacoco生成的xml报告的路径.

Step 2：点开”高级”.  配置增量分析相关的配置.  如下图所示
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/20191003_2.png" alt="图2"/></div>

 * VCS Root Path：源码的版本控制跟路径. 相对于工作空间的路径
 * VCS Branch Name Match RegEx： 匹配需要分析的代码分支.   
 * Coverage Analysis Level：分析级别.  支持行级和逻辑分支两种粒度的覆盖率分析. 


### 3.2. 覆盖率报告图表解析
Jenkins的Job主页会有两个图表。一个是全局的代码覆盖率信息。Y轴为统计粒度（分为代码逻辑分支，代码行，指令，方法，类等等）
第二个为相比于上一次master分支的build新增的代码的覆盖率情况。根据配置的统计粒度显示。
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/20191003_3.png" alt="图3"/></div>

相对报告图标又包含为源分支信息，目标分支信息，本次覆盖率概览和单文件增量覆盖率详情四个维度的信息
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/20191003_4.png" alt="图4"/></div>

 * Absolute：本文件的全量覆盖率信息. 
 * Relative：相比于之前的build的新增的代码的覆盖率
 * Change：本次新增的覆盖率，相对于上一次build的Absolute变化量


点击查看详细文件的覆盖率情况. 类似于Jacoco的html文件报告
<div align="center"><img src="{{site.baseurl}}images/{{page.date | date: "%Y-%m"}}/20191003_5.png" alt="图5"/></div>



## 4. 总结

 Enjoy it !
 End


