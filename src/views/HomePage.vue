<script setup lang="ts">
    import { ref, watch, nextTick } from 'vue'
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
        onIonViewDidEnter,
    } from '@ionic/vue'
    import { shareOutline, settingsOutline, addOutline } from 'ionicons/icons'
    import { useShare } from '@/composables/useShare'
    import ShiftFormModal from '@/components/ShiftFormModal.vue'
    import FilterBar from '@/components/home/FilterBar.vue'
    import ShiftList from '@/components/home/ShiftList.vue'
    import BlobBackground from '@/components/BlobBackground.vue'
    import { useSettingsStore } from '@/stores/settings'
    import type { Shift, ShiftEntry } from '@/types'

    const { shareSchedule } = useShare()
    const settingsStore = useSettingsStore()

    const isAddModalOpen = ref(false)
    const editingShift = ref<Shift | undefined>(undefined)
    const activeFilter = ref('all')
    const scrollRef = ref<HTMLElement>()
    const shiftListRef = ref<InstanceType<typeof ShiftList>>()
    const scrollY = ref(0)

    function onEditShift(shift: ShiftEntry) {
        editingShift.value = {
            id: shift.id,
            date: shift.date,
            type: shift.type,
            customLabel: shift.customLabel,
        }
        isAddModalOpen.value = true
    }

    function getSnapOffset(): number {
        const snapEl = shiftListRef.value?.snapAnchorEl
        if (!snapEl || !scrollRef.value) return 0
        return snapEl.offsetTop
    }

    function scrollToSnap() {
        const snapOffset = getSnapOffset()
        if (scrollRef.value && snapOffset > 0) {
            scrollRef.value.scrollTop = snapOffset
        }
    }

    function setupSpringBack() {
        scrollRef.value?.addEventListener(
            'touchend',
            () => {
                const snapOffset = getSnapOffset()
                if (!scrollRef.value || snapOffset <= 0) return
                if (scrollRef.value.scrollTop < snapOffset - 1) {
                    requestAnimationFrame(() => {
                        scrollRef.value!.scrollTo({ top: snapOffset, behavior: 'smooth' })
                    })
                }
            },
            { passive: true }
        )
        scrollRef.value?.addEventListener(
            'scroll',
            () => { scrollY.value = scrollRef.value?.scrollTop ?? 0 },
            { passive: true }
        )
    }

    onIonViewDidEnter(() => {
        setupSpringBack()
        requestAnimationFrame(() => scrollToSnap())
    })

    let hasScrolled = false
    watch(
        () => shiftListRef.value?.snapAnchorEl,
        async (snapEl) => {
            if (snapEl && !hasScrolled) {
                hasScrolled = true
                await nextTick()
                requestAnimationFrame(() => scrollToSnap())
            }
        }
    )
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

        <ion-content :scroll-y="false" style="--background: transparent">
            <blob-background v-if="settingsStore.settings.fancyBackground" :scroll-y="scrollY" />
            <div ref="scrollRef" class="snap-scroll">
                <filter-bar v-model="activeFilter" />
                <shift-list ref="shiftListRef" :active-filter="activeFilter" @edit-shift="onEditShift" />
            </div>
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
    .snap-scroll {
        position: absolute;
        inset: 0;
        overflow-y: scroll;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
        z-index: 1;
        background: transparent;
    }

    ion-fab {
        margin-bottom: env(safe-area-inset-bottom);
    }
</style>
