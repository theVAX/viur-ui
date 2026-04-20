<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/date.js'
</script>

<template>
  <Story title="Legacy Bones/DateBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure()"
        :skel="{ publishedAt: '2026-03-28' }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ readonly: true })"
        :skel="{ publishedAt: '2026-01-01' }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ required: true })"
        :skel="{ publishedAt: null }"
        :errors="[{ fieldPath: ['publishedAt'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ multiple: true })"
        :skel="{ publishedAt: ['2026-01-01', '2026-06-15'] }"
      />
    </Variant>

  </Story>
</template>
