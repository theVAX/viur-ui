<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/spatial.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/SpatialBone">

    <Variant title="Default (editierbar)" :source="src(createStructure(), { location: { lat: 48.1351, lng: 11.582 } })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: { lat: 48.1351, lng: 11.582 } }"
      />
    </Variant>

    <Variant title="Leer" :source="src(createStructure(), { location: null })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: null }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { location: { lat: 48.1351, lng: 11.582 } })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ readonly: true })"
        :skel="{ location: { lat: 48.1351, lng: 11.582 } }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { location: null },
          { errors: [{ fieldPath: ['location'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ required: true })"
        :skel="{ location: null }"
        :errors="[{ fieldPath: ['location'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Eingeschränkte Grenzen"
      :source="src(createStructure({ boundslat: [47, 55], boundslng: [6, 15], descr: 'Deutschland' }), { location: { lat: 52.52, lng: 13.405 } })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ boundslat: [47, 55], boundslng: [6, 15], descr: 'Deutschland' })"
        :skel="{ location: { lat: 52.52, lng: 13.405 } }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="location"
          bone-type="spatial"
          :structure="state.structure"
          :skel="{ location: { lat: 48.1351, lng: 11.582 } }"
          :errors="state.showError ? [{ fieldPath: ['location'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.location.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.location.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
