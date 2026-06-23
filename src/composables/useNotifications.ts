import { LocalNotifications } from '@capacitor/local-notifications'
import { useShiftsStore } from '@/stores/shifts'
import { useSettingsStore } from '@/stores/settings'

function shiftLabel(shift: { type: string; customLabel?: string }): string {
    if (shift.type === 'morning') return 'Ochtenddienst'
    if (shift.type === 'evening') return 'Avonddienst'
    return shift.customLabel || 'Aangepaste dienst'
}

export function useNotifications() {
    async function requestPermission(): Promise<boolean> {
        const { display } = await LocalNotifications.requestPermissions()
        return display === 'granted'
    }

    async function scheduleAllReminders() {
        const settingsStore = useSettingsStore()
        const shiftsStore = useShiftsStore()

        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications })
        }

        if (!settingsStore.settings.notificationsEnabled) return

        const [hours, minutes] = settingsStore.settings.notificationTime.split(':').map(Number)
        const now = new Date()

        const notifications = shiftsStore.shifts
            .map((shift) => {
                const [year, month, day] = shift.date.split('-').map(Number)
                // Schedule the evening before the shift
                const at = new Date(year, month - 1, day - 1, hours, minutes, 0, 0)
                return { shift, at }
            })
            .filter(({ at }) => at > now)
            .map(({ shift, at }) => ({
                id: parseInt(shift.date.replace(/-/g, ''), 10),
                title: 'Werkschema',
                body: `Morgen: ${shiftLabel(shift)}`,
                schedule: { at },
            }))

        if (notifications.length === 0) return

        await LocalNotifications.schedule({ notifications })
    }

    return { requestPermission, scheduleAllReminders }
}
