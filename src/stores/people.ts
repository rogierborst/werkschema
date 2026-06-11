import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import type { ImportedPerson } from '@/types'

export const usePeopleStore = defineStore('people', () => {
    const people = ref<ImportedPerson[]>([])

    async function load() {
        const { value } = await Preferences.get({ key: 'imported_people' })
        if (value) people.value = JSON.parse(value)
    }

    async function persist() {
        await Preferences.set({ key: 'imported_people', value: JSON.stringify(people.value) })
    }

    async function importPerson(person: ImportedPerson) {
        const idx = people.value.findIndex((p) => p.name === person.name)
        if (idx >= 0) {
            people.value[idx] = person
        } else {
            people.value.push(person)
        }
        await persist()
    }

    async function removePerson(name: string) {
        people.value = people.value.filter((p) => p.name !== name)
        await persist()
    }

    async function removeShiftFromPerson(personName: string, shiftId: string) {
        people.value = people.value
            .map((p) => (p.name !== personName ? p : { ...p, shifts: p.shifts.filter((s) => s.id !== shiftId) }))
            .filter((p) => p.shifts.length > 0)
        await persist()
    }

    return { people, load, importPerson, removePerson, removeShiftFromPerson }
})
