<template>
  <aside class="side-panel">
    <h3>
      運作日誌 <span class="log-count">({{ store.logs.length }})</span>
    </h3>
    <div class="log-viewer" ref="logContainer">
      <div v-for="(log, idx) in store.logs" :key="idx" class="log-entry" :class="getLogClass(log)">
        {{ log }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useElevatorStore } from '../stores/elevator'

const store = useElevatorStore()
const logContainer = ref<HTMLElement | null>(null)

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

const getLogClass = (log: string) => {
  if (log.includes('接走')) return 'log-pickup'
  if (log.includes('放下')) return 'log-dropoff'
  if (log.includes('出現')) return 'log-spawn'
  if (log.includes('模擬結束')) return 'log-finish'
  return ''
}
</script>

<style scoped>
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
</style>
