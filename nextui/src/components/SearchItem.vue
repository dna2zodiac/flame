<script setup>
import { ref } from 'vue'
import { local } from '../services/db';
import { DataClient } from '../services/databox';
import eventbus from '../services/eventbus';

const props = defineProps({
  data: Object,
});

function loadFileInEditor(url) {
   eventbus.emit('loading');
   DataClient.Project.GetFileContentsRaw(url).then((r) => {
      const div = document.createElement('div');
      div.innerHTML = r.contents;
      const m = local.monaco.editor.createModel(div.textContent);
      local.editor.setModel(m);
      eventbus.emit('loaded');
   }, () => {
      // TODO: show error
      eventbus.emit('loaded');
   });
}
</script>

<template>
   <div class="item-container">
      <div class="item-filename-container">
         <a class="item-filename" @click="loadFileInEditor(data.URL)">{{data.Repo}}:{{data.FileName}}</a>
      </div>
      <div v-if="data.DuplicateID">
         <div>[Dup] {{data.Repo}}:{{data.DuplicateID}}</div>
      </div>
      <div v-else>
         <div v-if="data.Matches.length === 1 && !data.Matches?.[0]?.LineNum">
            <span v-for="(part, i) in data.Matches[0].Fragments" :key="i">
               {{part.Pre}}<b>{{part.Match}}</b>{{part.Post}}
            </span>
         </div>
         <div class="line-container" v-else>
            <div class="line" v-for="(line, i) in data.Matches" :key="i">
               <span class="line-lno">{{line.LineNum}}</span>
               <div><span v-for="(part, j) in line.Fragments" :key="j">
               {{part.Pre}}<b>{{part.Match}}</b>{{part.Post}}
               </span></div>
            </div>
         </div>
      </div>
   </div>
</template>

<style scoped>
.item-container {
   border-bottom: 1px solid gray;
}
.item-container div {
   word-break: break-all;
}
.item-filename {
   cursor: pointer;
}
.line-container {
   width: 100%;
   overflow-x: auto;
}
.line {
   margin: 0;
   padding: 0;
   display: flex;
   white-space: pre;
   font-family: monospace;
}
.line-lno {
   user-select: none;
}
</style>
