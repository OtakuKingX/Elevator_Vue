<template>
  <div class="building">
    <!-- 電梯井標題列 -->
    <div class="shaft-header">
      <div class="floor-label-header"></div>
      <div v-for="e in store.elevators" :key="'h' + e.id" class="shaft-label">E{{ e.id }}</div>
      <div class="waiting-label">等候區</div>
    </div>

    <!-- 樓層容器 (相對定位，電梯在此內絕對定位) -->
    <div class="floors-container" ref="floorsRef">
      <!-- 樓層列 -->
      <div v-for="floor in floors" :key="floor" class="floor-row">
        <div class="floor-info">
          <span class="floor-name">{{ floor }}F</span>
        </div>

        <!-- 空的 shaft 佔位 (背景用) -->
        <div v-for="e in store.elevators" :key="'s' + e.id" class="shaft"></div>

        <!-- 等候區 -->
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

      <!-- 電梯本體 (絕對定位，用 translateY 平滑移動) -->
      <div
        v-for="(e, idx) in store.elevators"
        :key="'car' + e.id"
        class="elevator-car"
        :class="[e.status, { 'door-open': e.status === 'PROCESSING' }]"
        :style="getElevatorStyle(e, idx)"
        :title="getElevatorTooltip(e)"
      >
        <div class="car-body">
          <!-- 門 -->
          <div class="door door-left" :class="{ open: e.status === 'PROCESSING' }"></div>
          <div class="door door-right" :class="{ open: e.status === 'PROCESSING' }"></div>
          <!-- 內容 -->
          <div class="car-content">
            <div class="car-id">E{{ e.id }}</div>
            <div class="direction">{{ getDirSign(e.direction) }}</div>
            <div class="load">{{ e.passengers.length }}/{{ store.config.maxCapacity }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useElevatorStore } from '../stores/elevator'
import type { ElevatorState } from '../types/elevator'

const store = useElevatorStore()

const floors = computed(() =>
  Array.from({ length: store.config.maxFloor }, (_, i) => store.config.maxFloor - i),
)

// 計算百分比定位：每層佔 (100 / maxFloor)%
const getElevatorStyle = (e: ElevatorState, idx: number) => {
  const maxFloor = store.config.maxFloor
  const floorHeight = 100 / maxFloor
  // 從頂部算：第 maxFloor 樓 = 0%、第 1 樓 = (maxFloor-1) * floorHeight%
  const topPercent = (maxFloor - e.currentFloor) * floorHeight

  // 水平位置：floor-info 寬 60px，每個 shaft 寬 80px，電梯寬 72px → 置中偏移 4px
  const leftPx = 60 + idx * 80 + (80 - 72) / 2

  return {
    top: `${topPercent}%`,
    left: `${leftPx}px`,
    height: `${floorHeight}%`,
  }
}

const getWaitingAt = (floor: number) => {
  return store.waitingQueue.filter((p) => p.fromFloor === floor)
}

const getDirSign = (dir: number) => {
  if (dir === 1) return '▲'
  if (dir === -1) return '▼'
  return '●'
}

const getElevatorTooltip = (e: ElevatorState) => {
  if (e.passengers.length === 0) return `E${e.id}: 空車`
  const list = e.passengers.map((p) => `#${p.id}→${p.toFloor}F`).join(', ')
  return `E${e.id}: ${list}`
}
</script>

<style scoped>
.building {
  background: #f8f9fa;
  border: 4px solid #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shaft-header {
  display: flex;
  background: #2c3e50;
  color: white;
  font-size: 13px;
  font-weight: bold;
  border-bottom: 2px solid #333;
  flex-shrink: 0;
}

.floor-label-header {
  width: 60px;
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

/* 樓層容器 */
.floors-container {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.floor-row {
  flex: 1;
  display: flex;
  border-bottom: 1px solid #dee2e6;
  min-height: 0;
}

.floor-info {
  width: 60px;
  background: #333;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 13px;
  flex-shrink: 0;
}

.shaft {
  width: 80px;
  border-right: 2px dashed #bdc3c7;
  background: #ecf0f1;
  flex-shrink: 0;
}

.waiting-area {
  flex: 1;
  padding: 3px 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-content: center;
  background: #f8f9fa;
}

/* ===== 電梯本體 (絕對定位 + 平滑 transition) ===== */
.elevator-car {
  position: absolute;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: top 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 2px 0;
  box-sizing: border-box;
}

.car-body {
  width: 64px;
  height: 90%;
  max-height: 56px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.car-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: white;
  font-size: 11px;
  pointer-events: none;
}

.car-id {
  font-size: 9px;
  opacity: 0.7;
  position: absolute;
  top: 1px;
  left: 4px;
}

/* ===== 門動畫 ===== */
.door {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  z-index: 3;
  transition: transform 0.35s ease;
}

.door-left {
  left: 0;
  background: rgba(0, 0, 0, 0.15);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.door-right {
  right: 0;
  background: rgba(0, 0, 0, 0.15);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.door-left.open {
  transform: translateX(-100%);
}

.door-right.open {
  transform: translateX(100%);
}

/* ===== 電梯狀態色 ===== */
.elevator-car .car-body {
  background: #7f8c8d;
  border: 2px solid #6c7a7d;
}

.elevator-car.MOVING .car-body {
  background: #2980b9;
  border-color: #1f6dad;
  box-shadow: 0 0 12px rgba(41, 128, 185, 0.5);
}

.elevator-car.PROCESSING .car-body {
  background: #f1c40f;
  border-color: #f39c12;
  box-shadow: 0 0 18px rgba(241, 196, 15, 0.6);
  animation: pulse 0.6s ease-in-out infinite alternate;
}

.elevator-car.PROCESSING .car-content {
  color: #333;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.04);
  }
}

.elevator-car.IDLE .car-body {
  background: #7f8c8d;
  border-color: #6c7a7d;
}

/* ===== 乘客圖示 ===== */
.passenger-icon {
  display: inline-flex;
  align-items: center;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 11px;
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
  margin-right: 2px;
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
</style>
