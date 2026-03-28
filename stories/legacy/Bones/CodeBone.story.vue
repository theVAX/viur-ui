<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/raw.js'

const skelDefault = { code: 'print("Hello World")' }
const skelReadonly = { code: 'print("readonly")' }
const skelMultiple = { code: ['print("A")', 'print("B")'] }
</script>

<template>
  <Story title="Legacy Bones/CodeBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure()"
        :skel="skelDefault"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ readonly: true })"
        :skel="skelReadonly"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ required: true })"
        :skel="{ code: '' }"
        :errors="[{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="code"
        bone-type="raw.code.python"
        :structure="createStructure({ multiple: true })"
        :skel="skelMultiple"
      />
    </Variant>

  </Story>
</template>
