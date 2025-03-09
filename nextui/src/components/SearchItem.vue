<script setup>
import { ref, computed } from 'vue'
import FileIcon from 'file-icons-vue';
import { local } from '../services/db';
import { DataClient } from '../services/databox';
import eventbus from '../services/eventbus';
import { apiAddBreakpoint } from '../monaco-editor';

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
async function loadFileInEditor(url, lno) {
   eventbus.emit('loading');
   const uri = `flame://file/${props.data.Repo}/${props.data.FileName}`;
   const m0 = local.editor.getModel();
   if (!m0 || m0.uri.toString() !== uri) {
      m0.dispose();
      const uriObj = local.monaco.Uri.parse(uri);
      let m = local.monaco.editor.getModel(uriObj);
      if (!m) {
         // TODO: try ... catch ... to handle errors
         const r = await DataClient.Project.GetFileContentsRaw(url);
         const div = document.createElement('div');
         div.innerHTML = r.contents;
         m = local.monaco.editor.createModel(
            div.textContent,
            guessFileLanguage(uri),
            uriObj
         );
      }
      local.editor.setModel(m);

      // show breakpoints if any
      const btObj = local.breakpoints?.byFile?.[uri];
      if (btObj) {
         Object.keys(btObj).forEach(k => {
            const lineNumber = parseInt(k);
            apiAddBreakpoint(lineNumber);
         });
      }

      if (lno) {
         local.editor.focus();
         local.editor.revealPosition({ lineNumber: lno, column: 1 });
         local.editor.setSelection({ startLineNumber: lno, endLineNumber: lno, startColumn: 1, endColumn: 1 });
      }

      eventbus.emit('editor.breadcrumb.update', uri);
   }
   eventbus.emit('loaded');
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
