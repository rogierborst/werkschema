<script setup lang="ts">
import { computed } from 'vue'
import { IonChip, IonLabel } from '@ionic/vue'
import { usePeopleStore } from '@/stores/people'
import { useSettingsStore } from '@/stores/settings'

defineProps<{ modelValue: string }>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const peopleStore = usePeopleStore()
const settingsStore = useSettingsStore()

const options = computed(() => [
  { key: 'all', label: 'All' },
  { key: 'me', label: settingsStore.settings.myName || 'Me' },
  ...peopleStore.people.map(p => ({ key: p.name, label: p.name })),
])
</script>

<template>
  <div class="filter-bar" v-if="peopleStore.people.length > 0">
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
