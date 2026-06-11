<script setup lang="ts">
    import { ref, computed, onMounted, nextTick } from 'vue'
    import { IonList, IonIcon } from '@ionic/vue'
    import { calendarOutline } from 'ionicons/icons'
    import { useShiftsStore } from '@/stores/shifts'
    import { usePeopleStore } from '@/stores/people'
    import { useSettingsStore } from '@/stores/settings'
    import { useNotifications } from '@/composables/useNotifications'
    import ShiftItem from '@/components/home/ShiftItem.vue'
    import type { ShiftEntry } from '@/types'

    const props = defineProps<{ activeFilter: string }>()
    const emit = defineEmits<{ 'edit-shift': [shift: ShiftEntry] }>()

    const PERSON_COLORS = [
        { bg: '#dde8ff', text: '#1a4dcc' },
        { bg: '#d4f5e2', text: '#1a7a40' },
        { bg: '#ffd6db', text: '#c41230' },
        { bg: '#fff0c2', text: '#8a6000' },
        { bg: '#e8e9eb', text: '#4a4c54' },
        { bg: '#e8e6ff', text: '#4540d4' },
    ]

    const shiftsStore = useShiftsStore()
    const peopleStore = usePeopleStore()
    const settingsStore = useSettingsStore()
    const { scheduleNextDayReminder } = useNotifications()

    const todayStr = new Date().toISOString().split('T')[0]
    const snapAnchorRef = ref<HTMLElement | null>(null)

    const allEntries = computed<ShiftEntry[]>(() => {
        const myName = settingsStore.settings.myName || 'Me'
        const mine: ShiftEntry[] = shiftsStore.shifts.map((s) => ({
            ...s,
            ownerName: myName,
            isOwn: true,
            color: PERSON_COLORS[0].bg,
            textColor: PERSON_COLORS[0].text,
        }))

        const others: ShiftEntry[] = peopleStore.people.flatMap((person, idx) =>
            person.shifts.map((s) => ({
                ...s,
                ownerName: person.name,
                isOwn: false,
                color: PERSON_COLORS[(idx + 1) % PERSON_COLORS.length].bg,
                textColor: PERSON_COLORS[(idx + 1) % PERSON_COLORS.length].text,
            }))
        )

        return [...mine, ...others]
    })

    const filteredEntries = computed<ShiftEntry[]>(() =>
        allEntries.value
            .filter((e) => {
                if (props.activeFilter === 'all') return true
                if (props.activeFilter === 'me') return e.isOwn
                return e.ownerName === props.activeFilter
            })
            .sort((a, b) => a.date.localeCompare(b.date) || (a.isOwn ? -1 : 1))
    )

    const pastEntries = computed(() =>
        filteredEntries.value.filter((e) => e.date < todayStr).slice(-3)
    )

    const futureEntries = computed(() =>
        filteredEntries.value.filter((e) => e.date >= todayStr)
    )

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
        // Scroll is handled by the parent (HomePage) which has access to IonContent
    })

    defineExpose({ snapAnchorEl: snapAnchorRef })
</script>

<template>
    <template v-if="futureEntries.length > 0">
        <!-- Past items rendered above snap point, hidden by default -->
        <ion-list v-if="pastEntries.length > 0" lines="full">
            <shift-item
                v-for="shift in pastEntries"
                :key="shift.id"
                :shift="shift"
                @edit="emit('edit-shift', shift)"
                @delete="onDeleteShift(shift)"
            />
        </ion-list>

        <!-- Snap anchor: default scroll position, doubles as subtle past-items hint -->
        <div ref="snapAnchorRef" class="snap-anchor">
            <span v-if="pastEntries.length > 0" class="past-hint">
                ↑ {{ pastEntries.length }} vorige
            </span>
        </div>

        <ion-list lines="full">
            <shift-item
                v-for="shift in futureEntries"
                :key="shift.id"
                :shift="shift"
                @edit="emit('edit-shift', shift)"
                @delete="onDeleteShift(shift)"
            />
        </ion-list>
        <!-- Ensures past items can always be scrolled out of view -->
        <div class="scroll-spacer" />
    </template>

    <div v-else class="empty-state">
        <ion-icon :icon="calendarOutline" size="large" />
        <p>Nog geen diensten. Tik op + om je eerste dienst toe te voegen.</p>
    </div>
</template>

<style scoped>
    .snap-anchor {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
    }

    .past-hint {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        opacity: 0.6;
    }

    .scroll-spacer {
        height: 100dvh;
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
