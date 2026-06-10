<template>
  <ion-modal
    :is-open="isOpen"
    :breakpoints="[0, 1]"
    :initial-breakpoint="1"
    @did-dismiss="emit('did-dismiss')"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Shift</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('did-dismiss')">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Date picker -->
      <ion-item>
        <ion-label position="stacked">Date</ion-label>
        <ion-datetime-button datetime="shift-date" />
      </ion-item>

      <!-- Shift type -->
      <ion-item>
        <ion-label position="stacked">Shift type</ion-label>
      </ion-item>
      <ion-radio-group v-model="selectedType">
        <ion-item>
          <ion-radio value="morning" label-placement="end">🌅 Morning</ion-radio>
        </ion-item>
        <ion-item>
          <ion-radio value="evening" label-placement="end">🌆 Evening</ion-radio>
        </ion-item>
        <ion-item>
          <ion-radio value="custom" label-placement="end">✏️ Custom</ion-radio>
        </ion-item>
      </ion-radio-group>

      <!-- Custom label input -->
      <ion-item v-if="selectedType === 'custom'">
        <ion-input
          label="Custom label"
          label-placement="stacked"
          placeholder="e.g. Night shift"
          v-model="customLabel"
        />
      </ion-item>

      <ion-button expand="block" class="ion-margin-top" @click="onAdd">
        Add Shift
      </ion-button>
    </ion-content>

    <!-- Inline date picker popover -->
    <ion-modal :keep-contents-mounted="true">
      <ion-datetime
        id="shift-date"
        presentation="date"
        :value="selectedDate"
        @ion-change="onDateChange"
      />
    </ion-modal>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonRadioGroup, IonRadio, IonInput,
  IonDatetime, IonDatetimeButton,
} from '@ionic/vue'
import type { Shift, ShiftType } from '@/types'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  (e: 'did-dismiss'): void
  (e: 'shift-added', shift: Shift): void
}>()

const todayStr = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayStr)
const selectedType = ref<ShiftType>('morning')
const customLabel = ref('')

function onDateChange(ev: CustomEvent) {
  const value = ev.detail.value as string
  if (!value) return
  selectedDate.value = value.includes('T') ? value.split('T')[0] : value
}

function onAdd() {
  if (selectedType.value === 'custom' && !customLabel.value.trim()) return

  const shift: Shift = {
    id: `${selectedDate.value}-${Date.now()}`,
    date: selectedDate.value,
    type: selectedType.value,
    customLabel: selectedType.value === 'custom' ? customLabel.value.trim() : undefined,
  }

  emit('shift-added', shift)
  emit('did-dismiss')

  // Reset for next time
  selectedDate.value = todayStr
  selectedType.value = 'morning'
  customLabel.value = ''
}
</script>
