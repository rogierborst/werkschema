<script setup lang="ts">
    import { ShiftEntry } from '@/types'
    import { computed } from 'vue'

    const props = defineProps<{ shift: ShiftEntry }>()

    const dayName = computed(() => {
        const date = new Date(props.shift.date + 'T00:00:00')
        return date.toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()
    })
</script>

<template>
    <div class="day-badge" v-text="dayName" />
</template>

<style scoped>
    .day-badge {
        background: rgba(255 255 255 / 80%);
        border-left: 4px solid v-bind('shift.color');
        box-shadow: 0 -1px 0 rgba(0 0 0 / 25%), 0 1px 0 rgba(255 255 255 / 80%);
        color: #1a1a2e;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 700;
        flex-shrink: 0;
        margin-right: 14px;
    }
</style>
