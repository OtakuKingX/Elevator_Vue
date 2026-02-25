<template>
  <header class="dashboard">
    <h1>🏢 電梯管理模擬系統</h1>
    <div class="stats-panel">
      <div class="stat-box">
        <span class="label">模擬時間</span>
        <span class="value">{{ store.time }}s</span>
      </div>
      <div class="stat-box">
        <span class="label">已送達</span>
        <span class="value">{{ store.finishedPeopleCount }} / {{ store.config.targetPeople }}</span>
      </div>
      <div class="stat-box">
        <span class="label">等待中</span>
        <span class="value waiting">{{ store.waitingQueue.length }}</span>
      </div>
      <div class="stat-box speed-box">
        <span class="label">速度</span>
        <div class="speed-control">
          <button class="speed-btn" @click="$emit('changeSpeed', -1)" :disabled="speedLevel <= 0">
            −
          </button>
          <span class="value speed-value">{{ speedLabels[speedLevel] }}</span>
          <button
            class="speed-btn"
            @click="$emit('changeSpeed', 1)"
            :disabled="speedLevel >= speedLabels.length - 1"
          >
            +
          </button>
        </div>
      </div>
      <div class="actions">
        <button @click="$emit('start')" :disabled="store.isRunning" class="btn start">
          開始模擬
        </button>
        <button @click="$emit('stop')" :disabled="!store.isRunning" class="btn stop">暫停</button>
        <button @click="$emit('reset')" class="btn reset">重置</button>
      </div>
    </div>
  </header>

  <!-- 進度條 -->
  <div class="progress-bar-container">
    <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
    <span class="progress-text">送達進度 {{ progressPercent }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useElevatorStore } from '../stores/elevator'

const store = useElevatorStore()

defineProps<{
  speedLevel: number
  speedLabels: string[]
}>()

defineEmits<{
  changeSpeed: [delta: number]
  start: []
  stop: []
  reset: []
}>()

const progressPercent = computed(() =>
  Math.min(100, Math.round((store.finishedPeopleCount / store.config.targetPeople) * 100)),
)
</script>

<style scoped>
.dashboard {
  background: #1a1a1a;
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-panel {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-box .label {
  font-size: 12px;
  color: #aaa;
}
.stat-box .value {
  font-size: 24px;
  font-weight: bold;
  color: #42b883;
}
.stat-box .value.waiting {
  color: #f39c12;
}

.speed-box {
  min-width: 100px;
}
.speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
}
.speed-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.speed-btn:hover:not(:disabled) {
  background: #42b883;
}
.speed-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.speed-value {
  font-size: 18px !important;
  min-width: 30px;
  text-align: center;
}

.progress-bar-container {
  width: 100%;
  height: 22px;
  background: #1a1a1a;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #42b883, #2ecc71);
  transition: width 0.4s ease;
  border-radius: 0 3px 3px 0;
}
.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-left: 10px;
  transition: opacity 0.2s;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.start {
  background: #42b883;
  color: white;
}
.stop {
  background: #e74c3c;
  color: white;
}
.reset {
  background: #7f8c8d;
  color: white;
}
</style>
