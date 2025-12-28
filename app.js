/**
 * PDF 白边裁剪器 - 核心应用逻辑
 */

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 兼容 file:// 协议的文件保存函数
function saveAs(blob, filename) {
    // 尝试使用 File System Access API（现代浏览器）
    if (window.showSaveFilePicker) {
        (async () => {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PDF 文件',
                        accept: { 'application/pdf': ['.pdf'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('保存失败:', err);
                }
            }
        })();
    } else {
        // 回退方案：使用传统下载方式
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
}

// 应用状态
const state = {
    pdfFile: null,
    pdfDoc: null,
    pdfBytes: null,
    totalPages: 0,
    currentPage: 1,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    extraMargin: 15,
    isProcessing: false
};

// DOM 元素
const elements = {
    uploadSection: document.getElementById('upload-section'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    processingSection: document.getElementById('processing-section'),
    fileName: document.getElementById('file-name'),
    filePages: document.getElementById('file-pages'),
    progressContainer: document.getElementById('progress-container'),
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),
    controlsPanel: document.getElementById('controls-panel'),
    previewPanel: document.getElementById('preview-panel'),
    marginTop: document.getElementById('margin-top'),
    marginBottom: document.getElementById('margin-bottom'),
    marginLeft: document.getElementById('margin-left'),
    marginRight: document.getElementById('margin-right'),
    extraMargin: document.getElementById('extra-margin'),
    redetectBtn: document.getElementById('redetect-btn'),
    previewOriginal: document.getElementById('preview-original'),
    previewCropped: document.getElementById('preview-cropped'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    currentPage: document.getElementById('current-page'),
    totalPages: document.getElementById('total-pages'),
    resetBtn: document.getElementById('reset-btn'),
    downloadBtn: document.getElementById('download-btn')
};

// 初始化
function init() {
    setupEventListeners();
}

// 设置事件监听
function setupEventListeners() {
    // 上传区域点击
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    
    // 文件选择
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽事件
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    
    // 边距输入
    [elements.marginTop, elements.marginBottom, elements.marginLeft, elements.marginRight].forEach(input => {
        input.addEventListener('change', handleMarginChange);
    });
    elements.extraMargin.addEventListener('change', handleExtraMarginChange);
    
    // 重新检测按钮
    elements.redetectBtn.addEventListener('click', detectMargins);
    
    // 翻页
    elements.prevPage.addEventListener('click', () => changePage(-1));
    elements.nextPage.addEventListener('click', () => changePage(1));
    
    // 重置和下载
    elements.resetBtn.addEventListener('click', reset);
    elements.downloadBtn.addEventListener('click', downloadCroppedPDF);
}

// 处理拖拽经过
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

// 处理拖拽放下
function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        processFile(files[0]);
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// 处理文件
async function processFile(file) {
    state.pdfFile = file;
    state.isProcessing = true;
    
    // 显示处理区域
    elements.uploadSection.classList.add('hidden');
    elements.processingSection.classList.remove('hidden');
    elements.controlsPanel.classList.add('hidden');
    elements.previewPanel.classList.add('hidden');
    elements.progressContainer.classList.remove('hidden');
    
    // 显示文件信息
    elements.fileName.textContent = file.name;
    updateProgress('正在读取文件...', 10);
    
    try {
        // 读取 PDF 字节
        const arrayBuffer = await file.arrayBuffer();
        // 保存原始字节用于后续导出（pdf-lib 使用）
        state.pdfBytes = new Uint8Array(arrayBuffer);
        
        updateProgress('正在解析 PDF...', 30);
        
        // 创建副本给 PDF.js 使用（PDF.js 可能会转移 buffer 所有权）
        const pdfJsCopy = new Uint8Array(state.pdfBytes);
        
        // 加载 PDF 文档
        state.pdfDoc = await pdfjsLib.getDocument({ data: pdfJsCopy }).promise;
        state.totalPages = state.pdfDoc.numPages;
        
        elements.filePages.textContent = `${state.totalPages} 页`;
        elements.totalPages.textContent = state.totalPages;
        
        updateProgress('正在检测白边...', 50);
        
        // 检测白边
        await detectMargins();
        
        updateProgress('处理完成', 100);
        
        // 显示控制面板和预览
        setTimeout(() => {
            elements.progressContainer.classList.add('hidden');
            elements.controlsPanel.classList.remove('hidden');
            elements.previewPanel.classList.remove('hidden');
            state.isProcessing = false;
        }, 500);
        
    } catch (error) {
        console.error('处理 PDF 失败:', error);
        alert('处理 PDF 文件失败，请确保文件有效。');
        reset();
    }
}

// 更新进度
function updateProgress(text, percent) {
    elements.progressText.textContent = text;
    elements.progressFill.style.width = `${percent}%`;
}

// 检测白边 - 采样检测策略
async function detectMargins() {
    const samplePages = getSamplePages();
    let minMargins = null;
    
    for (const pageNum of samplePages) {
        const page = await state.pdfDoc.getPage(pageNum);
        const margins = await detectPageMargins(page);
        
        if (minMargins === null) {
            // 首页初始化
            minMargins = { ...margins };
        } else {
            // 取各页最小边距，避免裁掉内容
            minMargins.top = Math.min(minMargins.top, margins.top);
            minMargins.bottom = Math.min(minMargins.bottom, margins.bottom);
            minMargins.left = Math.min(minMargins.left, margins.left);
            minMargins.right = Math.min(minMargins.right, margins.right);
        }
    }
    
    state.margins = minMargins || { top: 0, bottom: 0, left: 0, right: 0 };
    updateMarginInputs();
    await updatePreview();
}

// 获取采样页面 - 跳过封面/前言，从正文采样
function getSamplePages() {
    const total = state.totalPages;
    const samples = [];
    
    // 跳过前 15 页（避开封面、版权页、前言、目录等）
    const skipPages = Math.min(15, Math.floor(total * 0.1));
    const startPage = skipPages + 1;
    
    if (total <= 20) {
        // 短文档：取中间几页
        samples.push(Math.floor(total / 2));
        if (total > 10) samples.push(Math.floor(total * 0.6));
        if (total > 15) samples.push(Math.floor(total * 0.7));
    } else {
        // 长文档：从正文部分均匀采样
        samples.push(startPage); // 正文起始
        samples.push(Math.floor(total * 0.3)); // 30% 位置
        samples.push(Math.floor(total * 0.5)); // 中间
        samples.push(Math.floor(total * 0.7)); // 70% 位置
    }
    
    return samples.filter(p => p >= 1 && p <= total);
}

// 检测单页白边
async function detectPageMargins(page) {
    const scale = 1.0; // 使用原始尺寸检测
    const viewport = page.getViewport({ scale });
    
    // 创建 canvas 渲染页面
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 渲染页面
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // 获取像素数据
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // 白色阈值（RGB 都大于此值认为是白色，降低阈值更保守）
    const threshold = 245;
    
    // 检测边界
    let top = 0, bottom = 0, left = 0, right = 0;
    
    // 检测上边距
    for (let y = 0; y < height; y++) {
        if (!isRowWhite(data, y, width, threshold)) {
            top = y;
            break;
        }
    }
    
    // 检测下边距
    for (let y = height - 1; y >= 0; y--) {
        if (!isRowWhite(data, y, width, threshold)) {
            bottom = height - 1 - y;
            break;
        }
    }
    
    // 检测左边距
    for (let x = 0; x < width; x++) {
        if (!isColumnWhite(data, x, width, height, threshold)) {
            left = x;
            break;
        }
    }
    
    // 检测右边距
    for (let x = width - 1; x >= 0; x--) {
        if (!isColumnWhite(data, x, width, height, threshold)) {
            right = width - 1 - x;
            break;
        }
    }
    
    return { top, bottom, left, right };
}

// 检查一行是否全白
function isRowWhite(data, y, width, threshold) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] < threshold || data[idx + 1] < threshold || data[idx + 2] < threshold) {
            return false;
        }
    }
    return true;
}

// 检查一列是否全白
function isColumnWhite(data, x, width, height, threshold) {
    for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        if (data[idx] < threshold || data[idx + 1] < threshold || data[idx + 2] < threshold) {
            return false;
        }
    }
    return true;
}

// 更新边距输入框
function updateMarginInputs() {
    elements.marginTop.value = Math.round(state.margins.top);
    elements.marginBottom.value = Math.round(state.margins.bottom);
    elements.marginLeft.value = Math.round(state.margins.left);
    elements.marginRight.value = Math.round(state.margins.right);
}

// 处理边距输入变化
function handleMarginChange() {
    state.margins.top = parseInt(elements.marginTop.value) || 0;
    state.margins.bottom = parseInt(elements.marginBottom.value) || 0;
    state.margins.left = parseInt(elements.marginLeft.value) || 0;
    state.margins.right = parseInt(elements.marginRight.value) || 0;
    updatePreview();
}

// 处理额外边距变化
function handleExtraMarginChange() {
    state.extraMargin = parseInt(elements.extraMargin.value) || 0;
    updatePreview();
}

// 更新预览
async function updatePreview() {
    if (!state.pdfDoc) return;
    
    const page = await state.pdfDoc.getPage(state.currentPage);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    // 渲染原始页面
    const originalCanvas = elements.previewOriginal;
    const originalContext = originalCanvas.getContext('2d');
    originalCanvas.width = viewport.width;
    originalCanvas.height = viewport.height;
    
    await page.render({
        canvasContext: originalContext,
        viewport: viewport
    }).promise;
    
    // 计算裁剪区域（考虑缩放和额外边距）
    const extra = state.extraMargin * scale;
    const cropTop = Math.max(0, state.margins.top * scale - extra);
    const cropBottom = Math.max(0, state.margins.bottom * scale - extra);
    const cropLeft = Math.max(0, state.margins.left * scale - extra);
    const cropRight = Math.max(0, state.margins.right * scale - extra);
    
    const cropWidth = viewport.width - cropLeft - cropRight;
    const cropHeight = viewport.height - cropTop - cropBottom;
    
    // 渲染裁剪后的预览
    const croppedCanvas = elements.previewCropped;
    const croppedContext = croppedCanvas.getContext('2d');
    croppedCanvas.width = Math.max(1, cropWidth);
    croppedCanvas.height = Math.max(1, cropHeight);
    
    croppedContext.drawImage(
        originalCanvas,
        cropLeft, cropTop, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    // 更新页码显示
    elements.currentPage.textContent = state.currentPage;
}

// 翻页
function changePage(delta) {
    const newPage = state.currentPage + delta;
    if (newPage >= 1 && newPage <= state.totalPages) {
        state.currentPage = newPage;
        updatePreview();
    }
}

// 下载裁剪后的 PDF
async function downloadCroppedPDF() {
    if (state.isProcessing) return;
    
    state.isProcessing = true;
    elements.downloadBtn.disabled = true;
    elements.downloadBtn.innerHTML = `
        <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"></circle>
        </svg>
        处理中...
    `;
    
    try {
        const { PDFDocument } = PDFLib;
        
        // 加载原始 PDF
        const pdfDoc = await PDFDocument.load(state.pdfBytes);
        const pages = pdfDoc.getPages();
        
        // 额外边距
        const extra = state.extraMargin;
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            
            // 获取对应的 PDF.js 页面来计算缩放比例
            const pdfJsPage = await state.pdfDoc.getPage(i + 1);
            const viewport = pdfJsPage.getViewport({ scale: 1.0 });
            
            // 计算像素到 PDF 点的比例
            const scaleX = width / viewport.width;
            const scaleY = height / viewport.height;
            
            // 将像素边距转换为 PDF 点，并应用额外边距
            const cropTopPx = Math.max(0, state.margins.top - extra);
            const cropBottomPx = Math.max(0, state.margins.bottom - extra);
            const cropLeftPx = Math.max(0, state.margins.left - extra);
            const cropRightPx = Math.max(0, state.margins.right - extra);
            
            // 转换为 PDF 点
            const cropTop = cropTopPx * scaleY;
            const cropBottom = cropBottomPx * scaleY;
            const cropLeft = cropLeftPx * scaleX;
            const cropRight = cropRightPx * scaleX;
            
            // 计算新的尺寸
            const newWidth = Math.max(1, width - cropLeft - cropRight);
            const newHeight = Math.max(1, height - cropTop - cropBottom);
            
            // PDF 坐标系原点在左下角
            // CropBox 参数：x, y（左下角坐标）, width, height
            page.setCropBox(
                cropLeft,           // 左边距
                cropBottom,         // 底部边距（PDF 的 Y 从下往上）
                newWidth,
                newHeight
            );
            
            // 同时设置 MediaBox
            page.setMediaBox(cropLeft, cropBottom, newWidth, newHeight);
        }
        
        // 导出 PDF
        const croppedPdfBytes = await pdfDoc.save();
        
        // 生成正确的文件名
        const originalName = state.pdfFile.name;
        const newFileName = originalName.replace(/\.pdf$/i, '') + '_cropped.pdf';
        
        // 下载文件
        saveAs(new Blob([croppedPdfBytes], { type: 'application/pdf' }), newFileName);
        
    } catch (error) {
        console.error('导出 PDF 失败:', error);
        alert('导出 PDF 失败: ' + error.message);
    }
    
    state.isProcessing = false;
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        下载裁剪后的 PDF
    `;
}

// 重置
function reset() {
    state.pdfFile = null;
    state.pdfDoc = null;
    state.pdfBytes = null;
    state.totalPages = 0;
    state.currentPage = 1;
    state.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    state.isProcessing = false;
    
    elements.fileInput.value = '';
    elements.uploadSection.classList.remove('hidden');
    elements.processingSection.classList.add('hidden');
}

// 启动应用
init();
