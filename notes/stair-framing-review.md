---
title: 薄霧城 · 楼梯名称与取景复核
subtitle: 2026-11-18 · 当前 feature 分支
lang: zh
file: stair-framing-review
template: doc
theme: paper
---
## A 问题与证据
本次修复位于 `codex/local-inspection-location-sync`。

| 用户看到的问题 | 原因与证据 | 修复 |
| --- | --- | --- |
| 画面已经是楼梯，名称仍是兵具间 | 相机尚未跨过房间边界，注视方向已改变 | 入口名称结合相机位置与注视方向判定 |
| 上楼时画面被梁和楼板遮住 | 镜头提前侧转；中心射线在2.44米处命中楼板底面 | 两段楼梯先沿台阶向上看，到平台后再转向 |

原始记录：`tests/stair-before.json`。
前一次停点检查漏掉了楼梯中途取景。
兵具间停点也已转向盔甲陈列。
自由观察继续保留当前位置，返回恢复原镜头。

## B 桌面实际截图
1440 × 960，Chrome。
从兵具间、楼梯入口到两层平台，名称随画面更新。

![桌面：兵具间、楼梯入口、上楼途中与两层平台](/Users/zhanghong1/Documents/workspace/opera/welldone/tests/stair-after-desktop-contact.png)

## C 窄屏实际截图
390 × 844，DPR 2，Chrome触摸模拟。
楼梯进入画面时，名称显示天守楼梯。

![窄屏：楼梯入口与名称同步显示](/Users/zhanghong1/Documents/workspace/opera/welldone/tests/stair-after-narrow-stair-reveal.png)

## D 验证与复测
| 检查范围 | 结果 |
| --- | --- |
| 楼梯取景、名称与楼层 | 35项通过，含正向和反向滚动 |
| 上楼中间视线 | 每种视口202个位置、1010条射线 |
| 附近楼板底面遮挡 | 中心区域射线未命中5米内朝下楼板面 |
| 路线与原地观察 | 36个关键点，169项通过 |
| 既有全站回归 | 39项通过，含路线净空与地面支撑 |

射线检查是采样验证，范围限于预设楼梯路线。
未验证实体手机、Safari或Firefox。
结果文件：`tests/stair-after.json`。

本地服务仍在 [127.0.0.1:4180](http://127.0.0.1:4180/)。
刷新页面后，通过底部章节切到兵具间。
向下滚动，检查楼梯入口、上楼途中和平台。
再向上滚动，检查名称是否同步恢复。
