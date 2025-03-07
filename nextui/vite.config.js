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
      languageWorkers: [
        'editorWorkerService', 'bat', 'cpp', 'csharp',
        'css', 'dart', 'dockerfile', 'go', 'html', 'ini',
        'java', 'javascript', 'kotlin', 'less', 'lua',
        'markdown', 'objective-c', 'perl', 'php', 'protobuf',
        'python', 'r', 'ruby', 'rust', 'scala', 'shell',
        'sql', 'swift', 'tcl', 'typescript', 'xml', 'yaml',
      ],
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
