<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/string.js'
</script>

<template>
  <Story title="Legacy Bones/StringBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: 'Beispieltext' }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ readonly: true })"
        :skel="{ title: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant title="Multilang" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ title: { de: 'Deutsch', en: 'English' } }"
        :languages="['de', 'en']"
      />
    </Variant>

  </Story>
</template>
