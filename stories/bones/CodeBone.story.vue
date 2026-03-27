<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/raw.js'

const pythonCode = 'def hello():\n    print("Hello, World!")\n'
const htmlCode = '<h1>Hello</h1>\n<p>World</p>\n'
</script>

<template>
  <Story title="Bones/CodeBone">

    <Variant title="Default – Python">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure()"
        :skel="{ code: pythonCode }"
      />
    </Variant>

    <Variant title="HTML">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.html"
        :structure="createStructure({ type: 'raw.code.html', descr: 'HTML' })"
        :skel="{ code: htmlCode }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ readonly: true })"
        :skel="{ code: pythonCode }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ required: true })"
        :skel="{ code: '' }"
        :errors="[{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple">
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
