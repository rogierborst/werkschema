<script setup lang="ts">
    import { computed } from 'vue'
    import { IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonIcon } from '@ionic/vue'
    import { trashOutline } from 'ionicons/icons'
    import type { ShiftEntry } from '@/types'
    import DayName from '@/components/ShiftItem/DayName.vue'
    import TypeLabel from '@/components/ShiftItem/TypeLabel.vue'

    const props = defineProps<{ shift: ShiftEntry }>()

    const emit = defineEmits<{
        edit: []
        delete: []
    }>()

    const TYPE_CLASS: Record<string, string> = {
        morning: 'day-shift',
        evening: 'night-shift',
        custom:  'custom-shift',
    }

    const dateLabel = computed(() => {
        const date = new Date(props.shift.date + 'T00:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.getTime() === today.getTime()) return 'Vandaag'
        if (date.getTime() === tomorrow.getTime()) return 'Morgen'
        if (date.getTime() === yesterday.getTime()) return 'Gisteren'

        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    })

    const shiftClasses = computed(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isToday = new Date(props.shift.date + 'T00:00:00').getTime() === today.getTime()
        return [TYPE_CLASS[props.shift.type] ?? 'custom-shift', isToday ? 'is-today' : null]
    })
</script>

<template>
    <ion-item-sliding :class="shiftClasses">
        <ion-item
            :button="shift.isOwn"
            :detail="false"
            @click="shift.isOwn ? emit('edit') : undefined"
        >
            <DayName slot="start" :shift />
            <TypeLabel :shift />
            <span slot="end" class="date-label">{{ dateLabel }}</span>
        </ion-item>
        <ion-item-options side="end">
            <ion-item-option color="danger" @click="emit('delete')">
                <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-item-option>
        </ion-item-options>
    </ion-item-sliding>
</template>

<style scoped>
    ion-item {
        --min-height: 64px;
        --inner-padding-end: 16px;
    }

    .date-label {
        font-size: 0.9rem;
        font-weight: 500;
        flex-shrink: 0;
    }
</style>
