# Changelog

本项目的所有重要更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.3.0] - 2026-04-06

### Changed
- 扩展名称更新为「PromptPilot - 图钉AI 提示词管理器」
- 安装包文件名统一为 `PromptPilot`
- 添加开源所需文件：LICENSE、.gitignore、CHANGELOG、README（中英双语）

---

## [1.2.0] - 2026-04-06

### Added
- 变量重命名功能：点击变量标签可内联编辑名称，自动批量替换提示词中的所有引用
- 变量快捷删除：变量标签新增 × 按钮，一键移除提示词中该变量的所有占位符

### Improved
- 变量标签升级为交互式组件，支持 hover 高亮、点击重命名、删除操作
- 重命名支持 Enter 确认 / Esc 取消键盘操作

---

## [1.1.0] - 2026-04-06

### Added
- 变量快捷插入工具栏：选中文字可直接转为变量，也可在光标处插入新变量
- 首页底部新增「@图钉AI导航」推广链接，跳转至 tudingai.com

### Improved
- 编辑页面交互优化，工具栏支持键盘快捷操作（Enter 确认 / Esc 取消）

---

## [1.0.0] - 2026-04-06

### Added
- 首次发布
- 提示词的增删改查及分类管理
- 变量模板系统（`{{变量名}}` 语法）
- 侧边面板 UI（深色主题）
- 一键填充到 AI 对话输入框
- 可选自动发送功能
- JSON 格式导入/导出
- 变量实时预览
- 支持平台：DeepSeek、ChatGPT、Google Gemini、Claude、腾讯元宝
