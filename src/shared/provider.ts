/**
 * 翻译服务提供商接口
 * 所有 LLM 提供商都需要实现此接口
 */

import { TextChunk, TranslatedChunk, TranslationStatus, TranslationError, ErrorCode } from './types'

/** 翻译选项 */
export interface TranslateOptions {
    /** 目标语言 */
    targetLanguage: string
    /** 源语言（可选，自动检测） */
    sourceLanguage?: string
    /** API Key */
    apiKey: string
    /** 自定义提示词 */
    customPrompt?: string
}

/** 翻译结果 */
export interface TranslateResult {
    success: boolean
    chunks: TranslatedChunk[]
    error?: TranslationError
}

/** 翻译提供商接口 */
export interface TranslationProvider {
    /** 提供商名称 */
    name: string

    /** 翻译一批文本块 */
    translate(chunks: TextChunk[], options: TranslateOptions): Promise<TranslateResult>

    /** 验证 API Key 是否有效 */
    validateApiKey(apiKey: string): Promise<boolean>
}

/** 创建翻译错误 */
export function createTranslationError(
    code: ErrorCode,
    message: string,
    retryable: boolean = false
): TranslationError {
    return { code, message, retryable }
}

/** 将文本块标记为成功翻译 */
export function markAsTranslated(
    chunk: TextChunk,
    translatedText: string
): TranslatedChunk {
    return {
        ...chunk,
        translatedText,
        status: TranslationStatus.SUCCESS,
    }
}

/** 将文本块标记为翻译失败 */
export function markAsFailed(chunk: TextChunk): TranslatedChunk {
    return {
        ...chunk,
        translatedText: '',
        status: TranslationStatus.FAILED,
    }
}
