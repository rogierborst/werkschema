import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import type { AppSettings } from '@/types'

const DEFAULTS: AppSettings = {
    myName: '',
    notificationsEnabled: true,
    notificationTime: '20:00',
    darkMode: false,
}

function systemDefaults(): AppSettings {
    return {
        ...DEFAULTS,
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    }
}

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref<AppSettings>({ ...DEFAULTS })

    async function load() {
        const { value } = await Preferences.get({ key: 'app_settings' })
        if (value) settings.value = { ...systemDefaults(), ...JSON.parse(value) }
        else settings.value = systemDefaults()
    }

    async function update(patch: Partial<AppSettings>) {
        settings.value = { ...settings.value, ...patch }
        await Preferences.set({ key: 'app_settings', value: JSON.stringify(settings.value) })
    }

    return { settings, load, update }
})
