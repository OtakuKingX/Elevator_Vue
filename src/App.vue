<template>
  <div class="elevator-app">
    <header class="dashboard">
      <h1>🏢 電梯管理模擬系統</h1>
      <div class="stats-panel">
        <div class="stat-box">
          <span class="label">模擬時間</span>
          <span class="value">{{ store.time }}s</span>
        </div>
        <div class="stat-box">
          <span class="label">已送達</span>
          <span class="value">{{ store.finishedPeopleCount }} / 40</span>
        </div>
        <div class="stat-box">
          <span class="label">等待中</span>
          <span class="value waiting">{{ store.waitingQueue.length }}</span>
        </div>
        <div class="stat-box speed-box">
          <span class="label">速度</span>
          <div class="speed-control">
            <button class="speed-btn" @click="changeSpeed(-1)" :disabled="speedLevel <= 0">
              −
            </button>
            <span class="value speed-value">{{ speedLabels[speedLevel] }}</span>
            <button
              class="speed-btn"
              @click="changeSpeed(1)"
              :disabled="speedLevel >= speeds.length - 1"
            >
              +
            </button>
          </div>
        </div>
        <div class="actions">
          <button @click="handleStart" :disabled="store.isRunning" class="btn start">
            開始模擬
          </button>
          <button @click="handleStop" :disabled="!store.isRunning" class="btn stop">暫停</button>
          <button @click="handleReset" class="btn reset">重置</button>
        </div>
      </div>
    </header>

    <!-- 進度條 -->
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
      <span class="progress-text">送達進度 {{ progressPercent }}%</span>
    </div>

    <main class="simulation-container">
      <div class="building">
        <!-- 電梯井標題 -->
        <div class="shaft-header">
          <div class="floor-info"></div>
          <div class="shaft-label">E1</div>
          <div class="shaft-label">E2</div>
          <div class="waiting-label">等候區</div>
        </div>

        <div v-for="floor in floors" :key="floor" class="floor-row">
          <div class="floor-info">
            <span class="floor-name">{{ floor }}F</span>
          </div>

          <div class="shaft">
            <transition name="move">
              <div
                v-if="store.elevators[0] && store.elevators[0].currentFloor === floor"
                class="elevator-car"
                :class="store.elevators[0].status"
                :title="getElevatorTooltip(store.elevators[0])"
              >
                <div class="car-id">E1</div>
                <div class="direction">{{ getDirSign(store.elevators[0].direction) }}</div>
                <div class="load">{{ store.elevators[0].passengers.length }}/5</div>
              </div>
            </transition>
          </div>

          <div class="shaft">
            <transition name="move">
              <div
                v-if="store.elevators[1] && store.elevators[1].currentFloor === floor"
                class="elevator-car"
                :class="store.elevators[1].status"
                :title="getElevatorTooltip(store.elevators[1])"
              >
                <div class="car-id">E2</div>
                <div class="direction">{{ getDirSign(store.elevators[1].direction) }}</div>
                <div class="load">{{ store.elevators[1].passengers.length }}/5</div>
              </div>
            </transition>
          </div>

          <div class="waiting-area">
            <div
              v-for="p in getWaitingAt(floor)"
              :key="p.id"
              class="passenger-icon"
              :class="p.direction === 1 ? 'up' : 'down'"
              :title="`#${p.id}: ${p.fromFloor}F → ${p.toFloor}F`"
            >
              <span class="arrow">{{ p.direction === 1 ? '▲' : '▼' }}</span>
              <span class="target">{{ p.toFloor }}</span>
            </div>
          </div>
        </div>
      </div>

      <aside class="side-panel">
        <h3>
          運作日誌 <span class="log-count">({{ store.logs.length }})</span>
        </h3>
        <div class="log-viewer" ref="logContainer">
          <div
            v-for="(log, idx) in store.logs"
            :key="idx"
            class="log-entry"
            :class="getLogClass(log)"
          >
            {{ log }}
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick, watch } from 'vue'
import { useElevatorStore } from './stores/elevator'

const store = useElevatorStore()
const floors = computed(() => Array.from({ length: 10 }, (_, i) => 10 - i))
const logContainer = ref<HTMLElement | null>(null)

let timer: number | null = null

// 速度控制
const speeds = [1000, 500, 250, 100]
const speedLabels = ['1x', '2x', '4x', '10x']
const speedLevel = ref(0)

const changeSpeed = (delta: number) => {
  const next = speedLevel.value + delta
  if (next < 0 || next >= speeds.length) return
  speedLevel.value = next
  // 如果正在跑就重啟 timer
  if (store.isRunning && timer) {
    clearInterval(timer)
    timer = window.setInterval(() => store.tick(), speeds[speedLevel.value])
  }
}

// 進度
const progressPercent = computed(() =>
  Math.min(100, Math.round((store.finishedPeopleCount / 40) * 100)),
)

// 自動捲動日誌
watch(
  () => store.logs.length,
  () => {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  },
)

const handleStart = () => {
  store.startSimulation()
  timer = window.setInterval(() => store.tick(), speeds[speedLevel.value])
}

const handleStop = () => {
  store.stopSimulation()
  if (timer) clearInterval(timer)
}

const handleReset = () => {
  handleStop()
  location.reload()
}

const getWaitingAt = (floor: number) => {
  return store.waitingQueue.filter((p) => p.fromFloor === floor)
}

const getDirSign = (dir: number) => {
  if (dir === 1) return '▲'
  if (dir === -1) return '▼'
  return '●'
}

const getElevatorTooltip = (e: { id: number; passengers: { id: number; toFloor: number }[] }) => {
  if (e.passengers.length === 0) return `E${e.id}: 空車`
  const list = e.passengers.map((p) => `#${p.id}→${p.toFloor}F`).join(', ')
  return `E${e.id}: ${list}`
}

const getLogClass = (log: string) => {
  if (log.includes('接走')) return 'log-pickup'
  if (log.includes('放下')) return 'log-dropoff'
  if (log.includes('出現')) return 'log-spawn'
  if (log.includes('模擬結束')) return 'log-finish'
  return ''
}

onUnmounted(() => handleStop())
</script>

<style scoped>
.elevator-app {
  font-family: 'Inter', system-ui, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  color: #2c3e50;
  padding: 20px;
}

/* 頂部 Dashboard */
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

/* 速度控制 */
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

/* 進度條 */
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

/* 按鈕樣式 */
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

/* 模擬區域 */
.simulation-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  height: 700px;
}

.building {
  background: #f8f9fa;
  border: 4px solid #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

/* 電梯井標題列 */
.shaft-header {
  display: flex;
  background: #2c3e50;
  color: white;
  font-size: 13px;
  font-weight: bold;
  border-bottom: 2px solid #333;
  border-radius: 4px 4px 0 0;
}
.shaft-header .floor-info {
  border-radius: 4px 0 0 0;
}
.shaft-label {
  width: 80px;
  text-align: center;
  padding: 6px 0;
  border-right: 2px dashed #4a6278;
}
.waiting-label {
  flex: 1;
  text-align: center;
  padding: 6px 0;
}

.floor-row {
  flex: 1;
  display: flex;
  border-bottom: 1px solid #dee2e6;
  position: relative;
}

.floor-info {
  width: 60px;
  background: #333;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.shaft {
  width: 80px;
  border-right: 2px dashed #bdc3c7;
  background: #ecf0f1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* 電梯本體 */
.elevator-car {
  width: 64px;
  height: 52px;
  background: #3498db;
  border: 2px solid #2980b9;
  border-radius: 4px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  z-index: 10;
  transition: all 0.5s ease-in-out;
  cursor: default;
  position: relative;
}

.elevator-car .car-id {
  font-size: 9px;
  opacity: 0.7;
  position: absolute;
  top: 1px;
  left: 4px;
}

.elevator-car.MOVING {
  background: #2980b9;
  border-color: #1f6dad;
  box-shadow: 0 0 8px rgba(41, 128, 185, 0.4);
}

.elevator-car.PROCESSING {
  background: #f1c40f;
  border-color: #f39c12;
  color: #333;
  box-shadow: 0 0 15px rgba(241, 196, 15, 0.5);
  animation: pulse 0.6s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

.elevator-car.IDLE {
  background: #7f8c8d;
  border-color: #6c7a7d;
}

.waiting-area {
  flex: 1;
  padding: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: center;
}

.passenger-icon {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  animation: fadeIn 0.3s ease;
  cursor: default;
}

.passenger-icon.up {
  background-color: #27ae60;
  border-bottom: 2px solid #1e8449;
}

.passenger-icon.down {
  background-color: #e74c3c;
  border-bottom: 2px solid #c0392b;
}

.arrow {
  margin-right: 3px;
}

.target {
  background: rgba(0, 0, 0, 0.2);
  padding: 0 3px;
  border-radius: 2px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 日誌面板 */
.side-panel {
  background: #2c3e50;
  color: #ecf0f1;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 700px;
  box-sizing: border-box;
}

.side-panel h3 {
  margin-top: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
}

.log-count {
  font-size: 13px;
  color: #7f8c8d;
  font-weight: normal;
}

.log-viewer {
  flex-grow: 1;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  background: #1a1a1a;
  padding: 10px;
  border-radius: 4px;
  scrollbar-width: thin;
  scrollbar-color: #42b883 #1a1a1a;
}

.log-viewer::-webkit-scrollbar {
  width: 6px;
}
.log-viewer::-webkit-scrollbar-thumb {
  background-color: #42b883;
  border-radius: 10px;
}

.log-entry {
  margin-bottom: 5px;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
  color: #8e9eab;
}

.log-entry.log-spawn {
  color: #bdc3c7;
}
.log-entry.log-pickup {
  color: #42b883;
}
.log-entry.log-dropoff {
  color: #3498db;
}
.log-entry.log-finish {
  color: #f1c40f;
  font-weight: bold;
  font-size: 14px;
}

/* 動畫：電梯切換樓層 */
.move-enter-active,
.move-leave-active {
  transition: opacity 0.3s;
}
.move-enter-from,
.move-leave-to {
  opacity: 0;
}
</style>
