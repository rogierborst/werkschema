<script setup lang="ts">
import { clipboardOutline } from 'ionicons/icons';
import {
    alertController,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonItemGroup,
    IonLabel
} from '@ionic/vue';
import { useShare } from '@/composables/useShare';
import { ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

const { parseDeepLink } = useShare()
const peopleStore = usePeopleStore()

const pastedLink = ref('')
const importError = ref('')
const importSuccess = ref('')

async function onImportLink () {
    const ok = await doImport(pastedLink.value)
    if (ok) pastedLink.value = ''
}

async function onPasteFromClipboard () {
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

async function doImport (link: string): Promise<boolean> {
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
            { text: 'Importeer', role: 'confirm' }
        ]
    })
    await alert.present()
    const { role, data } = await alert.onDidDismiss()
    if (role !== 'confirm') return false

    const name = (data?.values?.name as string)?.trim() || payload.name
    await peopleStore.importPerson({
        name,
        shifts: payload.shifts,
        importedAt: new Date().toISOString()
    })
    importSuccess.value = `✅ ${ name }'s schema geïmporteerd!`
    return true
}
</script>

<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>Importeer</ion-label>
        </ion-item-divider>
        <ion-item>
            <ion-input
                v-model="pastedLink"
                label="Plak een werkschema-link"
                label-placement="stacked"
                placeholder="werkschema://import?data=..."
                @keyup.enter="onImportLink"
            />
            <ion-button slot="end" fill="clear" @click="onImportLink"> Importeer</ion-button>
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
</template>
