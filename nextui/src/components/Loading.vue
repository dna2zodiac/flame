<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import eventbus from '../services/eventbus';

const loading = ref(false);

onMounted(() => {
   eventbus.on('loading', onLoading);
   eventbus.on('loaded', onLoaded);
});
onUnmounted(() => {
   eventbus.off('loading', onLoading);
   eventbus.off('loaded', onLoaded);
});
function onLoading() {
   loading.value = true;
}
function onLoaded() {
   loading.value = false;
}
</script>

<template>
<div :class="{mask: true, hide: !loading}"></div>
</template>

<style scoped>
.mask {
   position: fixed;
   top: 0;
   left: 0;
   width: 100vw;
   height: 100vh;
   background-color: white;
   opacity: 0.5;
}
</style>
