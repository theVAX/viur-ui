<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/numeric.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/NumericBone">
    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { amount: 42 })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure()"
        :skel="{ amount: 42 }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { amount: 42 })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ readonly: true })"
        :skel="{ amount: 42 }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { amount: [1, 2, 3] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ multiple: true })"
        :skel="{ amount: [1, 2, 3] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { amount: null },
          { errors: [{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ required: true })"
        :skel="{ amount: null }"
        :errors="[{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multilang"
      :source="src(createStructure({ languages: ['de', 'en'] }), { amount: { de: 10, en: 20 } }, { languages: ['de', 'en'] })"
      :auto-props-disabled="true"
    >
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
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="amount"
          bone-type="numeric"
          :structure="state.structure"
          :skel="{ amount: 42 }"
          :errors="state.showError ? [{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.amount.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.amount.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
