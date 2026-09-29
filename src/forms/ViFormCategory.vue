<template>
  <template v-if="hide">
    <slot></slot>
  </template>

  <wa-details
    v-else
    v-show="visible"
    class="viform-category"
    :class="[`viform-category-${encodeURI(name.toLowerCase())}`]"
    :open="open"
  >
    <div
      slot="summary"
      v-safe-html="name"
    ></div>
    <slot></slot>
  </wa-details>
</template>

<script setup>
import { vSafeHtml } from "../vite/safeHtml.js"

const props = defineProps({
  // String shown a Category
  name: {
    type: String,
    required: true,
  },
  // internal identifiert mostly lowerCased name
  identifier: {
    type: String,
    required: true,
  },
  //is hidden
  visible: {
    type: Boolean,
    default: true,
  },
  //is open
  open: {
    type: Boolean,
    default: true,
  },
  //hide wrapper
  hide: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* Intentionally no custom styling: the category is a plain <wa-details>
   (bordered, rounded, expand arrow at the end) so it follows the app theme. */
.viform-category + .viform-category {
  margin-block-start: var(--wa-space-s);
}
</style>
