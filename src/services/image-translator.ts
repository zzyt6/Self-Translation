/**
 * 图片翻译服务
 * 结合 OCR 和翻译服务实现图片翻译
 */

import { OCRService, OCRProvider } from './ocr-service'
import { TranslationManager } from './translator'
import { TextChunk, PluginConfig } from '../shared/types'

export interface ImageTranslationResult {
    originalText: string
    translatedText: string
    confidence: number
    language: string
}

export class ImageTranslator {
    private ocrService: OCRService
    private translationManager: TranslationManager

    constructor(config: PluginConfig, ocrProvider: OCRProvider = OCRProvider.TESSERACT) {
        this.ocrService = new OCRService(ocrProvider)
        this.translationManager = new TranslationManager(config)
    }

    /**
     * 翻译图片
     */
    async translateImage(
        imageSource: string | File | Blob
    ): Promise<ImageTranslationResult> {
        try {
            // 步骤 1: OCR 识别图片文字
            console.log('[图片翻译] 开始识别图片文字...')
            const ocrResult = await this.ocrService.recognizeImage(imageSource)

            if (!ocrResult.text.trim()) {
                throw new Error('未识别到文字内容')
            }

            console.log('[图片翻译] 识别结果:', ocrResult.text)

            // 步骤 2: 翻译识别的文字
            console.log('[图片翻译] 开始翻译...')
            const textChunk: TextChunk = {
                id: 'image-translation',
                text: ocrResult.text,
                nodePath: 'image://',
                index: 0,
            }

            const translatedChunks = await this.translationManager.translateChunks([
                textChunk,
            ])

            if (translatedChunks.length === 0 || translatedChunks[0].status !== 'success') {
                throw new Error('翻译失败')
            }

            return {
                originalText: ocrResult.text,
                translatedText: translatedChunks[0].translatedText,
                confidence: ocrResult.confidence,
                language: ocrResult.language,
            }
        } catch (error) {
            console.error('[图片翻译] 失败:', error)
            throw error
        }
    }

    /**
     * 从图片元素翻译
     */
    async translateImageElement(img: HTMLImageElement): Promise<ImageTranslationResult> {
        const imageBlob = await OCRService.extractImageData(img)
        return this.translateImage(imageBlob)
    }

    /**
     * 从图片 URL 翻译
     */
    async translateImageUrl(url: string): Promise<ImageTranslationResult> {
        return this.translateImage(url)
    }
}
