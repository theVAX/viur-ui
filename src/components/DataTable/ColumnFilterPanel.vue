<template>
  <!-- Inhalt des Filter-Popovers einer Spalte. Welche Steuerelemente erscheinen,
       entscheidet der filterType; die Werte für set-Filter kommen aus den
       Facetten (oder aus column.def.filterOptions, z. B. im Server-Modus). -->
  <div class="vi-dtf wa-stack wa-gap-s">
    <span class="vi-dtf-title">{{ column.label }}</span>

    <template v-if="state.kind === 'range'">
      <div class="wa-cluster wa-gap-2xs wa-flex-nowrap">
        <wa-input
          class="vi-dtf-input"
          size="small"
          appearance="outlined"
          :type="state.inputType"
          :placeholder="t('dataTable.filterFrom')"
          :value="state.from"
          @input="setRange(0, ($event.target as HTMLInputElement).value)"
        ></wa-input>
        <wa-input
          class="vi-dtf-input"
          size="small"
          appearance="outlined"
          :type="state.inputType"
          :placeholder="t('dataTable.filterTo')"
          :value="state.to"
          @input="setRange(1, ($event.target as HTMLInputElement).value)"
        ></wa-input>
      </div>
    </template>

    <template v-else-if="state.kind === 'set'">
      <wa-input
        v-if="state.options.length > 10"
        class="vi-dtf-search"
        size="small"
        appearance="outlined"
        :placeholder="t('dataTable.searchValues')"
        :value="state.optionQuery"
        @input="state.optionQuery = ($event.target as HTMLInputElement).value"
      >
        <wa-icon
          slot="start"
          name="magnifying-glass"
        ></wa-icon>
      </wa-input>
      <div class="vi-dtf-options wa-stack wa-gap-2xs">
        <label
          v-for="option in state.filteredOptions"
          :key="option.value"
          class="vi-dtf-option wa-flank wa-flex-nowrap wa-gap-xs"
        >
          <input
            class="vi-dtf-check"
            type="checkbox"
            :value="option.value"
            :checked="state.selected.includes(option.value)"
            @change="toggleOption(option.value)"
          />
          <span class="vi-dtf-option-label wa-split wa-flex-nowrap wa-gap-xs">
            <span class="wa-ellipsis">{{ option.label ?? option.value }}</span>
            <span
              v-if="option.count !== undefined"
              class="vi-dtf-count"
            >
              {{ option.count }}
            </span>
          </span>
        </label>
        <span
          v-if="!state.filteredOptions.length"
          class="vi-dtf-empty"
        >
          Keine Werte
        </span>
      </div>
    </template>

    <template v-else>
      <wa-input
        class="vi-dtf-input"
        size="small"
        appearance="outlined"
        :placeholder="state.kind === 'equals' ? 'genau …' : 'enthält …'"
        :value="state.text"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value || undefined)"
      ></wa-input>
    </template>

    <div class="wa-cluster wa-gap-2xs">
      <wa-button
        class="vi-dtf-clear"
        size="small"
        appearance="outlined"
        @click="clear"
      >
        Leeren
      </wa-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { computed, reactive } from "vue"
import type { ColumnFacets, FilterOption, ResolvedColumn } from "./types"

const { t } = useI18n()

const props = defineProps<{
  column: ResolvedColumn
  facets?: ColumnFacets
  modelValue?: unknown
}>()

const emit = defineEmits<{ "update:modelValue": [value: unknown] }>()

const state = reactive({
  optionQuery: "",

  kind: computed((): "text" | "equals" | "range" | "set" => {
    switch (props.column.filterType) {
      case "number-range":
      case "date-range":
        return "range"
      case "set":
      case "includes-any":
      case "includes-all":
        return "set"
      case "equals":
        return "equals"
      default:
        return "text"
    }
  }),
  inputType: computed((): string => (props.column.filterType === "date-range" ? "date" : "number")),
  text: computed((): string => (props.modelValue === undefined ? "" : String(props.modelValue))),
  range: computed((): [unknown, unknown] =>
    Array.isArray(props.modelValue) ? (props.modelValue as [unknown, unknown]) : [undefined, undefined]
  ),
  from: computed((): string => valueToText(state.range[0])),
  to: computed((): string => valueToText(state.range[1])),
  selected: computed((): string[] =>
    Array.isArray(props.modelValue) ? (props.modelValue as unknown[]).map((item) => String(item)) : []
  ),
  options: computed((): FilterOption[] => {
    if (props.column.def.filterOptions) return props.column.def.filterOptions
    return (props.facets?.values ?? []).map((facet) => ({
      value: facet.value,
      count: facet.count,
    }))
  }),
  filteredOptions: computed((): FilterOption[] => {
    const query = state.optionQuery.trim().toLowerCase()
    if (!query) return state.options
    return state.options.filter((option) =>
      String(option.label ?? option.value)
        .toLowerCase()
        .includes(query)
    )
  }),
})

function valueToText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value)
}

function setRange(index: 0 | 1, raw: string): void {
  const next: [unknown, unknown] = [...state.range] as [unknown, unknown]
  next[index] = raw === "" ? undefined : raw
  emit("update:modelValue", next[0] === undefined && next[1] === undefined ? undefined : next)
}

function toggleOption(value: string): void {
  const selected = new Set(state.selected)
  if (selected.has(value)) selected.delete(value)
  else selected.add(value)
  const next = [...selected]
  emit("update:modelValue", next.length ? next : undefined)
}

function clear(): void {
  state.optionQuery = ""
  emit("update:modelValue", undefined)
}
</script>

<style scoped>
.vi-dtf {
  min-inline-size: 15rem;
  max-inline-size: 20rem;
}
.vi-dtf-title {
  font-size: var(--wa-font-size-s);
  font-weight: 700;
}
.vi-dtf-input,
.vi-dtf-search {
  flex: 1 1 auto;
  min-inline-size: 0;
  width: 100%;
}
.vi-dtf-options {
  max-block-size: 14rem;
  overflow: auto;
}
.vi-dtf-option {
  font-size: var(--wa-font-size-s);
  cursor: pointer;
}
.vi-dtf-option-label {
  min-inline-size: 0;
  flex: 1 1 auto;
}
.vi-dtf-count {
  color: var(--wa-color-text-quiet);
  font-variant-numeric: tabular-nums;
}
.vi-dtf-empty,
.vi-dtf-count {
  font-size: var(--wa-font-size-xs);
}
.vi-dtf-empty {
  color: var(--wa-color-text-quiet);
}
</style>
