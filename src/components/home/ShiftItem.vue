<script setup lang="ts">
    import { computed } from 'vue'
    import { IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonLabel, IonIcon } from '@ionic/vue'
    import { trashOutline } from 'ionicons/icons'
    import type { ShiftEntry } from '@/types'
    import DayName from '@/components/ShiftItem/DayName.vue';
    import TypeIcon from '@/components/ShiftItem/TypeIcon.vue';
    import TypeLabel from '@/components/ShiftItem/TypeLabel.vue';

    const props = defineProps<{ shift: ShiftEntry }>()

    const emit = defineEmits<{
        edit: []
        delete: []
    }>()

    const dateParts = computed(() => {
        const date = new Date(props.shift.date + 'T00:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let label: string
        if (date.getTime() === today.getTime()) label = 'Vandaag'
        else if (date.getTime() === tomorrow.getTime()) label = 'Morgen'
        else if (date.getTime() === yesterday.getTime()) label = 'Gisteren'
        else label = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

        return { label }
    })
</script>

<template>
    <ion-item-sliding>
        <ion-item :button="shift.isOwn" :detail="false" @click="shift.isOwn ? emit('edit') : undefined">
            <DayName slot="start" :shift />
            <TypeLabel :shift />
            <span slot="end" class="date-label">{{ dateParts.label }}</span>
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

    ion-label {
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
        overflow: hidden;
    }

    .date-label {
        font-size: 0.9rem;
        color: var(--ion-color-medium);
        flex-shrink: 0;
    }
</style>
