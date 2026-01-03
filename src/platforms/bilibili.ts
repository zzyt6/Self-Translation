/**
 * Bilibili 平台适配
 * 支持 Bilibili 视频字幕翻译
 */

import { SubtitleItem } from '../services/subtitle-translator'

export class BilibiliAdapter {
    /**
     * 检测是否为 Bilibili 页面
     */
    static isBilibiliPage(): boolean {
        return window.location.hostname.includes('bilibili.com')
    }

    /**
     * 获取视频元素
     */
    static getVideoElement(): HTMLVideoElement | null {
        return (
            document.querySelector('video.bpx-player-video-wrap') ||
            document.querySelector('video')
        )
    }

    /**
     * 获取字幕容器
     */
    static getSubtitleContainer(): HTMLElement | null {
        return (
            document.querySelector('.bpx-player-subtitle-wrap') ||
            document.querySelector('.bilibili-player-video-subtitle')
        )
    }

    /**
     * 监听字幕变化
     */
    static observeSubtitles(
        callback: (subtitle: SubtitleItem) => void
    ): MutationObserver | null {
        const container = this.getSubtitleContainer()
        if (!container) {
            console.log('[Bilibili] 未找到字幕容器')
            return null
        }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const subtitleText = this.getCurrentSubtitleText()
                    if (subtitleText) {
                        const subtitle: SubtitleItem = {
                            id: `bilibili-${Date.now()}`,
                            text: subtitleText,
                            startTime: 0,
                            endTime: 0,
                        }
                        callback(subtitle)
                    }
                }
            }
        })

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        })

        console.log('[Bilibili] 开始监听字幕变化')
        return observer
    }

    /**
     * 获取当前显示的字幕文本
     */
    static getCurrentSubtitleText(): string {
        const subtitleElement =
            document.querySelector('.bpx-player-subtitle-panel-text') ||
            document.querySelector('.bilibili-player-video-subtitle-text')

        return subtitleElement?.textContent?.trim() || ''
    }

    /**
     * 检查是否启用了字幕
     */
    static isSubtitleEnabled(): boolean {
        const subtitleButton =
            document.querySelector('.bpx-player-ctrl-subtitle') ||
            document.querySelector('.bilibili-player-video-btn-subtitle')

        return subtitleButton?.classList.contains('active') || false
    }

    /**
     * 等待视频加载
     */
    static waitForVideo(): Promise<HTMLVideoElement> {
        return new Promise((resolve, reject) => {
            const video = this.getVideoElement()
            if (video) {
                resolve(video)
                return
            }

            const observer = new MutationObserver(() => {
                const video = this.getVideoElement()
                if (video) {
                    observer.disconnect()
                    resolve(video)
                }
            })

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            })

            // 10 秒超时
            setTimeout(() => {
                observer.disconnect()
                reject(new Error('等待视频加载超时'))
            }, 10000)
        })
    }
}
