<script setup lang="ts">
    import {
        IonDatetime,
        IonDatetimeButton,
        IonItem,
        IonItemDivider,
        IonItemGroup,
        IonLabel,
        IonModal,
        IonToggle,
    } from '@ionic/vue'
    import { useSettingsStore } from '@/stores/settings'
    import { computed } from 'vue'

    const settingsStore = useSettingsStore()
    const settings = computed(() => settingsStore.settings)

    async function onToggleNotifications(ev: CustomEvent) {
        await settingsStore.update({ notificationsEnabled: ev.detail.checked })
    }

    async function onTimeChange(ev: CustomEvent) {
        const value = ev.detail.value as string
        if (!value) return
        const d = new Date(value)
        if (isNaN(d.getTime())) return
        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        await settingsStore.update({ notificationTime: time })
    }

    const notificationTimeISO = computed(() => {
        const [h, m] = (settings.value.notificationTime ?? '').split(':').map(Number)
        if (isNaN(h) || isNaN(m)) return undefined
        return `2000-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    })
</script>

<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>Meldingen</ion-label>
        </ion-item-divider>
        <ion-item>
            <ion-label>Herinner me de avond ervoor</ion-label>
            <ion-toggle slot="end" :checked="settings.notificationsEnabled" @ion-change="onToggleNotifications" />
        </ion-item>
        <ion-item v-if="settings.notificationsEnabled">
            <ion-label>Herinneringstijd</ion-label>
            <ion-datetime-button slot="end" datetime="notif-time" />
        </ion-item>

        <ion-modal :keep-contents-mounted="true">
            <ion-datetime
                id="notif-time"
                presentation="time"
                hour-cycle="h23"
                :value="notificationTimeISO"
                @ion-change="onTimeChange"
            />
        </ion-modal>
    </ion-item-group>
</template>
