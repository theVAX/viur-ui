<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/password.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/PasswordBone">

    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { password: '' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure()"
        :skel="{ password: '' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { password: 'geheim' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ readonly: true })"
        :skel="{ password: 'geheim' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { password: '' },
          { errors: [{ fieldPath: ['password'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ required: true })"
        :skel="{ password: '' }"
        :errors="[{ fieldPath: ['password'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="password"
          bone-type="password"
          :structure="state.structure"
          :skel="{ password: '' }"
          :errors="state.showError ? [{ fieldPath: ['password'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.password.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.password.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
