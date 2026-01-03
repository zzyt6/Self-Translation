/**
 * Background Service Worker
 * 处理扩展的后台任务和右键菜单
 */

console.log('[Self Translation] Service Worker 已启动')

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Self Translation] 扩展已安装/更新')

    // 创建图片翻译右键菜单
    chrome.contextMenus.create({
        id: 'translate-image',
        title: '翻译此图片 🖼️',
        contexts: ['image'],
    })

    console.log('[Self Translation] 右键菜单已创建')
})

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translate-image' && tab?.id) {
        console.log('[Self Translation] 触发图片翻译')

        // 发送消息到 content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'TRANSLATE_IMAGE',
            imageUrl: info.srcUrl,
        }).catch(error => {
            console.error('[Self Translation] 发送消息失败:', error)
        })
    }
})

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Self Translation] 收到消息:', message.type)

    // 可以在这里处理其他后台任务
    sendResponse({ success: true })
    return false
})
