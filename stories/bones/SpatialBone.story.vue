<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/spatial.js'
</script>

<template>
  <Story title="Bones/SpatialBone">

    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: { lat: 48.1351, lng: 11.582 } }"
      />
    </Variant>

    <Variant title="Leer">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: null }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ readonly: true })"
        :skel="{ location: { lat: 48.1351, lng: 11.582 } }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ required: true })"
        :skel="{ location: null }"
        :errors="[{ fieldPath: ['location'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Eingeschränkte Grenzen">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ boundslat: [47, 55], boundslng: [6, 15], descr: 'Deutschland' })"
        :skel="{ location: { lat: 52.52, lng: 13.405 } }"
      />
    </Variant>

  </Story>
</template>
