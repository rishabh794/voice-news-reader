import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
          dest: '.'
        },
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
          dest: '.'
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: '.'
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx',
          dest: '.'
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx',
          dest: '.'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      'onnxruntime-web/wasm': path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.wasm.min.mjs'),
      'onnxruntime-web': path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.min.mjs')
    }
  },
  optimizeDeps: {
    include: [
      '@ricky0123/vad-react',
      '@ricky0123/vad-web',
      'onnxruntime-web',
      'onnxruntime-web/wasm'
    ]
  }
})
