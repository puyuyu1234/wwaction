<template>
  <div class="app-container">
    <PhaserGame />
  </div>
</template>

<script setup lang="ts">
import PhaserGame from './components/PhaserGame.vue'
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
