<template>
  <Story title="Bones/RecordBone">
    <Variant
      title="Playground"
      :auto-props-disabled="true"
      :source="pgSourceRef"
      :init-state="
        () => ({
          boneName: 'address',
          descr: 'Adresse',
          readonly: false,
          required: false,
          multiple: false,
          multilang: false,
          languages: 'de, en',
        })
      "
    >
      <template #default="{ state }">
        {{ syncPgSource(state) }}
        <RecordBoneWrapper
          :bone-name="state.boneName"
          :structure="{
            [state.boneName]: {
              type: 'record',
              descr: state.descr,
              required: state.required,
              readonly: state.readonly,
              multiple: state.multiple,
              languages: parseLangs(state),
              params: {},
              using: {
                street: {
                  type: 'str',
                  descr: 'Straße',
                  required: false,
                  readonly: false,
                  multiple: false,
                  visible: true,
                  languages: null,
                  params: {},
                },
                city: {
                  type: 'str',
                  descr: 'Stadt',
                  required: false,
                  readonly: false,
                  multiple: false,
                  visible: true,
                  languages: null,
                  params: {},
                },
                zip: {
                  type: 'str',
                  descr: 'PLZ',
                  required: false,
                  readonly: false,
                  multiple: false,
                  visible: true,
                  languages: null,
                  params: {},
                },
              },
            },
          }"
          :skel="
            parseLangs(state)
              ? { [state.boneName]: Object.fromEntries(parseLangs(state).map((l) => [l, state.multiple ? [{}] : {}])) }
              : state.multiple
                ? { [state.boneName]: [{}] }
                : { [state.boneName]: {} }
          "
          :languages="parseLangs(state)"
        />
      </template>
      <template #controls="{ state }">
        <HstText
          v-model="state.boneName"
          title="Bone-Name"
        />
        <div class="hst-hint">{{ hints.boneName }}</div>

        <HstText
          v-model="state.descr"
          title="Description (Label)"
        />
        <div class="hst-hint">{{ hints.descr }}</div>

        <HstCheckbox
          v-model="state.readonly"
          title="Readonly"
        />
        <div class="hst-hint">{{ hints.readonly }}</div>

        <HstCheckbox
          v-model="state.required"
          title="Required"
        />
        <div class="hst-hint">{{ hints.required }}</div>

        <HstCheckbox
          v-model="state.multiple"
          title="Multiple"
        />
        <div class="hst-hint">{{ hints.multiple }}</div>

        <HstCheckbox
          v-model="state.multilang"
          title="Multilang"
        />
        <div class="hst-hint">{{ hints.multilang }}</div>

        <template v-if="state.multilang">
          <HstText
            v-model="state.languages"
            title="Sprachen"
          />
          <div class="hst-hint">{{ hints.languages }}</div>
        </template>
      </template>
    </Variant>
  </Story>
</template>

<script setup>
import { ref } from "vue"
import RecordBoneWrapper from "../RecordBoneWrapper.vue"
import { hints } from "../fixtures/controlHints.js"
import { parseLangs } from "../fixtures/storyUtils.js"

function src(structure, skel) {
  const name = Object.keys(structure)[0]
  return [
    `<RecordBone`,
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
  const langs = parseLangs(state)
  const using = {
    street: {
      type: "str",
      descr: "Straße",
      required: false,
      readonly: false,
      multiple: false,
      visible: true,
      languages: null,
      params: {},
    },
    city: {
      type: "str",
      descr: "Stadt",
      required: false,
      readonly: false,
      multiple: false,
      visible: true,
      languages: null,
      params: {},
    },
    zip: {
      type: "str",
      descr: "PLZ",
      required: false,
      readonly: false,
      multiple: false,
      visible: true,
      languages: null,
      params: {},
    },
  }
  const structure = {
    [state.boneName]: {
      type: "record",
      descr: state.descr,
      required: state.required,
      readonly: state.readonly,
      multiple: state.multiple,
      languages: langs,
      params: {},
      using,
    },
  }
  const emptyVal = state.multiple ? [{}] : {}
  const skel = langs
    ? { [state.boneName]: Object.fromEntries(langs.map((l) => [l, emptyVal])) }
    : { [state.boneName]: emptyVal }
  pgSourceRef.value = src(structure, skel)
  return ""
}
</script>

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
