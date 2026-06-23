<script setup lang="ts">
    import { SHIFT_META, ShiftEntry } from '@/types'
    import { computed } from 'vue'
    import TypeIcon from '@/components/ShiftItem/TypeIcon.vue'

    const props = defineProps<{ shift: ShiftEntry }>()

    const label = computed(() => {
        if (props.shift.type === 'custom') {
            return props.shift.customLabel || SHIFT_META.custom.label
        }

        return SHIFT_META[props.shift.type].label
    })
</script>

<template>
    <IonLabel>
        <TypeIcon :shift />
        <span class="shift-type" v-text="label" />
    </IonLabel>
</template>

<style scoped>
    IonLabel {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        overflow: hidden;
    }

    .shift-type {
        font-size: 1rem;
        font-weight: 500;
        flex-shrink: 0;
        opacity: 0.65;
    }
</style>
