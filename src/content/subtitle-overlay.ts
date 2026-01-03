/**
 * 字幕翻译层渲染
 * 在视频字幕下方显示翻译
 */

import { TranslatedSubtitle } from '../services/subtitle-translator'

export class SubtitleOverlay {
    private overlayElement: HTMLDivElement | null = null

    /**
     * 初始化字幕翻译层
     */
    initialize(videoElement: HTMLVideoElement): void {

        if (this.overlayElement) {
            return
        }

        this.overlayElement = document.createElement('div')
        this.overlayElement.id = 'subtitle-translation-overlay'
        this.overlayElement.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            max-width: 80%;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(10px);
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
            font-size: 16px;
            line-height: 1.5;
            text-align: center;
            z-index: 999999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(102, 126, 234, 0.3);
        `

        // 将翻译层添加到视频容器中
        const videoContainer = this.findVideoContainer(videoElement)
        if (videoContainer) {
            videoContainer.style.position = 'relative'
            videoContainer.appendChild(this.overlayElement)
        } else {
            document.body.appendChild(this.overlayElement)
        }
    }

    /**
     * 显示翻译字幕
     */
    showSubtitle(subtitle: TranslatedSubtitle): void {
        if (!this.overlayElement) {
            return
        }

        this.overlayElement.textContent = subtitle.translatedText
        this.overlayElement.style.opacity = '1'
    }

    /**
     * 隐藏翻译字幕
     */
    hideSubtitle(): void {
        if (!this.overlayElement) {
            return
        }

        this.overlayElement.style.opacity = '0'
    }

    /**
     * 更新字幕内容
     */
    updateSubtitle(text: string): void {
        if (!this.overlayElement) {
            return
        }

        this.overlayElement.textContent = text
        this.overlayElement.style.opacity = '1'
    }

    /**
     * 销毁字幕翻译层
     */
    destroy(): void {
        if (this.overlayElement) {
            this.overlayElement.remove()
            this.overlayElement = null
        }
    }

    /**
     * 查找视频容器
     */
    private findVideoContainer(videoElement: HTMLVideoElement): HTMLElement | null {
        let parent = videoElement.parentElement

        while (parent) {
            // 检查是否为视频播放器容器
            const classList = parent.classList
            if (
                classList.contains('video-player') ||
                classList.contains('player') ||
                classList.contains('video-container') ||
                parent.id.includes('player')
            ) {
                return parent
            }

            parent = parent.parentElement
        }

        return videoElement.parentElement
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.overlayElement !== null
    }
}
