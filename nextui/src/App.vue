<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { initEditor } from './monaco-editor'
import NavbarSearch from './components/NavbarSearch.vue';
import Loading from './components/Loading.vue';
import eventbus from './services/eventbus';

const monacoEditor = ref(null);
const tab = ref(0);

onMounted(() => {
   initEditor(monacoEditor.value);
   eventbus.on('app.opentab', onOpenTab);
});
onUnmounted(() => {
  eventbus.off('app.opentab', onOpenTab);
});

const tabMap = {
   none: 0,
   search: 1,
   stack: 2,
   grid: 3,
   log: 4,
};
function onOpenTab(tabname) {
  const todotab = tabMap[tabname] || 0;
  if (tab.value === todotab) return;
  switchTab(todotab);
}

function switchTab(index) {
  if (tab.value == index) {
    tab.value = 0;
  } else {
    tab.value = index;
  }
}
</script>

<template>
  <div class="view">
    <div class="navbar">
      <div><button @click="switchTab(1)"><i class="bi bi-search"/></button></div>
      <div><button @click="switchTab(2)"><i class="bi bi-stack"/></button></div>
      <div><button @click="switchTab(3)"><i class="bi bi-grid-3x3-gap-fill"/></button></div>
      <div><button @click="switchTab(4)"><i class="bi bi-file-text-fill"/></button></div>
    </div>
    <div class="workspace">
      <div class="main-view">
        <div :class="{'tab-container': true, hide: tab == 0}">
          <div :class="{hide: tab != 1}"><NavbarSearch /></div>
          <div :class="{hide: tab != 2}">ViewStack</div>
          <div :class="{hide: tab != 3}">CallGrid</div>
          <div :class="{hide: tab != 4}">LogMap</div>
        </div>
        <div class="editor-container">
          <div ref="monacoEditor" class="editor"></div>
        </div>
      </div>
      <div>Status</div>
    </div>
  </div>
  <Loading />
</template>

<style scoped>
.view {
   display: flex;
   flex-direction: row;
   width: 100%;
   height: 100%;
   overflow: hidden;
}
.navbar {
   margin: 10px 0 10px 10px;
}
.workspace {
   display: flex;
   flex: 1 0 auto;
   flex-direction: column;
   width: 100%;
   height: 100%;
}
.main-view {
  flex: 1 0 auto;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}
.tab-container {
  width: 40%;
  padding: 10px;
  flex: 0 0 auto;
}
.tab-container > div {
  height: 100%;
  width: 100%;
}
.editor-container {
   flex: 1 0 auto;
   width: 0;
}
.editor {
   width: 100%;
   height: 100%;
}
</style>
