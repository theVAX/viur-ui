<template>
  <div class="image-description-wrapper">
    <div class="image-description-grid">
      <div>
        <vi-image
          :src="state.url"
          style="height: 50px"
        ></vi-image>
      </div>

      <div class="image-description-flex">
        <wa-tab-group
          v-if="state.value"
          class="lang-tab"
          placement="bottom"
        >
          <template
            v-for="(val, lang) in state.value"
            :key="lang + '_tab'"
          >
            <wa-tab
              slot="nav"
              :panel="'lang_' + lang"
              :disabled="state.loading"
              @click="state.currentLang = lang"
            >
              {{ $t(lang) }}
            </wa-tab>

            <wa-tab-panel :name="'lang_' + lang">
              <wa-textarea
                :value="state.value[lang]"
                :label="`Beschreibung (` + lang + `):`"
                @change="updateValue($event, lang)"
              ></wa-textarea>
            </wa-tab-panel>
          </template>
        </wa-tab-group>

        <wa-input
          v-model="state.prompt"
          placeholder="weitere Anweisungen"
        ></wa-input>
        <span class="image-description-small-print">
          * Bei der Beschreibung kommt künstliche Intelligenz zum Einsatz. Die Ergebnisse können daher fehlerhaft sein.
          Bitte prüfen Sie daher stets das Ergebnis.
        </span>
        <wa-button
          size="small"
          variant="brand"
          :loading="state.loading"
          @click="describe"
        >
          Beschreibung erstellen
        </wa-button>
      </div>
    </div>
  </div>

  <div
    slot="footer"
    class="footer"
  >
    <wa-button
      variant="danger"
      size="small"
      appearance="outlined"
      @click="CloseAction"
    >
      {{ $t("relation.abort") }}
    </wa-button>

    <wa-button
      variant="success"
      size="small"
      @click="ApplySelection"
    >
      Beschreibung übernehmen
    </wa-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
import { createControllerFetch } from "../../../request/index.js"
import viImage from "@viur/vue-utils/generic/Image.vue"

const props = defineProps({
  name: String,
  module: String,
  tabId: String,
  assistant: String,
  params: Object,
})
const viform = inject("viform")
const emit = defineEmits(["close", "next"])
const describeImageFetch = createControllerFetch({ endpoint: "describe_image", method: "POST" })

const state = reactive({
  value: null,
  currentLang: null,
  url: computed(
    () =>
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : window.location.origin) +
      props.params.value?.dest?.downloadUrl
  ),
  prompt: null,
  loading: false,
})

async function describe() {
  state.loading = true
  try {
    const fetchResult = describeImageFetch(
      "assistant",
      "/",
      {
        filekey: props.params.value.dest.key,
        context: JSON.stringify(viform?.value?.state?.skel),
        prompt: state.prompt,
        language: state.currentLang,
      },
      {
        immediate: false,
      }
    )
    await fetchResult.execute()
    state.value[state.currentLang] = fetchResult.data.value
  } catch (error) {
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  state.value = props.params.value?.rel?.alt
  if (!state.value) {
    let langs = {}
    for (const l of props.params.bone.using.alt.languages) {
      langs[l] = ""
    }
    state.value = langs
  }
  state.currentLang = props.params.bone.using.alt.languages[0]
})

function updateValue(e, lang) {
  state.value[lang] = e.target.value
}

function CloseAction() {
  emit("close", props.params.value)
}

function ApplySelection() {
  if (!props.params.value.rel) {
    props.params.value["rel"] = { alt: state.value }
  } else {
    props.params.value.rel.alt = state.value
  }
  emit("close", props.params.value)
}
</script>

<style scoped>
.image-description-wrapper {
  padding: var(--sl-spacing-large);
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-small);
}

.image-description-grid {
  display: grid;
  grid-template-columns: 15em minmax(0, 1fr);
  gap: var(--sl-spacing-large);
}

.footer {
  display: flex;
  justify-content: space-between;
}

.image-description-small-print {
  font-size: 0.7em;
}

.image-description-flex {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-small);
}

wa-textarea {
  &::part(form-control-label) {
    margin-bottom: var(--sl-spacing-x-small);
    font-weight: 600;
  }
}

wa-tab-panel::part(base) {
  padding: 0;
}

.lang-tab {
  --track-width: 0;
  --indicator-color: var(--vi-background-color);
  --track-color: var(--vi-border-color);

  &::part(body) {
    padding-bottom: var(--sl-spacing-x-small);
    overflow-x: hidden;
  }

  &::part(tabs) {
    border-top: 1px solid var(--vi-border-color);
  }

  & wa-tab {
    margin-top: -1px;

    &[aria-selected="true"] {
      z-index: 1;

      &::part(base) {
        background-color: var(--vi-background-color);
        border: 1px solid var(--vi-border-color);
        border-top: 1px solid var(--vi-background-color) !important;
        border-bottom: 2px solid var(--sl-color-primary-500) !important;
      }
    }

    &::part(base) {
      background-color: var(--sl-color-neutral-200);
      border: 1px solid var(--sl-color-neutral-400);
      border-top: 1px solid var(--vi-border-color);
      border-radius: 0;
      padding: var(--sl-spacing-x-small);
      transition: all ease 0.3s;
    }

    &:hover {
      &::part(base) {
        background-color: var(--vi-background-color);
        border: 1px solid var(--vi-border-color);
      }
    }

    &:first-child {
      &::part(base) {
        border-bottom-left-radius: 5px;
      }
    }

    &:nth-last-child(2) {
      &::part(base) {
        border-bottom-right-radius: 5px;
      }
    }

    &:not(:first-child) {
      &::part(base) {
        margin-left: -1px;
      }
    }
  }
}
</style>
