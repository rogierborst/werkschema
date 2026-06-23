<script setup lang="ts">
import { trashOutline } from 'ionicons/icons';
import { IonButton, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel } from '@ionic/vue';
import { usePeopleStore } from '@/stores/people';
import { computed } from 'vue';

const peopleStore = usePeopleStore()
const people = computed(() => peopleStore.people)
async function onRemovePerson(name: string) {
    await peopleStore.removePerson(name)
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}
</script>

<template>
    <ion-item-group>
        <ion-item-divider>
            <ion-label>Geïmporteerde schema's</ion-label>
        </ion-item-divider>
        <ion-item v-for="person in people" :key="person.name">
            <ion-label>
                <h3>{{ person.name }}</h3>
                <p>Geïmporteerd op {{ formatDate(person.importedAt) }}</p>
            </ion-label>
            <ion-button slot="end" fill="clear" color="danger" @click="onRemovePerson(person.name)">
                <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
        </ion-item>
        <ion-item v-if="people.length === 0">
            <ion-label color="medium">Nog geen geïmporteerde schema's</ion-label>
        </ion-item>
    </ion-item-group>
</template>
