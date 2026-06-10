import { LocalNotifications } from '@capacitor/local-notifications'
import { useShiftsStore } from '@/stores/shifts'
import { useSettingsStore } from '@/stores/settings'

const NOTIFICATION_ID = 1001

export function useNotifications() {
  async function requestPermission(): Promise<boolean> {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  }

  async function scheduleNextDayReminder() {
    const settingsStore = useSettingsStore()
    const shiftsStore = useShiftsStore()

    // Always cancel the existing reminder first
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] })

    if (!settingsStore.settings.notificationsEnabled) return

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const shift = shiftsStore.shifts.find(s => s.date === tomorrowStr)
    if (!shift) return

    const shiftLabel =
      shift.type === 'morning' ? 'Morning shift'
      : shift.type === 'evening' ? 'Evening shift'
      : shift.customLabel || 'Custom shift'

    const [hours, minutes] = settingsStore.settings.notificationTime.split(':').map(Number)
    const at = new Date()
    at.setHours(hours, minutes, 0, 0)
    // Don't schedule if the time has already passed today
    if (at <= new Date()) return

    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIFICATION_ID,
        title: 'Werkschema',
        body: `Tomorrow: ${shiftLabel}`,
        schedule: { at },
      }],
    })
  }

  return { requestPermission, scheduleNextDayReminder }
}
