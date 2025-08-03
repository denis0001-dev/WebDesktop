import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import { createHtmlPlugin } from 'vite-plugin-html'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        createHtmlPlugin({
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            }
        })
    ],
    css: {
        postcss: {
            plugins: [autoprefixer()],
        },
    },
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                }
            }
        }
    }
})
