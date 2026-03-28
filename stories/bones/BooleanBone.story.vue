<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/boolean.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/BooleanBone">
    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { active: true })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure()"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { active: false })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ readonly: true })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { active: [true, false, true] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ multiple: true })"
        :skel="{ active: [true, false, true] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { active: null },
          { errors: [{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ required: true })"
        :skel="{ active: null }"
        :errors="[{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Variante: Choose"
      :source="src(createStructure({ type: 'bool.choose' }), { active: true })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool.choose"
        :structure="createStructure({ type: 'bool.choose' })"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant
      title="Variante: Select (Dropdown)"
      :source="src(createStructure({ type: 'bool.select' }), { active: false })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool.select"
        :structure="createStructure({ type: 'bool.select' })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="active"
          bone-type="bool"
          :structure="state.structure"
          :skel="{ active: true }"
          :errors="state.showError ? [{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.active.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.active.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
