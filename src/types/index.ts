export type ShiftType = 'morning' | 'evening' | 'custom'

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
}

export interface SharePayload {
  version: 1
  name: string
  shifts: Shift[]
}
