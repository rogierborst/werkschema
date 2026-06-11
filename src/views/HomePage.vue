<script setup lang="ts">
    import { ref } from 'vue'
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonFab,
        IonFabButton,
    } from '@ionic/vue'
    import { shareOutline, settingsOutline, addOutline } from 'ionicons/icons'
    import { useShare } from '@/composables/useShare'
    import ShiftFormModal from '@/components/ShiftFormModal.vue'
    import FilterBar from '@/components/home/FilterBar.vue'
    import ShiftList from '@/components/home/ShiftList.vue'
    import type { Shift, ShiftEntry } from '@/types'

    const { shareSchedule } = useShare()

    const isAddModalOpen = ref(false)
    const editingShift = ref<Shift | undefined>(undefined)
    const activeFilter = ref('all')

    function onEditShift(shift: ShiftEntry) {
        editingShift.value = {
            id: shift.id,
            date: shift.date,
            type: shift.type,
            customLabel: shift.customLabel,
        }
        isAddModalOpen.value = true
    }
</script>

<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Werkschema</ion-title>
                <ion-buttons slot="end">
                    <ion-button title="Schema delen" @click="shareSchedule()">
                        <ion-icon slot="icon-only" :icon="shareOutline" />
                    </ion-button>
                    <ion-button router-link="/settings" title="Instellingen">
                        <ion-icon slot="icon-only" :icon="settingsOutline" />
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <filter-bar v-model="activeFilter" />
            <shift-list :active-filter="activeFilter" @edit-shift="onEditShift" />
        </ion-content>

        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
            <ion-fab-button @click="isAddModalOpen = true">
                <ion-icon :icon="addOutline" />
            </ion-fab-button>
        </ion-fab>

        <shift-form-modal
            :is-open="isAddModalOpen"
            :shift="editingShift"
            @did-dismiss="isAddModalOpen = false; editingShift = undefined"
        />
    </ion-page>
</template>

<style scoped>
    ion-fab {
        margin-bottom: env(safe-area-inset-bottom);
    }
</style>
