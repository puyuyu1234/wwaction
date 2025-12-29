<script setup lang="ts">
import GameCanvas from '@/components/GameCanvas.vue'
</script>

<template>
  <GameCanvas />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
