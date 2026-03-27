<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/boolean.js'
</script>

<template>
  <Story title="Bones/BooleanBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure()"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ readonly: true })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ multiple: true })"
        :skel="{ active: [true, false, true] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ required: true })"
        :skel="{ active: null }"
        :errors="[{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Variante: Choose">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool.choose"
        :structure="createStructure({ type: 'bool.choose' })"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant title="Variante: Select (Dropdown)">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool.select"
        :structure="createStructure({ type: 'bool.select' })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="active"
          bone-type="bool"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ active: true }"
          :errors="state.showError ? [{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }] : []"
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
