<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import eventbus from '../services/eventbus';
import { local } from '../services/db';
import { apiLoadFile, apiParseUri } from '../monaco-editor';

const groups = ref([]);

onMounted(() => {
   eventbus.on('stackview.update', onStackViewUpdate);
});
onUnmounted(() => {
   eventbus.off('stackview.update', onStackViewUpdate);
});
function onStackViewUpdate() {
   console.log(local.breakpoints);
   const btmap = local.breakpoints?.byFile || {};
   const list = [];
   Object.keys(btmap).forEach(uri => {
      Object.values(btmap[uri]).forEach(z => {
         const obj = {
            id: z.id,
            uri,
            lno: z.lno,
            text: z.text,
         };
         list.push(obj);
      });
   });
   list.sort((a, b) => a.id - b.id);
   const newgroups = [];
   let lastItem = null;
   list.forEach((z, i) => {
      if (lastItem && lastItem.uri === z.uri) {
         lastItem.lines.unshift(z);
      } else {
         const metaObj = apiParseUri(z.uri);
         lastItem = {
            key: i,
            uri: z.uri,
            repo: metaObj.repo,
            path: metaObj.path.join('/'),
            lines: [z],
         };
         newgroups.unshift(lastItem);
      }
      delete z.uri;
   });
   groups.value = newgroups;
}

async function loadFileInEditor(uri, lno) {
   await apiLoadFile(uri, { lineNumber: lno });
}
</script>

<template>
   <div class="stackview-container">
      StackView
      <div class="stackview-list-container">
         <div v-for="z in groups" :key="z.key">
            <a class="stackview-item" @click="loadFileInEditor(z.uri)">{{ z.repo }}:{{ z.path }}</a>
            <div v-for="line in z.lines">
               <a class="stackview-item-lno" @click="loadFileInEditor(z.uri, line.lno)">{{ line.lno }}</a>&nbsp;
               {{ line.text }}
            </div>
         </div>
      </div>
   </div>
</template>

<style scoped>
.stackview-container {
   width: 100%;
   height: 100%;
   display: flex;
   flex-direction: column;
}
.stackview-list-container {
   width: 100%;
   height: 0;
   flex: 1 0 auto;
   overflow-x: hidden;
   overflow-y: auto;
}
.stackview-item {
   cursor: pointer;
}
.stackview-item-lno {
   user-select: none;
   cursor: pointer;
}
</style>