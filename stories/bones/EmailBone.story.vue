<template>
  <Story title="Bones/EmailBone">
    <Variant
      title="Playground"
      :auto-props-disabled="true"
      :source="pgSourceRef"
      :init-state="
        () => ({
          boneName: 'email',
          descr: 'E-Mail-Adresse',
          boneType: 'str.email',
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
          bone-type="str.email"
          :structure="makeStructure(state, { languages: parseLangs(state) })"
          :skel="
            parseLangs(state)
              ? { [state.boneName]: Object.fromEntries(parseLangs(state).map((l) => [l, ''])) }
              : { [state.boneName]: '' }
          "
          :label="state.label"
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

<script setup>
import { ref } from "vue"
import BoneStoryWrapper from "../BoneStoryWrapper.vue"
import { hints } from "../fixtures/controlHints.js"
import { src, makeStructure, parseLangs } from "../fixtures/storyUtils.js"

const pgSourceRef = ref("")

function syncPgSource(state) {
  const langs = parseLangs(state)
  const skel = langs ? { [state.boneName]: Object.fromEntries(langs.map((l) => [l, ""])) } : { [state.boneName]: "" }
  pgSourceRef.value = src(makeStructure(state, { languages: langs }), skel, langs ? { languages: langs } : {})
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
