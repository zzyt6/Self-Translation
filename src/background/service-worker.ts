/**
 * Background Service Worker
 * 处理扩展的后台逻辑，包括消息路由和翻译任务管理
 */

import {
    Message,
    MessageType,
    PluginConfig,
    DEFAULT_CONFIG
} from '@/shared'

console.log('[LLM翻译] Service Worker 已启动')

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
) => {
    console.log('[LLM翻译] 收到消息:', message.type, message.payload)

    switch (message.type) {
        case MessageType.GET_CONFIG:
            handleGetConfig().then(sendResponse)
            return true // 表示异步响应

        case MessageType.SAVE_CONFIG:
            handleSaveConfig(message.payload as Partial<PluginConfig>).then(sendResponse)
            return true

        case MessageType.START_TRANSLATION:
            handleStartTranslation(sender.tab?.id)
            sendResponse({ success: true })
            break

        case MessageType.RESTORE_PAGE:
            handleRestorePage(sender.tab?.id)
            sendResponse({ success: true })
            break

        default:
            console.warn('[LLM翻译] 未知消息类型:', message.type)
    }

    return false
})

/**
 * 获取插件配置
 */
async function handleGetConfig(): Promise<PluginConfig> {
    const result = await chrome.storage.sync.get('config')
    return { ...DEFAULT_CONFIG, ...(result.config as Partial<PluginConfig>) }
}

/**
 * 保存插件配置
 */
async function handleSaveConfig(config: Partial<PluginConfig>): Promise<{ success: boolean }> {
    const currentConfig = await handleGetConfig()
    const newConfig = { ...currentConfig, ...config }
    await chrome.storage.sync.set({ config: newConfig })
    return { success: true }
}

/**
 * 开始翻译
 */
async function handleStartTranslation(tabId?: number) {
    if (!tabId) {
        console.error('[LLM翻译] 无法获取标签页 ID')
        return
    }

    // 向 content script 发送开始翻译的指令
    chrome.tabs.sendMessage(tabId, {
        type: MessageType.START_TRANSLATION,
        payload: {}
    })
}

/**
 * 恢复原页面
 */
async function handleRestorePage(tabId?: number) {
    if (!tabId) {
        console.error('[LLM翻译] 无法获取标签页 ID')
        return
    }

    chrome.tabs.sendMessage(tabId, {
        type: MessageType.RESTORE_PAGE,
        payload: {}
    })
}

// 扩展安装/更新时的处理
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[LLM翻译] 扩展已安装/更新:', details.reason)

    if (details.reason === 'install') {
        // 首次安装，初始化默认配置
        chrome.storage.sync.set({ config: DEFAULT_CONFIG })
    }
})
