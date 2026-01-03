/**
 * 字幕翻译服务
 * 支持实时翻译视频字幕
 */

import { TranslationManager } from './translator'
import { TextChunk, PluginConfig } from '../shared/types'

export interface SubtitleItem {
    id: string
    text: string
    startTime: number
    endTime: number
}

export interface TranslatedSubtitle extends SubtitleItem {
    translatedText: string
}

export class SubtitleTranslator {
    private translationManager: TranslationManager
    private cache: Map<string, string> = new Map()

    constructor(config: PluginConfig) {
        this.translationManager = new TranslationManager(config)
    }

    /**
     * 翻译单条字幕
     */
    async translateSubtitle(subtitle: SubtitleItem): Promise<TranslatedSubtitle> {
        // 检查缓存
        const cached = this.cache.get(subtitle.text)
        if (cached) {
            return {
                ...subtitle,
                translatedText: cached,
            }
        }

        try {
            const textChunk: TextChunk = {
                id: subtitle.id,
                text: subtitle.text,
                nodePath: 'subtitle://',
                index: 0,
            }

            const translatedChunks = await this.translationManager.translateChunks([
                textChunk,
            ])

            if (translatedChunks.length > 0 && translatedChunks[0].status === 'success') {
                const translatedText = translatedChunks[0].translatedText
                this.cache.set(subtitle.text, translatedText)

                return {
                    ...subtitle,
                    translatedText,
                }
            }

            throw new Error('翻译失败')
        } catch (error) {
            console.error('[字幕翻译] 失败:', error)
            return {
                ...subtitle,
                translatedText: subtitle.text, // 失败时返回原文
            }
        }
    }

    /**
     * 批量翻译字幕
     */
    async translateSubtitles(subtitles: SubtitleItem[]): Promise<TranslatedSubtitle[]> {
        const textChunks: TextChunk[] = subtitles.map((subtitle, index) => ({
            id: subtitle.id,
            text: subtitle.text,
            nodePath: 'subtitle://',
            index,
        }))

        const translatedChunks = await this.translationManager.translateChunks(textChunks)

        return subtitles.map((subtitle, index) => {
            const chunk = translatedChunks[index]
            const translatedText =
                chunk.status === 'success' ? chunk.translatedText : subtitle.text

            // 缓存成功的翻译
            if (chunk.status === 'success') {
                this.cache.set(subtitle.text, translatedText)
            }

            return {
                ...subtitle,
                translatedText,
            }
        })
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear()
    }
}
