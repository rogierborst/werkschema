<script setup lang="ts">
    import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
    import { useSettingsStore } from '@/stores/settings'

    const props = defineProps<{ scrollY: number }>()

    const settingsStore = useSettingsStore()
    const isDark = computed(() => settingsStore.settings.darkMode)

    // Light mode: blues + soft pink + warm yellow
    const COLORS_LIGHT = ['#6ab4e8', '#3d8fd4', '#f5c8d8', '#f0dc58']

    // Dark mode: warm grays from near-black to anthracite + one peach
    const COLORS_DARK = ['#2d2520', '#3d3028', '#524238', '#c87d60']

    interface BlobConfig {
        cx: number
        cy: number
        size: number
        rate: number
        dur: number
        driftDur: number
    }

    const CONFIGS: BlobConfig[] = [
        { cx: 8,  cy: 5,  size: 95, rate: 0.20, dur: 12000, driftDur: 8  },
        { cx: 78, cy: 22, size: 90, rate: 0.32, dur: 15000, driftDur: 11 },
        { cx: 18, cy: 78, size: 85, rate: 0.25, dur: 18000, driftDur: 7  },
        { cx: 72, cy: 88, size: 92, rate: 0.28, dur: 14000, driftDur: 10 },
    ]

    function makeRng(seed: number) {
        let s = seed >>> 0
        return () => {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0
            return s / 0x100000000
        }
    }

    function blobPath(numPts: number, rng: () => number): string {
        const cx = 100, cy = 100, avgR = 80
        const step = (2 * Math.PI) / numPts
        const pts: [number, number][] = Array.from({ length: numPts }, (_, i) => {
            const a = i * step - Math.PI / 2
            const r = avgR * (0.3 + rng() * 1.4)  // wider variance → more dramatic shape shifts
            return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
        })

        const n = pts.length
        const t = 0.35
        let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
        for (let i = 0; i < n; i++) {
            const p0 = pts[(i - 1 + n) % n]
            const p1 = pts[i]
            const p2 = pts[(i + 1) % n]
            const p3 = pts[(i + 2) % n]
            const cp1x = p1[0] + (p2[0] - p0[0]) * t
            const cp1y = p1[1] + (p2[1] - p0[1]) * t
            const cp2x = p2[0] - (p3[0] - p1[0]) * t
            const cp2y = p2[1] - (p3[1] - p1[1]) * t
            d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
        }
        return d + 'Z'
    }

    interface BlobData extends BlobConfig {
        color: string
        fromPath: string
        toPath: string
    }

    const blobs = ref<BlobData[]>([])
    const pathRefs: SVGPathElement[] = []
    let rafId = 0

    // Extract all numeric tokens from a path string
    function parsePath(d: string): number[] {
        return d.match(/-?[\d.]+/g)!.map(Number)
    }

    // Rebuild path string by substituting interpolated values back in
    function applyPath(template: string, vals: number[]): string {
        let i = 0
        return template.replace(/-?[\d.]+/g, () => vals[i++].toFixed(2))
    }

    function easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }

    function buildBlobs() {
        const rng = makeRng(Date.now())
        const colors = [...(isDark.value ? COLORS_DARK : COLORS_LIGHT)]
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]]
        }
        blobs.value = CONFIGS.map((cfg, i) => ({
            ...cfg,
            color:    colors[i],
            fromPath: blobPath(8, rng),
            toPath:   blobPath(8, rng),
        }))
    }

    onMounted(async () => {
        buildBlobs()

        // Re-pick colours whenever dark mode toggles (settings load async)
        watch(isDark, () => {
            blobs.value = blobs.value.map((blob, i) => {
                const rng = makeRng(Date.now() + i)
                const colors = [...(isDark.value ? COLORS_DARK : COLORS_LIGHT)]
                for (let k = colors.length - 1; k > 0; k--) {
                    const j = Math.floor(rng() * (k + 1));
                    [colors[k], colors[j]] = [colors[j], colors[k]]
                }
                return { ...blob, color: colors[i] }
            })
        })

        await nextTick()

        const parsed = blobs.value.map(blob => ({
            from:     parsePath(blob.fromPath),
            to:       parsePath(blob.toPath),
            template: blob.fromPath,
        }))

        const start = performance.now()

        function tick(now: number) {
            blobs.value.forEach((blob, i) => {
                const el = pathRefs[i]
                if (!el) return
                const elapsed = (now - start) / blob.dur
                // ping-pong: 0→1→0→1…
                const cycle = elapsed % 2
                const t = easeInOut(cycle < 1 ? cycle : 2 - cycle)
                const vals = parsed[i].from.map((v, j) => v + (parsed[i].to[j] - v) * t)
                el.setAttribute('d', applyPath(parsed[i].template, vals))
            })
            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
    })

    onUnmounted(() => cancelAnimationFrame(rafId))

    function blobWrapStyle(blob: BlobData): Record<string, string> {
        const half = blob.size / 2
        return {
            left:            `${blob.cx}%`,
            top:             `${blob.cy}%`,
            width:           `${blob.size}vw`,
            height:          `${blob.size}vw`,
            marginLeft:      `-${half}vw`,
            marginTop:       `-${half}vw`,
            animationName:   `blob-drift-${blobs.value.indexOf(blob)}`,
            animationDuration: `${blob.driftDur}s`,
        }
    }

    function parallaxStyle(blob: BlobData): Record<string, string> {
        const ty = (-props.scrollY * blob.rate).toFixed(2)
        return { transform: `translateY(${ty}px)` }
    }
</script>

<template>
    <div class="blob-bg" aria-hidden="true">
        <div
            v-for="(blob, i) in blobs"
            :key="i"
            class="blob-wrap"
            :style="blobWrapStyle(blob)"
        >
            <!-- parallax layer (JS-driven, doesn't conflict with drift animation) -->
            <div :style="parallaxStyle(blob)">
                <svg
                    viewBox="0 0 200 200"
                    class="blob-svg"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        :ref="(el) => { if (el) pathRefs[i] = el as SVGPathElement }"
                        :d="blob.fromPath"
                        :fill="blob.color"
                    />
                </svg>
            </div>
        </div>

        <div class="grain" />
    </div>
</template>

<style scoped>
    .blob-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
        background: v-bind("isDark ? '#16100c' : '#c8dff2'");
    }

    .blob-wrap {
        position: absolute;
        filter: blur(55px);
        opacity: 0.72;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate;
    }

    .blob-svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
    }

    /* Four distinct lazy drift paths, one per blob */
    @keyframes blob-drift-0 {
        0%   { translate:   0px    0px; }
        30%  { translate:  55px  -40px; }
        60%  { translate:  25px   60px; }
        100% { translate: -45px   30px; }
    }
    @keyframes blob-drift-1 {
        0%   { translate:   0px    0px; }
        25%  { translate: -50px   45px; }
        55%  { translate:  40px   55px; }
        100% { translate:  60px  -35px; }
    }
    @keyframes blob-drift-2 {
        0%   { translate:   0px    0px; }
        40%  { translate:  45px  -55px; }
        70%  { translate: -60px   35px; }
        100% { translate:  30px   50px; }
    }
    @keyframes blob-drift-3 {
        0%   { translate:   0px    0px; }
        35%  { translate: -40px  -45px; }
        65%  { translate:  50px   25px; }
        100% { translate: -25px   55px; }
    }

    .grain {
        position: absolute;
        inset: 0;
        /* stylelint-disable-next-line */
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)'/%3E%3C/svg%3E");
        background-size: 250px 250px;
        mix-blend-mode: overlay;
        opacity: 0.045;
    }
</style>
