<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/email.js'
</script>

<template>
  <Story title="Bones/EmailBone">

    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure()"
        :skel="{ email: 'hallo@example.com' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ readonly: true })"
        :skel="{ email: 'hallo@example.com' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ multiple: true })"
        :skel="{ email: ['eins@example.com', 'zwei@example.com'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ required: true })"
        :skel="{ email: '' }"
        :errors="[{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ email: { de: 'de@example.com', en: 'en@example.com' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="email"
          bone-type="str.email"
          :structure="state.structure"
          :skel="{ email: 'beispiel@example.com' }"
          :errors="state.showError ? [{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.email.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.email.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
