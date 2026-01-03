/**
 * 图片翻译结果显示
 * 在图片下方或弹窗中显示翻译结果
 */

import { ImageTranslationResult } from '../services/image-translator'

export class ImageOverlay {
    /**
     * 在图片下方显示翻译结果
     */
    static showBelowImage(img: HTMLImageElement, result: ImageTranslationResult): void {
        // 移除已存在的翻译结果
        this.removeTranslation(img)

        const container = document.createElement('div')
        container.className = 'image-translation-result'
        container.style.cssText = `
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 16px;
            margin-top: 12px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `

        // 标题
        const header = document.createElement('div')
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `

        const title = document.createElement('span')
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: #667eea;
        `
        title.textContent = '🖼️ 图片翻译'

        const closeBtn = document.createElement('button')
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `
        closeBtn.textContent = '关闭'
        closeBtn.addEventListener('click', () => {
            container.remove()
        })

        header.appendChild(title)
        header.appendChild(closeBtn)
        container.appendChild(header)

        // 原文
        if (result.originalText) {
            const originalSection = document.createElement('div')
            originalSection.style.cssText = `
                margin-bottom: 12px;
            `

            const originalLabel = document.createElement('div')
            originalLabel.style.cssText = `
                font-size: 12px;
                color: #94a3b8;
                margin-bottom: 6px;
            `
            originalLabel.textContent = '原文:'

            const originalText = document.createElement('div')
            originalText.style.cssText = `
                font-size: 13px;
                line-height: 1.6;
                color: #cbd5e1;
                background: rgba(255, 255, 255, 0.05);
                padding: 10px;
                border-radius: 6px;
            `
            originalText.textContent = result.originalText

            originalSection.appendChild(originalLabel)
            originalSection.appendChild(originalText)
            container.appendChild(originalSection)
        }

        // 译文
        const translationSection = document.createElement('div')

        const translationLabel = document.createElement('div')
        translationLabel.style.cssText = `
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 6px;
        `
        translationLabel.textContent = '译文:'

        const translationText = document.createElement('div')
        translationText.style.cssText = `
            font-size: 14px;
            line-height: 1.6;
            color: #f1f5f9;
            background: rgba(102, 126, 234, 0.1);
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        `
        translationText.textContent = result.translatedText

        translationSection.appendChild(translationLabel)
        translationSection.appendChild(translationText)
        container.appendChild(translationSection)

        // 置信度信息
        if (result.confidence) {
            const confidenceInfo = document.createElement('div')
            confidenceInfo.style.cssText = `
                margin-top: 10px;
                font-size: 11px;
                color: #64748b;
                text-align: right;
            `
            confidenceInfo.textContent = `识别置信度: ${Math.round(result.confidence)}%`
            container.appendChild(confidenceInfo)
        }

        // 插入到图片后面
        img.parentElement?.insertBefore(container, img.nextSibling)
    }

    /**
     * 在弹窗中显示翻译结果
     */
    static showInModal(result: ImageTranslationResult): void {
        // 创建遮罩层
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        `

        // 创建弹窗
        const modal = document.createElement('div')
        modal.style.cssText = `
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 16px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `

        // 标题
        const header = document.createElement('div')
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `

        const title = document.createElement('h2')
        title.style.cssText = `
            font-size: 20px;
            font-weight: 700;
            color: #667eea;
            margin: 0;
        `
        title.textContent = '🖼️ 图片翻译结果'

        const closeBtn = document.createElement('button')
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #f1f5f9;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `
        closeBtn.textContent = '关闭'
        closeBtn.addEventListener('click', () => {
            overlay.remove()
        })

        header.appendChild(title)
        header.appendChild(closeBtn)
        modal.appendChild(header)

        // 内容（与 showBelowImage 类似）
        const content = document.createElement('div')
        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">原文:</div>
                <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px;">
                    ${result.originalText}
                </div>
            </div>
            <div>
                <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">译文:</div>
                <div style="font-size: 15px; line-height: 1.6; color: #f1f5f9; background: rgba(102, 126, 234, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #667eea;">
                    ${result.translatedText}
                </div>
            </div>
        `

        modal.appendChild(content)

        overlay.appendChild(modal)
        document.body.appendChild(overlay)

        // 点击遮罩层关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove()
            }
        })
    }

    /**
     * 移除图片下方的翻译结果
     */
    static removeTranslation(img: HTMLImageElement): void {
        const next = img.nextSibling
        if (
            next &&
            next instanceof HTMLElement &&
            next.className === 'image-translation-result'
        ) {
            next.remove()
        }
    }

    /**
     * 显示加载状态
     */
    static showLoading(img: HTMLImageElement): HTMLDivElement {
        const loading = document.createElement('div')
        loading.className = 'image-translation-loading'
        loading.style.cssText = `
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 16px;
            margin-top: 12px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
            text-align: center;
            font-size: 14px;
        `
        loading.innerHTML = `
            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(102, 126, 234, 0.3); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 8px;">正在识别和翻译图片...</div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `

        img.parentElement?.insertBefore(loading, img.nextSibling)
        return loading
    }

    /**
     * 移除加载状态
     */
    static removeLoading(img: HTMLImageElement): void {
        const next = img.nextSibling
        if (
            next &&
            next instanceof HTMLElement &&
            next.className === 'image-translation-loading'
        ) {
            next.remove()
        }
    }
}
