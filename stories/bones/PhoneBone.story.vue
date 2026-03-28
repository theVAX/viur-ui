<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/phone.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/PhoneBone">

    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { phone: '+49 89 12345678' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure()"
        :skel="{ phone: '+49 89 12345678' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { phone: '+49 89 12345678' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ readonly: true })"
        :skel="{ phone: '+49 89 12345678' }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { phone: ['+49 89 12345678', '+43 1 98765432'] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ multiple: true })"
        :skel="{ phone: ['+49 89 12345678', '+43 1 98765432'] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { phone: '' },
          { errors: [{ fieldPath: ['phone'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ required: true })"
        :skel="{ phone: '' }"
        :errors="[{ fieldPath: ['phone'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="phone"
          bone-type="str.phone"
          :structure="state.structure"
          :skel="{ phone: '+49 89 123456' }"
          :errors="state.showError ? [{ fieldPath: ['phone'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.phone.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.phone.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
