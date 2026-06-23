export type ShiftType = 'morning' | 'evening' | 'custom'

export const SHIFT_META: Record<ShiftType, { icon: string; label: string }> = {
    morning: { icon: '☀️', label: 'Ochtend' },
    evening: { icon: '🌙', label: 'Avond' },
    custom:  { icon: '🚩', label: 'Anders' },
}

export interface Shift {
    id: string
    date: string // YYYY-MM-DD
    type: ShiftType
    customLabel?: string
}

export interface ImportedPerson {
    name: string
    shifts: Shift[]
    importedAt: string
}

export interface AppSettings {
    myName: string
    notificationsEnabled: boolean
    notificationTime: string // HH:MM, e.g. "20:00"
    darkMode: boolean
}

export interface SharePayload {
    version: 1
    name: string
    shifts: Shift[]
}

export interface ShiftEntry {
    id: string
    date: string
    type: ShiftType
    customLabel?: string
    ownerName: string
    isOwn: boolean
    color: string
    textColor: string
}
