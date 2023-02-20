<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
  <div class="main-container-Nprogress">
  </div>
</template>

<style >
/* body {
  padding: 0.5rem;
} */


#nprogress {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 2px !important;
  z-index: 99999 !important;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  /**/
}

::-webkit-scrollbar-track {
  background: rgb(239, 239, 239);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #333;
}

::-webkit-scrollbar-corner {
  background: #179a16;
}
</style>
