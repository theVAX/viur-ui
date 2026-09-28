<template>
  <div class="debug-wrapper">
    <wa-details
      summary="Bone Structure"
      open
    >
      <pre>{{ stringify(params.bone) }}</pre>
    </wa-details>
    <wa-details
      summary="Bone Value"
      open
    >
      <pre>{{ stringify(params.value) }}</pre>
    </wa-details>
    <wa-details summary="Bone State">
      <pre>{{ stringify(params.boneState) }}</pre>
    </wa-details>
    <wa-details summary="Context">
      <pre>{{ stringify({ name: params.name, lang: params.lang, index: params.index }) }}</pre>
    </wa-details>
  </div>

  <div
    slot="footer"
    class="debug-footer"
  >
    <wa-button
      size="small"
      variant="brand"
      appearance="outlined"
      @click="CloseAction"
    >
      {{ t("actions.close") }}
    </wa-button>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const props = defineProps({
  name: String,
  module: String,
  tabId: String,
  action: Object,
  params: Object,
})

const emit = defineEmits(["close", "next"])

/**
 * Stringifiziert ein Objekt für die Debug-Anzeige.
 * Überspringt interne Felder (`_*`) und behandelt Zyklen.
 */
function stringify(obj) {
  const seen = new WeakSet()
  try {
    return JSON.stringify(
      obj,
      (key, val) => {
        if (typeof key === "string" && key.startsWith("_")) return undefined
        if (typeof val === "function") return `[Function ${val.name || "anonymous"}]`
        if (val && typeof val === "object") {
          if (seen.has(val)) return "[Circular]"
          seen.add(val)
        }
        return val
      },
      2
    )
  } catch (e) {
    return String(obj)
  }
}

function CloseAction() {
  emit("close")
}
</script>

<style scoped>
.debug-wrapper {
  padding: var(--wa-space-l);
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-xs);
}

pre {
  margin: 0;
  padding: var(--wa-space-s);
  background-color: var(--wa-color-neutral-95);
  border-radius: var(--wa-border-radius-m);
  font-size: 0.8em;
  font-family: var(--wa-font-family-code, monospace);
  overflow: auto;
  max-height: 50vh;
}

.debug-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--wa-space-s);
}
</style>
