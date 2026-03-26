<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/boolean.js'
</script>

<template>
  <Story title="Bones/BooleanBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure()"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ readonly: true })"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ multiple: true })"
        :skel="{ active: [true, false, true] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ required: true })"
        :skel="{ active: null }"
        :errors="[{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>
  </Story>
</template>
