# 考研英语 · 每日打卡

> 考研英语备考日常规划 + 打卡追踪，跨设备同步学习进度。

## 功能

- **每日打卡** — 按考研英语题型规划每日任务，完成即打卡
- **任务自定义** — 启用/禁用学习项目，调整每日目标
- **打卡日历** — 月视图查看学习记录
- **统计追踪** — 连续打卡天数、累计天数、各任务完成频次
- **学习资源** — 整合热门英语学习网站/App 快捷入口
- **PWA 支持** — 可添加到桌面离线使用

## 使用

### 在线访问

项目部署在 GitHub Pages 后访问：

```
https://<你的用户名>.github.io/kaoyan-english/
```

### 本地运行

直接打开 `index.html` 即可使用，所有数据存储在浏览器 localStorage 中。

## 技术栈

- 纯 HTML + CSS + JavaScript
- localStorage 本地数据持久化
- PWA (manifest.json + Service Worker)
- 无外部依赖，零构建

## 部署

### 方式一：GitHub Pages

1. 推送代码到 GitHub 仓库
2. 在仓库 Settings → Pages 中选择 `main` 分支的根目录
3. 等待几分钟即可访问

### 方式二：Vercel / Netlify

直接导入该仓库即可自动部署。

## 自定义

编辑 `js/app.js` 中的 `DEFAULT_TASKS` 和 `RESOURCES` 数组可以自定义学习项目和资源链接。

## 数据

数据存储在浏览器 localStorage 中，清除浏览器数据会导致打卡记录丢失。建议定期备份：

1. 打开浏览器开发者工具
2. Application → Local Storage → `kaoyan_english_data`
3. 复制 JSON 内容保存到本地
