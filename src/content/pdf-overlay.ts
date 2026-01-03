/**
 * PDF 翻译层渲染
 * 在 PDF 页面上叠加翻译内容
 */

import { TranslatedChunk } from '../shared/types'

export class PDFOverlay {
    private overlayContainer: HTMLDivElement | null = null
    private translationMap: Map<string, string> = new Map()

    /**
     * 初始化翻译层
     */
    initialize(): void {
        if (this.overlayContainer) {
            return
        }

        this.overlayContainer = document.createElement('div')
        this.overlayContainer.id = 'pdf-translation-overlay'
        this.overlayContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
            overflow: hidden;
        `

        document.body.appendChild(this.overlayContainer)
    }

    /**
     * 渲染翻译结果
     */
    renderTranslations(chunks: TranslatedChunk[]): void {
        if (!this.overlayContainer) {
            this.initialize()
        }

        // 清空现有内容
        this.overlayContainer!.innerHTML = ''

        // 存储翻译映射
        for (const chunk of chunks) {
            if (chunk.status === 'success') {
                this.translationMap.set(chunk.id, chunk.translatedText)
            }
        }

        // 创建翻译面板
        const panel = this.createTranslationPanel(chunks)
        this.overlayContainer!.appendChild(panel)
    }

    /**
     * 创建翻译面板（侧边栏模式）
     */
    private createTranslationPanel(chunks: TranslatedChunk[]): HTMLDivElement {
        const panel = document.createElement('div')
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            height: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 20px;
            pointer-events: auto;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
        `

        // 添加标题
        const header = document.createElement('div')
        header.style.cssText = `
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `
        header.innerHTML = `
            <span>📄 PDF 翻译</span>
            <button id="close-pdf-translation" style="
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #f1f5f9;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">关闭</button>
        `

        panel.appendChild(header)

        // 添加关闭按钮事件
        setTimeout(() => {
            const closeBtn = document.getElementById('close-pdf-translation')
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.destroy()
                })
            }
        }, 100)

        // 按页面分组显示翻译
        const pageGroups = this.groupByPage(chunks)

        for (const [pageNumber, pageChunks] of pageGroups) {
            // 页面标题
            const pageHeader = document.createElement('div')
            pageHeader.style.cssText = `
                font-size: 14px;
                font-weight: 600;
                color: #94a3b8;
                margin: 20px 0 10px 0;
            `
            pageHeader.textContent = `第 ${pageNumber} 页`
            panel.appendChild(pageHeader)

            // 翻译内容
            for (const chunk of pageChunks) {
                if (chunk.status === 'success') {
                    const item = document.createElement('div')
                    item.style.cssText = `
                        background: rgba(255, 255, 255, 0.05);
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 10px;
                        font-size: 14px;
                        line-height: 1.6;
                        border-left: 3px solid #667eea;
                    `
                    item.textContent = chunk.translatedText
                    panel.appendChild(item)
                }
            }
        }

        return panel
    }

    /**
     * 按页面分组翻译块
     */
    private groupByPage(chunks: TranslatedChunk[]): Map<number, TranslatedChunk[]> {
        const groups = new Map<number, TranslatedChunk[]>()

        for (const chunk of chunks) {
            // 从 nodePath 提取页码 (pdf://page1 -> 1)
            const match = chunk.nodePath.match(/page(\d+)/)
            const pageNumber = match ? parseInt(match[1]) : 1

            if (!groups.has(pageNumber)) {
                groups.set(pageNumber, [])
            }
            groups.get(pageNumber)!.push(chunk)
        }

        // 按页码排序
        return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]))
    }

    /**
     * 销毁翻译层
     */
    destroy(): void {
        if (this.overlayContainer) {
            this.overlayContainer.remove()
            this.overlayContainer = null
        }
        this.translationMap.clear()
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.overlayContainer !== null
    }
}
