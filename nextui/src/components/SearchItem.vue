<script setup>
import { ref, computed } from 'vue'
import FileIcon from 'file-icons-vue';
import { local } from '../services/db';
import { DataClient } from '../services/databox';
import eventbus from '../services/eventbus';

const props = defineProps({
  data: Object,
});

function guessFileLanguage(filename) {
    const languages = local.monaco.languages.getLanguages();
    const basename = filename.split('/').pop();
    const ps = filename.split('.');
    if (ps.length === 1) return null;
    const ext = `.${ps.pop()}`;
    for (const lang of languages) {
        if (lang.extensions && lang.extensions.includes(ext)) {
            return lang.id;
        }
        if (lang.filenames && lang.filenames.includes(basename)) {
            return lang.id;
        }
    }
    return null; // No matching language found
}
function loadFileInEditor(url, lno) {
   eventbus.emit('loading');
   DataClient.Project.GetFileContentsRaw(url).then((r) => {
      const uri = `flame://${props.data.Repo}/${props.data.FileName}`;
      const div = document.createElement('div');
      div.innerHTML = r.contents;
      const m0 = local.editor.getModel();
      if (!m0 || m0.uri.toString() !== uri) {
         m0.dispose();
         const m = local.monaco.editor.createModel(
            div.textContent,
            guessFileLanguage(uri),
            local.monaco.Uri.parse(uri)
         );
         local.editor.setModel(m);
      }
      if (lno) {
         local.editor.focus();
         local.editor.revealPosition({ lineNumber: lno, column: 1 });
         local.editor.setSelection({ startLineNumber: lno, endLineNumber: lno, startColumn: 1, endColumn: 1 });
      }
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
         <FileIcon :name="data.FileName"/>
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
               <span class="line-lno" @click="loadFileInEditor(data.URL, line.LineNum)">{{line.LineNum}}</span>
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
