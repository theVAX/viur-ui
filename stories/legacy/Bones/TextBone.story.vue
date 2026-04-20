<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure, validHtmlStructure } from "../../fixtures/text.js"
</script>

<template>
  <Story title="Legacy Bones/TextBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure()"
        :skel="{ content: '<p>Beispieltext</p>' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ readonly: true })"
        :skel="{ content: '<p>Nur lesen</p>' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ required: true })"
        :skel="{ content: '' }"
        :errors="[{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="HTML (CKEditor)"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="validHtmlStructure"
        :skel="{ content: '<p>Beispieltext <b>fett</b></p>' }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ multiple: true })"
        :skel="{ content: ['<p>Absatz 1</p>', '<p>Absatz 2</p>'] }"
      />
    </Variant>

    <Variant
      title="Multilang"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ content: { de: '<p>Deutsch</p>', en: '<p>English</p>' } }"
        :languages="['de', 'en']"
      />
    </Variant>
  </Story>
</template>
