/**
 * 功能集成模块
 * 整合 PDF、图片、字幕翻译功能到 content script
 */

import { PluginConfig } from '../shared/types'
import { PDFTranslator } from '../services/pdf-translator'
import { PDFOverlay } from './pdf-overlay'
import { ImageTranslator } from '../services/image-translator'
import { ImageOverlay } from './image-overlay'
import { OCRProvider } from '../services/ocr-service'
import { SubtitleTranslator } from '../services/subtitle-translator'
import { SubtitleOverlay } from './subtitle-overlay'
import { YouTubeAdapter } from '../platforms/youtube'
import { BilibiliAdapter } from '../platforms/bilibili'

export class FeatureIntegration {
    private config: PluginConfig
    private pdfOverlay: PDFOverlay | null = null
    private subtitleOverlay: SubtitleOverlay | null = null
    private subtitleObserver: MutationObserver | null = null

    constructor(config: PluginConfig) {
        this.config = config
    }

    /**
     * 初始化所有功能
     */
    async initialize(): Promise<void> {
        // 初始化 PDF 翻译
        if (this.config.enablePdfTranslation && PDFTranslator.isPDFPage()) {
            await this.initializePdfTranslation()
        }

        // 初始化图片翻译（右键菜单）
        if (this.config.enableImageTranslation) {
            this.initializeImageTranslation()
        }

        // 初始化字幕翻译
        if (this.config.enableSubtitleTranslation) {
            await this.initializeSubtitleTranslation()
        }
    }

    /**
     * 初始化 PDF 翻译
     */
    private async initializePdfTranslation(): Promise<void> {
        try {
            console.log('[功能集成] 检测到 PDF 页面，开始初始化 PDF 翻译...')

            const pdfUrl = PDFTranslator.getCurrentPDFUrl()
            if (!pdfUrl) {
                console.log('[功能集成] 无法获取 PDF URL')
                return
            }

            // 加载 PDF
            const pdf = await PDFTranslator.loadPDF(pdfUrl)
            console.log(`[功能集成] PDF 加载成功，共 ${pdf.numPages} 页`)

            // 提取文本
            const textItems = await PDFTranslator.extractAllText(pdf)
            console.log(`[功能集成] 提取到 ${textItems.length} 个文本项`)

            // 转换为翻译块
            const textChunks = PDFTranslator.convertToTextChunks(textItems)
            console.log(`[功能集成] 生成 ${textChunks.length} 个翻译块`)

            // 翻译
            const { TranslationManager } = await import('../services/translator')
            const translationManager = new TranslationManager(this.config)
            const translatedChunks = await translationManager.translateChunks(textChunks)

            // 显示翻译结果
            this.pdfOverlay = new PDFOverlay()
            this.pdfOverlay.renderTranslations(translatedChunks)

            console.log('[功能集成] PDF 翻译完成')
        } catch (error) {
            console.error('[功能集成] PDF 翻译失败:', error)
        }
    }

    /**
     * 初始化图片翻译
     */
    private initializeImageTranslation(): void {
        console.log('[功能集成] 初始化图片翻译功能...')

        // 监听右键菜单事件
        document.addEventListener('contextmenu', (e) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'IMG') {
                // 存储当前右键点击的图片
                (window as any).__currentContextImage = target
            }
        })

        // 监听来自 background 的翻译图片消息
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'TRANSLATE_IMAGE') {
                this.handleImageTranslation()
                sendResponse({ success: true })
            }
            return false
        })
    }

    /**
     * 处理图片翻译
     */
    private async handleImageTranslation(): Promise<void> {
        const img = (window as any).__currentContextImage as HTMLImageElement
        if (!img) {
            console.log('[功能集成] 未找到目标图片')
            return
        }

        try {
            console.log('[功能集成] 开始翻译图片...')

            // 显示加载状态
            ImageOverlay.showLoading(img)

            // 创建图片翻译器
            const ocrProvider = this.config.ocrProvider === 'ocr_space' 
                ? OCRProvider.OCR_SPACE 
                : OCRProvider.TESSERACT

            const imageTranslator = new ImageTranslator(this.config, ocrProvider)

            // 翻译图片
            const result = await imageTranslator.translateImageElement(img)

            // 移除加载状态
            ImageOverlay.removeLoading(img)

            // 显示翻译结果
            ImageOverlay.showBelowImage(img, result)

            console.log('[功能集成] 图片翻译完成')
        } catch (error) {
            console.error('[功能集成] 图片翻译失败:', error)
            ImageOverlay.removeLoading(img)
            alert('图片翻译失败: ' + (error as Error).message)
        }
    }

    /**
     * 初始化字幕翻译
     */
    private async initializeSubtitleTranslation(): Promise<void> {
        // 检测平台
        if (YouTubeAdapter.isYouTubePage()) {
            await this.initializeYouTubeSubtitles()
        } else if (BilibiliAdapter.isBilibiliPage()) {
            await this.initializeBilibiliSubtitles()
        }
    }

    /**
     * 初始化 YouTube 字幕翻译
     */
    private async initializeYouTubeSubtitles(): Promise<void> {
        try {
            console.log('[功能集成] 检测到 YouTube 页面，初始化字幕翻译...')

            // 等待视频加载
            const video = await YouTubeAdapter.waitForVideo()
            console.log('[功能集成] YouTube 视频已加载')

            // 初始化字幕翻译器
            const subtitleTranslator = new SubtitleTranslator(this.config)
            this.subtitleOverlay = new SubtitleOverlay()
            this.subtitleOverlay.initialize(video)

            // 监听字幕变化
            this.subtitleObserver = YouTubeAdapter.observeSubtitles(async (subtitle) => {
                const translated = await subtitleTranslator.translateSubtitle(subtitle)
                this.subtitleOverlay?.updateSubtitle(translated.translatedText)
            })

            console.log('[功能集成] YouTube 字幕翻译已启动')
        } catch (error) {
            console.error('[功能集成] YouTube 字幕翻译初始化失败:', error)
        }
    }

    /**
     * 初始化 Bilibili 字幕翻译
     */
    private async initializeBilibiliSubtitles(): Promise<void> {
        try {
            console.log('[功能集成] 检测到 Bilibili 页面，初始化字幕翻译...')

            // 等待视频加载
            const video = await BilibiliAdapter.waitForVideo()
            console.log('[功能集成] Bilibili 视频已加载')

            // 初始化字幕翻译器
            const subtitleTranslator = new SubtitleTranslator(this.config)
            this.subtitleOverlay = new SubtitleOverlay()
            this.subtitleOverlay.initialize(video)

            // 监听字幕变化
            this.subtitleObserver = BilibiliAdapter.observeSubtitles(async (subtitle) => {
                const translated = await subtitleTranslator.translateSubtitle(subtitle)
                this.subtitleOverlay?.updateSubtitle(translated.translatedText)
            })

            console.log('[功能集成] Bilibili 字幕翻译已启动')
        } catch (error) {
            console.error('[功能集成] Bilibili 字幕翻译初始化失败:', error)
        }
    }

    /**
     * 清理资源
     */
    destroy(): void {
        if (this.pdfOverlay) {
            this.pdfOverlay.destroy()
            this.pdfOverlay = null
        }

        if (this.subtitleOverlay) {
            this.subtitleOverlay.destroy()
            this.subtitleOverlay = null
        }

        if (this.subtitleObserver) {
            this.subtitleObserver.disconnect()
            this.subtitleObserver = null
        }
    }
}
