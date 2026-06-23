<script setup lang="ts">
import { SHIFT_META, ShiftEntry } from '@/types';

defineProps<{ shift: ShiftEntry }>()
</script>

<template>
    <span class="shift-icon" v-text="SHIFT_META[shift.type].icon" />
</template>

<style scoped>
.shift-icon {
    font-size: 1.3rem;
    flex-shrink: 0;
}
</style>