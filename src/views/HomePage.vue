<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonList, IonItemDivider, IonLabel,
  IonFab, IonFabButton,
} from '@ionic/vue'
import {
  shareOutline, settingsOutline, addOutline, calendarOutline,
} from 'ionicons/icons'
import { useShiftsStore } from '@/stores/shifts'
import { usePeopleStore } from '@/stores/people'
import { useSettingsStore } from '@/stores/settings'
import { useShare } from '@/composables/useShare'
import { useNotifications } from '@/composables/useNotifications'
import ShiftFormModal from '@/components/ShiftFormModal.vue'
import FilterBar from '@/components/home/FilterBar.vue'
import ShiftItem from '@/components/home/ShiftItem.vue'
import type { Shift, ShiftEntry, DateGroup } from '@/types'

const PERSON_COLORS = ['#3880ff', '#2dd36f', '#eb445a', '#ffc409', '#92949c', '#6a64ff']

const shiftsStore = useShiftsStore()
const peopleStore = usePeopleStore()
const settingsStore = useSettingsStore()
const { shareSchedule } = useShare()
const { scheduleNextDayReminder } = useNotifications()

const contentRef = ref()
const todayDividerRef = ref<HTMLElement | null>(null)
const isAddModalOpen = ref(false)
const editingShift = ref<Shift | undefined>(undefined)
const activeFilter = ref<string>('all')

const todayStr = new Date().toISOString().split('T')[0]

const allPeople = computed(() => peopleStore.people)

const filterOptions = computed(() => [
  { key: 'all', label: 'All' },
  { key: 'me', label: settingsStore.settings.myName || 'Me' },
  ...allPeople.value.map(p => ({ key: p.name, label: p.name })),
])

const allEntries = computed<ShiftEntry[]>(() => {
  const myName = settingsStore.settings.myName || 'Me'
  const mine: ShiftEntry[] = shiftsStore.shifts.map(s => ({
    ...s,
    ownerName: myName,
    isOwn: true,
    color: PERSON_COLORS[0],
  }))

  const others: ShiftEntry[] = allPeople.value.flatMap((person, idx) =>
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
      if (activeFilter.value === 'all') return true
      if (activeFilter.value === 'me') return e.isOwn
      return e.ownerName === activeFilter.value
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

function onEditShift(shift: ShiftEntry) {
  editingShift.value = {
    id: shift.id,
    date: shift.date,
    type: shift.type,
    customLabel: shift.customLabel,
  }
  isAddModalOpen.value = true
}

async function onShiftAdded(shift: Shift) {
  await shiftsStore.addShift(shift)
  await scheduleNextDayReminder()
}

async function onShiftUpdated(shift: Shift) {
  await shiftsStore.updateShift(shift)
  await scheduleNextDayReminder()
}

async function onShare() {
  await shareSchedule()
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    todayDividerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 300)
})
</script>

<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Werkschema</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="onShare" title="Share schedule">
                        <ion-icon slot="icon-only" :icon="shareOutline" />
                    </ion-button>
                    <ion-button router-link="/settings" title="Settings">
                        <ion-icon slot="icon-only" :icon="settingsOutline" />
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content ref="contentRef">
            <filter-bar
                v-if="allPeople.length > 0"
                v-model="activeFilter"
                :options="filterOptions"
            />

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
                        @edit="onEditShift(shift)"
                        @delete="onDeleteShift(shift)"
                    />
                </template>
            </ion-list>

            <div v-else class="empty-state">
                <ion-icon :icon="calendarOutline" size="large" />
                <p>No shifts yet. Tap + to add your first shift.</p>
            </div>
        </ion-content>

        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
            <ion-fab-button @click="isAddModalOpen = true">
                <ion-icon :icon="addOutline" />
            </ion-fab-button>
        </ion-fab>

        <shift-form-modal
            :is-open="isAddModalOpen"
            :shift="editingShift"
            @did-dismiss="isAddModalOpen = false; editingShift = undefined"
            @shift-added="onShiftAdded"
            @shift-updated="onShiftUpdated"
        />
    </ion-page>
</template>

<style scoped>
ion-fab {
  margin-bottom: env(safe-area-inset-bottom);
}

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
