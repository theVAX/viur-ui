<script setup>
import { ref } from "vue"
import BoneStoryWrapper from "../BoneStoryWrapper.vue"
import { hints } from "../fixtures/controlHints.js"

function src(structure, skel) {
  const name = Object.keys(structure)[0]
  return [
    `<Bone`,
    `  name="${name}"`,
    `  :structure="structure"`,
    `  :skel="skel"`,
    `/>`,
    ``,
    `<!-- structure -->`,
    JSON.stringify(structure, null, 2),
    ``,
    `<!-- skel -->`,
    JSON.stringify(skel, null, 2),
  ].join("\n")
}

const pgSourceRef = ref("")

function syncPgSource(state) {
  const structure = {
    [state.boneName]: {
      type: "str.phone",
      descr: state.descr,
      required: state.required,
      readonly: state.readonly,
      multiple: state.multiple,
      languages: null,
      params: {},
    },
  }
  const skel = { [state.boneName]: "" }
  pgSourceRef.value = src(structure, skel)
  return ""
}
</script>

<template>
  <Story title="Bones/PhoneBone">
    <Variant
      title="Playground"
      :auto-props-disabled="true"
      :source="pgSourceRef"
      :init-state="
        () => ({
          boneName: 'phone',
          descr: 'Telefonnummer',
          readonly: false,
          required: false,
          multiple: false,
          label: 'normal',
        })
      "
    >
      <template #default="{ state }">
        {{ syncPgSource(state) }}
        <BoneStoryWrapper
          :bone-name="state.boneName"
          bone-type="str.phone"
          :structure="{
            [state.boneName]: {
              type: 'str.phone',
              descr: state.descr,
              required: state.required,
              readonly: state.readonly,
              multiple: state.multiple,
              languages: null,
              params: {},
            },
          }"
          :skel="{ [state.boneName]: '' }"
          :label="state.label"
        />
      </template>
      <template #controls="{ state }">
        <HstText v-model="state.boneName" title="Bone-Name" />
        <div class="hst-hint">{{ hints.boneName }}</div>

        <HstText v-model="state.descr" title="Description (Label)" />
        <div class="hst-hint">{{ hints.descr }}</div>

        <HstCheckbox v-model="state.readonly" title="Readonly" />
        <div class="hst-hint">{{ hints.readonly }}</div>

        <HstCheckbox v-model="state.required" title="Required" />
        <div class="hst-hint">{{ hints.required }}</div>

        <HstCheckbox v-model="state.multiple" title="Multiple" />
        <div class="hst-hint">{{ hints.multiple }}</div>

        <HstSelect
          v-model="state.label"
          title="Label"
          :options="[
            { label: 'normal', value: 'normal' },
            { label: 'top', value: 'top' },
            { label: 'hide', value: 'hide' },
            { label: 'placeholder', value: 'placeholder' },
          ]"
        />
        <div class="hst-hint">{{ hints.label }}</div>
      </template>
    </Variant>
  </Story>
</template>

<style>
.hst-hint {
  font-size: 11px;
  color: #888;
  padding: 2px 12px 10px;
  line-height: 1.5;
}
.hst-hint code {
  font-family: monospace;
  background: #2a2a2a;
  padding: 1px 4px;
  border-radius: 3px;
  color: #fa7;
}
</style>
