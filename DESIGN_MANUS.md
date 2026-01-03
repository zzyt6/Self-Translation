# PDF 和图片翻译功能设计文档

## 功能概述

本次更新将为 Self-Translation 添加以下三大功能：

1. **PDF 文件翻译**：通过 PDF.js 解析 PDF 内容并翻译
2. **图片 OCR + 翻译**：调用 OCR API 识别图片文字后翻译
3. **视频字幕翻译**：支持 YouTube、Bilibili 等平台的字幕翻译

## 技术架构

### 1. PDF 翻译模块

**依赖**：
- `pdfjs-dist`：用于解析 PDF 文件

**实现思路**：
- 检测当前页面是否为 PDF 文件（通过 URL 或 Content-Type）
- 使用 PDF.js 提取文本内容
- 将文本分块后调用现有的翻译服务
- 在 PDF 页面上叠加翻译层（overlay）

**文件结构**：
```
src/services/pdf-translator.ts    # PDF 翻译服务
src/content/pdf-overlay.ts        # PDF 翻译层渲染
```

### 2. 图片 OCR + 翻译模块

**依赖**：
- Tesseract.js（客户端 OCR）或 OCR API（如 OCR.space）

**实现思路**：
- 检测页面中的图片元素
- 用户右键点击图片选择"翻译图片"
- 调用 OCR 服务识别图片中的文字
- 将识别结果翻译后显示在图片下方或弹窗中

**文件结构**：
```
src/services/ocr-service.ts       # OCR 服务封装
src/services/image-translator.ts  # 图片翻译服务
src/content/image-overlay.ts      # 图片翻译结果显示
```

### 3. 视频字幕翻译模块

**支持平台**：
- YouTube
- Bilibili
- 其他使用标准字幕格式的视频网站

**实现思路**：
- 检测视频播放器和字幕元素
- 拦截字幕更新事件
- 实时翻译字幕内容
- 在原字幕下方显示翻译（双语字幕）

**文件结构**：
```
src/services/subtitle-translator.ts  # 字幕翻译服务
src/content/subtitle-overlay.ts      # 字幕翻译层渲染
src/platforms/youtube.ts             # YouTube 平台适配
src/platforms/bilibili.ts            # Bilibili 平台适配
```

## UI 更新

### 配置面板新增选项

1. **OCR 服务选择**：
   - Tesseract.js（本地，免费）
   - OCR.space API（在线，需要 API Key）

2. **PDF 翻译设置**：
   - 是否自动检测 PDF 页面
   - 翻译层样式（背景色、透明度）

3. **字幕翻译设置**：
   - 是否启用字幕翻译
   - 字幕位置（下方/上方）

## 实现优先级

1. **第一阶段**：PDF 翻译（核心功能）
2. **第二阶段**：图片 OCR + 翻译
3. **第三阶段**：视频字幕翻译

## 注意事项

- 保持代码风格与现有项目一致
- 所有新功能都应该是可选的（通过配置开关控制）
- 确保不影响现有的网页翻译功能
- 添加错误处理和用户提示
