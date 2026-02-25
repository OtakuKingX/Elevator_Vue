<template>
  <div class="elevator-app">
    <DashboardHeader
      :speedLevel="speedLevel"
      :speedLabels="speedLabels"
      @changeSpeed="changeSpeed"
      @start="handleStart"
      @stop="handleStop"
      @reset="handleReset"
    />

    <ConfigPanel />

    <main class="simulation-container">
      <BuildingView />
      <LogPanel />
    </main>

    <StatsPanel v-if="showStats" @close="showStats = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useElevatorStore } from './stores/elevator'
import DashboardHeader from './components/DashboardHeader.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import BuildingView from './components/BuildingView.vue'
import LogPanel from './components/LogPanel.vue'
import StatsPanel from './components/StatsPanel.vue'

const store = useElevatorStore()

let timer: number | null = null

// 速度控制
const speeds = [1000, 500, 250, 100]
const speedLabels = ['1x', '2x', '4x', '10x']
const speedLevel = ref(0)

const showStats = ref(false)

const changeSpeed = (delta: number) => {
  const next = speedLevel.value + delta
  if (next < 0 || next >= speeds.length) return
  speedLevel.value = next
  if (store.isRunning && timer) {
    clearInterval(timer)
    timer = window.setInterval(() => store.tick(), speeds[speedLevel.value])
  }
}

// 模擬結束時自動彈出統計
watch(
  () => store.isRunning,
  (running, wasRunning) => {
    if (!running && wasRunning && store.stats) {
      showStats.value = true
    }
  },
)

const handleStart = () => {
  showStats.value = false
  store.startSimulation()
  timer = window.setInterval(() => store.tick(), speeds[speedLevel.value])
}

const handleStop = () => {
  store.stopSimulation()
  if (timer) clearInterval(timer)
}

const handleReset = () => {
  handleStop()
  showStats.value = false
  location.reload()
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

.simulation-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  height: 700px;
}
</style>
