<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonList, IonItem, IonItemGroup, IonItemDivider, IonLabel,
  IonInput, IonToggle, IonButton, IonIcon, IonDatetime, IonDatetimeButton, IonModal,
  alertController,
} from '@ionic/vue'
import { trashOutline, clipboardOutline } from 'ionicons/icons'
import { useSettingsStore } from '@/stores/settings'
import { usePeopleStore } from '@/stores/people'
import { useShare } from '@/composables/useShare'
import { useNotifications } from '@/composables/useNotifications'

const settingsStore = useSettingsStore()
const peopleStore = usePeopleStore()
const { parseDeepLink } = useShare()
const { scheduleNextDayReminder } = useNotifications()

const settings = computed(() => settingsStore.settings)
const people = computed(() => peopleStore.people)
const pastedLink = ref('')
const importError = ref('')
const importSuccess = ref('')

async function doImport(link: string): Promise<boolean> {
  importError.value = ''
  importSuccess.value = ''
  const payload = parseDeepLink(link.trim())
  if (!payload) {
    importError.value = 'Ongeldige link. Controleer en probeer opnieuw.'
    return false
  }

  const alert = await alertController.create({
    header: 'Schema importeren',
    message: 'Onder welke naam wil je dit schema opslaan?',
    inputs: [{ name: 'name', type: 'text', value: payload.name, placeholder: 'Naam' }],
    buttons: [
      { text: 'Annuleer', role: 'cancel' },
      { text: 'Importeer', role: 'confirm' },
    ],
  })
  await alert.present()
  const { role, data } = await alert.onDidDismiss()
  if (role !== 'confirm') return false

  const name = (data?.values?.name as string)?.trim() || payload.name
  await peopleStore.importPerson({
    name,
    shifts: payload.shifts,
    importedAt: new Date().toISOString(),
  })
  importSuccess.value = `✅ ${name}'s schema geïmporteerd!`
  return true
}

async function onToggleDarkMode(ev: CustomEvent) {
  await settingsStore.update({ darkMode: ev.detail.checked })
}

async function saveSettings() {
  await settingsStore.update({ myName: settings.value.myName })
}

async function onToggleNotifications(ev: CustomEvent) {
  await settingsStore.update({ notificationsEnabled: ev.detail.checked })
  await scheduleNextDayReminder()
}

async function onTimeChange(ev: CustomEvent) {
  const value = ev.detail.value as string
  if (!value) return
  // IonDatetime returns full ISO string; extract HH:MM
  const time = value.includes('T') ? value.split('T')[1].substring(0, 5) : value.substring(0, 5)
  await settingsStore.update({ notificationTime: time })
  await scheduleNextDayReminder()
}

async function onRemovePerson(name: string) {
  await peopleStore.removePerson(name)
}

async function onImportLink() {
  const ok = await doImport(pastedLink.value)
  if (ok) pastedLink.value = ''
}

async function onPasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    const match = text.match(/werkschema:\/\/\S+/)
    if (!match) {
      importError.value = 'Geen werkschema-link gevonden op het klembord.'
      importSuccess.value = ''
      return
    }
    const ok = await doImport(match[0])
    if (ok) pastedLink.value = ''
  } catch {
    importError.value = 'Kan klembord niet lezen. Plak de link handmatig.'
    importSuccess.value = ''
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Appearance</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-label>Dark mode</ion-label>
            <ion-toggle
              slot="end"
              :checked="settings.darkMode"
              @ion-change="onToggleDarkMode"
            />
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Profile</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-input
              label="Your name"
              label-placement="stacked"
              placeholder="e.g. Jan"
              :value="settings.myName"
              @ion-input="settings.myName = ($event.target as HTMLIonInputElement).value as string"
              @ion-blur="saveSettings"
            />
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Notifications</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-label>Remind me the evening before</ion-label>
            <ion-toggle
              slot="end"
              :checked="settings.notificationsEnabled"
              @ion-change="onToggleNotifications"
            />
          </ion-item>
          <ion-item v-if="settings.notificationsEnabled">
            <ion-label>Reminder time</ion-label>
            <ion-datetime-button slot="end" datetime="notif-time" />
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Imported schedules</ion-label>
          </ion-item-divider>
          <ion-item v-for="person in people" :key="person.name">
            <ion-label>
              <h3>{{ person.name }}</h3>
              <p>Imported {{ formatDate(person.importedAt) }}</p>
            </ion-label>
            <ion-button slot="end" fill="clear" color="danger" @click="onRemovePerson(person.name)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </ion-item>
          <ion-item v-if="people.length === 0">
            <ion-label color="medium">No imported schedules yet</ion-label>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Importeer</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-input
              label="Plak een werkschema-link"
              label-placement="stacked"
              placeholder="werkschema://import?data=..."
              v-model="pastedLink"
              @keyup.enter="onImportLink"
            />
            <ion-button slot="end" fill="clear" @click="onImportLink">
              Importeer
            </ion-button>
          </ion-item>
          <ion-item button :detail="false" @click="onPasteFromClipboard">
            <ion-icon slot="start" :icon="clipboardOutline" />
            <ion-label>Plakken uit klembord</ion-label>
          </ion-item>
          <ion-item v-if="importError">
            <ion-label color="danger">{{ importError }}</ion-label>
          </ion-item>
          <ion-item v-if="importSuccess">
            <ion-label color="success">{{ importSuccess }}</ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>

      <ion-modal :keep-contents-mounted="true">
        <ion-datetime
          id="notif-time"
          presentation="time"
          :value="settings.notificationTime"
          @ion-change="onTimeChange"
        />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
