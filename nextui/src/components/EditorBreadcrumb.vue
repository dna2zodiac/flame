<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import eventbus from '../services/eventbus';
const data = ref(null);

onMounted(() => {
   eventbus.on('editor.breadcrumb.update', onUpdateEditorBreadcrumb)
});
onUnmounted(() => {
   eventbus.off('editor.breadcrumb.update', onUpdateEditorBreadcrumb)
});
function onUpdateEditorBreadcrumb(uri) {
   // uri = flame://file|dir/<repo>/<path/to/target>
   const metaObj = {};
   const uriObj = URL.parse(uri);
   if (uriObj.pathname === '/') {
      metaObj.type = 'root';
      metaObj.repo = '';
      metaObj.path = [];
   } else {
      const ps = uriObj.pathname.split('/');
      ps.shift();
      metaObj.repo = ps.shift();
      metaObj.path = ps;
      metaObj.type = uriObj.hostname;
   }
   data.value = metaObj;
}
</script>

<template>
   <div class="breadcrumb-container" v-if="data">
      <button><i class="bi bi-house"/></button>
      <span class="breadcrumb-item" v-if="data.repo"><a>{{ data.repo }}</a></span>
      <span class="breadcrumb-item" v-for="(z, i) in data.path" :key="i">
         / <a>{{z}}</a>
      </span>
      {{ data.type === 'file' ? '' : '/' }}
   </div>
</template>

<style scoped>
.breadcrumb-container {
   width: calc(100% - 40px);
   word-break: break-all;
}
.breadcrumb-item {
   margin: 0 2px;
}
.breadcrumb-item > a {
   cursor: pointer;
}
</style>