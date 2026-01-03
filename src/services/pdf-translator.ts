/**
 * PDF 翻译服务
 * 使用 PDF.js 解析 PDF 文件并进行翻译
 */

import * as pdfjsLib from 'pdfjs-dist'
import { TextChunk } from '../shared/types'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface PDFTextItem {
    text: string
    x: number
    y: number
    width: number
    height: number
    pageNumber: number
}

export class PDFTranslator {
    /**
     * 检测当前页面是否为 PDF
     */
    static isPDFPage(): boolean {
        const url = window.location.href
        const contentType = document.contentType || ''
        
        return (
            url.endsWith('.pdf') ||
            contentType.includes('application/pdf') ||
            document.querySelector('embed[type="application/pdf"]') !== null
        )
    }

    /**
     * 从 URL 加载 PDF 文档
     */
    static async loadPDF(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
        try {
            const loadingTask = pdfjsLib.getDocument(url)
            const pdf = await loadingTask.promise
            return pdf
        } catch (error) {
            console.error('[PDF翻译] 加载 PDF 失败:', error)
            throw new Error('无法加载 PDF 文件')
        }
    }

    /**
     * 提取 PDF 页面的文本内容
     */
    static async extractTextFromPage(
        page: pdfjsLib.PDFPageProxy
    ): Promise<PDFTextItem[]> {
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({ scale: 1.0 })
        
        const items: PDFTextItem[] = []
        
        for (const item of textContent.items) {
            if ('str' in item && item.str.trim()) {
                const transform = item.transform
                items.push({
                    text: item.str,
                    x: transform[4],
                    y: viewport.height - transform[5], // 转换坐标系
                    width: item.width || 0,
                    height: item.height || 0,
                    pageNumber: page.pageNumber,
                })
            }
        }
        
        return items
    }

    /**
     * 提取整个 PDF 的文本内容
     */
    static async extractAllText(pdf: pdfjsLib.PDFDocumentProxy): Promise<PDFTextItem[]> {
        const allItems: PDFTextItem[] = []
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const items = await this.extractTextFromPage(page)
            allItems.push(...items)
        }
        
        return allItems
    }

    /**
     * 将 PDF 文本项转换为翻译块
     */
    static convertToTextChunks(items: PDFTextItem[]): TextChunk[] {
        const chunks: TextChunk[] = []
        
        // 按页面和位置分组文本
        const groupedByPage = new Map<number, PDFTextItem[]>()
        
        for (const item of items) {
            if (!groupedByPage.has(item.pageNumber)) {
                groupedByPage.set(item.pageNumber, [])
            }
            groupedByPage.get(item.pageNumber)!.push(item)
        }
        
        // 为每个页面创建文本块
        let index = 0
        for (const [pageNumber, pageItems] of groupedByPage) {
            // 按 Y 坐标排序（从上到下）
            pageItems.sort((a, b) => a.y - b.y)
            
            // 合并相近的文本行
            let currentParagraph = ''
            let lastY = -1
            
            for (const item of pageItems) {
                // 如果 Y 坐标差距较大，说明是新段落
                if (lastY !== -1 && Math.abs(item.y - lastY) > 20) {
                    if (currentParagraph.trim()) {
                        chunks.push({
                            id: `pdf-page${pageNumber}-${index}`,
                            text: currentParagraph.trim(),
                            nodePath: `pdf://page${pageNumber}`,
                            index: index++,
                        })
                        currentParagraph = ''
                    }
                }
                
                currentParagraph += item.text + ' '
                lastY = item.y
            }
            
            // 添加最后一个段落
            if (currentParagraph.trim()) {
                chunks.push({
                    id: `pdf-page${pageNumber}-${index}`,
                    text: currentParagraph.trim(),
                    nodePath: `pdf://page${pageNumber}`,
                    index: index++,
                })
            }
        }
        
        return chunks
    }

    /**
     * 获取当前 PDF 的 URL
     */
    static getCurrentPDFUrl(): string | null {
        // 尝试从 embed 标签获取
        const embed = document.querySelector('embed[type="application/pdf"]') as HTMLEmbedElement
        if (embed && embed.src) {
            return embed.src
        }
        
        // 尝试从 iframe 获取
        const iframe = document.querySelector('iframe[src*=".pdf"]') as HTMLIFrameElement
        if (iframe && iframe.src) {
            return iframe.src
        }
        
        // 使用当前页面 URL
        if (window.location.href.endsWith('.pdf')) {
            return window.location.href
        }
        
        return null
    }
}
