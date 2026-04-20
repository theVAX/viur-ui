<script setup>
import { ref } from "vue"
import BoneStoryWrapper from "../BoneStoryWrapper.vue"
import { hints } from "../fixtures/controlHints.js"

function src(structure, skel, extra = {}) {
  const name = Object.keys(structure)[0]
  const attrs = [`name="${name}"`]
  if (extra.languages) attrs.push(`:languages="${JSON.stringify(extra.languages).replace(/"/g, "'")}"`)
  return [
    `<Bone`,
    `  ${attrs.join("\n  ")}`,
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
  const langs = state.multilang
    ? state.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : null
  const structure = {
    [state.boneName]: {
      type: "numeric",
      descr: state.descr,
      required: state.required,
      readonly: state.readonly,
      multiple: state.multiple,
      languages: langs,
      params: {},
    },
  }
  const skel = langs ? { [state.boneName]: Object.fromEntries(langs.map((l) => [l, 0])) } : { [state.boneName]: 0 }
  pgSourceRef.value = src(structure, skel, langs ? { languages: langs } : {})
  return ""
}
</script>

<template>
  <Story title="Bones/NumericBone">
    <Variant
      title="Playground"
      :auto-props-disabled="true"
      :source="pgSourceRef"
      :init-state="
        () => ({
          boneName: 'amount',
          descr: 'Betrag',
          readonly: false,
          required: false,
          multiple: false,
          multilang: false,
          languages: 'de, en',
          label: 'normal',
        })
      "
    >
      <template #default="{ state }">
        {{ syncPgSource(state) }}
        <BoneStoryWrapper
          :bone-name="state.boneName"
          bone-type="numeric"
          :structure="{
            [state.boneName]: {
              type: 'numeric',
              descr: state.descr,
              required: state.required,
              readonly: state.readonly,
              multiple: state.multiple,
              languages: state.multilang
                ? state.languages
                    .split(',')
                    .map((l) => l.trim())
                    .filter(Boolean)
                : null,
              params: {},
            },
          }"
          :skel="
            state.multilang
              ? {
                  [state.boneName]: Object.fromEntries(
                    state.languages
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .map((l) => [l, 0])
                  ),
                }
              : { [state.boneName]: 0 }
          "
          :label="state.label"
          :languages="
            state.multilang
              ? state.languages
                  .split(',')
                  .map((l) => l.trim())
                  .filter(Boolean)
              : null
          "
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
