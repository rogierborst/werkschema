<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { computed } from 'vue';
import { IonInput, IonItem, IonItemDivider, IonItemGroup, IonLabel } from '@ionic/vue';

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)

async function saveSettings() {
    await settingsStore.update({ myName: settings.value.myName })
}
</script>

<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>Profiel</ion-label>
        </ion-item-divider>
        <ion-item>
            <ion-input
                label="Jouw naam"
                label-placement="stacked"
                placeholder="bijv. Jan"
                :value="settings.myName"
                @ion-input="settings.myName = ($event.target as HTMLIonInputElement).value as string"
                @ion-blur="saveSettings"
            />
        </ion-item>
    </ion-item-group>
</template>
