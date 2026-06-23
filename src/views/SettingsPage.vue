<script setup lang="ts">
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonBackButton,
        IonContent,
        IonList,
    } from '@ionic/vue'
    import ThemeSettings from '@/components/Settings/ThemeSettings.vue';
    import ProfileEditor from '@/components/Settings/ProfileEditor.vue';
    import NotificationSettings from '@/components/Settings/NotificationSettings.vue';
    import ScheduleImports from '@/components/Settings/ScheduleImports.vue';
</script>

<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/home" />
                </ion-buttons>
                <ion-title>Instellingen</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <ion-list>
                <ThemeSettings />

               <ProfileEditor />

                <NotificationSettings />

                <ScheduleImports />
            </ion-list>
        </ion-content>
    </ion-page>
</template>
