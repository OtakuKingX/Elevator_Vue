<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center justify-space-between flex-wrap pa-4 bg-secondary">
      <div class="d-flex align-center">
        <v-icon size="32" class="mr-2">mdi-office-building</v-icon>
        <span class="text-h5">電梯管理模擬系統</span>
      </div>

      <div class="d-flex align-center gap-2 flex-wrap">
        <v-btn
          color="primary"
          :disabled="store.isRunning"
          @click="$emit('start')"
          prepend-icon="mdi-play"
        >
          開始模擬
        </v-btn>
        <v-btn
          color="error"
          :disabled="!store.isRunning"
          @click="$emit('stop')"
          prepend-icon="mdi-pause"
        >
          暫停
        </v-btn>
        <v-btn color="grey" @click="$emit('reset')" prepend-icon="mdi-refresh"> 重置 </v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-caption text-medium-emphasis">模擬時間</div>
            <div class="text-h5 text-primary font-weight-bold">{{ store.time }}s</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-caption text-medium-emphasis">已送達</div>
            <div class="text-h5 text-primary font-weight-bold">
              {{ store.finishedPeopleCount }} / {{ store.config.targetPeople }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-caption text-medium-emphasis">等待中</div>
            <div class="text-h5 text-accent font-weight-bold">{{ store.waitingQueue.length }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-caption text-medium-emphasis">速度</div>
            <div class="d-flex align-center justify-center gap-2">
              <v-btn
                size="small"
                icon="mdi-minus"
                @click="$emit('changeSpeed', -1)"
                :disabled="speedLevel <= 0"
                variant="text"
              ></v-btn>
              <span class="text-h6 font-weight-bold">{{ speedLabels[speedLevel] }}</span>
              <v-btn
                size="small"
                icon="mdi-plus"
                @click="$emit('changeSpeed', 1)"
                :disabled="speedLevel >= speedLabels.length - 1"
                variant="text"
              ></v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 進度條 -->
    <v-progress-linear
      :model-value="progressPercent"
      color="primary"
      height="25"
      class="text-center"
    >
      <template v-slot:default="{ value }">
        <strong class="text-white">送達進度 {{ Math.ceil(value) }}%</strong>
      </template>
    </v-progress-linear>
  </v-card>
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
.gap-2 {
  gap: 8px;
}
</style>
