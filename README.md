<div align="center">

# PromptPilot ✈️

### 图钉AI 提示词管理器

**存储、管理和一键自动填充 AI 对话提示词的 Chrome 浏览器扩展**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://github.com/maxiaobang7/PromptPilot)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=flat-square)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.3.0-orange?style=flat-square)](manifest.json)

[English](#english) · [中文](#中文)

---

</div>

<a name="中文"></a>

## ✨ 功能亮点

- 🗂️ **提示词管理** — 创建、编辑、删除、搜索提示词，支持分类归档
- 🔖 **变量模板系统** — 用 `{{变量名}}` 标记动态内容，使用时快速替换，无需改动原文
- ⚡ **一键填充** — 侧边面板点击即填充到 AI 对话输入框
- 🚀 **自动发送** — 可选填充后自动提交消息
- ✏️ **变量交互管理** — 支持变量重命名、快捷删除、默认值设定
- 📦 **导入/导出** — JSON 格式一键备份与恢复
- 👁️ **实时预览** — 填写变量时即时预览最终效果

## 🌐 支持平台

| 平台 | 网址 | 状态 |
|:---:|------|:---:|
| DeepSeek | `chat.deepseek.com` | ✅ |
| ChatGPT | `chatgpt.com` / `chat.openai.com` | ✅ |
| Google Gemini | `gemini.google.com` | ✅ |
| Claude | `claude.ai` | ✅ |
| 腾讯元宝 | `yuanbao.tencent.com` | ✅ |

## 📸 界面截图

> 💡 安装扩展后截图，放入 `screenshots/` 文件夹，然后取消下方注释即可显示

<!--
| 侧边面板主界面 | 变量模板填写 | 提示词编辑 |
|:---:|:---:|:---:|
| ![主界面](screenshots/main.png) | ![变量填写](screenshots/variables.png) | ![编辑](screenshots/edit.png) |
-->

## 📥 安装方法

### 方法一：从源码安装（推荐）

1. **下载项目**

   ```bash
   git clone https://github.com/maxiaobang7/PromptPilot.git
   ```

2. **打开 Chrome 扩展管理页面**

   在地址栏输入 `chrome://extensions/` 并回车

3. **开启开发者模式**

   点击页面右上角的「开发者模式」开关

4. **加载扩展**

   点击「加载已解压的扩展程序」，选择克隆下来的 `PromptPilot` 文件夹

5. **完成**

   PromptPilot 图标会出现在浏览器工具栏中，点击即可打开侧边面板

### 方法二：下载 ZIP

1. 点击本页面绿色的 **Code** 按钮 → **Download ZIP**
2. 解压 ZIP 文件
3. 按照上述步骤 2-5 加载解压后的文件夹

## 🚀 使用指南

### 基本用法

1. 访问任意支持的 AI 网站（如 ChatGPT、Claude 等）
2. 点击浏览器工具栏中的 PromptPilot 图标，打开侧边面板
3. 点击 **+** 按钮创建新的提示词
4. 点击提示词卡片即可一键填充到对话框

### 变量模板

在提示词内容中使用 `{{变量名}}` 标记需要动态替换的部分：

```
请帮我审查以下 {{编程语言}} 代码，关注 {{审查重点}} 方面的问题：

{{代码内容}}
```

使用时，PromptPilot 会弹出变量填写界面，输入各变量值后一键填充，无需每次都修改整段提示词。

### 变量管理

- **添加变量** — 在编辑页面，选中文字点击「转为变量」，或直接在光标处插入新变量
- **重命名变量** — 点击检测到的变量标签名称，输入新名称即可批量替换
- **删除变量** — 点击变量标签上的 × 按钮，一键移除所有相关占位符
- **设置默认值** — 为每个变量预设默认值，减少重复输入

### 自动发送

底部开启「自动发送」开关后，填充提示词的同时会自动点击发送按钮。

### 导入 / 导出

点击工具栏的导入/导出按钮，可以将所有提示词导出为 JSON 文件进行备份，也可以从 JSON 文件导入提示词。

## 🏗️ 项目结构

```
PromptPilot/
├── manifest.json        # 扩展配置文件 (Manifest V3)
├── background.js        # Service Worker 后台脚本
├── content.js           # 内容脚本（注入 AI 网站）
├── content.css          # 内容脚本样式
├── sidepanel.html       # 侧边面板页面
├── sidepanel.css        # 侧边面板样式
├── sidepanel.js         # 侧边面板交互逻辑
├── icons/               # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── screenshots/         # 截图（用于 README 展示）
├── LICENSE              # MIT 开源协议
├── .gitignore           # Git 忽略规则
├── CHANGELOG.md         # 更新日志
└── README.md            # 项目说明
```

## 🛠️ 技术栈

- **Chrome Extension Manifest V3** — 最新扩展规范
- **Vanilla JavaScript** — 零框架依赖，轻量高效
- **Chrome Side Panel API** — 原生侧边面板体验
- **Chrome Storage API** — 本地数据持久化存储

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

### 提交规范

本项目推荐遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 前缀 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | 修复 Bug |
| `docs:` | 文档更新 |
| `style:` | 样式调整 |
| `refactor:` | 重构代码 |

## 📋 路线图

- [ ] Chrome Web Store 上架
- [ ] 支持提示词文件夹 / 多级分类
- [ ] 支持更多 AI 平台（Kimi、通义千问等）
- [ ] 提示词社区分享功能
- [ ] 深色 / 浅色主题切换
- [ ] 多语言界面支持（i18n）
- [ ] 快捷键支持

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源，可自由使用、修改和分发。

## 🔗 相关链接

- 🌐 [图钉AI导航](https://www.tudingai.com/) — 发现更多优质 AI 工具
- 🐛 [提交 Bug](https://github.com/maxiaobang7/PromptPilot/issues)
- 💬 [讨论区](https://github.com/maxiaobang7/PromptPilot/discussions)

---

<a name="english"></a>

## English

### What is PromptPilot?

PromptPilot is a Chrome browser extension for storing, managing, and one-click auto-filling AI chat prompts. Save your frequently used prompt templates, fill them into AI chat inputs with one click via the side panel, and optionally auto-send.

### Key Features

- **Prompt Management** — Create, edit, delete, search and categorize prompts
- **Variable Template System** — Use `{{variable}}` placeholders for dynamic content
- **One-Click Fill** — Click a prompt card to instantly fill the AI chat input
- **Auto-Send** — Optionally send the prompt automatically after filling
- **Interactive Variables** — Rename, delete, and set defaults for template variables
- **Import / Export** — Backup and restore all prompts as JSON

### Supported Platforms

ChatGPT · Claude · Google Gemini · DeepSeek · 腾讯元宝 (Tencent Yuanbao)

### Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `PromptPilot` folder
5. The PromptPilot icon will appear in your toolbar — click to open the side panel

### License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

**If you find this useful, please give it a ⭐ Star!**

Made with ❤️ by [图钉AI](https://www.tudingai.com/)

</div>
