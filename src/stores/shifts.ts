import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import type { Shift } from '@/types'

export const useShiftsStore = defineStore('shifts', () => {
    const shifts = ref<Shift[]>([])

    async function load() {
        const { value } = await Preferences.get({ key: 'my_shifts' })
        if (value) shifts.value = JSON.parse(value)
    }

    async function persist() {
        await Preferences.set({ key: 'my_shifts', value: JSON.stringify(shifts.value) })
    }

    async function addShift(shift: Shift) {
        // Replace if same date already exists for own schedule
        const idx = shifts.value.findIndex((s) => s.date === shift.date)
        if (idx >= 0) {
            shifts.value[idx] = shift
        } else {
            shifts.value.push(shift)
        }
        await persist()
    }

    async function updateShift(shift: Shift) {
        // Remove old version by id, then upsert by date (handles date conflicts)
        shifts.value = shifts.value.filter((s) => s.id !== shift.id)
        const idx = shifts.value.findIndex((s) => s.date === shift.date)
        if (idx >= 0) {
            shifts.value[idx] = shift
        } else {
            shifts.value.push(shift)
        }
        await persist()
    }

    async function removeShift(id: string) {
        shifts.value = shifts.value.filter((s) => s.id !== id)
        await persist()
    }

    return { shifts, load, addShift, updateShift, removeShift }
})
