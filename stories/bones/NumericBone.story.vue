<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/numeric.js'
</script>

<template>
  <Story title="Bones/NumericBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure()"
        :skel="{ amount: 42 }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ readonly: true })"
        :skel="{ amount: 42 }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ multiple: true })"
        :skel="{ amount: [1, 2, 3] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ required: true })"
        :skel="{ amount: null }"
        :errors="[{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ amount: { de: 10, en: 20 } }"
        :languages="['de', 'en']"
      />
    </Variant>
    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="amount"
          bone-type="numeric"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ amount: 42 }"
          :errors="state.showError ? [{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }] : []"
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
