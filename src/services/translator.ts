/**
 * 翻译服务管理器
 * 统一管理所有翻译提供商
 */

import { LLMProvider, TextChunk, TranslatedChunk, PluginConfig } from '../shared/types'
import { TranslationProvider, TranslateOptions } from '../shared/provider'
import { DeepSeekProvider } from './deepseek'
import { chunkArray, delay } from '../shared/utils'

/** 提供商实例映射 */
const providers: Record<LLMProvider, TranslationProvider> = {
    [LLMProvider.DEEPSEEK]: new DeepSeekProvider(),
}

/** 翻译进度回调 */
export type ProgressCallback = (completed: number, total: number, failed: number) => void

/** 翻译管理器 */
export class TranslationManager {
    private config: PluginConfig
    private cache: Map<string, string> = new Map()

    constructor(config: PluginConfig) {
        this.config = config
    }

    /**
     * 翻译文本块
     * 支持并发控制和进度回调
     */
    async translateChunks(
        chunks: TextChunk[],
        onProgress?: ProgressCallback
    ): Promise<TranslatedChunk[]> {
        const provider = providers[this.config.provider]
        const apiKey = this.config.apiKeys[this.config.provider]

        if (!apiKey) {
            throw new Error('未配置 API Key')
        }

        const options: TranslateOptions = {
            targetLanguage: this.config.targetLanguage,
            apiKey,
        }

        // 检查缓存
        const uncachedChunks: TextChunk[] = []
        const cachedResults: Map<number, TranslatedChunk> = new Map()

        if (this.config.enableCache) {
            chunks.forEach((chunk, index) => {
                const cacheKey = this.getCacheKey(chunk.text)
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    cachedResults.set(index, {
                        ...chunk,
                        translatedText: cached,
                        status: 'cached' as any,
                    })
                } else {
                    uncachedChunks.push(chunk)
                }
            })
        } else {
            uncachedChunks.push(...chunks)
        }

        console.log(`[翻译管理器] 共 ${chunks.length} 块，缓存命中 ${cachedResults.size} 块`)

        // 分批翻译未缓存的块
        const batchSize = 5 // 每批最多5个文本块
        const batches = chunkArray(uncachedChunks, batchSize)

        let completed = cachedResults.size
        let failed = 0
        const translatedMap: Map<string, TranslatedChunk> = new Map()

        // 并发控制
        const concurrency = this.config.concurrency

        for (let i = 0; i < batches.length; i += concurrency) {
            const batchGroup = batches.slice(i, i + concurrency)

            const results = await Promise.all(
                batchGroup.map(batch => provider.translate(batch, options))
            )

            // 处理结果
            for (const result of results) {
                for (const translatedChunk of result.chunks) {
                    translatedMap.set(translatedChunk.id, translatedChunk)

                    if (translatedChunk.status === 'success') {
                        // 缓存成功的翻译
                        if (this.config.enableCache) {
                            const cacheKey = this.getCacheKey(translatedChunk.text)
                            this.cache.set(cacheKey, translatedChunk.translatedText)
                        }
                        completed++
                    } else {
                        failed++
                    }
                }
            }

            // 报告进度
            onProgress?.(completed, chunks.length, failed)

            // 批次间延迟，避免触发速率限制
            if (i + concurrency < batches.length) {
                await delay(500)
            }
        }

        // 合并结果
        const finalResults: TranslatedChunk[] = chunks.map((chunk, index) => {
            // 优先使用缓存
            if (cachedResults.has(index)) {
                return cachedResults.get(index)!
            }
            // 查找翻译结果
            return translatedMap.get(chunk.id) || {
                ...chunk,
                translatedText: '',
                status: 'failed' as any,
            }
        })

        return finalResults
    }

    /**
     * 生成缓存键
     */
    private getCacheKey(text: string): string {
        // 简单的哈希函数
        let hash = 0
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return `${this.config.provider}:${this.config.targetLanguage}:${hash.toString(36)}`
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear()
    }

    /**
     * 更新配置
     */
    updateConfig(config: PluginConfig): void {
        this.config = config
    }
}
