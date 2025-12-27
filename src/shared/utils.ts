/**
 * 共享工具函数
 */

/**
 * 生成文本的哈希值（用于缓存键）
 */
export function hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error as Error
            if (i < maxRetries - 1) {
                await delay(delayMs * (i + 1)) // 指数退避
            }
        }
    }

    throw lastError
}

/**
 * 分块处理数组
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * 并发控制执行
 */
export async function concurrentMap<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    concurrency: number
): Promise<R[]> {
    const results: R[] = []
    const executing: Promise<void>[] = []

    for (let i = 0; i < items.length; i++) {
        const promise = fn(items[i], i).then(result => {
            results[i] = result
        })

        executing.push(promise)

        if (executing.length >= concurrency) {
            await Promise.race(executing)
            // 移除已完成的 promise
            const completed = executing.findIndex(p =>
                p === promise || Promise.race([p, Promise.resolve('pending')]).then(
                    r => r !== 'pending'
                )
            )
            if (completed !== -1) {
                executing.splice(completed, 1)
            }
        }
    }

    await Promise.all(executing)
    return results
}
