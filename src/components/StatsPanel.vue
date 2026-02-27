<template>
  <v-dialog :model-value="true" max-width="700" persistent>
    <v-card v-if="store.stats && !store.isRunning">
      <v-card-title class="d-flex align-center justify-center text-h5 pa-4">
        <v-icon class="mr-2" size="32">mdi-chart-bar</v-icon>
        模擬統計結果
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="primary" class="text-center pa-4">
              <div class="text-caption">總耗時</div>
              <div class="text-h4 font-weight-bold">{{ store.stats.totalTime }}s</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" class="text-center pa-4">
              <div class="text-caption">平均等待時間</div>
              <div class="text-h4 font-weight-bold">{{ store.stats.avgWaitTime }}s</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="error" class="text-center pa-4">
              <div class="text-caption">最長等待時間</div>
              <div class="text-h4 font-weight-bold">{{ store.stats.maxWaitTime }}s</div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <div class="text-h6 mb-3 text-primary">
          <v-icon class="mr-1">mdi-elevator</v-icon>
          各電梯效率
        </div>

        <v-row>
          <v-col v-for="es in store.stats.perElevator" :key="es.id" cols="12" sm="6" md="4">
            <v-card variant="outlined" class="pa-3">
              <div class="text-h6 text-primary mb-2">E{{ es.id }}</div>
              <v-list density="compact" class="pa-0 bg-transparent">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-account-multiple</v-icon>
                  </template>
                  <v-list-item-title>載客人次</v-list-item-title>
                  <template v-slot:append>
                    <strong>{{ es.tripCount }}</strong>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-stairs</v-icon>
                  </template>
                  <v-list-item-title>移動樓層數</v-list-item-title>
                  <template v-slot:append>
                    <strong>{{ es.totalFloorsMoved }}</strong>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-speedometer</v-icon>
                  </template>
                  <v-list-item-title>效率 (人/層)</v-list-item-title>
                  <template v-slot:append>
                    <strong>{{
                      es.totalFloorsMoved > 0
                        ? (es.tripCount / es.totalFloorsMoved).toFixed(2)
                        : '—'
                    }}</strong>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="justify-center pa-4">
        <v-btn color="primary" size="large" @click="$emit('close')" prepend-icon="mdi-close">
          關閉
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useElevatorStore } from '../stores/elevator'

const store = useElevatorStore()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
/* Vuetify 處理所有樣式 */
</style>
