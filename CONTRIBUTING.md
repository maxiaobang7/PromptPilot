# 贡献指南 | Contributing Guide

感谢你对 PromptPilot 的关注！欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

1. 前往 [Issues](https://github.com/your-username/PromptPilot/issues) 页面
2. 点击 **New Issue**
3. 选择 **Bug Report** 模板
4. 尽可能详细地描述问题，包括：
   - 你使用的 Chrome 版本
   - 出现问题的 AI 网站
   - 复现步骤
   - 期望行为与实际行为

### 功能建议

1. 前往 [Issues](https://github.com/your-username/PromptPilot/issues) 页面
2. 点击 **New Issue**
3. 选择 **Feature Request** 模板
4. 描述你期望的功能及使用场景

### 提交代码

1. **Fork** 本仓库
2. 克隆你的 Fork：
   ```bash
   git clone https://github.com/your-fork/PromptPilot.git
   cd PromptPilot
   ```
3. 创建功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. 编写代码并测试
5. 提交更改：
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```
6. 推送到你的 Fork：
   ```bash
   git push origin feature/your-feature-name
   ```
7. 在 GitHub 上创建 **Pull Request**

## 开发指引

### 本地调试

1. 在 Chrome 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」→ 选择项目文件夹
4. 修改代码后，回到扩展页面点击刷新按钮即可热更新

### 项目结构

```
PromptPilot/
├── manifest.json     # 扩展配置
├── background.js     # Service Worker
├── content.js        # 注入到 AI 网站的脚本
├── sidepanel.*       # 侧边面板（HTML + CSS + JS）
└── icons/            # 图标文件
```

### 添加新平台支持

如需支持新的 AI 网站，需要修改以下文件：

1. **manifest.json** — 在 `content_scripts.matches` 和 `host_permissions` 中添加 URL 匹配规则
2. **content.js** — 在 `SITE_CONFIG` 中添加新平台的输入框和发送按钮选择器
3. **background.js** — 在 `getSiteName()` 中添加新平台的名称映射

## 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档变更
- `style:` 样式修改（不影响逻辑）
- `refactor:` 代码重构
- `chore:` 构建工具或辅助工具变动

## 行为准则

请保持友善和尊重。我们希望营造一个开放、包容的社区环境。
