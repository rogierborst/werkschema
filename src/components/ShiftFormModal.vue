<script setup lang="ts">
    import { ref, watch } from 'vue'
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
    } from '@ionic/vue'
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
            lastUsedDate = shift.date
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
            <ion-item>
                <ion-label position="stacked">Datum</ion-label>
                <ion-datetime-button datetime="shift-date" />
            </ion-item>

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
