import { Share } from '@capacitor/share'
import { useShiftsStore } from '@/stores/shifts'
import { useSettingsStore } from '@/stores/settings'
import type { SharePayload } from '@/types'

export function useShare() {
  function encodePayload(payload: SharePayload): string {
    const json = JSON.stringify(payload)
    // Use encodeURIComponent + btoa to safely handle unicode characters
    return btoa(encodeURIComponent(json))
  }

  function decodePayload(encoded: string): SharePayload | null {
    try {
      const json = decodeURIComponent(atob(encoded))
      return JSON.parse(json) as SharePayload
    } catch {
      return null
    }
  }

  function buildDeepLink(): string {
    const shiftsStore = useShiftsStore()
    const settingsStore = useSettingsStore()
    const payload: SharePayload = {
      version: 1,
      name: settingsStore.settings.myName || 'Unknown',
      shifts: shiftsStore.shifts,
    }
    return `werkschema://import?data=${encodePayload(payload)}`
  }

  function parseDeepLink(url: string): SharePayload | null {
    try {
      const u = new URL(url)
      const data = u.searchParams.get('data')
      if (!data) return null
      return decodePayload(data)
    } catch {
      return null
    }
  }

  async function shareSchedule() {
    const link = buildDeepLink()
    const settingsStore = useSettingsStore()
    const name = settingsStore.settings.myName || 'My'
    await Share.share({
      title: 'Werkschema',
      text: `📅 ${name} heeft zijn/haar werkschema gedeeld!\n\nKopieer de link hieronder en plak hem in Werkschema (Instellingen → Importeer):\n\n${link}`,
      dialogTitle: 'Share your schedule',
    })
  }

  return { buildDeepLink, parseDeepLink, shareSchedule }
}
