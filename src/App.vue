<script setup lang="ts">
import { Game } from '@core/Game'
import { onMounted } from 'vue'

import { StageScene } from '@/engine/scene/StageScene'

onMounted(async () => {
  const game = new Game('gameCanvas', 320, 240)
  await game.init()

  const stage = new StageScene(1, game.getInput())
  game.changeScene(stage)

  game.start()
  console.log('Game started!')
})
</script>

<template>
  <canvas id="gameCanvas"></canvas>
</template>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>

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
