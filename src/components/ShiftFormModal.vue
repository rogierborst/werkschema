<script setup lang="ts">
    import { ref, watch, computed } from 'vue'
    import {
        IonModal,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonItem,
        IonLabel,
        IonRadioGroup,
        IonRadio,
        IonInput,
        IonDatetime,
        IonDatetimeButton,
        IonIcon,
    } from '@ionic/vue'
    import { calendarOutline } from 'ionicons/icons'
    import { useShiftsStore } from '@/stores/shifts'
    import { SHIFT_META } from '@/types'
    import type { Shift, ShiftType } from '@/types'

    const props = defineProps<{ isOpen: boolean; shift?: Shift }>()
    const emit = defineEmits<{ (e: 'did-dismiss'): void }>()

    const shiftsStore = useShiftsStore()

    const todayStr = new Date().toISOString().split('T')[0]
    let lastUsedDate = todayStr

    const selectedDate = ref(todayStr)
    const selectedType = ref<ShiftType>('morning')
    const customLabel = ref('')
    const datetimeRef = ref<HTMLIonDatetimeElement | null>(null)

    const DAY_NAMES = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
    const MONTH_NAMES = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

    const formattedDate = computed(() => {
        const d = new Date(selectedDate.value + 'T00:00:00')
        return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`
    })

    watch(
        () => props.isOpen,
        (open) => {
            if (open && props.shift) {
                selectedDate.value = props.shift.date
                selectedType.value = props.shift.type
                customLabel.value = props.shift.customLabel ?? ''
            } else if (open) {
                selectedDate.value = lastUsedDate
                selectedType.value = 'morning'
                customLabel.value = ''
            }
        }
    )

    function onDateChange(ev: CustomEvent) {
        const value = ev.detail.value as string
        if (!value) return
        selectedDate.value = value.includes('T') ? value.split('T')[0] : value
    }

    async function onAdd() {
        if (selectedType.value === 'custom' && !customLabel.value.trim()) return

        const shift: Shift = {
            id: props.shift ? props.shift.id : `${selectedDate.value}-${Date.now()}`,
            date: selectedDate.value,
            type: selectedType.value,
            customLabel: selectedType.value === 'custom' ? customLabel.value.trim() : undefined,
        }

        if (props.shift) {
            await shiftsStore.updateShift(shift)
        } else {
            await shiftsStore.addShift(shift)
            const next = new Date(shift.date)
            next.setDate(next.getDate() + 1)
            lastUsedDate = next.toISOString().split('T')[0]
            selectedDate.value = lastUsedDate
            selectedType.value = 'morning'
            customLabel.value = ''
        }

        emit('did-dismiss')
    }
</script>

<template>
    <ion-modal :is-open="isOpen" :breakpoints="[0, 1]" :initial-breakpoint="1" @did-dismiss="emit('did-dismiss')">
        <ion-header>
            <ion-toolbar>
                <ion-title>{{ shift ? 'Dienst bewerken' : 'Dienst toevoegen' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="emit('did-dismiss')">Annuleer</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <!-- Date picker -->
            <ion-label class="date-field-label">Datum</ion-label>
            <div class="ion-padding-vertical date-picker-row">
                <div class="date-picker-wrapper">
                    <ion-datetime-button datetime="shift-date" />
                    <span class="date-label-overlay">{{ formattedDate }}</span>
                    <ion-icon :icon="calendarOutline" class="date-icon" />
                </div>
            </div>

            <!-- Shift type -->
            <ion-item>
                <ion-label position="stacked">Dienst type</ion-label>
            </ion-item>
            <ion-radio-group v-model="selectedType">
                <ion-item>
                    <ion-radio value="morning" label-placement="end">
                        {{ SHIFT_META.morning.icon }} {{ SHIFT_META.morning.label }}
                    </ion-radio>
                </ion-item>
                <ion-item>
                    <ion-radio value="evening" label-placement="end">
                        {{ SHIFT_META.evening.icon }} {{ SHIFT_META.evening.label }}
                    </ion-radio>
                </ion-item>
                <ion-item>
                    <ion-radio value="custom" label-placement="end">
                        {{ SHIFT_META.custom.icon }} {{ SHIFT_META.custom.label }}...
                    </ion-radio>
                </ion-item>
            </ion-radio-group>

            <!-- Custom label input -->
            <ion-item v-if="selectedType === 'custom'">
                <ion-input
                    v-model="customLabel"
                    label="Eigen omschrijving"
                    label-placement="stacked"
                    placeholder="bijv. Nachtdienst"
                />
            </ion-item>

            <ion-button expand="block" class="ion-margin-top" @click="onAdd">
                {{ shift ? 'Wijzigingen opslaan' : 'Dienst toevoegen' }}
            </ion-button>
        </ion-content>

        <!-- Inline date picker popover -->
        <ion-modal :keep-contents-mounted="true">
            <ion-datetime
                ref="datetimeRef"
                id="shift-date"
                presentation="date"
                :value="selectedDate"
                show-default-buttons
                done-text="Klaar"
                @ion-change="onDateChange"
            />
        </ion-modal>
    </ion-modal>
</template>

<style scoped>
.date-field-label {
    display: block;
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    padding: 16px 16px 0;
}

.date-picker-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.date-picker-wrapper {
    position: relative;
    display: inline-flex;
}

ion-datetime-button::part(native) {
    background-color: #ffffff;
    padding: 10px 2.5rem 10px 14px;
    color: transparent;
}

.date-label-overlay {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9rem;
    color: var(--ion-text-color, #000);
    pointer-events: none;
}

.date-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.1rem;
    color: var(--ion-color-medium);
    pointer-events: none;
}

</style>
