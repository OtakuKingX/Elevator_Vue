<template>
  <div v-if="store.stats && !store.isRunning" class="stats-overlay">
    <div class="stats-card">
      <h2>📊 模擬統計結果</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">總耗時</span>
          <span class="stat-value highlight">{{ store.stats.totalTime }}s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均等待時間</span>
          <span class="stat-value">{{ store.stats.avgWaitTime }}s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最長等待時間</span>
          <span class="stat-value warn">{{ store.stats.maxWaitTime }}s</span>
        </div>
      </div>

      <h3>各電梯效率</h3>
      <div class="elevator-stats">
        <div v-for="es in store.stats.perElevator" :key="es.id" class="elevator-stat-card">
          <div class="es-header">E{{ es.id }}</div>
          <div class="es-row">
            <span>載客人次</span>
            <strong>{{ es.tripCount }}</strong>
          </div>
          <div class="es-row">
            <span>移動樓層數</span>
            <strong>{{ es.totalFloorsMoved }}</strong>
          </div>
          <div class="es-row">
            <span>效率 (人/層)</span>
            <strong>{{
              es.totalFloorsMoved > 0 ? (es.tripCount / es.totalFloorsMoved).toFixed(2) : '—'
            }}</strong>
          </div>
        </div>
      </div>

      <button class="close-btn" @click="$emit('close')">關閉</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElevatorStore } from '../stores/elevator'

const store = useElevatorStore()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.stats-card {
  background: #1a1a2e;
  color: #ecf0f1;
  border-radius: 16px;
  padding: 32px 40px;
  min-width: 420px;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-card h2 {
  margin: 0 0 20px;
  text-align: center;
}

.stats-card h3 {
  margin: 24px 0 12px;
  color: #42b883;
  font-size: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8e9eab;
  margin-bottom: 6px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #42b883;
}

.stat-value.highlight {
  color: #3498db;
}

.stat-value.warn {
  color: #e74c3c;
}

.elevator-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.elevator-stat-card {
  flex: 1;
  min-width: 140px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 14px;
  border-left: 3px solid #42b883;
}

.es-header {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #3498db;
}

.es-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
  color: #bdc3c7;
}

.es-row strong {
  color: white;
}

.close-btn {
  display: block;
  margin: 24px auto 0;
  padding: 10px 32px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #36a276;
}
</style>
