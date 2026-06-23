<script setup lang="ts">
import { ShiftEntry } from '@/types';
import { computed } from 'vue';

const props = defineProps<{ shift: ShiftEntry }>()

const dayName = computed(() => {
    const date = new Date(props.shift.date + 'T00:00:00');
    return date.toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()
})
</script>

<template>
    <div class="day-badge" v-text="dayName" />
</template>

<style scoped>
.day-badge {
    background: v-bind('shift.color');
    color: v-bind('shift.textColor');
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 700;
    text-shadow: 0 -1px 0 black, 0 1px 0 white;
    flex-shrink: 0;
    margin-right: 14px;

}
</style>
