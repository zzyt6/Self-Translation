/**
 * 共享类型定义
 * 定义插件内各模块间的通信协议
 */

// ============ 文本块结构 ============

/** 文本块 - 表示页面中的一段可翻译文本 */
export interface TextChunk {
    /** 唯一标识符 */
    id: string
    /** 原始文本内容 */
    text: string
    /** 对应的 DOM 节点路径（用于定位） */
    nodePath: string
    /** 在页面中的索引位置 */
    index: number
}

/** 翻译后的文本块 */
export interface TranslatedChunk extends TextChunk {
    /** 翻译后的文本 */
    translatedText: string
    /** 翻译状态 */
    status: TranslationStatus
}

// ============ 翻译状态 ============

export enum TranslationStatus {
    /** 等待翻译 */
    PENDING = 'pending',
    /** 翻译中 */
    TRANSLATING = 'translating',
    /** 翻译成功 */
    SUCCESS = 'success',
    /** 翻译失败 */
    FAILED = 'failed',
    /** 从缓存加载 */
    CACHED = 'cached',
}

// ============ 错误码 ============

export enum ErrorCode {
    /** 未知错误 */
    UNKNOWN = 'UNKNOWN',
    /** 网络错误 */
    NETWORK_ERROR = 'NETWORK_ERROR',
    /** API Key 无效 */
    INVALID_API_KEY = 'INVALID_API_KEY',
    /** 速率限制 */
    RATE_LIMITED = 'RATE_LIMITED',
    /** 请求超时 */
    TIMEOUT = 'TIMEOUT',
    /** 文本过长 */
    TEXT_TOO_LONG = 'TEXT_TOO_LONG',
    /** 不支持的语言 */
    UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
}

/** 翻译错误 */
export interface TranslationError {
    code: ErrorCode
    message: string
    retryable: boolean
}

// ============ 消息通信 ============

/** 消息类型 */
export enum MessageType {
    /** 开始翻译（分屏模式） */
    START_TRANSLATION = 'START_TRANSLATION',
    /** 开始原网页翻译 */
    START_INLINE_TRANSLATION = 'START_INLINE_TRANSLATION',
    /** 开始双语对照翻译 */
    START_BILINGUAL_TRANSLATION = 'START_BILINGUAL_TRANSLATION',
    /** 翻译进度更新 */
    TRANSLATION_PROGRESS = 'TRANSLATION_PROGRESS',
    /** 翻译完成 */
    TRANSLATION_COMPLETE = 'TRANSLATION_COMPLETE',
    /** 翻译失败 */
    TRANSLATION_ERROR = 'TRANSLATION_ERROR',
    /** 恢复原页面 */
    RESTORE_PAGE = 'RESTORE_PAGE',
    /** 获取配置 */
    GET_CONFIG = 'GET_CONFIG',
    /** 保存配置 */
    SAVE_CONFIG = 'SAVE_CONFIG',
}

/** 基础消息结构 */
export interface Message<T = unknown> {
    type: MessageType
    payload: T
}

// ============ 配置 ============

/** LLM 提供商 */
export enum LLMProvider {
    /** DeepSeek */
    DEEPSEEK = 'deepseek',
}

/** 插件配置 */
export interface PluginConfig {
    /** 当前选择的 LLM 提供商 */
    provider: LLMProvider
    /** 各提供商的 API Key */
    apiKeys: Record<string, string>
    /** 目标语言 */
    targetLanguage: string
    /** 并发请求数 */
    concurrency: number
    /** 是否启用缓存 */
    enableCache: boolean
    /** 翻译模式: split(分屏) | inline(原网页/替换) | bilingual(双语对照) */
    translateMode: 'split' | 'inline' | 'bilingual'
    /** 是否启用 PDF 翻译 */
    enablePdfTranslation?: boolean
    /** 是否启用图片翻译 */
    enableImageTranslation?: boolean
    /** 是否启用字幕翻译 */
    enableSubtitleTranslation?: boolean
    /** OCR 提供商 */
    ocrProvider?: 'tesseract' | 'ocr_space'
    /** OCR API Key (用于 OCR.space) */
    ocrApiKey?: string
}

/** 默认配置 */
export const DEFAULT_CONFIG: PluginConfig = {
    provider: LLMProvider.DEEPSEEK,
    apiKeys: {},
    targetLanguage: 'zh-CN',
    concurrency: 3,
    enableCache: true,
    translateMode: 'split',
    enablePdfTranslation: true,
    enableImageTranslation: true,
    enableSubtitleTranslation: true,
    ocrProvider: 'tesseract',
    ocrApiKey: '',
}

// ============ 翻译进度 ============

export interface TranslationProgress {
    /** 总块数 */
    total: number
    /** 已完成块数 */
    completed: number
    /** 失败块数 */
    failed: number
    /** 当前状态 */
    status: 'idle' | 'translating' | 'completed' | 'error'
}
