<script setup lang="ts">
import {
  IonItem, IonItemSliding, IonItemOptions, IonItemOption,
  IonLabel, IonAvatar, IonIcon,
} from '@ionic/vue'
import { trashOutline } from 'ionicons/icons'
import type { ShiftEntry } from '@/types'

defineProps<{ shift: ShiftEntry }>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

function shiftLabel(shift: ShiftEntry): string {
  if (shift.type === 'morning') return '☀️ Ochtend'
  if (shift.type === 'evening') return '🌙 Avond'
  return `✏️ ${shift.customLabel || 'Custom'}`
}
</script>

<template>
  <ion-item-sliding>
    <ion-item
      :button="shift.isOwn"
      :detail="false"
      @click="shift.isOwn ? emit('edit') : undefined"
    >
      <ion-avatar
        slot="start"
        :style="{ background: shift.color, width: '10px', borderRadius: '2px', marginRight: '12px' }"
      />
      <ion-label>
        <h3>{{ shiftLabel(shift) }}</h3>
        <p>{{ shift.ownerName }}</p>
      </ion-label>
    </ion-item>
    <ion-item-options side="end">
      <ion-item-option color="danger" @click="emit('delete')">
        <ion-icon slot="icon-only" :icon="trashOutline" />
      </ion-item-option>
    </ion-item-options>
  </ion-item-sliding>
</template>
