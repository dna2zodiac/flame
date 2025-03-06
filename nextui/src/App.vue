<script setup>
import { ref, onMounted } from 'vue'
import { initEditor } from './monaco-editor'

const monacoEditor = ref(null);

onMounted(() => {
   console.log(monacoEditor);
   initEditor(monacoEditor.value);
});
</script>

<template>
  <div ref="monacoEditor" class="editor"></div>
</template>

<style scoped>
.editor {
   width: 100%;
   height: 100%;
}
</style>
