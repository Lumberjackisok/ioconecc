<script lang="ts">
export default {
  name: 'TypingText',
}
</script>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  }
});

const typing = (speed: number) => {

};

let typingText = ref('');

onMounted(() => {
  const typingInterval = setInterval(() => {
    if (typingText.value.length < props.text.length) {
      typingText.value += props.text[typingText.value.length];
    } else {
      clearInterval(typingInterval);
    }
  }, 200)
})

</script>

<template>
  <div class="typing-text-container">
  <span class="typing-text" className="py-6">{{ typingText }}</span>
  <span class="typing-cursor ">&nbsp;</span>
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