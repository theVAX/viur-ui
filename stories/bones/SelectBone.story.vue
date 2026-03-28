<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/select.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/SelectBone">
    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { status: 'draft' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure()"
        :skel="{ status: 'draft' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { status: 'published' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ readonly: true })"
        :skel="{ status: 'published' }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { status: ['draft', 'published'] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ multiple: true })"
        :skel="{ status: ['draft', 'published'] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { status: null },
          { errors: [{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ required: true })"
        :skel="{ status: null }"
        :errors="[{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multilang"
      :source="
        src(
          createStructure({ languages: ['de', 'en'] }),
          { status: { de: 'draft', en: 'published' } },
          { languages: ['de', 'en'] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ status: { de: 'draft', en: 'published' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant
      title="Variante: Choose (Buttons)"
      :source="src(createStructure({ type: 'select.choose' }), { status: 'draft' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="status"
        bone-type="select.choose"
        :structure="createStructure({ type: 'select.choose' })"
        :skel="{ status: 'draft' }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="status"
          bone-type="select"
          :structure="state.structure"
          :skel="{ status: 'draft' }"
          :errors="state.showError ? [{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.status.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.status.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
