<template>
  <v-expand-transition>
    <v-card v-if="!store.isRunning" class="mb-4">
      <v-card-title class="d-flex align-center bg-secondary">
        <v-icon class="mr-2">mdi-cog</v-icon>
        模擬參數設定
      </v-card-title>
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="6" sm="3">
            <v-text-field
              label="樓層數"
              type="number"
              :model-value="store.config.maxFloor"
              @update:model-value="update('maxFloor', $event)"
              min="3"
              max="30"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              label="電梯數量"
              type="number"
              :model-value="store.config.elevatorCount"
              @update:model-value="update('elevatorCount', $event)"
              min="1"
              max="6"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              label="電梯容量"
              type="number"
              :model-value="store.config.maxCapacity"
              @update:model-value="update('maxCapacity', $event)"
              min="1"
              max="20"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              label="總人數"
              type="number"
              :model-value="store.config.targetPeople"
              @update:model-value="update('targetPeople', $event)"
              min="5"
              max="200"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-expand-transition>
</template>

<script setup lang="ts">
import { useElevatorStore } from '../stores/elevator'
import type { SimulationConfig } from '../types/elevator'

const store = useElevatorStore()

const update = (key: keyof SimulationConfig, value: string | number) => {
  const val = typeof value === 'string' ? parseInt(value) : value
  if (!isNaN(val) && val > 0) {
    store.updateConfig({ [key]: val })
  }
}
</script>

<style scoped>
/* Vuetify 處理所有樣式 */
</style>
