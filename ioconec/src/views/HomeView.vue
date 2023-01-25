<script lang="ts">
export default {
  name: 'HomeView',
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/modules/user';
const userStore = useUserStore();
onMounted(() => {
  console.log('in home page,token:', userStore.token);

  let token = sessionStorage.getItem('token') == null ? '' : JSON.parse(sessionStorage.getItem('token')!);
  console.log('token::::', token.token);



})
</script>

<template>
  <div>
    <h1>首页</h1>
  </div>
</template>

<style scoped>

</style>