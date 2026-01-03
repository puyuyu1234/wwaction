<script setup lang="ts">
import type { Input } from '@ptre/core/Input'

const props = defineProps<{
  input: Input
}>()

const dpadButtons = [
  { key: 'KeyA', label: '←', position: 'left' },
  { key: 'KeyD', label: '→', position: 'right' },
  { key: 'KeyS', label: '↓', position: 'down' },
] as const

const actionButtons = [
  { key: 'Space', label: 'Wind', position: 'wind' },
  { key: 'KeyW', label: 'Jump', position: 'jump' },
] as const

const handleTouchStart = (key: string, e: TouchEvent) => {
  e.preventDefault()
  props.input.setKeyPressed(key)
}

const handleTouchEnd = (key: string, e: TouchEvent) => {
  e.preventDefault()
  props.input.setKeyReleased(key)
}
</script>

<template>
  <div class="virtual-controller">
    <div class="dpad">
      <button
        v-for="btn in dpadButtons"
        :key="btn.key"
        :class="['dpad-btn', `dpad-${btn.position}`]"
        @touchstart="handleTouchStart(btn.key, $event)"
        @touchend="handleTouchEnd(btn.key, $event)"
        @touchcancel="handleTouchEnd(btn.key, $event)"
      >
        {{ btn.label }}
      </button>
    </div>
    <div class="action-buttons">
      <button
        v-for="btn in actionButtons"
        :key="btn.key"
        :class="['action-btn', `action-${btn.position}`]"
        @touchstart="handleTouchStart(btn.key, $event)"
        @touchend="handleTouchEnd(btn.key, $event)"
        @touchcancel="handleTouchEnd(btn.key, $event)"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.virtual-controller {
  position: fixed;
  bottom: 2vw;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 3vw;
  pointer-events: none;
  z-index: 1000;
}

.dpad {
  position: relative;
  width: 55vw;
  height: 55vw;
  max-width: 260px;
  max-height: 260px;
  pointer-events: auto;
}

.dpad-btn {
  position: absolute;
  width: 22vw;
  height: 22vw;
  max-width: 100px;
  max-height: 100px;
  border: none;
  border-radius: 15%;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 8vw;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 500px) {
  .dpad-btn {
    font-size: 36px;
  }
}

.dpad-btn:active {
  background: rgba(255, 255, 255, 0.6);
}

.dpad-left {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.dpad-right {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.dpad-down {
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
}

.action-buttons {
  position: relative;
  width: 40vw;
  height: 50vw;
  max-width: 240px;
  max-height: 240px;
  pointer-events: auto;
}

.action-btn {
  position: absolute;
  width: 26vw;
  height: 26vw;
  max-width: 120px;
  max-height: 120px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 5vw;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 500px) {
  .action-btn {
    font-size: 24px;
  }
}

.action-btn:active {
  background: rgba(255, 255, 255, 0.6);
}

/* ゲームボーイ風配置: Jumpが右上、Windが左下 */
.action-jump {
  right: 0;
  top: 0;
  background: rgba(100, 200, 255, 0.4);
}

.action-jump:active {
  background: rgba(100, 200, 255, 0.7);
}

.action-wind {
  left: 0;
  bottom: 0;
  background: rgba(150, 255, 150, 0.4);
}

.action-wind:active {
  background: rgba(150, 255, 150, 0.7);
}
</style>
