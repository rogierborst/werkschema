<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { IonList, IonItemDivider, IonLabel, IonIcon } from '@ionic/vue'
import { calendarOutline } from 'ionicons/icons'
import { useShiftsStore } from '@/stores/shifts'
import { usePeopleStore } from '@/stores/people'
import { useSettingsStore } from '@/stores/settings'
import { useNotifications } from '@/composables/useNotifications'
import ShiftItem from '@/components/home/ShiftItem.vue'
import type { ShiftEntry, DateGroup } from '@/types'

const props = defineProps<{ activeFilter: string }>()
const emit = defineEmits<{ 'edit-shift': [shift: ShiftEntry] }>()

const PERSON_COLORS = ['#3880ff', '#2dd36f', '#eb445a', '#ffc409', '#92949c', '#6a64ff']

const shiftsStore = useShiftsStore()
const peopleStore = usePeopleStore()
const settingsStore = useSettingsStore()
const { scheduleNextDayReminder } = useNotifications()

const todayStr = new Date().toISOString().split('T')[0]
const todayDividerRef = ref<HTMLElement | null>(null)

const allEntries = computed<ShiftEntry[]>(() => {
  const myName = settingsStore.settings.myName || 'Me'
  const mine: ShiftEntry[] = shiftsStore.shifts.map(s => ({
    ...s,
    ownerName: myName,
    isOwn: true,
    color: PERSON_COLORS[0],
  }))

  const others: ShiftEntry[] = peopleStore.people.flatMap((person, idx) =>
    person.shifts.map(s => ({
      ...s,
      ownerName: person.name,
      isOwn: false,
      color: PERSON_COLORS[(idx + 1) % PERSON_COLORS.length],
    }))
  )

  return [...mine, ...others]
})

const visibleEntries = computed<ShiftEntry[]>(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  return allEntries.value
    .filter(e => e.date >= cutoffStr)
    .filter(e => {
      if (props.activeFilter === 'all') return true
      if (props.activeFilter === 'me') return e.isOwn
      return e.ownerName === props.activeFilter
    })
    .sort((a, b) => a.date.localeCompare(b.date))
})

const dateGroups = computed<DateGroup[]>(() => {
  const map = new Map<string, ShiftEntry[]>()
  for (const entry of visibleEntries.value) {
    if (!map.has(entry.date)) map.set(entry.date, [])
    map.get(entry.date)!.push(entry)
  }

  return Array.from(map.entries()).map(([date, shifts]) => ({
    date,
    label: formatDateLabel(date),
    isToday: date === todayStr,
    shifts,
  }))
})

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

async function onDeleteShift(shift: ShiftEntry) {
  if (shift.isOwn) {
    await shiftsStore.removeShift(shift.id)
  } else {
    await peopleStore.removeShiftFromPerson(shift.ownerName, shift.id)
  }
  await scheduleNextDayReminder()
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    todayDividerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 300)
})
</script>

<template>
  <ion-list v-if="dateGroups.length > 0" lines="full">
    <template v-for="group in dateGroups" :key="group.date">
      <ion-item-divider
        :ref="group.isToday ? (el) => (todayDividerRef = el as HTMLElement) : undefined"
        :color="group.isToday ? 'primary' : undefined"
        sticky
      >
        <ion-label>{{ group.label }}</ion-label>
      </ion-item-divider>

      <shift-item
        v-for="shift in group.shifts"
        :key="shift.id"
        :shift="shift"
        @edit="emit('edit-shift', shift)"
        @delete="onDeleteShift(shift)"
      />
    </template>
  </ion-list>

  <div v-else class="empty-state">
    <ion-icon :icon="calendarOutline" size="large" />
    <p>No shifts yet. Tap + to add your first shift.</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: var(--ion-color-medium);
  gap: 12px;
  text-align: center;
}
</style>
