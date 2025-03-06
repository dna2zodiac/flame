import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // XXX: should patch vite-plugin-moanco-editor, in getWorks()
    //      filter out null/undefined item, especially tail element
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'typescript', 'javascript'],
    }),
  ],
  server: {
    proxy: {
      '/zoekt': {
        target: 'http://127.0.0.1:6070/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoekt\//, '/'),
      },
    },
  },
})
