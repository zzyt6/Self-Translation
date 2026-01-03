/**
 * OCR 服务
 * 支持 Tesseract.js (本地) 和 OCR.space API (在线)
 */

import Tesseract from 'tesseract.js'

export interface OCRResult {
    text: string
    confidence: number
    language: string
}

export enum OCRProvider {
    TESSERACT = 'tesseract',
    OCR_SPACE = 'ocr_space',
}

export class OCRService {
    private provider: OCRProvider
    private apiKey?: string

    constructor(provider: OCRProvider = OCRProvider.TESSERACT, apiKey?: string) {
        this.provider = provider
        this.apiKey = apiKey
    }

    /**
     * 识别图片中的文字
     */
    async recognizeImage(imageSource: string | File | Blob): Promise<OCRResult> {
        if (this.provider === OCRProvider.TESSERACT) {
            return this.recognizeWithTesseract(imageSource)
        } else if (this.provider === OCRProvider.OCR_SPACE) {
            return this.recognizeWithOCRSpace(imageSource)
        }

        throw new Error('不支持的 OCR 提供商')
    }

    /**
     * 使用 Tesseract.js 识别图片
     */
    private async recognizeWithTesseract(
        imageSource: string | File | Blob
    ): Promise<OCRResult> {
        try {
            console.log('[OCR] 使用 Tesseract.js 识别图片...')

            const result = await Tesseract.recognize(imageSource, 'eng+chi_sim', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] 识别进度: ${Math.round(m.progress * 100)}%`)
                    }
                },
            })

            return {
                text: result.data.text,
                confidence: result.data.confidence,
                language: 'auto',
            }
        } catch (error) {
            console.error('[OCR] Tesseract 识别失败:', error)
            throw new Error('图片识别失败')
        }
    }

    /**
     * 使用 OCR.space API 识别图片
     */
    private async recognizeWithOCRSpace(
        imageSource: string | File | Blob
    ): Promise<OCRResult> {
        if (!this.apiKey) {
            throw new Error('未配置 OCR.space API Key')
        }

        try {
            console.log('[OCR] 使用 OCR.space API 识别图片...')

            const formData = new FormData()

            if (typeof imageSource === 'string') {
                formData.append('url', imageSource)
            } else {
                formData.append('file', imageSource)
            }

            formData.append('apikey', this.apiKey)
            formData.append('language', 'eng')
            formData.append('isOverlayRequired', 'false')

            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.IsErroredOnProcessing) {
                throw new Error(data.ErrorMessage?.[0] || '识别失败')
            }

            const text = data.ParsedResults?.[0]?.ParsedText || ''

            return {
                text: text.trim(),
                confidence: 0.9, // OCR.space 不返回置信度
                language: 'auto',
            }
        } catch (error) {
            console.error('[OCR] OCR.space 识别失败:', error)
            throw new Error('图片识别失败')
        }
    }

    /**
     * 从图片元素提取图片数据
     */
    static async extractImageData(img: HTMLImageElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                reject(new Error('无法创建 Canvas 上下文'))
                return
            }

            canvas.width = img.naturalWidth || img.width
            canvas.height = img.naturalHeight || img.height

            ctx.drawImage(img, 0, 0)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('无法提取图片数据'))
                }
            }, 'image/png')
        })
    }

    /**
     * 检测图片语言
     */
    static detectLanguage(text: string): 'en' | 'zh' | 'mixed' {
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g)
        const englishChars = text.match(/[a-zA-Z]/g)

        const chineseCount = chineseChars ? chineseChars.length : 0
        const englishCount = englishChars ? englishChars.length : 0

        if (chineseCount > englishCount * 2) {
            return 'zh'
        } else if (englishCount > chineseCount * 2) {
            return 'en'
        } else {
            return 'mixed'
        }
    }
}
