/**
 * DeepSeek 翻译服务提供商
 * 使用 DeepSeek Chat API 进行翻译
 */

import { TextChunk, TranslatedChunk, ErrorCode } from '../shared/types'
import {
    TranslationProvider,
    TranslateOptions,
    TranslateResult,
    createTranslationError,
    markAsTranslated,
    markAsFailed
} from '../shared/provider'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

/** DeepSeek API 请求体 */
interface DeepSeekRequest {
    model: string
    messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
    }>
    temperature?: number
    max_tokens?: number
    stream?: boolean
}

/** DeepSeek API 响应体 */
interface DeepSeekResponse {
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
        index: number
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }>
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

/** DeepSeek 错误响应 */
interface DeepSeekError {
    error: {
        message: string
        type: string
        code: string
    }
}

export class DeepSeekProvider implements TranslationProvider {
    name = 'DeepSeek'

    private model = 'deepseek-chat'

    /**
     * 翻译一批文本块
     */
    async translate(chunks: TextChunk[], options: TranslateOptions): Promise<TranslateResult> {
        if (chunks.length === 0) {
            return { success: true, chunks: [] }
        }

        try {
            // 构建翻译请求
            const textsToTranslate = chunks.map((chunk, index) =>
                `[${index}] ${chunk.text}`
            ).join('\n\n')

            const systemPrompt = this.buildSystemPrompt(options)
            const userPrompt = this.buildUserPrompt(textsToTranslate, chunks.length)

            const response = await this.callAPI(options.apiKey, systemPrompt, userPrompt)

            if (!response.ok) {
                const errorData = await response.json() as DeepSeekError
                return this.handleAPIError(errorData, chunks)
            }

            const data = await response.json() as DeepSeekResponse
            const translatedTexts = this.parseResponse(data, chunks.length)

            // 构建翻译结果
            const translatedChunks: TranslatedChunk[] = chunks.map((chunk, index) => {
                const translatedText = translatedTexts[index]
                if (translatedText) {
                    return markAsTranslated(chunk, translatedText)
                } else {
                    return markAsFailed(chunk)
                }
            })

            return {
                success: true,
                chunks: translatedChunks,
            }

        } catch (error) {
            console.error('[DeepSeek] 翻译失败:', error)
            return {
                success: false,
                chunks: chunks.map(chunk => markAsFailed(chunk)),
                error: createTranslationError(
                    ErrorCode.NETWORK_ERROR,
                    error instanceof Error ? error.message : '网络请求失败',
                    true
                ),
            }
        }
    }

    /**
     * 验证 API Key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await this.callAPI(apiKey, 'You are a helpful assistant.', 'Hello')
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * 调用 DeepSeek API
     */
    private async callAPI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<Response> {
        const request: DeepSeekRequest = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            stream: false,
        }

        return fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(request),
        })
    }

    /**
     * 构建系统提示词
     */
    private buildSystemPrompt(options: TranslateOptions): string {
        const targetLang = options.targetLanguage === 'zh-CN' ? '简体中文' : options.targetLanguage

        return `你是一位精通各类科技领域（编程、工程、科学）的专业翻译专家。任务是将给定的技术文本翻译成${targetLang}。

这是一项对准确性要求极高的任务，请严格遵守以下【核心翻译规则】：

1. **【绝对保留实体】(最高优先级)**
   - **基于特征识别保留**：凡是具有代码特征、特定格式的词，一律保留原文。
     - 包含符号的词：比如带点(.)、下划线(_)、括号()、井号(#)（如 \`torch.nn\`, \`user_id\`, \`render()\`, \`#header\`）。
     - 混合大小写(驼峰)的词：如 \`tensorAttributes\`, \`XMLHttpRequest\`, \`iPhone\`。
     - 全大写的常量/缩写：如 \`CUDA\`, \`HTTP\`, \`JSON\`。
     - 文件路径、URL、版本号。

2. **【智能术语处理】**
   - **通用术语**：如 "Database"->"数据库"，"Algorithm"->"算法"，请进行标准翻译。
   - **专有名词/特定概念**：
     - 若该词在特定领域有固定且无歧义的中文译名（如 "Neural Network"->"神经网络"），请翻译。
     - **关键规则**：若该词是特定框架/系统的核心概念，或者中文翻译容易产生歧义（如 "Tensor", "Embedding", "Middleware", "Layout", "Schema"），**请保留原文**，或使用 "中文(原文)" 格式。
     - **原则：宁可保留英文，也不要强行意译**。

3. **【语体要求】**
   - 译文应专业、简洁，符合技术人员阅读习惯。
   - 严禁把代码里的英文单词强行翻译成中文（例如不要把 \`padding\` 翻译成 \`垫充\`）。

4. **【格式要求】**
   - **必须**保留原文开头的序号标记 [数字]，格式为：[数字] 翻译后的文本
   - 每段翻译独占一行。
   - 不要添加额外的解释。`
    }

    /**
     * 构建用户提示词
     */
    private buildUserPrompt(texts: string, count: number): string {
        return `请翻译以下 ${count} 段文本：

${texts}`
    }

    /**
     * 解析 API 响应
     */
    private parseResponse(data: DeepSeekResponse, expectedCount: number): string[] {
        const content = data.choices[0]?.message?.content || ''
        const results: string[] = []

        // 解析 [index] 格式的翻译结果
        const lines = content.split('\n').filter(line => line.trim())

        for (let i = 0; i < expectedCount; i++) {
            const pattern = new RegExp(`\\[${i}\\]\\s*(.+)`, 's')

            // 查找匹配的行
            for (const line of lines) {
                const match = line.match(pattern)
                if (match) {
                    results[i] = match[1].trim()
                    break
                }
            }

            // 如果没找到，尝试按行顺序匹配
            if (!results[i] && lines[i]) {
                // 移除可能的序号前缀
                results[i] = lines[i].replace(/^\[\d+\]\s*/, '').trim()
            }
        }

        return results
    }

    /**
     * 处理 API 错误
     */
    private handleAPIError(errorData: DeepSeekError, chunks: TextChunk[]): TranslateResult {
        const errorMessage = errorData.error?.message || '未知错误'
        const errorCode = errorData.error?.code || ''

        let code = ErrorCode.UNKNOWN
        let retryable = false

        if (errorCode.includes('invalid_api_key') || errorCode.includes('authentication')) {
            code = ErrorCode.INVALID_API_KEY
        } else if (errorCode.includes('rate_limit')) {
            code = ErrorCode.RATE_LIMITED
            retryable = true
        } else if (errorCode.includes('timeout')) {
            code = ErrorCode.TIMEOUT
            retryable = true
        }

        return {
            success: false,
            chunks: chunks.map(chunk => markAsFailed(chunk)),
            error: createTranslationError(code, errorMessage, retryable),
        }
    }
}

// 导出单例
export const deepseekProvider = new DeepSeekProvider()
