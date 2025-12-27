import { DEFAULT_CONFIG, MessageType, PluginConfig, LLMProvider } from '../shared/types'

// 状态管理
const state: { currentConfig: PluginConfig; isSaving: boolean } = {
    currentConfig: { ...DEFAULT_CONFIG },
    isSaving: false
}

// DOM 元素引用
const elements = {
    modeRadios: () => document.querySelectorAll('input[name="translateMode"]') as NodeListOf<HTMLInputElement>,
    providerSelect: () => document.getElementById('provider') as HTMLSelectElement,
    apiKeyInput: () => document.getElementById('apiKey') as HTMLInputElement,
    concurrencyInput: () => document.getElementById('concurrency') as HTMLInputElement,
    btnSave: () => document.getElementById('btn-save') as HTMLButtonElement,
    toggleApiVisibility: () => document.getElementById('toggleApiVisibility') as HTMLElement,
    toast: () => document.getElementById('toast') as HTMLElement
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig()
    setupEventListeners()
})

async function loadConfig() {
    try {
        // 优先从本地存储读取配置
        const result = await chrome.storage.local.get('pluginConfig')
        if (result.pluginConfig) {
            state.currentConfig = { ...DEFAULT_CONFIG, ...result.pluginConfig }
        } else {
            // 如果没有存储，尝试从 Content Script 获取 (作为兼容)
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tab?.id) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { type: MessageType.GET_CONFIG })
                    if (response) {
                        state.currentConfig = { ...DEFAULT_CONFIG, ...response }
                    }
                } catch (e) {
                    console.log('Content script not ready')
                }
            }
        }
        updateUI()
    } catch (error) {
        console.error('Failed to load config:', error)
        showToast('加载配置失败', 'error')
    }
}

function updateUI() {
    const { currentConfig } = state

    // 设置模式
    const radios = elements.modeRadios()
    radios.forEach(radio => {
        if (radio.value === currentConfig.translateMode) {
            radio.checked = true
        }
    })

    // 设置 Provider
    const providerSelect = elements.providerSelect()
    if (providerSelect) {
        providerSelect.value = currentConfig.provider
    }

    // 设置 API Key
    const apiKeyInput = elements.apiKeyInput()
    if (apiKeyInput) {
        apiKeyInput.value = currentConfig.apiKeys[currentConfig.provider] || ''
    }

    // 设置并发数
    const concurrencyInput = elements.concurrencyInput()
    if (concurrencyInput) {
        concurrencyInput.value = String(currentConfig.concurrency)
    }
}

function setupEventListeners() {
    // 保存按钮
    elements.btnSave()?.addEventListener('click', handleSaveConfig)

    // API Key 可见性切换
    elements.toggleApiVisibility()?.addEventListener('click', () => {
        const input = elements.apiKeyInput()
        if (input.type === 'password') {
            input.type = 'text'
        } else {
            input.type = 'password'
        }
    })

    // Provider 切换时更新 API Key 输入框显示
    elements.providerSelect()?.addEventListener('change', (e) => {
        const provider = (e.target as HTMLSelectElement).value as LLMProvider
        // 保存当前输入的 key 到临时状态
        state.currentConfig.apiKeys[state.currentConfig.provider] = elements.apiKeyInput().value

        // 切换 provider
        state.currentConfig.provider = provider

        // 更新 UI 显示对应 provider 的 key
        elements.apiKeyInput().value = state.currentConfig.apiKeys[provider] || ''
    })
}

async function handleSaveConfig() {
    if (state.isSaving) return
    state.isSaving = true

    const btn = elements.btnSave()
    const originalText = btn.textContent || '保存配置'
    btn.textContent = '保存中...'
    btn.disabled = true

    try {
        // 收集表单数据
        const modeRadio = document.querySelector('input[name="translateMode"]:checked') as HTMLInputElement
        const translateMode = (modeRadio?.value || 'split') as 'split' | 'inline' | 'bilingual'

        const provider = elements.providerSelect().value as LLMProvider
        const apiKey = elements.apiKeyInput().value.trim()
        const concurrency = parseInt(elements.concurrencyInput().value, 10) || 3

        // 更新配置对象
        state.currentConfig.translateMode = translateMode
        state.currentConfig.provider = provider
        state.currentConfig.apiKeys[provider] = apiKey
        state.currentConfig.concurrency = concurrency

        // KEY CHANGE: 保存到本地存储
        await chrome.storage.local.set({ pluginConfig: state.currentConfig })

        // 同时也发送消息通知当前页面更新 (即时生效)
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id) {
            // 忽略错误 (例如在扩展页面或空白页)
            chrome.tabs.sendMessage(tab.id, {
                type: MessageType.SAVE_CONFIG,
                payload: state.currentConfig
            }).catch(() => { })
        }

        showToast('设置已保存 ✨')

    } catch (error) {
        console.error('Save failed:', error)
        showToast('保存失败', 'error')
    } finally {
        state.isSaving = false
        btn.textContent = originalText
        btn.disabled = false
    }
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = elements.toast()
    const msgSpan = document.getElementById('toast-msg')
    if (toast && msgSpan) {
        msgSpan.textContent = message
        toast.style.borderColor = type === 'success' ? '#10b981' : '#ef4444'
        toast.classList.add('show')
        setTimeout(() => {
            toast.classList.remove('show')
        }, 2000)
    }
}
