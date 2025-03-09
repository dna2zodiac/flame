<script setup>
import FileIcon from 'file-icons-vue';
import { apiLoadFile } from '../monaco-editor';

const props = defineProps({
  data: Object,
});

async function loadFileInEditor(lno) {
   // url = props.data.URL
   const uri = `flame://file/${props.data.Repo}/${props.data.FileName}`;
   await apiLoadFile(uri, { lineNumber: lno });
}
</script>

<template>
   <div class="item-container">
      <div class="item-filename-container">
         <FileIcon :name="data.FileName"/>
         <a class="item-filename" @click="loadFileInEditor()">{{data.Repo}}:{{data.FileName}}</a>
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
               <span class="line-lno" @click="loadFileInEditor(line.LineNum)">{{line.LineNum}}</span>
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
   cursor: pointer;
   margin-right: 5px;
}
</style>
