<script setup lang="ts">
    import { useSettingsStore } from '@/stores/settings'
    import { computed } from 'vue'
    import { IonItem, IonItemDivider, IonItemGroup, IonLabel, IonToggle } from '@ionic/vue'

    const settingsStore = useSettingsStore()
    const settings = computed(() => settingsStore.settings)

    async function onToggleDarkMode(ev: CustomEvent) {
        await settingsStore.update({ darkMode: ev.detail.checked })
    }

    async function onToggleFancyBackground(ev: CustomEvent) {
        await settingsStore.update({ fancyBackground: ev.detail.checked })
    }
</script>

<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>Weergave</ion-label>
        </ion-item-divider>
        <ion-item>
            <ion-label>Donkere modus</ion-label>
            <ion-toggle slot="end" :checked="settings.darkMode" @ion-change="onToggleDarkMode" />
        </ion-item>
        <ion-item>
            <ion-label>Fancy achtergrond</ion-label>
            <ion-toggle slot="end" :checked="settings.fancyBackground" @ion-change="onToggleFancyBackground" />
        </ion-item>
    </ion-item-group>
</template>
