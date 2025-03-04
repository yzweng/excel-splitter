# Excel 表格拆分工具 📊

一个简单易用的 Excel 文件拆分工具，支持按工作表拆分和按内容拆分，让 Excel 文件处理更轻松！

## ✨ 功能特点

- 🔄 支持两种拆分方式：
  - 📑 按工作表拆分：将多个工作表拆分为独立的 Excel 文件
  - 📋 按内容拆分：根据指定列的值将数据拆分为多个文件

- 💡 智能处理：
  - 🎯 自动保留原始格式和样式
  - 📅 完整保留日期格式
  - 🎨 保留单元格背景色和边框
  - 📐 保持列宽和行高设置
  - 🚀 拆分完成后自动打开输出文件夹

- 👀 友好的用户界面：
  - 🖱️ 拖放文件支持
  - 📝 清晰的操作提示
  - 🚦 实时处理进度显示
  - 💬 优雅的消息提示
  - 💾 自动记住用户的拆分方式选择

## 🚀 使用方法

### 按工作表拆分

1. 点击"添加文件"按钮选择 Excel 文件（支持多选）
2. 选择"按工作表拆分"（默认选项）
3. 确认输出目录
4. 点击"开始拆分"
5. 等待处理完成

### 按内容拆分

1. 点击"添加文件"按钮选择 Excel 文件
2. 选择"按内容拆分"
3. 在拆分设置中选择：
   - 要拆分的工作表
   - 用于拆分的列
4. 确认输出目录
5. 点击"开始拆分"
6. 等待处理完成

## 📋 支持的文件格式

- 📗 .xlsx（Excel 2007+）
- 📕 .xls（Excel 97-2003）

## 🎯 使用场景

- 📊 将包含多个工作表的 Excel 文件拆分为单独的文件
- 📈 按部门、类别等字段拆分数据
- 📉 处理大型 Excel 文件，提高文件可管理性
- 📑 数据分类整理与归档

## 💡 小贴士

- 💾 默认输出目录为第一个选择的文件所在目录
- 🔍 可以随时更改输出目录
- 🚫 拆分过程中请勿关闭程序
- ⚡ 支持批量处理多个文件
- 📂 处理完成后自动打开输出文件夹，方便查看结果
- 📝 文件命名规则：
  - 按工作表拆分：`原文件名_工作表名.xlsx`
  - 按内容拆分：`原文件名_工作表名_拆分列名_值.xlsx`
- 🔄 插件会记住您上次选择的拆分方式，下次打开时自动应用

## 🛠️ 技术特点

- 🎯 使用 xlsx-style 库确保样式完整保留
- 🔄 支持大文件处理
- 💪 保持原始文件格式
- ⚡ 高效的文件处理机制
- 💾 使用 uTools 数据库保存用户配置

## 📝 更新日志

### v1.1.0
- ✨ 添加用户配置保存功能，记住上次的拆分方式
- 🛠️ 修复按工作表拆分时样式丢失问题
- 🔄 优化文件命名规则，添加工作表名和列名
- 📂 拆分完成后自动打开输出文件夹
- 🎨 优化界面样式，提升用户体验

### v1.0.0
- 🎉 首次发布
- ✨ 支持按工作表拆分
- ✨ 支持按内容拆分
- 🎨 完整的样式保留
- 💬 友好的消息提示系统

## 🤝 反馈与支持

如果您在使用过程中遇到任何问题，或有任何建议，欢迎通过以下方式反馈：

- 📮 在 uTools 插件中心评论
- ⭐ 给插件打分 