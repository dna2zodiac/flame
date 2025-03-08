<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import SearchItem from './SearchItem.vue';
import eventbus from '../services/eventbus';

const props = defineProps({
  data: Object,
})

const container = ref(null);
const opened = ref(true);
const loading = ref(true);
const results = ref(null);

function revealStack() {
   opened.value = true;
   nextTick(() => {
      const s = container.value;
      const q = container.value.nextSibling;
      const p = container.value.parentNode;
      s && p && s.parentNode.scrollTo(0, q.offsetTop - s.offsetHeight - p.offsetTop);
   });
}

onMounted(() => {
   props.data.req.then((r) => {
      results.value = r?.result;
      if (results.value?.FileMatches?.length) {
         results.value.FileMatches.forEach(z => z.Matches && z.Matches.sort((a, b) => a.LineNum - b.LineNum));
      }
      loading.value = false;
      props.data.api = {
         revealStack,
      };
   });
   revealStack();
});
onUnmounted(() => {
   if (props.data.api) {
      delete props.data.api.revealStack;
      delete props.data.api;
   }
});

const viewN = computed(() => {
   const n0 = results.value?.Stats?.FileCount || 0;
   const n = results.value?.Last?.Num || 0;
   return n > n0 ? n0 : n;
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
            Found {{ viewN }} out of {{ results?.Stats?.FileCount }} file(s) in {{ results?.Stats?.Duration / 1000000 }} ms
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
   position: sticky;
   top: 0;
   background-color: ButtonFace;
   z-index: 10;
   padding: 2px;

}
.title {
   flex: 1 0 auto;
   word-break: break-all;
   padding: 0 5px;
}
</style>
