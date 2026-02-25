<template>
  <div class="config-panel" v-if="!store.isRunning">
    <h3>⚙️ 模擬參數設定</h3>
    <div class="config-grid">
      <label>
        <span>樓層數</span>
        <input
          type="number"
          :value="store.config.maxFloor"
          @input="update('maxFloor', $event)"
          min="3"
          max="30"
        />
      </label>
      <label>
        <span>電梯數量</span>
        <input
          type="number"
          :value="store.config.elevatorCount"
          @input="update('elevatorCount', $event)"
          min="1"
          max="6"
        />
      </label>
      <label>
        <span>電梯容量</span>
        <input
          type="number"
          :value="store.config.maxCapacity"
          @input="update('maxCapacity', $event)"
          min="1"
          max="20"
        />
      </label>
      <label>
        <span>總人數</span>
        <input
          type="number"
          :value="store.config.targetPeople"
          @input="update('targetPeople', $event)"
          min="5"
          max="200"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElevatorStore } from '../stores/elevator'
import type { SimulationConfig } from '../types/elevator'

const store = useElevatorStore()

const update = (key: keyof SimulationConfig, event: Event) => {
  const val = parseInt((event.target as HTMLInputElement).value)
  if (!isNaN(val) && val > 0) {
    store.updateConfig({ [key]: val })
  }
}
</script>

<style scoped>
.config-panel {
  background: #2c3e50;
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.config-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.config-grid label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #bdc3c7;
}

.config-grid input {
  width: 80px;
  padding: 6px 4px 6px 10px;
  border: 1px solid #4a6278;
  border-radius: 4px;
  background: #1a1a1a;
  color: #42b883;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.config-grid input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}
</style>
