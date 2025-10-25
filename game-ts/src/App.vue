<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
</script>

<template>
  <main>
    <GameCanvas />
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
}
</style>
