<script setup>
import { ref, onMounted } from 'vue'
import SearchItem from './SearchItem.vue';
import eventbus from '../services/eventbus';

const props = defineProps({
  data: Object,
})

const container = ref(null);
const opened = ref(true);
const loading = ref(true);
const results = ref(null);

onMounted(() => {
   props.data.req.then((r) => {
      results.value = r?.result;
      loading.value = false;
      setTimeout(() => {
         const s = container.value;
         const p = container.value.parentNode;
         s && p && s.parentNode.scrollTo(0, s.offsetTop - p.offsetTop);
      });
   });
});

function switchSearchDetails() {
   opened.value = !opened.value;
}
function getQuery() {
   eventbus.emit('navbar.search.input.push', props.data.query);
}
function removeSelf() {
   eventbus.emit('navbar.search.stack.remove', { id: props.data.id });
}
</script>

<template>
   <div ref="container" class="title-container">
      <div><button @click="switchSearchDetails">
         <i :class="{bi: true, 'bi-folder2-open': opened, 'bi-folder2': !opened}"/>
      </button></div>
      <div class="title">{{data.query}}</div>
      <div><button @click="getQuery"><i class="bi bi-input-cursor-text"/></button></div>
      <div><button @click="removeSelf"><i class="bi bi-x"/></button></div>
   </div>
   <div :class="{hide: !opened}">
      <div v-if="loading">Searching ...</div>
      <div v-if="!loading && !!results">
         <div>
            Found {{ results.Last.Num }} out of {{ results?.Stats?.FileCount }} file(s) in {{ results?.Stats?.Duration / 1000000 }} ms
         </div>
         <SearchItem v-for="item in results.FileMatches" :key="item.FileName" :data="item" />
      </div>
   </div>
</template>

<style scoped>
.title-container {
   display: flex;
   flex-direction: row;
   width: 100%;
}
.title {
   flex: 1 0 auto;
   word-break: break-all;
   padding: 0 5px;
}
</style>
