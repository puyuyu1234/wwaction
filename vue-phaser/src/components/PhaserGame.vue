<template>
  <div ref="gameContainer" class="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { initGame } from "@/game/main";
import type Phaser from "phaser";

const gameContainer = ref<HTMLDivElement>();
let game: Phaser.Game | null = null;

onMounted(() => {
  if (gameContainer.value) {
    game = initGame(gameContainer.value);
  }
});

onUnmounted(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
