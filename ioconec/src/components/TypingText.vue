<script lang="ts">
export default {
  name: 'TypingText',
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  }
});



let typingText = ref('');

const state: any = reactive({
  cursor: 1,
});

watchEffect(() => {
  typingText.value = props.text;
});

onMounted(() => {
  typingText.value = '';
  setTimeout(() => {
    const typingInterval = setInterval(() => {
      if (typingText.value.length < props.text.length) {
        typingText.value += props.text[typingText.value.length];
      } else {
        clearInterval(typingInterval);
        if (typingText.value.length != 0) {//目的是空字符串的时候光标同样显示
          setTimeout(() => {
            state.cursor = 0;
          }, 2000)
        }
      }
    }, 100)
  }, 2000)

})

</script>

<template>
  <div class="typing-text-container">
  <span class="typing-text" className="px-0.5">{{ typingText }}</span>
  <span class="typing-cursor" v-if="state.cursor">&nbsp;</span>
  </div>
</template>

<style scoped>
.typing-text-container {
  position: relative;
}

.typing-cursor {
  border-right: 0.5rem solid white;
  position: absolute;
  animation: typingCursor 1s infinite;
}

@keyframes typingCursor {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>