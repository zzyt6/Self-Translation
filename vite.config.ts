import { defineConfig, build } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    root: resolve(__dirname, 'src'),
    base: './',
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'manifest.json',
                    dest: '.',
                },
                {
                    src: '../icons/*',
                    dest: 'icons',
                },
                {
                    src: 'content/content.css',
                    dest: 'content',
                },
            ],
        }),
        // 自定义插件：单独构建 content script 为 IIFE 格式
        {
            name: 'build-content-script',
            closeBundle: async () => {
                await build({
                    configFile: false,
                    build: {
                        emptyOutDir: false,
                        outDir: resolve(__dirname, 'dist/content'),
                        lib: {
                            entry: resolve(__dirname, 'src/content/content.ts'),
                            name: 'ContentScript',
                            formats: ['iife'],
                            fileName: () => 'content.js',
                        },
                        rollupOptions: {
                            output: {
                                extend: true,
                            },
                        },
                    },
                    resolve: {
                        alias: {
                            '@': resolve(__dirname, 'src'),
                        },
                    },
                })
            },
        },
    ],
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                'popup/popup': resolve(__dirname, 'src/popup/popup.html'),
                'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: '[name][extname]',
            },
        },
    },
})
