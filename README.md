# pdf-autocrop

<p align="center">
  <img src="screenshots/homepage.png" alt="PDF Autocrop Homepage" width="600">
</p>

<p align="center">
  🔪 A browser-based PDF margin cropper that <b>automatically</b> detects and removes white margins for better reading on tablets and e-readers.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#usage">Usage</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

- **🤖 Auto Detection** - Intelligently detects white margins by sampling content pages
- **📤 Drag & Drop** - Simply drag your PDF file to upload
- **👀 Live Preview** - Compare before and after side by side
- **⚙️ Fine Tuning** - Manually adjust margins if needed
- **💾 One-Click Export** - Download the cropped PDF instantly
- **🔒 Privacy First** - All processing happens locally in your browser, no file upload to any server

## 📸 Demo

### Upload Interface

![Homepage](screenshots/homepage.png)

### Processing & Preview

![Processing Preview](screenshots/preview.png)

## 🚀 Usage

1. Open `index.html` in your browser
2. Drag & drop a PDF file (or click to select)
3. Wait for **automatic margin detection**
4. Adjust margins if needed
5. Click "Download" to save the cropped PDF

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF rendering and parsing |
| [pdf-lib](https://pdf-lib.js.org/) | PDF manipulation and export |
| Canvas API | Margin detection via pixel analysis |
| File System Access API | Native save dialog support |

## 🧠 How It Works

### Smart Sampling Strategy

Instead of scanning every page (which would be slow for large books), the tool:

1. **Skips front matter** (cover, copyright, preface, table of contents)
2. **Samples from content pages** (at 30%, 50%, 70% of the document)
3. **Takes minimum margins** across samples to avoid cutting off any content

### Margin Detection Algorithm

```
1. Render sampled pages to canvas at 1:1 scale
2. Scan pixels from edges inward
3. Find first non-white pixel row/column
4. Calculate margin distances
5. Apply conservative extra padding
```

### PDF Processing

Uses `pdf-lib` to modify `CropBox` and `MediaBox` on all pages, which:
- ✅ Preserves original content (non-destructive)
- ✅ Works with all PDF viewers
- ✅ Keeps file size minimal

## 📋 Browser Compatibility

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 86+ | ✅ | Full support with native save dialog |
| Edge 86+ | ✅ | Full support with native save dialog |
| Firefox | ✅ | Works, fallback download method |
| Safari | ✅ | Works, fallback download method |

## 📄 License

[MIT](LICENSE)

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

<p align="center">
  Made with ❤️ for better reading experience
</p>
