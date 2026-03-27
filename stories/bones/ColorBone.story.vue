<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/color.js'
</script>

<template>
  <Story title="Bones/ColorBone">

    <Variant title="Default (leer)">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure()"
        :skel="{ color: null }"
      />
    </Variant>

    <Variant title="Mit Farbe">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure()"
        :skel="{ color: '#e74c3c' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ readonly: true })"
        :skel="{ color: '#3498db' }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ required: true })"
        :skel="{ color: null }"
        :errors="[{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ multiple: true })"
        :skel="{ color: ['#e74c3c', '#3498db'] }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="color"
          bone-type="color"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ color: '#3b82f6' }"
          :errors="state.showError ? [{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstCheckbox v-model="state.readonly" title="Readonly" />
        <HstCheckbox v-model="state.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
