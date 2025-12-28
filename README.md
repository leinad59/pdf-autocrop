# pdf-autocrop

<p align="center">
  <img src="screenshots/homepage.png" alt="PDF Autocrop Homepage" width="600">
</p>

<p align="center">
  🔪 一个纯前端运行的 PDF 白边裁剪工具，能够<b>自动</b>检测并移除白边，提升在平板和电子书阅读器上的阅读体验。
</p>

<p align="center">
  <a href="./README_EN.md">English</a> | <b>中文</b>
</p>

<p align="center">
  <a href="#features">功能特性</a> •
  <a href="#demo">演示</a> •
  <a href="#usage">使用方法</a> •
  <a href="#how-it-works">工作原理</a> •
  <a href="#license">开源协议</a>
</p>

---

## <a id="features"></a>✨ 功能特性

- **🤖 自动检测** - 智能采样正文页面，自动识别白边范围
- **📤 拖拽上传** - 支持点击或直接拖拽 PDF 文件上传
- **👀 实时预览** - 裁剪效果前后对比，实时可见
- **⚙️ 手动微调** - 支持对四边边距进行手动精确调整
- **💾 一键导出** - 处理完成后直接在浏览器生成并下载 PDF
- **🔒 隐私安全** - 所有处理均在本地浏览器完成，文件**绝不**上传至服务器

## <a id="demo"></a>📸 演示

### 上传界面

![Homepage](screenshots/homepage.png)

### 处理与预览

![Processing Preview](screenshots/preview.png)

## <a id="usage"></a>🚀 使用方法

1. 在浏览器中打开 `index.html`
2. 拖拽 PDF 文件到上传区域（或点击选择）
3. 等待**自动白边检测**完成
4. 如有需要，可手动调整边距参数
5. 点击「下载裁剪后的 PDF」保存文件

## 🛠️ 技术栈

| 技术 | 用途 |
|------------|---------|
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF 解析与渲染 |
| [pdf-lib](https://pdf-lib.js.org/) | PDF 修改与生成导出 |
| Canvas API | 基于像素分析的边缘检测 |
| File System Access API | 原生文件保存对话框支持 |

## <a id="how-it-works"></a>🧠 工作原理

### 智能采样策略

为了避免扫描每一页（对于大文件会很慢），本工具采取以下策略：

1. **跳过前页**：自动避开封面、版权页、前言、目录等内容稀疏的页面
2. **正文采样**：在文档的 30%、50%、70% 处进行采样检测
3. **保留最小边距**：取各采样页的最小检测边距，防止误裁切内容

### 边缘检测算法

```
1. 将采样页面以 1:1 比例渲染到 Canvas
2. 从边缘向中心扫描像素
3. 找到第一行/列非白色的像素
4. 计算白边距离
5. 应用保守的额外留白（Extra Padding）
```

### PDF 处理

使用 `pdf-lib` 修改所有页面的 `CropBox` 和 `MediaBox`：
- ✅ 非破坏性编辑，保留原始内容
- ✅ 兼容所有标准 PDF 阅读器
- ✅ 保持文件体积最小化

## 📋 浏览器兼容性

| 浏览器 | 支持情况 | 说明 |
|---------|-----------|-------|
| Chrome 86+ | ✅ | 完美支持（含原生保存对话框） |
| Edge 86+ | ✅ | 完美支持（含原生保存对话框） |
| Firefox | ✅ | 支持（使用传统下载方式） |
| Safari | ✅ | 支持（使用传统下载方式） |

## <a id="license"></a>📄 开源协议

[MIT](LICENSE)

## 🤝 参与贡献

欢迎提交 Issues 和 Pull Requests！

---

<p align="center">
  Made with ❤️ for better reading experience
</p>
