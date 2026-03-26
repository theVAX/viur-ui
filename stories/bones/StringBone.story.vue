<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/string.js'
</script>

<template>
  <Story title="Bones/StringBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: 'Beispieltext' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ readonly: true })"
        :skel="{ title: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ title: { de: 'Deutsch', en: 'English' } }"
        :languages="['de', 'en']"
      />
    </Variant>
  </Story>
</template>
