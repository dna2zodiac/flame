<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { DataClient } from '../services/databox';
import NavbarSearchStack from './NavbarSearchStack.vue';
import eventbus from '../services/eventbus';

const input = ref(null);
const query = ref("");
const stacks = ref([]);
const clickSearch = () => {
   const q = query.value;
   if (!q) return;
   const id = stacks.value.length ? (stacks.value[0].id + 1) : 1;
   const dup = stacks.value.find(z => z.query === q);
   if (dup) {
      dup.api && dup.api.revealStack();
      return;
   }
   stacks.value.unshift({
      id: id,
      query: q,
      loading: true,
      req: DataClient.Project.Search(q)
   });
};

onMounted(() => {
   eventbus.on('navbar.search.stack.remove', onSearchStackRemoving);
   eventbus.on('navbar.search.input.push', onGetQuery);
});
onUnmounted(() => {
   eventbus.off('navbar.search.stack.remove', onSearchStackRemoving);
   eventbus.off('navbar.search.input.push', onGetQuery);
});

function onGetQuery(q) {
   if (!q) return;
   query.value = q;
   input.value.focus();
}
function onSearchStackRemoving(evt) {
   if (!evt || !evt.id) return;
   const one = stacks.value.find(z => z.id == evt.id);
   stacks.value.splice(stacks.value.indexOf(one), 1);
}
</script>

<template>
   <div class="search-container">
      Search
      <div class="search-bar">
         <input ref="input" v-model="query" @keyup.enter="clickSearch" />
         <button @click="clickSearch"><i class="bi bi-search"/></button>
      </div>
      <div class="search-stack-container">
         <NavbarSearchStack v-for="item in stacks" :key="item.id" :data="item" />
      </div>
   </div>
</template>

<style scoped>
.search-container {
   width: 100%;
   height: 100%;
   display: flex;
   flex-direction: column;
}
.search-bar {
   display: flex;
   flex-direction: row;
}
.search-bar > input {
   flex: 1 0 auto;
}
.search-stack-container {
   flex: 1 0 auto;
   overflow-x: hidden;
   overflow-y: auto;
   height: 0;
}
</style>
