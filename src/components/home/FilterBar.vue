<script setup lang="ts">
import { IonChip, IonLabel } from '@ionic/vue'

interface FilterOption {
  key: string
  label: string
}

defineProps<{
  options: FilterOption[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="filter-bar">
    <ion-chip
      v-for="option in options"
      :key="option.key"
      :color="modelValue === option.key ? 'primary' : undefined"
      :outline="modelValue !== option.key"
      @click="emit('update:modelValue', option.key)"
    >
      <ion-label>{{ option.label }}</ion-label>
    </ion-chip>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 8px 12px;
  gap: 4px;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar {
  display: none;
}
</style>
