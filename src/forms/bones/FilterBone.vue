<template>
  <div
    class="bone"
    :class="{
      'has-subbones': state.bonestructure['using'],
      'is-label-top': label === 'top',
      'is-label-hide': ['hide', 'placeholder'].includes(label),
      [`bone-type-${state.bonestructure['type'].split('.')[0]}`]: true,
      [`bone-name-${name}`]: true,
    }"
  >
    <bone-label
      v-if="!['hide', 'placeholder'].includes(label)"
      :name="name"
    >
      <span :class="{ 'bone-label-required': state.required }">{{ state.bonestructure["descr"] }}</span>
      <span
        v-if="state.required"
        class="bone-label-required"
      >
        *
      </span>
      <wa-tooltip
        v-if="state.hasTooltip && !showLabelInfo"
        :for="state.labelTooltipTargetId"
        :content="state.bonestructure.params['tooltip']"
        placement="top-center"
      ></wa-tooltip>
      <div
        v-if="state.hasTooltip && !showLabelInfo"
        :id="state.labelTooltipTargetId"
        class="bone-label-tooltip"
      >
        <wa-icon name="question"></wa-icon>
      </div>
    </bone-label>

    <wa-alert
      v-if="showLabelInfo && state.hasTooltip"
      variant="brand"
      open
      class="bone-label-info"
    >
      <wa-icon
        slot="icon"
        name="circle-info"
      ></wa-icon>
      {{ state.bonestructure.params["tooltip"] }}
    </wa-alert>
    <wa-tooltip
      class="bone-tooltip"
      :for="state.boneTooltipTargetId"
      :disabled="!state.showtooltip"
      :content="state.bonestructure?.['descr']"
      style="--show-delay: 1000"
    ></wa-tooltip>
    <div
      :id="state.boneTooltipTargetId"
      class="bone-inner"
      :class="[`bone-widget-${name}`]"
    >
      <div class="bone-row">
        <wa-select
          v-if="state.multilanguage"
          style="width: 100px"
          :value="state.currentLanguage"
          @change="updateLanguage"
        >
          <wa-option
            v-for="lang in state.languages"
            :value="lang"
          >
            {{ $t(lang) }}
          </wa-option>
        </wa-select>
        <div class="bone-row">
          <div class="bone-block">
            <component
              :is="is"
              :value="state.bonevalue"
              :name="name"
              :index="null"
              :bone="state.bonestructure"
              :autofocus="autofocus"
              @change="updateValue"
              @keypress.enter="updateValue"
            ></component>
          </div>
          <bone-actions
            v-if="state.boneactions"
            :value="state.bonevalue"
            :name="name"
            :index="null"
            :bone="state.bonestructure"
            @change="updateValue"
          ></bone-actions>
        </div>
      </div>
      <template v-if="errorStyle === 'default'">
        <wa-alert
          v-for="message in state.errorMessages"
          open
          summary="Errors"
          variant="danger"
          class="bone-error"
        >
          <wa-icon
            slot="icon"
            name="triangle-exclamation"
          ></wa-icon>
          <div class="bone-error">
            {{ $t(`errors.${message}`) }}
          </div>
        </wa-alert>
      </template>
      <template v-else>
        <div
          v-for="message in state.errorMessages"
          style="font-size: 0.8em; color: red"
        >
          {{ $t(`errors.${message}`) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import {
  reactive,
  defineComponent,
  computed,
  onBeforeMount,
  provide,
  getCurrentInstance,
  onMounted,
  watch,
  ref,
  inject,
  unref,
} from "vue"
import wrapperMultiple from "./BoneMultipleWrapper.vue"
import BoneLabel from "./BoneLabel.vue"
import { BoneHasMultipleHandling, getBoneActionbar } from "./index"
import rawBone from "./rawBone.vue"
import Utils, { buildBoneDomId } from "./utils"
import { VueDraggable } from "vue-draggable-plus"
import BoneActions from "./BoneActions.vue"

const emit = defineEmits(["change", "change-internal", "handleClick"])

const props = defineProps({
  is: {
    type: Object,
    default: rawBone,
  },
  name: {
    type: String,
    required: true,
  },
  languages: Array,
  multiple: Boolean,
  readonly: Boolean,
  required: Boolean,
  params: Object,
  value: [Object, String, Number, Boolean, Array],
  structure: {
    type: Object,
    required: true,
  },
  skel: {
    type: null,
    required: true,
  },
  errors: Object,
  label: {
    type: String,
    default: "normal",
    validator(value, props) {
      return ["normal", "top", "hide", "placeholder"].includes(value)
    },
  },
  boneactions: { type: Boolean, default: false },
  showLabelInfo: { type: Boolean, required: false, default: false },
  autofocus: { type: Boolean, required: false, default: false },
  defaultLanguage: { type: String, default: "de" },
  showBoneTooltip: { type: Boolean, required: false, default: false },
  errorStyle: {
    type: String,
    default: "default",
    validator(value, props) {
      return ["default", "decent"].includes(value)
    },
  },
})
const parentBonePath = inject("bonePath", [])
const bonePath = computed(() => [...(unref(parentBonePath) ?? []), props.name])
provide("bonePath", bonePath)
const state = reactive({
  boneactions: computed(() => props.boneactions),
  bonestructure: computed(() => {
    let struct = props.structure?.[props.name]
    struct["multiple"] = false
    return struct
  }),
  bonevalue: null,
  multilanguage: computed(() => state.languages?.length && state.languages.length > 0),
  languages: computed(() => {
    if (props.languages) {
      return props.languages
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("languages")
      ? state.bonestructure["languages"]
      : []
  }),
  readonly: computed(() => {
    if (props.readonly) {
      return props.readonly
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("readonly")
      ? state.bonestructure["readonly"]
      : false
  }),
  required: computed(() => {
    if (props.required) {
      return props.required
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("required")
      ? state.bonestructure["required"]
      : false
  }),
  hasTooltip: computed(() => {
    return state.bonestructure && Object.keys(state.bonestructure["params"]).includes("tooltip") ? true : false
  }),

  multiple: computed(() => {
    if (props.multiple) {
      return props.multiple
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("multiple")
      ? state.bonestructure["multiple"]
      : false
  }),
  params: computed(() => {
    if (props.params) {
      return props.params
    }
    return state.bonestructure && Object.keys(state.bonestructure).includes("params")
      ? state.bonestructure["params"]
      : {}
  }),
  actionbar: computed(() => {
    return getBoneActionbar(state.bonestructure?.["type"])
  }),
  isEmpty: computed(() => {
    // Function to check if an object is empty
    function isObjectEmpty(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            return false
          } else if (!Array.isArray(value)) {
            return false
          }
        }
      }
      return true
    }

    // Ignore the computation when the state is readonly
    if (state.readonly) return false

    // Check for null or undefined values
    if (!state.bonevalue) return true

    // Check if the value is an array with elements
    if (Array.isArray(state.bonevalue) && state.bonevalue.length === 0) return true

    // Check if the value is an object and not an array, then use helper function to check if it's empty
    if (state.bonevalue === Object(state.bonevalue) && !Array.isArray(state.bonevalue))
      return isObjectEmpty(state.bonevalue)

    return false
  }),

  errors: [],
  errorMessages: computed(() => {
    let errors = []
    for (let error of props.errors) {
      if (
        error["fieldPath"][0] === props.name &&
        (error["fieldPath"].length === 1 ||
          ((state.multilanguage || state.multiple) && error["fieldPath"].length === 2) ||
          (state.multilanguage && state.multiple && error["fieldPath"].length === 3)) &&
        (error["severity"] > 2 || (state.required && (error["severity"] === 2 || error["severity"] === 0)))
      ) {
        //severity level???
        errors.push(error["errorMessage"])
      }
    }
    return errors
  }),
  label: computed(() => props.label),
  showtooltip: computed(() => {
    if (props.showBoneTooltip) {
      return true
    }
    if (["hide", "placeholder"].includes(props.label)) {
      return true
    }
    return false
  }),
  defaultLanguage: computed(() => props.defaultLanguage),
  currentLanguage: null,
  labelTooltipTargetId: computed(() => buildBoneDomId(unref(bonePath) ?? [], "label-tooltip")),
  boneTooltipTargetId: computed(() => buildBoneDomId(unref(bonePath) ?? [], "field-tooltip")),
})
provide("boneState", state)

function updateValue(name, val, lang = null, index = null, valid = true) {
  if (val === undefined) return false
  if (valid) {
    if (lang) {
      if (!state.bonevalue) {
        state.bonevalue = {}
      }
      if (Object.keys(state.bonevalue).includes(lang) && index !== null) {
        state.bonevalue[lang][index] = val
      } else {
        state.bonevalue[lang] = val
      }
    } else if (index !== null) {
      state.bonevalue[index] = val
    } else {
      state.bonevalue = val
    }
  }

  if (state.readonly) return false

  let changeInternalObj = {
    name: name,
    value: val,
    lang: state.multilanguage ? state.currentLanguage : null,
    index: index,
    valid: valid,
  }

  emit("change-internal", changeInternalObj)
}
provide("updateValue", updateValue)

function updateLanguage(e) {
  state.currentLanguage = e.target.value
  let changeInternalObj = {
    name: props.name,
    value: state.bonevalue,
    lang: state.currentLanguage,
    index: null,
    valid: true,
  }

  emit("change-internal", changeInternalObj)
}

function addMultipleEntry(lang = null, data = "") {
  if (lang) {
    if (Object.keys(state.bonevalue).includes(lang)) {
      state.bonevalue[lang].push(data)
    } else {
      state.bonevalue[lang] = [data]
    }
  } else {
    if (state.bonevalue) {
      state.bonevalue.push(data)
    } else {
      state.bonevalue = [data]
    }
  }
}
provide("addMultipleEntry", addMultipleEntry)

function removeMultipleEntry(index, lang = null) {
  if (lang) {
    state.bonevalue?.[lang].splice(index, 1)
  } else {
    state.bonevalue.splice(index, 1)
  }

  if (lang) {
    updateValue(props.name, state.bonevalue[lang], lang)
  } else {
    updateValue(props.name, state.bonevalue)
  }
}

function removeMultipleEntries(lang = null) {
  if (lang) {
    state.bonevalue?.[lang].splice(0)
  } else {
    state.bonevalue.splice(0)
  }
  if (lang) {
    updateValue(props.name, state.bonevalue[lang], lang)
  } else {
    updateValue(props.name, state.bonevalue)
  }
}

provide("removeMultipleEntries", removeMultipleEntries)

function formatString(formatstr, boneValue) {
  return Utils.formatString(formatstr, boneValue)
}
provide("formatString", formatString)

onBeforeMount(() => {
  if (props.value) {
    state.bonevalue = props.value
  } else {
    state.bonevalue = props.skel?.[props.name]
  }
  state.currentLanguage = state.defaultLanguage
})

watch(
  () => props.skel?.[props.name],
  (newVal, oldVal) => {
    state.bonevalue = props.skel?.[props.name]
  }
)

watch(
  () => props.errors?.[props.name],
  (newVal, oldVal) => {
    state.errors = props.errors
  }
)
</script>

<style scoped>
@layer foundation.form {
  .bone {
    display: grid;
    grid-template-columns: 235px 1fr;
    grid-gap: var(--wa-space-s);
    margin-bottom: 20px;

    &.is-label-top,
    &.has-subbones {
      display: flex;
      flex-direction: column;
      grid-gap: 0;

      & > :deep(.bone-label) {
        border-bottom-left-radius: 0;
        border-top-right-radius: var(--wa-border-radius-m);
        min-width: 235px;
      }

      & > .bone-inner {
        padding-top: var(--wa-space-s);
        border-top: 2px solid var(--wa-color-neutral-80);
        margin-bottom: 5px;
      }
    }

    &.is-label-hide {
      display: flex;
      flex-direction: column;
      grid-gap: 0;
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  wa-tab-panel::part(base) {
    padding: 0;
  }

  .bone-lang-tabs {
    width: 100%;
    --track-width: 0;
    --indicator-color: var(--vi-background-color);
    --track-color: var(--vi-border-color);

    &::part(body) {
      padding-bottom: var(--wa-space-xs);
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
          border-bottom: 2px solid var(--wa-color-brand-50) !important;
        }
      }

      &::part(base) {
        background-color: var(--wa-color-neutral-90);
        border: 1px solid var(--wa-color-neutral-70);
        border-top: 1px solid var(--vi-border-color);
        border-radius: 0;
        padding: var(--wa-space-xs);
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

  .bone-multiple-placeholder {
    &:not(.is-readonly) {
      margin-bottom: var(--wa-space-xs);
    }

    & wa-input {
      &::part(base) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        opacity: 0.7;
      }
    }

    @media (max-width: 900px) {
      & wa-input {
        &::part(base) {
          border-top-right-radius: 0;
          border-bottom-left-radius: var(--wa-border-radius-m);
        }
      }
    }
  }

  .bone-inner {
    min-width: 1px;

    & wa-alert {
      margin-top: var(--wa-space-xs);
      background-color: transparent;

      &::part(message) {
        padding: var(--wa-space-xs) var(--wa-space-s);
      }

      &::part(icon) {
        padding-left: var(--wa-space-s);
      }
    }
  }

  .bone-label-info {
    &::part(base) {
      align-items: center;
      margin-left: 0.5em;
      background-color: var(--wa-color-info-95);
      border: none;
      overflow: visible;
    }

    &::part(message) {
      padding: var(--wa-space-s);
    }

    &::part(icon) {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--wa-color-surface-default);
      width: 1em;
      height: 1em;
      margin-left: -0.5em;
      padding-left: 0;
    }
  }

  .bone-label-tooltip {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding-left: 0.4em;

    & wa-icon {
      background-color: var(--wa-color-info-50);
      color: #fff;
      padding: 0.4em;
      border-radius: 50%;
      font-size: 0.55em;
    }
  }

  wa-tooltip {
    &::part(body) {
      background-color: var(--wa-color-info-50);
    }

    &::part(base__arrow) {
      background-color: var(--wa-color-info-50);
    }
  }

  .bone-label-required {
    color: var(--wa-color-brand-50);
    font-weight: 700;
  }

  :deep(wa-combobox) {
    &::part(input__base) {
      border: 1px solid var(--vi-border-color);
      box-shadow: none !important;
    }

    &::part(input__prefix) {
      display: none !important;
    }

    &::part(input__suffix) {
      display: none !important;
    }
  }

  wa-tooltip.bone-tooltip {
    &::part(body) {
      background-color: var(--wa-color-brand-50);
    }

    &::part(base__arrow) {
      background-color: var(--wa-color-brand-50);
    }
  }
}

.bone-error::part(base) {
  background-color: #ffecec;
  color: var(--wa-color-danger-30);
}

.bone-row {
  display: flex;
  flex-direction: row;
  gap: var(--wa-space-xs);
}

.bone-block {
  display: block;
  width: 100%;
}
</style>

<style>
wa-input[data-user-invalid]::part(base),
wa-select[data-user-invalid]::part(combobox),
wa-checkbox[data-user-invalid]::part(control) {
  border-color: var(--wa-color-danger-50);
}
</style>
