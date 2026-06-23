<script setup lang="ts">
    import { onMounted, watch } from 'vue'
    import { IonApp, IonRouterOutlet } from '@ionic/vue'
    import { App } from '@capacitor/app'
    import { useRouter } from 'vue-router'
    import { useShiftsStore } from '@/stores/shifts'
    import { usePeopleStore } from '@/stores/people'
    import { useSettingsStore } from '@/stores/settings'
    import { useShare } from '@/composables/useShare'
    import { useNotifications } from '@/composables/useNotifications'

    const router = useRouter()
    const shiftsStore = useShiftsStore()
    const peopleStore = usePeopleStore()
    const settingsStore = useSettingsStore()
    const { parseDeepLink } = useShare()
    const { requestPermission, scheduleAllReminders } = useNotifications()

    watch(
        () => settingsStore.settings.darkMode,
        (dark) => document.documentElement.classList.toggle('ion-palette-dark', dark),
        { immediate: true }
    )

    onMounted(async () => {
        await Promise.all([settingsStore.load(), shiftsStore.load(), peopleStore.load()])

        await requestPermission()
        await scheduleAllReminders()

        shiftsStore.$onAction(({ name, after }) => {
            if (['addShift', 'updateShift', 'removeShift'].includes(name)) {
                after(() => scheduleAllReminders())
            }
        })

        settingsStore.$onAction(({ name, args, after }) => {
            if (name !== 'update') return
            const patch = args[0] as Record<string, unknown>
            if ('notificationTime' in patch || 'notificationsEnabled' in patch) {
                after(() => scheduleAllReminders())
            }
        })

        // Handle deep links (app opened via werkschema:// URL)
        await App.addListener('appUrlOpen', async ({ url }) => {
            const payload = parseDeepLink(url)
            if (!payload) return
            await peopleStore.importPerson({
                name: payload.name,
                shifts: payload.shifts,
                importedAt: new Date().toISOString(),
            })

            await router.push('/home')
        })
    })
</script>

<template>
    <ion-app>
        <ion-router-outlet />
    </ion-app>
</template>
