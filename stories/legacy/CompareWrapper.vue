<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; max-width: 1200px;">

    <!-- Legacy Panel -->
    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #f97316; margin-bottom: 0.5rem; text-transform: uppercase;">
        Legacy (Shoelace)
      </div>
      <div data-testid="legacy-panel">
        <LegacyBone
          :is="legacyBoneComponent"
          :name="boneName"
          :structure="structure"
          :skel="skel"
          :errors="errors"
          :label="label"
          :languages="languages"
          @change-internal="onLegacyChange"
        />
      </div>
      <div data-testid="legacy-event-log">
        <div
          v-if="legacyEvents.length"
          style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; max-height: 8rem; overflow-y: auto;"
        >
          <div v-for="(ev, i) in legacyEvents" :key="i">{{ ev }}</div>
        </div>
      </div>
    </div>

    <!-- Neu Panel -->
    <div>
      <div style="font-size: 0.75rem; font-weight: bold; color: #3b82f6; margin-bottom: 0.5rem; text-transform: uppercase;">
        Neu (WebAwesome)
      </div>
      <div data-testid="new-panel">
        <Bone
          :is="newBoneComponent"
          :name="boneName"
          :structure="structure"
          :skel="skel"
          :errors="errors"
          :label="label"
          :languages="languages"
          @change-internal="onNewChange"
        />
      </div>
      <div data-testid="new-event-log">
        <div
          v-if="newEvents.length"
          style="margin-top: 0.5rem; font-size: 0.7rem; font-family: monospace; background: #111; color: #aaa; padding: 0.5rem; border-radius: 4px; max-height: 8rem; overflow-y: auto;"
        >
          <div v-for="(ev, i) in newEvents" :key="i">{{ ev }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, markRaw, ref, provide, reactive } from 'vue'
import { getBoneWidget as getLegacyBoneWidget } from '@viur/vue-utils/bones/edit/index.js'
import { getBoneWidget as getNewBoneWidget } from '../../src/forms/bones/index.js'

const props = defineProps({
  boneName: { type: String, required: true },
  boneType: { type: String, required: true },
  structure: { type: Object, required: true },
  skel: { type: Object, default: () => ({}) },
  errors: { type: Array, default: () => [] },
  label: { type: String, default: 'normal' },
  languages: { type: Array, default: null },
})

provide('mainformState', reactive({ skel: props.skel, readonly: false, renderer: 'json' }))

const legacyBoneComponent = computed(() => markRaw(getLegacyBoneWidget(props.boneType)))
const newBoneComponent = computed(() => markRaw(getNewBoneWidget(props.boneType)))

const legacyEvents = ref([])
const newEvents = ref([])

function onLegacyChange(event) {
  legacyEvents.value.push(JSON.stringify(event))
}

function onNewChange(event) {
  newEvents.value.push(JSON.stringify(event))
}
</script>
