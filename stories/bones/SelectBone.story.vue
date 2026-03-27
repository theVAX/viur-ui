<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/select.js'
</script>

<template>
  <Story title="Bones/SelectBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure()"
        :skel="{ status: 'draft' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ readonly: true })"
        :skel="{ status: 'published' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ multiple: true })"
        :skel="{ status: ['draft', 'published'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ required: true })"
        :skel="{ status: null }"
        :errors="[{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ status: { de: 'draft', en: 'published' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant title="Variante: Choose (Buttons)">
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select.choose"
        :structure="createStructure({ type: 'select.choose' })"
        :skel="{ status: 'draft' }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="status"
          bone-type="select"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ status: 'draft' }"
          :errors="state.showError ? [{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }] : []"
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
