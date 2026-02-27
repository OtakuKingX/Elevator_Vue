<template>
  <v-card class="log-panel d-flex flex-column" height="700">
    <v-card-title class="d-flex align-center bg-secondary flex-shrink-0">
      <v-icon class="mr-2">mdi-text-box-outline</v-icon>
      運作日誌
      <v-chip size="small" class="ml-2">{{ store.logs.length }}</v-chip>
    </v-card-title>
    <v-card-text class="flex-grow-1 pa-0" style="height: calc(100% - 64px); overflow: hidden">
      <v-virtual-scroll :items="store.logs" height="100%" item-height="30" ref="logContainer">
        <template v-slot:default="{ item }">
          <div class="log-entry pa-2" :class="getLogClass(item)">
            {{ item }}
          </div>
        </template>
      </v-virtual-scroll>
    </v-card-text>
  </v-card>
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
.log-panel {
  font-family: 'Courier New', Courier, monospace;
}

.log-entry {
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #8e9eab;
}

.log-entry.log-spawn {
  color: #bdc3c7;
}
.log-entry.log-pickup {
  color: #42b883;
  font-weight: 500;
}
.log-entry.log-dropoff {
  color: #3498db;
  font-weight: 500;
}
.log-entry.log-finish {
  color: #f1c40f;
  font-weight: bold;
  font-size: 14px;
}
</style>
