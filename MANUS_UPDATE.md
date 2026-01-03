# Self Translation - Manus 版本更新说明

## 版本信息

- **版本号**: v1.1.0
- **分支名**: manus_create
- **更新日期**: 2026-01-04

## 新增功能

本次更新为 Self Translation 添加了三大核心功能，极大地扩展了插件的应用场景。

### 1. 📝 PDF 文件翻译

**功能描述**：
- 自动检测 PDF 页面并提取文本内容
- 使用 PDF.js 解析 PDF 文件
- 在侧边栏显示按页分组的翻译结果
- 支持多页 PDF 文档的完整翻译

**使用方法**：
1. 在浏览器中打开 PDF 文件
2. 插件会自动检测并开始翻译
3. 翻译结果显示在右侧侧边栏中
4. 点击"关闭"按钮可以隐藏翻译面板

**技术实现**：
- 使用 `pdfjs-dist` 库解析 PDF
- 智能分段和段落识别
- 保留原文排版结构

### 2. 🖼️ 图片 OCR + 翻译

**功能描述**：
- 支持识别图片中的文字（OCR）
- 自动翻译识别出的文字
- 支持两种 OCR 引擎：
  - **Tesseract.js**：本地免费，无需 API Key
  - **OCR.space**：在线 API，识别准确度更高

**使用方法**：
1. 在网页中找到包含文字的图片
2. 右键点击图片，选择"翻译此图片 🖼️"
3. 等待识别和翻译完成
4. 翻译结果会显示在图片下方

**配置选项**：
- 在插件配置面板中选择 OCR 提供商
- 如果使用 OCR.space，需要配置 API Key
- 可以通过复选框启用/禁用图片翻译功能

### 3. 🎥 视频字幕翻译

**功能描述**：
- 实时翻译视频字幕
- 支持主流视频平台：
  - YouTube
  - Bilibili
- 在原字幕下方显示翻译（双语字幕）

**使用方法**：
1. 打开 YouTube 或 Bilibili 视频
2. 确保视频已启用字幕
3. 插件会自动检测并开始翻译字幕
4. 翻译字幕会实时显示在视频下方

**技术实现**：
- 使用 MutationObserver 监听字幕变化
- 平台适配器模式，支持不同视频网站
- 智能缓存，避免重复翻译

## 配置面板更新

### 新增配置项

1. **高级功能开关**：
   - ✅ PDF 翻译（默认启用）
   - ✅ 图片翻译（默认启用）
   - ✅ 字幕翻译（默认启用）

2. **OCR 设置**：
   - OCR 提供商选择（Tesseract.js / OCR.space）
   - OCR.space API Key 配置（可选）

### UI 改进

- 配置面板新增"高级功能"和"OCR 设置"两个区域
- 使用复选框控制功能开关，更加直观
- OCR API Key 输入框根据选择的提供商自动显示/隐藏

## 技术架构

### 新增文件

```
src/
├── services/
│   ├── pdf-translator.ts          # PDF 翻译服务
│   ├── ocr-service.ts              # OCR 服务封装
│   ├── image-translator.ts         # 图片翻译服务
│   └── subtitle-translator.ts      # 字幕翻译服务
├── content/
│   ├── pdf-overlay.ts              # PDF 翻译层渲染
│   ├── image-overlay.ts            # 图片翻译结果显示
│   ├── subtitle-overlay.ts         # 字幕翻译层渲染
│   └── feature-integration.ts      # 功能集成模块
└── platforms/
    ├── youtube.ts                  # YouTube 平台适配
    └── bilibili.ts                 # Bilibili 平台适配
```

### 新增依赖

- `pdfjs-dist`: PDF 解析库
- `tesseract.js`: 客户端 OCR 引擎

### 权限更新

在 `manifest.json` 中新增：
- `contextMenus`: 用于创建右键菜单

## 安装和使用

### 从源码构建

```bash
# 克隆 manus_create 分支
git clone -b manus_create https://github.com/zzyt6/Self-Translation.git
cd Self-Translation

# 安装依赖
npm install

# 构建项目
npm run build

# 加载到 Chrome
# 1. 打开 chrome://extensions
# 2. 启用"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 dist 文件夹
```

### 配置说明

1. **基础配置**（必需）：
   - DeepSeek API Key：用于翻译功能
   - 并发数：控制翻译速度（1-10）

2. **高级功能**（可选）：
   - 根据需要启用/禁用 PDF、图片、字幕翻译
   - 选择 OCR 提供商（推荐使用 Tesseract.js）

3. **OCR 配置**（可选）：
   - 如果使用 OCR.space，需要在 [OCR.space](https://ocr.space/ocrapi) 注册并获取 API Key

## 使用场景

### 学术阅读

- **PDF 论文翻译**：快速理解英文学术论文
- **图表翻译**：识别论文中的图表文字

### 技术文档

- **GitHub README 翻译**：理解开源项目文档
- **技术博客翻译**：阅读英文技术文章

### 视频学习

- **YouTube 教程翻译**：学习国外技术教程
- **Bilibili 字幕翻译**：观看外语视频

### 日常浏览

- **图片文字翻译**：翻译社交媒体上的图片文字
- **网页翻译**：保持原有的三种翻译模式

## 注意事项

1. **PDF 翻译**：
   - 仅支持文本型 PDF，扫描版 PDF 需要先进行 OCR
   - 大型 PDF 文件可能需要较长时间处理

2. **图片翻译**：
   - Tesseract.js 首次使用时需要下载语言包（约 2-3MB）
   - 图片质量会影响 OCR 识别准确度
   - 建议使用清晰、对比度高的图片

3. **字幕翻译**：
   - 需要视频已启用字幕功能
   - 翻译会有轻微延迟（取决于网络和 API 响应速度）
   - 目前仅支持 YouTube 和 Bilibili

4. **性能考虑**：
   - 新功能会增加一定的资源消耗
   - 可以通过配置面板关闭不需要的功能
   - 建议根据实际使用场景选择性启用

## 已知问题

1. PDF 翻译在某些复杂排版的 PDF 中可能出现段落识别不准确
2. 图片 OCR 对手写文字和艺术字体识别效果较差
3. 字幕翻译在快速切换视频时可能需要重新加载页面

## 未来计划

- [ ] 支持更多视频平台（Netflix、腾讯视频等）
- [ ] 优化 PDF 排版识别算法
- [ ] 添加图片翻译结果的编辑功能
- [ ] 支持批量图片翻译
- [ ] 添加翻译历史记录

## 贡献者

- **原作者**: zzyt6 & ZedongCao
- **Manus 版本开发**: Manus AI Agent

## 反馈与支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues: https://github.com/zzyt6/Self-Translation/issues
- Email: zouzhenyu03@gmail.com

---

**感谢使用 Self Translation！**
