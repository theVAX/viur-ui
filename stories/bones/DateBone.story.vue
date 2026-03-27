<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/date.js'
</script>

<template>
  <Story title="Bones/DateBone">
    <Variant title="Default (Datum)">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure()"
        :skel="{ publishedAt: '2026-03-26' }"
      />
    </Variant>

    <Variant title="Datetime">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ date: true, time: true })"
        :skel="{ publishedAt: '2026-03-26T10:00:00' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ readonly: true })"
        :skel="{ publishedAt: '2026-03-26' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ multiple: true })"
        :skel="{ publishedAt: ['2026-03-01', '2026-03-15'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ required: true })"
        :skel="{ publishedAt: null }"
        :errors="[{ fieldPath: ['publishedAt'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Zeit-only">
      <BoneStoryWrapper
        bone-name="publishedAt"
        bone-type="date"
        :structure="createStructure({ date: false, time: true })"
        :skel="{ publishedAt: '10:30:00' }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="publishedAt"
          bone-type="date"
          :structure="state.structure"
          :skel="{ publishedAt: '2026-03-27' }"
          :errors="state.showError ? [{ fieldPath: ['publishedAt'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.publishedAt.date" title="Datum" />
        <HstCheckbox v-model="state.structure.publishedAt.time" title="Zeit" />
        <HstCheckbox v-model="state.structure.publishedAt.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.publishedAt.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
