<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/raw.js'

const pythonCode = 'def hello():\n    print("Hello, World!")\n'
const htmlCode = '<h1>Hello</h1>\n<p>World</p>\n'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/CodeBone">

    <Variant title="Default – Python" :source="src(createStructure(), { code: pythonCode })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure()"
        :skel="{ code: pythonCode }"
      />
    </Variant>

    <Variant title="HTML" :source="src(createStructure({ type: 'raw.code.html', descr: 'HTML' }), { code: htmlCode })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.html"
        :structure="createStructure({ type: 'raw.code.html', descr: 'HTML' })"
        :skel="{ code: htmlCode }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { code: pythonCode })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ readonly: true })"
        :skel="{ code: pythonCode }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { code: '' },
          { errors: [{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ required: true })"
        :skel="{ code: '' }"
        :errors="[{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { code: ['print(1)', 'print(2)'] })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ multiple: true })"
        :skel="{ code: ['print(1)', 'print(2)'] }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="code"
          :bone-type="state.structure.code.type"
          :structure="state.structure"
          :skel="{ code: 'def hello():\n    print(\'Hello, World!\')\n' }"
          :errors="state.showError ? [{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.code.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.code.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
