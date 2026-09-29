<template>
  <!-- Vue-Nachbau von <wa-data-grid> (WebAwesome Pro). Spalten sind Daten,
       Zell-Inhalte kommen aus Slots (`cell:<id>`), veränderlicher Zustand
       läuft über v-model. Alles Weitere steckt in den Composables. -->
  <div
    class="vi-dt"
    :class="[
      `is-size-${size}`,
      `is-${appearance}`,
      {
        'is-striped': striped,
        'is-loading': state.isLoading,
        'is-selectable': selectable !== false && selectOnRowClick,
      },
    ]"
    :style="state.hostStyle"
  >
    <!-- ── Toolbar: Suche + Spaltenmenü ─────────────────────────────── -->
    <div
      v-if="state.showToolbar"
      class="vi-dt-toolbar wa-split wa-gap-s wa-flex-nowrap"
    >
      <div class="wa-cluster wa-gap-xs wa-flex-nowrap">
        <slot name="toolbar-start" />
        <wa-input
          v-if="withSearch"
          class="vi-dt-search"
          size="small"
          appearance="outlined"
          :placeholder="t('dataTable.search')"
          :value="search"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
        >
          <wa-icon
            slot="start"
            name="magnifying-glass"
          ></wa-icon>
        </wa-input>
      </div>
      <div class="wa-cluster wa-gap-xs wa-flex-nowrap">
        <slot name="toolbar-end" />
        <template v-if="withColumnsMenu">
          <wa-button
            :id="`${uid}-columns`"
            class="vi-dt-columns-button"
            size="small"
            appearance="outlined"
          >
            <wa-icon
              slot="start"
              name="table-columns"
            ></wa-icon>
            {{ t("dataTable.columns") }}
          </wa-button>
          <wa-popover
            :for="`${uid}-columns`"
            placement="bottom-end"
            class="vi-dt-columns-menu"
          >
            <div class="wa-stack wa-gap-2xs">
              <label
                v-for="column in state.columns"
                :key="column.id"
                class="vi-dt-colopt wa-flank wa-flex-nowrap wa-gap-xs"
              >
                <input
                  type="checkbox"
                  :checked="layout.isVisible(column)"
                  :disabled="!column.hideable"
                  :data-column="column.id"
                  @change="layout.toggleColumn(column.id)"
                />
                <span class="wa-ellipsis">{{ column.label }}</span>
              </label>
              <wa-button
                class="vi-dt-reset-columns"
                size="small"
                appearance="plain"
                @click="resetColumns"
              >
                {{ t("dataTable.resetColumns") }}
              </wa-button>
            </div>
          </wa-popover>
        </template>
      </div>
    </div>

    <!-- ── Scroll-Bereich: Kopf, Körper, Spaltenfüße ────────────────── -->
    <div
      ref="scrollerEl"
      class="vi-dt-scroller"
      :role="state.gridRole"
      :aria-label="label ?? undefined"
      :aria-rowcount="state.filteredCount"
      :aria-colcount="state.cellColumns.length"
      @scroll.passive="virtual.onScroll"
      @keydown="nav.handleKeydown"
    >
      <div
        class="vi-dt-head"
        role="rowgroup"
      >
        <div
          class="vi-dt-row vi-dt-headrow"
          role="row"
          :style="state.gridStyle"
        >
          <div
            v-for="cell in state.cellColumns"
            :key="cell.key"
            class="vi-dt-cell vi-dt-hcell"
            :class="[
              cell.kind === 'data' ? `is-align-${cell.col!.column.headerAlign}` : 'is-lead',
              {
                'is-sticky': cell.sticky,
                'is-pin-edge': cell.pinEdge,
                'is-pin-start': cell.side === 'start',
                'is-pin-end': cell.side === 'end',
                'is-sortable': cell.kind === 'data' && cell.col!.column.sortable,
                'is-sorted': cell.kind === 'data' && state.sortIndex[cell.col!.column.id] !== undefined,
                'is-dragging': layout.state.dragging?.id === cell.id,
                'is-drop-target': layout.state.dragging?.overId === cell.id && layout.state.dragging?.id !== cell.id,
              },
            ]"
            :style="cellStyle(cell)"
            role="columnheader"
            :data-row="-1"
            :data-col="cell.index"
            :data-column="cell.id"
            :tabindex="nav.isActive(-1, cell.index) ? 0 : -1"
            :aria-sort="ariaSort(cell)"
            :draggable="cell.kind === 'data' && cell.col!.movable ? 'true' : undefined"
            @click="onHeaderClick(cell, $event)"
            @focus="nav.setActive(-1, cell.index, false)"
            @dragstart="onDragStart(cell, $event)"
            @dragover="onDragOver(cell, $event)"
            @dragend="layout.endDrag()"
            @drop.prevent="layout.endDrag()"
          >
            <!-- Auswahl-Kopfzelle: alles auf dieser Seite -->
            <input
              v-if="cell.kind === 'select' && selectable === 'multiple'"
              class="vi-dt-checkbox vi-dt-select-all"
              type="checkbox"
              :aria-label="t('dataTable.selectAllPage')"
              :checked="state.selectAllState === 'checked'"
              :indeterminate.prop="state.selectAllState === 'indeterminate'"
              @click.stop="toggleSelectAll()"
            />

            <template v-if="cell.kind === 'data'">
              <span class="vi-dt-hlabel wa-ellipsis">
                <slot
                  :name="`header:${cell.col!.column.id}`"
                  :column="cell.col!.column"
                >
                  {{ cell.col!.column.label }}
                </slot>
              </span>
              <wa-icon
                v-if="state.sortIndex[cell.col!.column.id] !== undefined"
                class="vi-dt-sort"
                :name="state.sortDirs[cell.col!.column.id] ? 'chevron-down' : 'chevron-up'"
              ></wa-icon>
              <span
                v-if="state.sort.length > 1 && state.sortIndex[cell.col!.column.id] !== undefined"
                class="vi-dt-sortnum"
              >
                {{ state.sortIndex[cell.col!.column.id]! + 1 }}
              </span>
              <wa-button
                v-if="cell.col!.column.filterable"
                :id="filterButtonId(cell.col!.column.id)"
                class="vi-dt-filter-button"
                :class="{ 'is-active': !isEmptyFilter(filterValue(cell.col!.column.id)) }"
                appearance="plain"
                size="small"
                :data-column="cell.col!.column.id"
                :title="t('dataTable.filterFor', { column: cell.col!.column.label })"
              >
                <wa-icon name="filter"></wa-icon>
              </wa-button>
              <wa-dropdown
                v-if="withColumnMenu"
                class="vi-dt-column-menu"
                placement="bottom-end"
              >
                <wa-button
                  slot="trigger"
                  class="vi-dt-column-menu-button"
                  appearance="plain"
                  size="small"
                  :data-column="cell.col!.column.id"
                  :title="t('dataTable.columnOptions')"
                >
                  <wa-icon name="ellipsis-vertical"></wa-icon>
                </wa-button>
                <wa-dropdown-item
                  v-if="cell.col!.column.sortable"
                  @click="applySort(cell.col!.column.id, false)"
                >
                  {{ t("dataTable.sortAsc") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.column.sortable"
                  @click="applySort(cell.col!.column.id, true)"
                >
                  {{ t("dataTable.sortDesc") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.pinnable"
                  @click="pinColumn(cell.col!.column.id, 'start')"
                >
                  {{ t("dataTable.pinLeft") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.pinnable"
                  @click="pinColumn(cell.col!.column.id, 'end')"
                >
                  {{ t("dataTable.pinRight") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.pinnable && cell.col!.pinned"
                  @click="pinColumn(cell.col!.column.id, false)"
                >
                  {{ t("dataTable.unpin") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.resizable"
                  @click="autoSizeColumn(cell.col!.column.id)"
                >
                  {{ t("dataTable.autoSize") }}
                </wa-dropdown-item>
                <wa-dropdown-item
                  v-if="cell.col!.column.hideable"
                  @click="layout.toggleColumn(cell.col!.column.id, false)"
                >
                  {{ t("dataTable.hideColumn") }}
                </wa-dropdown-item>
              </wa-dropdown>
              <wa-icon
                v-if="cell.col!.pinned"
                class="vi-dt-pin"
                name="thumbtack"
                :title="cell.col!.pinned === 'start' ? t('dataTable.pinnedLeft') : t('dataTable.pinnedRight')"
                @click.stop="pinColumn(cell.col!.column.id, false)"
              ></wa-icon>
              <span
                v-if="cell.col!.resizable"
                class="vi-dt-resize"
                :data-column="cell.col!.column.id"
                @pointerdown.stop.prevent="onResizeStart(cell.col!.column.id, $event)"
                @dblclick.stop="autoSizeColumn(cell.col!.column.id)"
              ></span>
            </template>
          </div>
        </div>
      </div>

      <div
        ref="bodyEl"
        class="vi-dt-body"
        role="rowgroup"
        :style="{
          paddingBlockStart: `${virtual.state.padStart}px`,
          paddingBlockEnd: `${virtual.state.padEnd}px`,
        }"
      >
        <template
          v-for="displayRow in virtual.state.windowRows"
          :key="displayRow.key"
        >
          <!-- Detail-Panel: eigene Zeile über die volle Breite -->
          <div
            v-if="displayRow.kind === 'detail'"
            class="vi-dt-detailrow"
            role="row"
            :data-detail="displayRow.key"
          >
            <div
              class="vi-dt-detail"
              role="gridcell"
            >
              <slot
                name="row-detail"
                :row="displayRow.row!"
              />
            </div>
          </div>

          <div
            v-else
            class="vi-dt-row"
            :class="[
              displayRow.kind === 'group' ? 'is-group' : 'is-data',
              {
                'is-selected': displayRow.kind === 'data' && state.selectedSet.has(displayRow.nodeKey),
                'is-odd': displayRow.index % 2 === 1,
                'is-dragging': state.rowDrag?.key === displayRow.nodeKey,
                'is-drop-before': state.rowDrag?.overKey === displayRow.nodeKey && state.rowDrag?.mode === 'before',
                'is-drop-after': state.rowDrag?.overKey === displayRow.nodeKey && state.rowDrag?.mode === 'after',
                'is-drop-inside':
                  (state.rowDrag?.overKey === displayRow.nodeKey && state.rowDrag?.mode === 'inside') ||
                  (dragSession?.state.over?.container === dragSource &&
                    dragSession?.state.over?.key === displayRow.nodeKey),
              },
              rowClass?.(displayRow.row!) || '',
            ]"
            role="row"
            :style="state.gridStyle"
            :data-key="displayRow.key"
            @dblclick="onRowDoubleClick(displayRow, $event)"
            :aria-selected="
              selectable !== false && displayRow.kind === 'data' ? state.selectedSet.has(displayRow.nodeKey) : undefined
            "
            :aria-level="state.isTree ? displayRow.depth + 1 : undefined"
            :aria-expanded="displayRow.expandable ? displayRow.expanded : undefined"
          >
            <div
              v-for="cell in state.cellColumns"
              :key="cell.key"
              class="vi-dt-cell"
              :class="[
                cell.kind === 'data' ? `is-align-${cell.col!.column.align}` : 'is-lead',
                cell.kind === 'data' ? cellClass(cell, displayRow) : '',
                {
                  'is-tree-cell': state.isTree && cell.index === state.firstDataCellIndex,
                  'is-child': displayRow.depth > 0,
                  'is-sticky': cell.sticky,
                  'is-pin-edge': cell.pinEdge,
                  'is-pin-start': cell.side === 'start',
                  'is-pin-end': cell.side === 'end',
                },
              ]"
              :style="[cellStyle(cell), indentStyle(cell, displayRow)]"
              role="gridcell"
              :data-row="state.rowIndexOf[displayRow.key]"
              :data-col="cell.index"
              :data-column="cell.id"
              :tabindex="nav.isActive(state.rowIndexOf[displayRow.key]!, cell.index) ? 0 : -1"
              @focus="nav.setActive(state.rowIndexOf[displayRow.key]!, cell.index, false)"
              @mousedown="onCellMouseDown($event)"
              @click="onCellClick(displayRow, cell, $event)"
              @contextmenu="onCellContextMenu(displayRow, cell, $event)"
            >
              <!-- Ziehgriff der festen Reihenfolge -->
              <span
                v-if="cell.kind === 'order' && displayRow.kind === 'data'"
                class="vi-dt-grip"
                :class="{ 'is-disabled': !state.orderActive }"
                :title="state.orderActive ? t('dataTable.dragToReorder') : t('dataTable.reorderDisabled')"
                :aria-hidden="!state.orderActive"
                @pointerdown.prevent="beginRowDrag(displayRow, $event)"
              >
                <wa-icon name="grip-vertical"></wa-icon>
              </span>

              <!-- Auswahl -->
              <input
                v-if="cell.kind === 'select' && selectable !== false"
                class="vi-dt-checkbox"
                :type="selectable === 'single' ? 'radio' : 'checkbox'"
                :aria-label="t('dataTable.selectRow', { row: displayRow.index + 1 })"
                :checked="state.rowSelection[displayRow.key] === 'checked'"
                :indeterminate.prop="state.rowSelection[displayRow.key] === 'indeterminate'"
                :disabled="displayRow.kind === 'data' && !canSelect(displayRow.row!)"
                @click.stop="onSelectRow(displayRow, $event as MouseEvent)"
              />

              <!-- Aufklapp-Spalte (Baum, Gruppen, Detail-Panels) -->
              <template v-if="cell.kind === 'expand'">
                <wa-button
                  v-if="displayRow.expandable"
                  class="vi-dt-expand"
                  appearance="plain"
                  size="small"
                  :aria-expanded="displayRow.expanded"
                  :aria-label="displayRow.expanded ? 'Zeile einklappen' : 'Zeile ausklappen'"
                  @click.stop="toggleExpand(displayRow)"
                >
                  <wa-icon :name="displayRow.expanded ? 'chevron-down' : 'chevron-right'"></wa-icon>
                </wa-button>
              </template>

              <!-- Gruppenzeile: Wert + Anzahl in der ersten Datenspalte, sonst Aggregate -->
              <template v-else-if="displayRow.kind === 'group' && cell.kind === 'data'">
                <template v-if="cell.index === state.firstDataCellIndex">
                  <slot
                    name="group"
                    :group="displayRow.node"
                  >
                    <span class="vi-dt-group-value wa-ellipsis">{{ groupLabel(displayRow) }}</span>
                    <span class="vi-dt-group-count">{{ displayRow.node!.groupCount }}</span>
                  </slot>
                </template>
                <span
                  v-else
                  class="vi-dt-aggregate wa-ellipsis"
                >
                  {{ aggregateText(cell, displayRow) }}
                </span>
              </template>

              <!-- Datenzelle -->
              <template v-else-if="cell.kind === 'data'">
                <!-- Baumdaten: Führungslinien, dann Pfeil (oder Platzhalter). Je
                     Ebene ein Feld — nur dort, wo unter dem Vorfahren noch ein
                     Geschwister folgt, wird auch eine Linie gezeichnet. -->
                <template v-if="state.isTree && cell.index === state.firstDataCellIndex">
                  <!-- Durchlauf-Spalten … -->
                  <span
                    v-for="(line, level) in displayRow.ancestorLines"
                    :key="level"
                    class="vi-dt-guide"
                    :class="{ 'is-line': line }"
                    aria-hidden="true"
                  ></span>
                  <!-- … und der eigene Winkel. -->
                  <span
                    v-if="displayRow.depth > 0"
                    class="vi-dt-guide"
                    :class="displayRow.isLastChild ? 'is-corner' : 'is-tee'"
                    aria-hidden="true"
                  ></span>
                  <wa-button
                    v-if="displayRow.expandable"
                    class="vi-dt-expand"
                    :class="{ 'is-empty': isEmptyBranch(displayRow) }"
                    appearance="plain"
                    size="small"
                    :disabled="isEmptyBranch(displayRow) || undefined"
                    :aria-expanded="displayRow.expanded"
                    :aria-busy="isLoadingChildren(displayRow.row)"
                    :aria-label="
                      isEmptyBranch(displayRow)
                        ? t('dataTable.noChildren')
                        : displayRow.expanded
                          ? t('dataTable.collapseRow')
                          : t('dataTable.expandRow')
                    "
                    @click.stop="toggleExpand(displayRow)"
                  >
                    <wa-spinner
                      v-if="isLoadingChildren(displayRow.row)"
                      class="vi-dt-expand-spinner"
                    ></wa-spinner>
                    <wa-icon
                      v-else
                      :name="displayRow.expanded ? 'chevron-down' : 'chevron-right'"
                    ></wa-icon>
                  </wa-button>
                  <!-- Blatt: derselbe Abstand wie zwischen Pfeil und Linien. -->
                  <span
                    v-else
                    class="vi-dt-leaf-gap"
                    aria-hidden="true"
                  ></span>
                </template>
                <slot
                  :name="`cell:${cell.col!.column.id}`"
                  :row="displayRow.row!"
                  :value="cell.col!.column.get(displayRow.row!)"
                  :column="cell.col!.column"
                  :index="displayRow.index"
                >
                  <span
                    v-if="cell.col!.column.def.badge && badgesFor(cell.col!.column, displayRow.row!)"
                    class="vi-dt-badges"
                  >
                    <span
                      v-for="(badge, badgeIndex) in badgesFor(cell.col!.column, displayRow.row!)"
                      :key="badgeIndex"
                      class="vi-dt-badge"
                      :style="{ '--dt-badge-color': badge.color }"
                    >
                      {{ badge.label }}
                    </span>
                  </span>
                  <span
                    v-else
                    class="wa-ellipsis"
                    :title="cell.col!.column.text(displayRow.row!)"
                  >
                    {{ cell.col!.column.text(displayRow.row!) }}
                  </span>
                </slot>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- Spaltenfüße, am unteren Rand des Scroll-Bereichs -->
      <div
        v-if="state.hasColumnFooters"
        class="vi-dt-foot"
        role="rowgroup"
      >
        <div
          class="vi-dt-row vi-dt-footrow"
          role="row"
          :style="state.gridStyle"
        >
          <div
            v-for="cell in state.cellColumns"
            :key="cell.key"
            class="vi-dt-cell vi-dt-footcell"
            :class="[
              cell.kind === 'data' ? `is-align-${cell.col!.column.align}` : 'is-lead',
              {
                'is-sticky': cell.sticky,
                'is-pin-edge': cell.pinEdge,
                'is-pin-start': cell.side === 'start',
                'is-pin-end': cell.side === 'end',
              },
            ]"
            :style="cellStyle(cell)"
            role="gridcell"
            :data-column="cell.id"
          >
            <template v-if="cell.kind === 'data'">
              <slot
                :name="`footer:${cell.col!.column.id}`"
                :rows="state.footerRows"
              >
                <span class="wa-ellipsis">{{ state.footerText[cell.col!.column.id] ?? "" }}</span>
              </slot>
            </template>
          </div>
        </div>
      </div>

      <!-- Leer / keine Treffer -->
      <div
        v-if="state.showEmpty"
        class="vi-dt-state"
      >
        <slot name="empty">
          <div class="wa-stack wa-gap-2xs wa-align-items-center">
            <wa-icon name="table-cells"></wa-icon>
            <span>{{ t("dataTable.noData") }}</span>
          </div>
        </slot>
      </div>
      <div
        v-else-if="state.showNoResults"
        class="vi-dt-state"
      >
        <slot name="no-results">
          <div class="wa-stack wa-gap-2xs wa-align-items-center">
            <wa-icon name="magnifying-glass"></wa-icon>
            <span>{{ t("dataTable.noResults") }}</span>
          </div>
        </slot>
      </div>

      <!-- Ladeschleier (Server-Modus) -->
      <div
        v-if="state.isLoading"
        class="vi-dt-loading"
      >
        <slot name="loading"><wa-spinner class="vi-dt-spinner"></wa-spinner></slot>
      </div>
    </div>

    <!-- ── Nachladen (Cursor-Quellen) ───────────────────────────────── -->
    <div
      v-if="state.cursorMode"
      class="vi-dt-more wa-split wa-gap-s wa-flex-nowrap"
    >
      <span class="vi-dt-moreinfo">{{ state.loadedText }}</span>
      <div class="wa-cluster wa-gap-2xs wa-flex-nowrap">
        <!-- Platz für Aufrufer-Inhalte in der Leiste (z.B. Reload-Action). -->
        <slot name="cursor-start" />
        <select
          class="vi-dt-pagesize"
          :aria-label="t('dataTable.perPageAria')"
          :value="pageSize"
          @change="onCursorPageSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="option in state.cursorPageSizes"
            :key="option"
            :value="option"
          >
            {{ t("dataTable.perPage", { count: option }) }}
          </option>
        </select>
        <template v-if="hasMore">
          <wa-button
            class="vi-dt-more-btn"
            size="small"
            appearance="outlined"
            :loading="state.isLoading || undefined"
            @click="emit('load-more', { pages: 1, pageSize })"
          >
            {{ loadMoreLabel ?? t("dataTable.loadMore") }}
          </wa-button>
          <wa-button
            v-for="pages in loadMorePages"
            :key="pages"
            size="small"
            appearance="outlined"
            :disabled="state.isLoading || undefined"
            :title="t('dataTable.loadPages', { pages })"
            @click="emit('load-more', { pages, pageSize })"
          >
            +{{ pages }}
          </wa-button>
          <wa-button
            size="small"
            appearance="outlined"
            :disabled="state.isLoading || undefined"
            @click="emit('load-more', { pages: 'all', pageSize })"
          >
            {{ loadAllLabel ?? t("dataTable.loadAll") }}
          </wa-button>
        </template>
        <slot name="cursor-end" />
      </div>
    </div>

    <!-- ── Pager ────────────────────────────────────────────────────── -->
    <div
      v-if="paginate"
      class="vi-dt-pager wa-split wa-gap-s wa-flex-nowrap"
    >
      <span class="vi-dt-pageinfo">
        {{
          t("dataTable.pageInfo", {
            rows: state.filteredCount,
            page: page + 1,
            pages: state.pageCount,
          })
        }}
      </span>
      <div class="wa-cluster wa-gap-2xs wa-flex-nowrap">
        <select
          class="vi-dt-pagesize"
          :aria-label="t('dataTable.rowsPerPageAria')"
          :value="pageSize"
          @change="setPageSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="option in pageSizeOptions"
            :key="option"
            :value="option"
          >
            {{ t("dataTable.perPage", { count: option }) }}
          </option>
        </select>
        <wa-button
          class="vi-dt-first"
          size="small"
          appearance="outlined"
          :disabled="page === 0 || undefined"
          :title="t('dataTable.firstPage')"
          @click="setPage(0)"
        >
          <wa-icon name="angles-left"></wa-icon>
        </wa-button>
        <wa-button
          class="vi-dt-prev"
          size="small"
          appearance="outlined"
          :disabled="page === 0 || undefined"
          :title="t('dataTable.prevPage')"
          @click="setPage(page - 1)"
        >
          <wa-icon name="chevron-left"></wa-icon>
        </wa-button>
        <wa-button
          class="vi-dt-next"
          size="small"
          appearance="outlined"
          :disabled="page >= state.pageCount - 1 || undefined"
          :title="t('dataTable.nextPage')"
          @click="setPage(page + 1)"
        >
          <wa-icon name="chevron-right"></wa-icon>
        </wa-button>
        <wa-button
          class="vi-dt-last"
          size="small"
          appearance="outlined"
          :disabled="page >= state.pageCount - 1 || undefined"
          :title="t('dataTable.lastPage')"
          @click="setPage(state.pageCount - 1)"
        >
          <wa-icon name="angles-right"></wa-icon>
        </wa-button>
      </div>
    </div>

    <!-- Filter-Popover je sichtbarer filterbarer Spalte (nach ihren Ankern!) -->
    <wa-popover
      v-for="column in state.filterColumns"
      :key="column.id"
      class="vi-dt-filter-panel"
      :for="filterButtonId(column.id)"
      placement="bottom-start"
    >
      <ColumnFilterPanel
        :column="column"
        :facets="state.facets[column.id]"
        :model-value="filterValue(column.id)"
        @update:model-value="setFilter(column.id, $event)"
      />
    </wa-popover>

    <span
      class="vi-dt-live"
      aria-live="polite"
    >
      {{ state.announcement }}
    </span>
  </div>
</template>

<script setup lang="ts" generic="R extends Row">
import { useI18n } from "vue-i18n"
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch, shallowRef } from "vue"
import ColumnFilterPanel from "./ColumnFilterPanel.vue"
import { useColumnLayout, type LayoutColumn } from "./useColumnLayout"
import { useGridNavigation } from "./useGridNavigation"
import { useVirtualRows } from "./useVirtualRows"
import { DRAG_SESSION } from "../Browser/dragSession"
import { aggregateColumn, defaultText, findColumn, isEmptyFilter, nextSortState, resolveColumns } from "./columns"
import {
  buildRows,
  collectKeys,
  flattenNodes,
  isDescendant,
  locateNode,
  nestByParent,
  orderValueFor,
  paginateNodes,
  selectionStateFor,
  type BuiltRows,
  type ChildRowsAccessor,
  type NestedTree,
  type SelectionState,
  type NodeLocation,
} from "./rows"
import type {
  ColumnFacets,
  DataTableColumn,
  DataTableRequest,
  DataTableResponse,
  DataTableState,
  DisplayRow,
  FilterEntry,
  PinSide,
  ResolvedColumn,
  Row,
  RowKey,
  RowNode,
  SortEntry,
  CellBadge,
} from "./types"

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn<R>[]
    data?: R[]
    /** Feld mit stabiler Zeilen-id — für Auswahl über Sortierung/Seiten hinweg. */
    rowKey?: string | null
    label?: string | null
    selectable?: false | "single" | "multiple"
    selectableRows?: ((row: R) => boolean) | null
    /** Bei aktiver Auswahl wählt ein Linksklick auf die Zeile den Eintrag (Shift: Bereich). */
    selectOnRowClick?: boolean
    /**
     * Nachlade-Baum (`loadChildren`) bei jedem Datenwechsel von außen
     * zurücksetzen (Pfeile zu, Kinder-Cache leer). Standard false: ein Drop
     * bleibt eine rein lokale Verschiebung und nichts klappt ungefragt zu —
     * zurückgesetzt wird nur über `reload()` / `resetTree()`.
     */
    resetTreeOnDataChange?: boolean
    /** Container-Id dieser Tabelle in einer umgebenden Drag-Session (Browser). */
    dragSource?: string
    striped?: boolean
    size?: "xs" | "s" | "m" | "l" | "xl"
    appearance?: "outlined" | "plain"
    withSearch?: boolean
    withColumnsMenu?: boolean
    withColumnMenu?: boolean
    resizable?: boolean
    reorderable?: boolean
    pinnable?: boolean
    paginate?: boolean
    pageSizeOptions?: number[]
    groupBy?: string | string[] | null
    childRows?: string | ((row: R) => R[] | undefined | null) | null
    /**
     * Feld mit dem Verweis auf die Elternzeile (ViUR: `parententry`). Damit
     * baut die Komponente aus einer FLACHEN Liste selbst den Baum — `rowKey`
     * ist dafür Pflicht. Bereits verschachtelte Daten laufen weiter über
     * `childRows`, das dann Vorrang hat.
     */
    parentField?: string | null
    /**
     * Kinder einer Ebene bei Bedarf nachladen (ViUR: `list` mit `parententry`).
     * Gesetzt heißt: JEDE Datenzeile bekommt einen Aufklapp-Pfeil, weil vorher
     * unbekannt ist, ob es Kinder gibt. Nach dem Laden bleibt der Pfeil stehen
     * und wird deaktiviert, wenn nichts kam — so springt das Layout nicht.
     */
    loadChildren?: ((row: R) => Promise<R[]>) | null
    /**
     * Weiß die Anwendung vorab, ob eine Zeile Kinder haben KANN (in ViUR etwa
     * `node` vs. `leaf`), dann hier melden: `false` → gar kein Pfeil,
     * `true`/`undefined` → Pfeil, geladen wird beim Aufklappen.
     */
    rowHasChildren?: ((row: R) => boolean | undefined) | null
    filterFromLeafRows?: boolean
    /** Zeilen bekommen ein Detail-Panel (Inhalt: Slot `row-detail`). */
    rowDetail?: boolean
    rowClass?: ((row: R) => string | null | undefined) | null
    /**
     * Feld mit der numerischen Reihenfolge (ViUR: "sortindex"). Gesetzt heißt:
     * die Tabelle ist fest danach sortiert und die Zeilen lassen sich per
     * Ziehen umsortieren — die Komponente meldet den neuen Wert über
     * `row-reorder`, gespeichert wird außerhalb.
     */
    orderField?: string | null
    /** Abstand für neue Werte am Anfang/Ende der Liste. */
    orderStep?: number
    sortDescFirst?: boolean
    withoutSortRemoval?: boolean
    maxMultiSort?: number
    searchFn?: ((value: unknown, term: string, row: R) => boolean) | null
    /** Server-Modus ohne Callback: die Komponente meldet `data-request`. */
    /**
     * Cursor-Quellen (z. B. ViUR-Listen) laden vorwärts nach statt Seiten zu
     * springen. Ist `hasMore` gesetzt (auch `false`), erscheint statt des Pagers
     * eine Leiste mit „Mehr laden"; das Laden macht der Aufrufer auf `load-more`.
     */
    hasMore?: boolean | null
    loadMoreLabel?: string | null
    loadAllLabel?: string | null
    /** Schnellwahl „die nächsten N Seiten laden" in der Cursor-Leiste. */
    loadMorePages?: number[]
    /** Seitengrößen der Cursor-Leiste (ViUR: limit, maximal 99). */
    cursorPageSizes?: number[]
    server?: boolean
    dataSource?: ((request: DataTableRequest) => Promise<DataTableResponse<R>>) | null
    total?: number
    loading?: boolean
    filterDebounce?: number
    /** true/false erzwingen, "auto" ab `virtualizeThreshold` Zeilen. */
    virtualize?: boolean | "auto"
    virtualizeThreshold?: number
    rowHeight?: number
    /**
     * Deckel für den Scrollbereich. OHNE Angabe greift der CSS-Vorgabewert
     * `--dt-max-height: 30rem` — dadurch bleibt die Variable von aussen
     * ueberschreibbar (z. B. `--dt-max-height: none`, damit die Tabelle eine
     * Flaeche fuellt). Ein gesetzter Wert steht inline und gewinnt.
     */
    maxHeight?: string
  }>(),
  {
    data: () => [],
    rowKey: null,
    label: null,
    selectable: false,
    selectableRows: null,
    selectOnRowClick: true,
    resetTreeOnDataChange: false,
    dragSource: "list",
    striped: false,
    size: "m",
    appearance: "outlined",
    withSearch: false,
    withColumnsMenu: false,
    withColumnMenu: false,
    resizable: false,
    reorderable: false,
    pinnable: false,
    paginate: false,
    pageSizeOptions: () => [10, 20, 50, 100],
    groupBy: null,
    childRows: null,
    parentField: null,
    loadChildren: null,
    rowHasChildren: null,
    filterFromLeafRows: false,
    rowDetail: false,
    rowClass: null,
    orderField: null,
    orderStep: 1,
    sortDescFirst: false,
    withoutSortRemoval: false,
    maxMultiSort: 0,
    searchFn: null,
    hasMore: null,
    loadMoreLabel: null,
    loadAllLabel: null,
    loadMorePages: () => [5, 10],
    cursorPageSizes: () => [10, 30, 50, 99],
    server: false,
    dataSource: null,
    total: undefined,
    loading: undefined,
    filterDebounce: 250,
    virtualize: "auto",
    virtualizeThreshold: 60,
    rowHeight: 44,
    // Kein Default: siehe maxHeight oben — der Deckel kommt aus dem CSS.
    maxHeight: undefined,
  }
)

// Zustand, den außen mitgeführt werden kann — je ein v-model.
const sort = defineModel<SortEntry[]>("sort", { default: () => [] })
const filters = defineModel<FilterEntry[]>("filters", { default: () => [] })
const search = defineModel<string>("search", { default: "" })
const selectedKeys = defineModel<RowKey[]>("selectedKeys", { default: () => [] })
const expandedKeys = defineModel<RowKey[]>("expandedKeys", { default: () => [] })
const page = defineModel<number>("page", { default: 0 })
const pageSize = defineModel<number>("pageSize", { default: 20 })

const emit = defineEmits<{
  "cell-click": [payload: { column: string; value: unknown; row: R; index: number }]
  /** Doppelklick auf eine Datenzeile — typisch zum Öffnen des Datensatzes. */
  "row-dblclick": [payload: { key: RowKey; row: R; index: number; originalEvent: MouseEvent }]
  "cell-contextmenu": [payload: { column: string; value: unknown; row: R; index: number; originalEvent: MouseEvent }]
  "sort-change": [sort: SortEntry[]]
  "filter-change": [payload: { search: string; filters: FilterEntry[] }]
  "row-select": [payload: { selectedKeys: RowKey[]; rows: R[] }]
  "row-expand": [payload: { key: RowKey; row?: R }]
  "row-collapse": [payload: { key: RowKey; row?: R }]
  "column-move": [payload: { columnOrder: string[]; finished: boolean }]
  "column-resize": [payload: { column: string; width: number; finished: boolean }]
  "column-pin": [payload: { column: string; side: PinSide | false }]
  "column-visibility-change": [payload: { column: string; visible: boolean }]
  "page-change": [payload: { page: number; pageSize: number }]
  "row-reorder": [
    payload: {
      row: R
      key: RowKey
      /** Neuer Wert für das Feld aus `orderField`. */
      order: number
      /** Neue Elternzeile (Baum); null = oberste Ebene. */
      parent: RowKey | null
      /** true, wenn sich der Elternteil geändert hat (dann `move` statt `edit`). */
      parentChanged: boolean
      /** Position unter den neuen Geschwistern. */
      toIndex: number
      /** Nachbarn tragen denselben Wert — die Liste sollte neu durchnummeriert werden. */
      needsReindex: boolean
    },
  ]
  "load-more": [payload: { pages: number | "all"; pageSize: number }]
  "data-request": [request: DataTableRequest]
  "data-error": [payload: { error: unknown; request: DataTableRequest }]
  "children-error": [payload: { error: unknown; key: RowKey; row: R }]
}>()

const uid = useId()

// DOM-Refs (erlaubte Ausnahme).
const scrollerEl = ref<HTMLElement>()
const bodyEl = ref<HTMLElement>()

// Nicht-reaktive Interna.
let headerObserver: ResizeObserver | undefined
let detailObserver: ResizeObserver | undefined
let debounceTimer = 0
let abortController: AbortController | undefined
let lastSelectedIndex: number | null = null

// Umschließende Drag-Session (Browser): erlaubt, Zeilen AUSSERHALB der Tabelle
// fallen zu lassen (Navigations-Baum, Ordnerzeilen). Ohne Browser: null.
const dragSession = inject(DRAG_SESSION, null)

const { t } = useI18n()

/**
 * Optimistische Verschiebungen (Drag & Drop / Alt+Pfeil): rowKey → neuer
 * Ordnungswert und ggf. neuer Elternteil. Damit verschwindet die Zeile sofort
 * an ihrer alten Stelle und taucht am Ziel (auch IN einem Ordner) auf, ohne
 * auf das Speichern und Neuladen zu warten. Sobald der Aufrufer neue Daten
 * liefert (props.data / Server-Antwort), werden die Überlagerungen verworfen —
 * dann gilt wieder allein der Datenbestand.
 */
const moveOverrides = shallowRef(new Map<RowKey, { order: number; parent?: RowKey | null }>())

/**
 * Optimistische Verschiebungen im NACHLADE-Modus (`loadChildren`): dort leben
 * die Kinder nicht in `props.data`, sondern im Cache `state.loadedChildren` —
 * eine Verschiebung nimmt die Zeile daher direkt aus dem Quell-Bucket und
 * setzt eine Kopie in den Ziel-Bucket. Für die oberste Ebene (props.data darf
 * nicht mutiert werden) gibt es eine Ausblendliste und eingefügte Kopien.
 * Beides wird — wie moveOverrides — verworfen, sobald neue Daten kommen.
 */
const lazyMoves = shallowRef({ hidden: new Set<RowKey>(), injected: [] as R[] })

const LEAD_WIDTH = 44
const ORDER_WIDTH = 36

/** Ablegen: davor, dahinter oder hinein (wie admin4). */
type DropMode = "before" | "after" | "inside"

interface CellColumn {
  key: string
  index: number
  kind: "select" | "expand" | "data" | "order"
  id: string
  sticky: boolean
  side: PinSide | null
  offset: number
  pinEdge: boolean
  col?: LayoutColumn<R>
}

const layout = useColumnLayout<R>({
  columns: () => cols(),
  resizable: () => props.resizable,
  reorderable: () => props.reorderable,
  pinnable: () => props.pinnable,
  onResize: (column, width, finished) => emit("column-resize", { column, width, finished }),
  onMove: (columnOrder, finished) => emit("column-move", { columnOrder, finished }),
  onPin: (column, side) => emit("column-pin", { column, side }),
  onVisibilityChange: (column, visible) => emit("column-visibility-change", { column, visible }),
})

const state = reactive({
  /** Server-Modus: Zeilen und Gesamtzahl aus der letzten Antwort. */
  serverRows: [] as R[],
  serverTotal: -1,
  fetching: false,
  announcement: "",

  columns: computed((): ResolvedColumn<R>[] => resolveColumns(props.columns)),

  groupByList: computed((): string[] => {
    const value = props.groupBy
    if (!value) return []
    return (Array.isArray(value) ? value : value.split(/[\s,]+/)).filter(Boolean)
  }),

  isServer: computed((): boolean => props.server || Boolean(props.dataSource)),

  /**
   * Hierarchie aus einer flachen Liste (parentField). Null, sobald die Daten
   * schon verschachtelt sind oder die Voraussetzungen fehlen.
   */
  nested: computed((): NestedTree<R> | null => {
    if (props.childRows || !props.parentField) return null
    if (!props.rowKey) {
      console.warn("[DataTable] `parent-field` braucht `row-key`, um Eltern und Kinder zu verbinden")
      return null
    }
    return nestByParent(state.rows as R[], props.rowKey, props.parentField)
  }),

  /**
   * Zugriff auf die Kinder: aus `childRows`, aus dem gebauten Baum
   * (`parentField`) und/oder aus den nachgeladenen Ebenen — in dieser
   * Reihenfolge zusammengeführt.
   */
  childAccessor: computed((): ChildRowsAccessor<R> | null => {
    const nested = state.nested as NestedTree<R> | null
    const staticAccess: ChildRowsAccessor<R> | null =
      props.childRows ?? (nested ? (row: R) => nested.children.get(row[props.rowKey!] as RowKey) : null)

    if (!props.loadChildren) return staticAccess

    return (row: R) => {
      const own =
        typeof staticAccess === "function"
          ? staticAccess(row)
          : staticAccess
            ? (row[staticAccess] as R[] | undefined)
            : undefined
      if (own?.length) return own
      return state.loadedChildren[String(rowKeyOf(row))] as R[] | undefined
    }
  }),

  isTree: computed((): boolean => Boolean(state.childAccessor)),
  isLoading: computed((): boolean => props.loading ?? state.fetching),

  /** Nachgeladene Kinder je Zeilenschlüssel (leeres Array = es gibt keine). */
  loadedChildren: {} as Record<string, R[]>,
  /** Zeilen, deren Kinder gerade geladen werden. */
  loadingChildren: {} as Record<string, boolean>,

  /** Laufende Zeilen-Ziehgeste (feste Reihenfolge). */
  rowDrag: null as {
    key: RowKey
    overKey: RowKey | null
    /** Wie admin4: davor, dahinter oder HINEIN (neuer Elternteil). */
    mode: DropMode
  } | null,

  rows: computed((): R[] => {
    let base = props.dataSource ? (state.serverRows as R[]) : props.data
    if (props.rowKey && (lazyMoves.value.hidden.size || lazyMoves.value.injected.length)) {
      const key = props.rowKey
      const { hidden, injected } = lazyMoves.value
      base = base.filter((row) => !hidden.has(row[key] as RowKey)).concat(injected)
    }
    if (moveOverrides.value.size && props.rowKey) {
      const key = props.rowKey
      base = base.map((row) => {
        const override = moveOverrides.value.get(row[key] as RowKey)
        if (!override) return row
        const patched = { ...row }
        if (props.orderField) (patched as Record<string, unknown>)[props.orderField] = override.order
        if (props.parentField && override.parent !== undefined) {
          ;(patched as Record<string, unknown>)[props.parentField] = override.parent
        }
        return patched
      })
    }
    // Feste Reihenfolge: numerisch aufsteigend — auch im SERVER-Modus. Nur so
    // rückt eine per Drag & Drop verschobene Zeile SOFORT an ihren Platz, ohne
    // die Ebene neu zu laden (den neuen Wert liefert moveOverrides oben).
    // Eine aktive Spaltensortierung hat Vorrang: dann ordnet im Client-Modus die
    // Pipeline und im Server-Modus der Server.
    if (!props.orderField || sort.value.length > 0) return base
    const field = props.orderField
    return [...base].sort((a, b) => Number(a[field] ?? 0) - Number(b[field] ?? 0))
  }),

  /**
   * Umsortieren ist nur in der festen Reihenfolge sinnvoll — nicht bei
   * Gruppierung und nicht, während eine Spaltensortierung aktiv ist.
   *
   * Im Server-Modus ist es ausdrücklich erlaubt: die Reihenfolge kommt dort vom
   * Server (`orderby` auf dem Feld), der neue Wert wird aus den Nachbarn
   * berechnet und per `row-reorder` nach außen gemeldet — gespeichert wird
   * ohnehin außerhalb.
   */
  orderActive: computed(
    (): boolean => Boolean(props.orderField) && !state.groupByList.length && sort.value.length === 0
  ),

  sort: computed((): SortEntry[] => sort.value),

  /** Filter/Suche/Sortierung/Gruppierung — im Server-Modus macht das der Server. */
  built: computed(
    (): BuiltRows<R> =>
      buildRows<R>({
        data: (state.nested as NestedTree<R> | null)?.roots ?? (state.rows as R[]),
        columns: state.columns,
        sort: state.isServer ? [] : sort.value,
        filters: state.isServer ? [] : filters.value,
        search: state.isServer ? "" : search.value,
        searchFn: props.searchFn,
        childRows: state.childAccessor as ChildRowsAccessor<R> | null,
        filterFromLeafRows: props.filterFromLeafRows,
        groupBy: state.groupByList,
        rowKey: props.rowKey,
      })
  ),

  /** Cursor-Modus: der Aufrufer steuert das Nachladen (siehe hasMore). */
  cursorMode: computed((): boolean => props.hasMore !== null && props.hasMore !== undefined),
  /** Seitengrößen der Cursor-Leiste — die aktuelle Größe ist immer wählbar. */
  cursorPageSizes: computed((): number[] => {
    const options = new Set(props.cursorPageSizes)
    options.add(pageSize.value)
    return [...options].sort((a, b) => a - b)
  }),
  /** „N Einträge" bzw. „N von M" — M nur, wenn der Server eine Gesamtzahl kennt. */
  loadedText: computed((): string => {
    const loaded = state.rows.length
    // Lokale Suche/Filter aktiv: die Zahl der TREFFER zeigen, nicht den
    // Ladezähler — sonst wirkt die Leiste, als wäre nichts gefiltert.
    if (!state.isServer && state.filteredCount !== loaded) {
      return t("dataTable.filteredOf", { filtered: state.filteredCount, loaded })
    }
    const total = props.total ?? (state.serverTotal >= 0 ? state.serverTotal : -1)
    if (total >= 0 && total !== loaded) return t("dataTable.loadedOf", { loaded, total })
    if (loaded === 1) return t("dataTable.loadedOne")
    return t("dataTable.loaded", { loaded })
  }),

  facets: computed((): Record<string, ColumnFacets> => state.built.facets),

  filteredCount: computed((): number =>
    state.isServer ? (props.total ?? state.serverTotal ?? state.rows.length) : state.built.filteredCount
  ),

  pageCount: computed((): number => {
    if (!props.paginate) return 1
    const total = state.filteredCount
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize.value)))
  }),

  pagedNodes: computed((): RowNode<R>[] =>
    props.paginate && !state.isServer ? paginateNodes(state.built.nodes, page.value, pageSize.value) : state.built.nodes
  ),

  expandedSet: computed((): Set<RowKey> => new Set(expandedKeys.value)),
  selectedSet: computed((): Set<RowKey> => new Set(selectedKeys.value)),

  displayRows: computed((): DisplayRow<R>[] =>
    flattenNodes(state.pagedNodes as RowNode<R>[], {
      isExpanded: (key) => state.expandedSet.has(key),
      withDetail: props.rowDetail,
      // Beim Nachladen ist vorher unbekannt, ob eine Zeile Kinder hat: Pfeil
      // zeigen, solange das Gegenteil nicht feststeht.
      mayHaveChildren: props.loadChildren
        ? (node) => node.kind === "data" && Boolean(node.row) && childState(node.row!) !== "none"
        : undefined,
    })
  ),

  /** Index in der Renderliste je Zeilenschlüssel — für Tastatur und Fokus. */
  rowIndexOf: computed((): Record<string, number> => {
    const map: Record<string, number> = {}
    state.displayRows.forEach((row, index) => {
      map[row.key] = index
    })
    return map
  }),

  dataDisplayRows: computed((): DisplayRow<R>[] => state.displayRows.filter((row) => row.kind === "data")),

  rowSelection: computed((): Record<string, SelectionState> => {
    const map: Record<string, SelectionState> = {}
    for (const row of state.displayRows) {
      if (row.kind === "detail" || !row.node) continue
      map[row.key] =
        row.kind === "data" && !row.node.children.length
          ? state.selectedSet.has(row.nodeKey)
            ? "checked"
            : "unchecked"
          : selectionStateFor(row.node, state.selectedSet)
    }
    return map
  }),

  selectAllState: computed((): SelectionState => {
    const keys = selectableKeysOnPage()
    if (!keys.length) return "unchecked"
    const hits = keys.filter((key) => state.selectedSet.has(key)).length
    return hits === 0 ? "unchecked" : hits === keys.length ? "checked" : "indeterminate"
  }),

  sortIndex: computed((): Record<string, number | undefined> => {
    const map: Record<string, number | undefined> = {}
    sort.value.forEach((entry, index) => {
      map[entry.id] = index
    })
    return map
  }),
  sortDirs: computed((): Record<string, boolean> => {
    const map: Record<string, boolean> = {}
    for (const entry of sort.value) map[entry.id] = entry.desc
    return map
  }),

  /** Führende Spalten (Auswahl, Aufklappen) plus die sichtbaren Datenspalten. */
  cellColumns: computed((): CellColumn[] => {
    const cells: CellColumn[] = []
    let lead = 0
    if (props.orderField) {
      cells.push({
        key: "__order",
        index: cells.length,
        kind: "order",
        id: "__order",
        sticky: true,
        side: "start",
        offset: lead,
        pinEdge: false,
      })
      lead += ORDER_WIDTH
    }
    if (props.selectable !== false) {
      cells.push({
        key: "__select",
        index: cells.length,
        kind: "select",
        id: "__select",
        sticky: true,
        side: "start",
        offset: lead,
        pinEdge: false,
      })
      lead += LEAD_WIDTH
    }
    if (state.hasExpandColumn) {
      cells.push({
        key: "__expand",
        index: cells.length,
        kind: "expand",
        id: "__expand",
        sticky: true,
        side: "start",
        offset: lead,
        pinEdge: false,
      })
      lead += LEAD_WIDTH
    }
    for (const col of layout.state.visibleColumns as LayoutColumn<R>[]) {
      cells.push({
        key: col.column.id,
        index: cells.length,
        kind: "data",
        id: col.column.id,
        sticky: Boolean(col.pinned),
        side: col.pinned || null,
        offset: col.pinned === "start" ? col.offset + lead : col.offset,
        pinEdge: col.pinEdge,
        col,
      })
    }
    return cells
  }),

  firstDataCellIndex: computed((): number => state.cellColumns.find((cell) => cell.kind === "data")?.index ?? 0),

  /**
   * Eigene Aufklapp-Spalte nur für Gruppen und Detail-Panels. Bei Baumdaten
   * sitzt der Pfeil IN der ersten Datenspalte — nur dort rückt er mit der Ebene
   * ein, und genau das macht die Hierarchie sichtbar.
   */
  hasExpandColumn: computed((): boolean => Boolean(props.rowDetail || state.groupByList.length)),

  gridStyle: computed((): Record<string, string> => {
    const tracks: string[] = []
    if (props.orderField) tracks.push(`${ORDER_WIDTH}px`)
    if (props.selectable !== false) tracks.push(`${LEAD_WIDTH}px`)
    if (state.hasExpandColumn) tracks.push(`${LEAD_WIDTH}px`)
    for (const col of layout.state.visibleColumns as LayoutColumn<R>[]) tracks.push(col.track)
    return { gridTemplateColumns: tracks.join(" ") }
  }),

  hostStyle: computed((): Record<string, string> => {
    const style: Record<string, string> = { "--dt-row-height": `${props.rowHeight}px` }
    // Nur setzen, wenn angegeben — sonst bliebe der Inline-Wert gegen jede
    // Regel von aussen stehen und `--dt-max-height` waere keine Variable mehr.
    if (props.maxHeight) style["--dt-max-height"] = props.maxHeight
    return style
  }),

  gridRole: computed((): string => (state.isTree ? "treegrid" : "grid")),

  // Panel-Props sind nicht generisch — hier auf die Basisform bringen.
  filterColumns: computed((): ResolvedColumn[] =>
    (layout.state.visibleColumns as LayoutColumn<R>[])
      .map((col) => col.column as unknown as ResolvedColumn)
      .filter((column) => column.filterable)
  ),

  footerRows: computed((): R[] => (state.isTree ? state.built.topLevelRows : state.built.dataRows)),

  hasColumnFooters: computed((): boolean =>
    (layout.state.visibleColumns as LayoutColumn<R>[]).some((col) => col.column.def.footer !== undefined)
  ),

  footerText: computed((): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const col of layout.state.visibleColumns as LayoutColumn<R>[]) {
      const footer = col.column.def.footer
      if (footer === undefined) continue
      map[col.column.id] = typeof footer === "function" ? footer(state.footerRows) : footer
    }
    return map
  }),

  virtualizeActive: computed((): boolean =>
    props.virtualize === "auto" ? state.displayRows.length > props.virtualizeThreshold : Boolean(props.virtualize)
  ),

  hasFilterOrSearch: computed(
    (): boolean => Boolean(search.value.trim()) || filters.value.some((filter) => !isEmptyFilter(filter.value))
  ),

  showEmpty: computed((): boolean => !state.displayRows.length && !state.hasFilterOrSearch && !state.isLoading),
  showNoResults: computed((): boolean => !state.displayRows.length && state.hasFilterOrSearch && !state.isLoading),
  showToolbar: computed((): boolean => props.withSearch || props.withColumnsMenu),
})

// reactive() entfaltet die Generics zu `Row`; diese Helfer geben den Zugriffen
// ihren konkreten Typ zurück.
const cols = (): ResolvedColumn<R>[] => state.columns as ResolvedColumn<R>[]
const displayed = (): DisplayRow<R>[] => state.displayRows as DisplayRow<R>[]
const dataRowsOf = (): R[] => state.built.dataRows as R[]
const selectedSetOf = (): Set<RowKey> => state.selectedSet as Set<RowKey>

const virtual = useVirtualRows<R>(scrollerEl, {
  rows: () => displayed(),
  rowHeight: () => props.rowHeight,
  enabled: () => state.virtualizeActive,
})

const nav = useGridNavigation(scrollerEl, {
  rowCount: () => state.displayRows.length,
  colCount: () => state.cellColumns.length,
  pageRows: () => Math.max(1, Math.floor((scrollerEl.value?.clientHeight ?? 400) / props.rowHeight)),
  onHeaderActivate: (col, shift) => {
    const cell = state.cellColumns[col]
    if (cell?.kind === "data") toggleSort(cell.col!.column, shift)
    else if (cell?.kind === "select") toggleSelectAll()
  },
  onCellActivate: (rowIndex, col) => {
    const displayRow = state.displayRows[rowIndex]
    const cell = state.cellColumns[col]
    if (!displayRow) return
    const onTreeCell = state.isTree && cell?.kind === "data" && cell.index === state.firstDataCellIndex
    if (displayRow.expandable && (cell?.kind === "expand" || displayRow.kind === "group" || onTreeCell)) {
      toggleExpand(displayRow)
      return
    }
    if (displayRow.kind === "data" && cell?.kind === "data") {
      emit("cell-click", {
        column: cell.col!.column.id,
        value: cell.col!.column.get(displayRow.row!),
        row: displayRow.row!,
        index: displayRow.index,
      })
    }
  },
  onToggleSelect: (rowIndex) => {
    const displayRow = state.displayRows[rowIndex]
    if (displayRow) toggleRowSelection(displayRow, false)
  },
  onExtendSelection: (rowIndex) => {
    const displayRow = state.displayRows[rowIndex]
    if (displayRow) toggleRowSelection(displayRow, true)
  },
  onSelectAll: () => selectAllOnPage(true),
  onCopy: () => void copySelectedRows(),
  onContextMenu: (rowIndex, col) => {
    const displayRow = state.displayRows[rowIndex]
    const cell = state.cellColumns[col]
    if (displayRow?.kind !== "data" || cell?.kind !== "data") return
    emit("cell-contextmenu", {
      column: cell.col!.column.id,
      value: cell.col!.column.get(displayRow.row!),
      row: displayRow.row!,
      index: displayRow.index,
      originalEvent: new MouseEvent("contextmenu"),
    })
  },
  onMoveRow: (rowIndex, delta) => moveRowByKeyboard(rowIndex, delta),
  onMoveColumn: (col, delta) => {
    const cell = state.cellColumns[col]
    if (cell?.kind === "data" && cell.col!.movable) layout.shiftColumn(cell.col!.column.id, delta)
  },
  onResizeColumn: (col, delta) => {
    const cell = state.cellColumns[col]
    if (cell?.kind !== "data" || !cell.col!.resizable) return
    layout.setWidth(cell.col!.column.id, cell.col!.width + delta)
    emit("column-resize", {
      column: cell.col!.column.id,
      width: cell.col!.width + delta,
      finished: true,
    })
  },
})

// ── Darstellung ──────────────────────────────────────────────────────

function cellStyle(cell: CellColumn): Record<string, string> {
  if (!cell.sticky) return {}
  return cell.side === "end"
    ? { position: "sticky", insetInlineEnd: `${cell.offset}px`, zIndex: "2" }
    : { position: "sticky", insetInlineStart: `${cell.offset}px`, zIndex: "2" }
}

/**
 * Einrückung von Baum- und Gruppenebenen. Sie sitzt auf der ERSTEN Datenspalte
 * — in der schmalen Aufklapp-Spalte (feste Breite) wäre sie unsichtbar.
 */
/**
 * Einrückung der Ebenen. Im Baum übernehmen das die Führungsfelder
 * (`.vi-dt-guide`) — dort bleibt es beim normalen Padding. Gruppen ohne Baum
 * haben keine Führungslinien und werden weiter über Padding eingerückt.
 */
function indentStyle(cell: CellColumn, displayRow: DisplayRow<R>): Record<string, string> {
  if (cell.index !== state.firstDataCellIndex || displayRow.depth === 0) return {}
  if (state.isTree) return {}
  return {
    paddingInlineStart: `calc(var(--dt-cell-padding) + var(--dt-indent) * ${displayRow.depth})`,
  }
}

function cellClass(cell: CellColumn, displayRow: DisplayRow<R>): string {
  const source = cell.col?.column.def.cellClass
  if (!source || !displayRow.row) return ""
  if (typeof source === "string") return source
  return source(cell.col!.column.get(displayRow.row), displayRow.row) ?? ""
}

function ariaSort(cell: CellColumn): "none" | "ascending" | "descending" | undefined {
  if (cell.kind !== "data" || !cell.col!.column.sortable) return undefined
  const index = state.sortIndex[cell.col!.column.id]
  if (index === undefined) return "none"
  return state.sortDirs[cell.col!.column.id] ? "descending" : "ascending"
}

function filterButtonId(columnId: string): string {
  return `${uid}-filter-${columnId.replace(/[^a-zA-Z0-9_-]/g, "_")}`
}

function filterValue(columnId: string): unknown {
  return filters.value.find((filter) => filter.id === columnId)?.value
}

function groupLabel(displayRow: DisplayRow<R>): string {
  return defaultText(displayRow.node?.groupValue)
}

function aggregateText(cell: CellColumn, displayRow: DisplayRow<R>): string {
  if (cell.kind !== "data" || !displayRow.node) return ""
  const column = cell.col!.column
  const value = displayRow.node.aggregates?.[column.id]
  if (value === undefined) return ""
  const first = displayRow.node.groupRows?.[0]
  return column.def.formatter && first ? column.def.formatter(value, first) : defaultText(value)
}

// ── Sortierung ───────────────────────────────────────────────────────

function toggleSort(column: ResolvedColumn<R>, multi: boolean): void {
  if (!column.sortable) return
  // Der NEUE Wert wird lokal gehalten und weitergegeben — nicht über das Modell
  // zurückgelesen (siehe scheduleFetch: bei gebundenem v-model kommt die
  // Aktualisierung erst mit dem Prop der Eltern).
  const next = nextSortState(sort.value, column as ResolvedColumn, {
    multi,
    descFirst: props.sortDescFirst,
    withoutRemoval: props.withoutSortRemoval,
    maxMultiSort: props.maxMultiSort,
  })
  sort.value = next
  emit("sort-change", next)
  setPage(0, false)
  if (state.isServer) scheduleFetch(false, { sort: next })
}

function applySort(columnId: string, desc: boolean): void {
  const next = [{ id: columnId, desc }]
  sort.value = next
  emit("sort-change", next)
  setPage(0, false)
  if (state.isServer) scheduleFetch(false, { sort: next })
}

function onHeaderClick(cell: CellColumn, event: MouseEvent): void {
  nav.setActive(-1, cell.index, false)
  if (cell.kind !== "data") return
  const target = event.target as HTMLElement
  // Klicks auf Bedienelemente im Kopf (Filter, Menü, Pin, Resize) nicht sortieren.
  if (target.closest(".vi-dt-filter-button, .vi-dt-column-menu, .vi-dt-pin, .vi-dt-resize")) return
  toggleSort(cell.col!.column, event.shiftKey)
}

// ── Suche & Filter ───────────────────────────────────────────────────

function onSearchInput(value: string): void {
  search.value = value
  setPage(0, false)
  emit("filter-change", { search: value, filters: filters.value })
  if (state.isServer) scheduleFetch(true, { search: value })
}

function setFilter(columnId: string, value: unknown): void {
  const rest = filters.value.filter((filter) => filter.id !== columnId)
  const next = isEmptyFilter(value) ? rest : [...rest, { id: columnId, value }]
  filters.value = next
  setPage(0, false)
  emit("filter-change", { search: search.value, filters: next })
  if (state.isServer) scheduleFetch(true, { filters: next })
}

// ── Auswahl ──────────────────────────────────────────────────────────

/** Plaketten einer Zelle (Spalten mit `badge`-Funktion, z. B. select/bool). */
function badgesFor(column: ResolvedColumn<R>, row: R): CellBadge[] | null {
  const badges = column.def.badge?.(column.get(row), row)
  return badges?.length ? badges : null
}

function canSelect(row: R): boolean {
  return props.selectableRows ? props.selectableRows(row) : true
}

/**
 * Auswählbare Schlüssel der aktuellen Seite — inklusive eingeklappter
 * Teilbäume und Gruppenmitglieder, aber ohne gesperrte Zeilen
 * (`selectableRows`). Nur Wurzelknoten der Seite besuchen, sonst zählen
 * ausgeklappte Kinder doppelt.
 */
function selectableKeysOnPage(): RowKey[] {
  const keys: RowKey[] = []
  const seen = new Set<RowKey>()

  const visit = (node: RowNode<R>): void => {
    if (node.kind === "data" && node.row && !seen.has(node.key)) {
      if (canSelect(node.row)) {
        seen.add(node.key)
        keys.push(node.key)
      }
    }
    for (const child of node.children) visit(child)
  }

  for (const displayRow of displayed()) {
    if (displayRow.kind === "detail" || displayRow.depth !== 0 || !displayRow.node) continue
    visit(displayRow.node as RowNode<R>)
  }
  return keys
}

function commitSelection(keys: RowKey[]): void {
  selectedKeys.value = keys
  emit("row-select", { selectedKeys: keys, rows: resolveSelectedRows(keys) })
}

function resolveSelectedRows(keys: RowKey[]): R[] {
  const wanted = new Set(keys)
  return dataRowsOf().filter((row: R, index: number) => {
    const key = props.rowKey ? (row[props.rowKey] as RowKey) : index
    return wanted.has(key)
  })
}

function toggleRowSelection(displayRow: DisplayRow<R>, range: boolean): void {
  if (props.selectable === false || displayRow.kind === "detail") return
  if (displayRow.kind === "data" && displayRow.row && !canSelect(displayRow.row)) return

  if (props.selectable === "single") {
    commitSelection(state.selectedSet.has(displayRow.nodeKey) ? [] : [displayRow.nodeKey])
    lastSelectedIndex = displayRow.index
    return
  }

  const selected: Set<RowKey> = new Set(selectedSetOf())

  if (range && lastSelectedIndex !== null && displayRow.kind === "data") {
    const from = Math.min(lastSelectedIndex, displayRow.index)
    const to = Math.max(lastSelectedIndex, displayRow.index)
    for (const candidate of state.dataDisplayRows as DisplayRow<R>[]) {
      if (candidate.index < from || candidate.index > to) continue
      if (candidate.row && !canSelect(candidate.row)) continue
      selected.add(candidate.nodeKey)
    }
    commitSelection([...selected])
    return
  }

  // Baum/Gruppe: Kinder mitnehmen.
  const keys = displayRow.node ? collectKeys(displayRow.node) : [displayRow.nodeKey]
  const selectable = keys.filter((key) => {
    const row = findRowByKey(key)
    return !row || canSelect(row)
  })
  const allSelected = selectable.every((key) => selected.has(key))
  for (const key of selectable) {
    if (allSelected) selected.delete(key)
    else selected.add(key)
  }
  if (displayRow.kind === "data") lastSelectedIndex = displayRow.index
  commitSelection([...selected])
}

function findRowByKey(key: RowKey): R | undefined {
  if (!props.rowKey) return undefined
  return dataRowsOf().find((row: R) => (row[props.rowKey!] as RowKey) === key)
}

/**
 * Auswahl per Checkbox. Absichtlich am `click` und nicht am `change`: nur das
 * Klick-Ereignis trägt `shiftKey`, und darauf beruht die Bereichsauswahl.
 */
function onSelectRow(displayRow: DisplayRow<R>, event: MouseEvent): void {
  toggleRowSelection(displayRow, event.shiftKey)
}
// Klick auf die ZEILE (nicht das Kästchen): verhält sich wie ein Dateimanager.
// Ein schlichter Klick ersetzt die Auswahl durch diese Zeile; Strg/Cmd nimmt
// sie zusätzlich auf bzw. wieder heraus; Shift wählt den Bereich. Das Kästchen
// selbst (onSelectRow) toggelt weiterhin additiv.
// Bei gedrückter Strg/Cmd- oder Shift-Taste dient der Klick der Mehrfachauswahl —
// die Text-Markierung des Browsers wird dafür unterdrückt (preventDefault auf
// mousedown verhindert den Markierungsbeginn, der Click kommt trotzdem an).
function onCellMouseDown(event: MouseEvent): void {
  if (props.selectable === false || !props.selectOnRowClick) return
  if (event.ctrlKey || event.metaKey || event.shiftKey) event.preventDefault()
}
function selectRowFromClick(displayRow: DisplayRow<R>, event: MouseEvent): void {
  if (props.selectable !== "multiple" || event.ctrlKey || event.metaKey || event.shiftKey) {
    toggleRowSelection(displayRow, event.shiftKey)
    return
  }
  if (displayRow.kind === "detail") return
  if (displayRow.kind === "data" && displayRow.row && !canSelect(displayRow.row)) return
  // Baum/Gruppe: Kinder mitnehmen (wie beim Kästchen).
  const keys = (displayRow.node ? collectKeys(displayRow.node) : [displayRow.nodeKey]).filter((key) => {
    const row = findRowByKey(key)
    return !row || canSelect(row)
  })
  if (displayRow.kind === "data") lastSelectedIndex = displayRow.index
  commitSelection(keys)
}

function selectAllOnPage(force?: boolean): void {
  const keys = selectableKeysOnPage()
  const allSelected = keys.length > 0 && keys.every((key) => selectedSetOf().has(key))
  const selected: Set<RowKey> = new Set(selectedSetOf())
  const shouldSelect = force ?? !allSelected
  for (const key of keys) {
    if (shouldSelect) selected.add(key)
    else selected.delete(key)
  }
  commitSelection([...selected])
  state.announcement = shouldSelect
    ? t("dataTable.rowsSelected", { count: keys.length })
    : t("dataTable.selectionCleared")
}

function toggleSelectAll(): void {
  selectAllOnPage()
}

// ── Kinder nachladen ─────────────────────────────────────────────────

function rowKeyOf(row: R): RowKey {
  return props.rowKey ? (row[props.rowKey] as RowKey) : ""
}

/**
 * Was wissen wir über die Kinder dieser Zeile?
 *   "none"    → sicher keine (die Anwendung sagt es über `rowHasChildren`)
 *   "empty"   → nachgeladen, es gab keine → Pfeil bleibt, aber deaktiviert
 *   "loaded"  → nachgeladen, es gibt Kinder
 *   "unknown" → noch nicht geladen → Pfeil aktiv
 */
function childState(row: R): "none" | "empty" | "loaded" | "unknown" {
  if (props.rowHasChildren?.(row) === false) return "none"
  const cached = state.loadedChildren[String(rowKeyOf(row))] as R[] | undefined
  if (!cached) return "unknown"
  return cached.length ? "loaded" : "empty"
}

function isLoadingChildren(row?: R): boolean {
  return row ? Boolean(state.loadingChildren[String(rowKeyOf(row))]) : false
}

/** Pfeil ohne Wirkung: nachgeladen und es gibt nichts. */
function isEmptyBranch(displayRow: DisplayRow<R>): boolean {
  if (!props.loadChildren || displayRow.kind !== "data" || !displayRow.row) return false
  return childState(displayRow.row) === "empty" && !displayRow.node?.children.length
}

/** Kinder einer Zeile holen (einmalig; `force` lädt erneut). */
async function fetchChildren(row: R, force = false): Promise<void> {
  if (!props.loadChildren) return
  const key = String(rowKeyOf(row))
  if (!force && state.loadedChildren[key]) return
  if (state.loadingChildren[key]) return

  state.loadingChildren[key] = true
  try {
    const children = await props.loadChildren(row)
    state.loadedChildren[key] = (children ?? []) as (typeof state.loadedChildren)[string]
  } catch (error) {
    emit("children-error", { error, key: rowKeyOf(row), row })
    console.warn("[DataTable] Kinder konnten nicht geladen werden", error)
  } finally {
    delete state.loadingChildren[key]
  }
}

// ── Aufklappen ───────────────────────────────────────────────────────

function toggleExpand(displayRow: DisplayRow<R>): void {
  if (!displayRow.expandable) return
  if (isEmptyBranch(displayRow) || isLoadingChildren(displayRow.row)) return

  // Erst laden, dann aufklappen — sonst klappt eine leere Ebene auf und
  // wieder zu, sobald die Antwort kommt.
  if (props.loadChildren && displayRow.kind === "data" && displayRow.row) {
    const row = displayRow.row
    if (childState(row) === "unknown" && !displayRow.node?.children.length) {
      void fetchChildren(row).then(() => {
        if (childState(row) !== "empty") expand(displayRow.nodeKey, row)
      })
      return
    }
  }

  const keys = new Set(expandedKeys.value)
  if (keys.has(displayRow.nodeKey)) {
    keys.delete(displayRow.nodeKey)
    expandedKeys.value = [...keys]
    emit("row-collapse", { key: displayRow.nodeKey, row: displayRow.row })
  } else {
    keys.add(displayRow.nodeKey)
    expandedKeys.value = [...keys]
    emit("row-expand", { key: displayRow.nodeKey, row: displayRow.row })
  }
}

/** Zeile aufklappen und melden. */
function expand(key: RowKey, row?: R): void {
  if (expandedKeys.value.includes(key)) return
  expandedKeys.value = [...expandedKeys.value, key]
  emit("row-expand", { key, row })
}

function allExpandableKeys(nodes: RowNode<R>[] = state.built.nodes as RowNode<R>[], into: RowKey[] = []): RowKey[] {
  for (const node of nodes) {
    if (node.children.length || (props.rowDetail && node.kind === "data")) into.push(node.key)
    if (node.children.length) allExpandableKeys(node.children, into)
  }
  return into
}

// ── Zellklicks ───────────────────────────────────────────────────────

/**
 * Doppelklick auf einer Datenzeile. Bedienelemente in der Zeile (Auswahl,
 * Aufklappen, Aktionen) lösen ihn nicht aus — dort doppelt zu klicken meint
 * nicht „Datensatz öffnen".
 */
function onRowDoubleClick(displayRow: DisplayRow<R>, event: MouseEvent): void {
  if (displayRow.kind !== "data" || !displayRow.row) return
  const target = event.target as HTMLElement
  if (target.closest("wa-checkbox, wa-button, a, input, select, .vi-dt-expand")) return
  // Ein Doppelklick löst zwei Klicks aus, die die Auswahl per Klick wieder
  // aufheben würden — die Zeile bleibt/wird ausgewählt.
  if (props.selectable !== false && props.selectOnRowClick && canSelect(displayRow.row)) {
    const key = displayRow.nodeKey
    if (!state.selectedSet.has(key)) {
      commitSelection(props.selectable === "single" ? [key] : [...selectedSetOf(), key])
    }
  }
  emit("row-dblclick", {
    key: displayRow.nodeKey,
    row: displayRow.row,
    index: displayRow.index,
    originalEvent: event,
  })
}

function onCellClick(displayRow: DisplayRow<R>, cell: CellColumn, event: MouseEvent): void {
  nav.setActive(state.rowIndexOf[displayRow.key] ?? 0, cell.index, false)
  if (displayRow.kind === "group") {
    toggleExpand(displayRow)
    return
  }
  if (cell.kind !== "data" || !displayRow.row) return
  const target = event.target as HTMLElement
  if (target.closest(".vi-dt-expand, .vi-dt-checkbox")) return
  // Zeile per Klick auswählen — außer der Klick trifft ein interaktives Element
  // in der Zelle (Link, Button, Eingabefeld), das sich selbst um den Klick kümmert.
  if (
    props.selectable !== false &&
    props.selectOnRowClick &&
    displayRow.kind === "data" &&
    !target.closest("a, button, input, select, textarea, label, [contenteditable], wa-button, wa-checkbox, wa-switch")
  ) {
    selectRowFromClick(displayRow, event)
  }
  emit("cell-click", {
    column: cell.col!.column.id,
    value: cell.col!.column.get(displayRow.row),
    row: displayRow.row,
    index: displayRow.index,
  })
}

function onCellContextMenu(displayRow: DisplayRow<R>, cell: CellColumn, event: MouseEvent): void {
  if (cell.kind !== "data" || !displayRow.row) return
  emit("cell-contextmenu", {
    column: cell.col!.column.id,
    value: cell.col!.column.get(displayRow.row),
    row: displayRow.row,
    index: displayRow.index,
    originalEvent: event,
  })
}

// ── Feste Reihenfolge: Zeilen umsortieren ────────────────────────────

/**
 * Zeilen werden mit ZEIGER-Ereignissen gezogen, nicht mit HTML5-Drag-and-Drop.
 * Grund: `dragover` verlangt ein akzeptierendes Ziel und feuert je nach
 * Umgebung unzuverlässig (bei Touch gar nicht) — die Einfügemarke bliebe dann
 * aus und die Zielposition wäre Zufall. Pointer-Events verhalten sich überall
 * gleich, funktionieren mit Touch und sind testbar.
 */
function beginRowDrag(displayRow: DisplayRow<R>, event: PointerEvent): void {
  if (!state.orderActive || displayRow.kind !== "data") return
  state.rowDrag = { key: displayRow.nodeKey, overKey: null, mode: "after" }

  if (dragSession) {
    const keys = movingKeysFor(displayRow.nodeKey)
    dragSession.start({
      keys,
      rows: keys.map((movingKey) => findRowByKey(movingKey) ?? displayRow.row!).filter(Boolean) as R[],
      source: props.dragSource,
    })
  }

  const move = (moveEvent: PointerEvent) => updateRowDrag(moveEvent.clientX, moveEvent.clientY)
  const up = (upEvent: PointerEvent) => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    updateRowDrag(upEvent.clientX, upEvent.clientY)
    commitRowDrag()
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
  event.stopPropagation()
}

/**
 * Zeile unter dem Zeiger bestimmen und die Zone ableiten. Wie im admin4 gibt es
 * drei: oberes Viertel = davor, unteres Viertel = dahinter, die Mitte = HINEIN
 * (die Zeile wird Kind des Ziels). Ohne Baum bleibt nur davor/dahinter.
 */
function updateRowDrag(clientX: number, clientY: number): void {
  const drag = state.rowDrag
  if (!drag) return
  // Erst die umgebende Session fragen: liefert sie ein Ziel (Baumknoten oder
  // Ordnerzeile), übernimmt sie Anzeige und Drop — der interne Indikator ruht.
  if (dragSession?.state.active) {
    const external = dragSession.update(clientX, clientY)
    if (external) {
      drag.overKey = null
      return
    }
  }
  const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>(".vi-dt-row.is-data")
  if (!element || !scrollerEl.value?.contains(element)) return
  const target = displayed().find((row) => row.key === element.dataset.key)
  if (!target || target.nodeKey === drag.key) return

  // In den eigenen Teilbaum ziehen ist nicht möglich — er hinge an sich selbst.
  if (isDescendant(state.built.nodes as RowNode<R>[], drag.key, target.nodeKey)) {
    drag.overKey = null
    return
  }

  const rect = element.getBoundingClientRect()
  const offset = (clientY - rect.top) / rect.height
  drag.overKey = target.nodeKey
  if (!state.isTree) drag.mode = offset > 0.5 ? "after" : "before"
  else if (offset < 0.25) drag.mode = "before"
  else if (offset > 0.75) drag.mode = "after"
  else drag.mode = "inside"
}

/** Nachlade-Modus: Zeile aus ihrem alten Bucket nehmen und am Ziel einsetzen. */
function applyLazyMove(source: NodeLocation<R>, targetParent: RowKey | null, insertAt: number, order: number): void {
  const row = source.node.row
  if (!row) return
  const key = source.node.key
  const moved = { ...row } as R
  if (props.orderField) (moved as Record<string, unknown>)[props.orderField] = order
  if (props.parentField) (moved as Record<string, unknown>)[props.parentField] = targetParent

  const hidden = new Set(lazyMoves.value.hidden)
  let injected = lazyMoves.value.injected.filter((candidate) => (candidate[props.rowKey!] as RowKey) !== key)

  // Aus der Quelle entfernen …
  if (source.parentKey === null) {
    hidden.add(key) // oberste Ebene: props.data bleibt unangetastet, nur ausblenden
  } else {
    const bucket = state.loadedChildren[String(source.parentKey)] as R[] | undefined
    if (bucket) {
      state.loadedChildren[String(source.parentKey)] = bucket.filter(
        (candidate) => (candidate[props.rowKey!] as RowKey) !== key
      ) as (typeof state.loadedChildren)[string]
    }
  }

  // … und am Ziel einsetzen.
  if (targetParent === null) {
    // Original (falls es in props.data steht) bleibt ausgeblendet; sichtbar
    // ist die Kopie mit neuem Ordnungswert.
    hidden.add(key)
    injected = [...injected, moved]
  } else {
    const bucket = state.loadedChildren[String(targetParent)] as R[] | undefined
    if (bucket) {
      const next = [...bucket]
      next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, moved)
      state.loadedChildren[String(targetParent)] = next as (typeof state.loadedChildren)[string]
    }
    // Bucket noch nie geladen: beim Aufklappen holt fetchChildren den Stand
    // vom Server — der enthält die Zeile nach dem Speichern ohnehin.
  }

  lazyMoves.value = { hidden, injected }
}

/**
 * Nachlade-Modus zurücksetzen: Kinder-Cache verwerfen und alle Zweige
 * zuklappen — die Pfeile stehen danach wieder auf „zu", und das nächste
 * Aufklappen holt den frischen Stand vom Server. Läuft bei `reload()` und
 * wenn der Aufrufer neue Daten liefert; ohne `loadChildren` (parentField-
 * Bäume) bleibt die Aufklapp-Situation erhalten, dort sind die Kinder ohnehin
 * immer aus den aktuellen Daten abgeleitet.
 */
function resetLazyTree(): void {
  if (!props.loadChildren) return
  state.loadedChildren = {}
  state.loadingChildren = {}
  if (expandedKeys.value.length) expandedKeys.value = []
}

// Drag & Drop ist rein CLIENTSEITIG: die Zeile wird lokal verschoben (Buckets/
// Überlagerungen oben), `row-reorder` meldet den Zug zum Speichern im
// Hintergrund — die Tabelle lädt danach NICHTS neu, und die App muss es auch
// nicht. Kommen von außen neue Daten herein, sind sie maßgeblich: die
// optimistischen Überlagerungen werden verworfen (frische Daten enthalten
// einen gespeicherten Zug bereits). Der Nachlade-Baum bleibt dabei stehen —
// zugeklappt und geleert wird er nur über `reload()`/`resetTree()` oder, per
// Opt-in `resetTreeOnDataChange`, bei jedem Datenwechsel ohne vorangegangene
// Verschiebung.
watch(
  () => (props.dataSource ? (state.serverRows as R[]) : props.data),
  () => {
    const afterMove =
      moveOverrides.value.size > 0 || lazyMoves.value.hidden.size > 0 || lazyMoves.value.injected.length > 0
    if (moveOverrides.value.size) moveOverrides.value = new Map()
    if (lazyMoves.value.hidden.size || lazyMoves.value.injected.length) {
      lazyMoves.value = { hidden: new Set(), injected: [] }
    }
    if (props.resetTreeOnDataChange && !afterMove) resetLazyTree()
  }
)

function commitRowDrag(): void {
  const drag = state.rowDrag
  state.rowDrag = null
  // Ein Session-Ziel (Baum/Ordner außerhalb der internen Logik) hat Vorrang:
  // der Browser übernimmt den Zug, hier passiert dann nichts mehr.
  if (dragSession?.state.active) {
    if (dragSession.state.over) {
      dragSession.drop()
      return
    }
    dragSession.cancel()
  }
  if (drag?.overKey !== null && drag?.overKey !== undefined) {
    moveRowTo(drag.key, drag.overKey, drag.mode)
  }
}

/**
 * Zeile an eine neue Stelle setzen und den neuen Ordnungswert melden.
 *
 * Gerechnet wird immer im Kreis der künftigen GESCHWISTER — bei „hinein" also
 * unter den Kindern des Ziels, sonst unter den Geschwistern des Ziels. Nur so
 * ergibt der Wert im Baum Sinn: `sortindex` gilt je Elternteil.
 */
function moveRowTo(key: RowKey, targetKey: RowKey, mode: DropMode): void {
  if (!props.orderField || key === targetKey) return
  const field = props.orderField
  const nodes = state.built.nodes as RowNode<R>[]

  const target = locateNode(nodes, targetKey)
  if (!target) return

  // Mehrfachauswahl: gehört die gezogene Zeile zur Auswahl, wandert die ganze
  // Auswahl mit — in Anzeige-Reihenfolge. Zeilen, die nicht ans Ziel dürfen
  // (das Ziel selbst, Vorfahren des Ziels), bleiben außen vor.
  const moving = movingKeysFor(key).filter(
    (candidate) => candidate !== targetKey && !isDescendant(nodes, candidate, targetKey)
  )
  if (!moving.length) return
  const movingSet = new Set(moving)

  const orderOf = (node: RowNode<R>): number => Number(node.row?.[field] ?? 0)

  let parentKey: RowKey | null
  let insertAt: number
  let values: number[]

  if (mode === "inside") {
    // Neue Kinder: hinter die vorhandenen Kinder des Ziels.
    parentKey = targetKey
    const children = target.node.children.filter((child) => !movingSet.has(child.key))
    values = children.map(orderOf)
    insertAt = values.length
  } else {
    parentKey = target.parentKey
    const siblings = target.siblings.filter((node) => !movingSet.has(node.key))
    values = siblings.map(orderOf)
    const targetIndex = siblings.findIndex((node) => node.key === targetKey)
    insertAt = mode === "after" ? targetIndex + 1 : targetIndex
  }

  let movedCount = 0
  let parentChangedAny = false
  const firstInsertAt = insertAt

  for (const movingKey of moving) {
    const source = locateNode(nodes, movingKey)
    if (!source?.node.row) continue

    const { order, needsReindex } = orderValueFor(values, insertAt, props.orderStep)
    // Den vergebenen Wert in die Nachbarliste übernehmen, damit die nächste
    // Zeile der Auswahl DAHINTER einsortiert wird (Reihenfolge bleibt erhalten).
    values.splice(Math.max(0, Math.min(values.length, insertAt)), 0, order)

    // Optimistisch übernehmen: die Zeile verlässt ihre alte Stelle sofort und
    // erscheint am Ziel — beim Drop IN einen Ordner also unter dessen Kindern.
    if (props.rowKey) {
      if (props.loadChildren) {
        applyLazyMove(source, parentKey, insertAt, order)
      } else {
        const next = new Map(moveOverrides.value)
        next.set(movingKey, { order, parent: props.parentField ? parentKey : undefined })
        moveOverrides.value = next
      }
    }

    emit("row-reorder", {
      row: source.node.row,
      key: movingKey,
      order,
      parent: parentKey,
      parentChanged: parentKey !== source.parentKey,
      toIndex: insertAt,
      needsReindex,
    })
    if (parentKey !== source.parentKey) parentChangedAny = true
    movedCount++
    insertAt++
  }

  if (!movedCount) return
  const movedParams = { count: movedCount, position: firstInsertAt + 1 }
  state.announcement =
    movedCount > 1
      ? parentChangedAny
        ? t("dataTable.rowsMovedLevel", movedParams)
        : t("dataTable.rowsMoved", movedParams)
      : parentChangedAny
        ? t("dataTable.rowMovedLevel", movedParams)
        : t("dataTable.rowMoved", movedParams)
}

/**
 * Welche Zeilen ein Zug bewegt: nur die gezogene — oder, wenn sie Teil der
 * Auswahl ist, alle ausgewählten Zeilen in Anzeige-Reihenfolge. Ausgewählte
 * Nachfahren einer ebenfalls ausgewählten Zeile wandern implizit mit ihrem
 * Teilbaum und werden nicht doppelt bewegt.
 */
function movingKeysFor(key: RowKey): RowKey[] {
  if (props.selectable === false || !state.selectedSet.has(key) || state.selectedSet.size < 2) return [key]
  const selected = state.selectedSet as Set<RowKey>
  const nodes = state.built.nodes as RowNode<R>[]
  const ordered: RowKey[] = []
  for (const row of state.dataDisplayRows as DisplayRow<R>[]) {
    if (selected.has(row.nodeKey)) ordered.push(row.nodeKey)
  }
  // dataDisplayRows enthält nur SICHTBARE Zeilen — ausgewählte Zeilen in
  // zugeklappten Zweigen hängen wir hinten an, damit sie nicht liegenbleiben.
  const seen = new Set(ordered)
  for (const candidate of selected) {
    if (!seen.has(candidate)) ordered.push(candidate)
  }
  const selectedList = [...selected]
  const result = ordered.filter(
    (candidate) => !selectedList.some((other) => other !== candidate && isDescendant(nodes, other, candidate))
  )
  return result.length ? result : [key]
}

/** Zeilenschlüssel wie in der Pipeline (rowKey oder Indexpfad). */
function keyOfRow(row: R, index: number): RowKey {
  return props.rowKey ? (row[props.rowKey] as RowKey) : String(index)
}

/**
 * Tastatur: Zeile um eine Position verschieben (Alt + ↑/↓) — innerhalb ihrer
 * GESCHWISTER. Ein Elternwechsel bleibt der Maus vorbehalten; per Tastatur
 * wäre nicht erkennbar, in welche Ebene man zielt.
 */
function moveRowByKeyboard(rowIndex: number, delta: number): void {
  if (!state.orderActive) return
  const displayRow = state.displayRows[rowIndex]
  if (displayRow?.kind !== "data") return
  const location = locateNode(state.built.nodes as RowNode<R>[], displayRow.nodeKey)
  if (!location) return
  const neighbour = location.siblings[location.index + delta]
  if (!neighbour) return
  moveRowTo(displayRow.nodeKey, neighbour.key, delta > 0 ? "after" : "before")
  nav.setActive(rowIndex + delta, nav.state.col)
}

// ── Spalten: Resize, Reorder, Pin ────────────────────────────────────

function onResizeStart(columnId: string, event: PointerEvent): void {
  layout.startResize(columnId, event.clientX)
  const move = (moveEvent: PointerEvent) => layout.moveResize(moveEvent.clientX)
  const up = () => {
    layout.endResize()
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}

function onDragStart(cell: CellColumn, event: DragEvent): void {
  if (cell.kind !== "data" || !cell.col!.movable) return
  event.dataTransfer?.setData("text/plain", cell.col!.column.id)
  layout.startDrag(cell.col!.column.id, event.clientX, event.clientY)
}

function onDragOver(cell: CellColumn, event: DragEvent): void {
  if (!layout.state.dragging || cell.kind !== "data") return
  event.preventDefault()
  layout.dragOver(cell.col!.column.id, event.clientX, event.clientY)
}

function pinColumn(columnId: string, side: PinSide | false): void {
  layout.pinColumn(columnId, side)
}

/**
 * Spalte auf die Breite ihres breitesten Inhalts bringen.
 *
 * Gemessen wird der TEXT, nicht die Box: der Inhalt sitzt in einem
 * Block-Element, das die Zelle ausfüllt — dessen scrollWidth wäre also immer
 * die aktuelle Spaltenbreite, und Autosize könnte nie verkleinern. Ein Range
 * über die Knoteninhalte liefert die echte Textbreite; für Komponenten-Inhalte
 * (Badges, Tags) fällt die Messung auf scrollWidth zurück.
 */
function autoSizeColumn(columnId: string): void {
  const cells = scrollerEl.value?.querySelectorAll<HTMLElement>(`[data-column="${columnId}"]`)
  if (!cells?.length) return
  const range = document.createRange()
  let widest = 0
  for (const cell of cells) {
    const content = cell.querySelector<HTMLElement>(".wa-ellipsis, .vi-dt-hlabel") ?? cell
    let measured = 0
    if (content.firstChild) {
      range.selectNodeContents(content)
      measured = range.getBoundingClientRect().width
    }
    widest = Math.max(widest, Math.max(measured, content.scrollWidth === content.clientWidth ? 0 : content.scrollWidth))
  }
  const width = Math.ceil(widest) + 40 // Polsterung + Werkzeuge im Kopf
  layout.setWidth(columnId, width)
  emit("column-resize", { column: columnId, width, finished: true })
}

function autoSizeColumns(): void {
  for (const col of layout.state.visibleColumns as LayoutColumn<R>[]) autoSizeColumn(col.column.id)
}

function sizeColumnsToFit(): void {
  const available = scrollerEl.value?.clientWidth ?? 0
  const columns = layout.state.visibleColumns as LayoutColumn<R>[]
  if (!available || !columns.length) return
  let lead = 0
  if (props.orderField) lead += ORDER_WIDTH
  if (props.selectable !== false) lead += LEAD_WIDTH
  if (state.hasExpandColumn) lead += LEAD_WIDTH
  const each = Math.floor((available - lead) / columns.length)
  for (const col of columns) layout.setWidth(col.column.id, each)
}

function resetColumns(): void {
  layout.resetColumns()
}

// ── Paginierung ──────────────────────────────────────────────────────

function setPage(next: number, notify = true): void {
  const clamped = Math.max(0, Math.min(state.pageCount - 1, next))
  if (clamped === page.value) return
  page.value = clamped
  if (notify) emit("page-change", { page: clamped, pageSize: pageSize.value })
  nav.clamp()
  if (state.isServer) scheduleFetch(false, { page: clamped })
}

/** Cursor-Leiste: neue Seitengröße — der Aufrufer lädt damit neu (page-change). */
function onCursorPageSize(next: number): void {
  pageSize.value = next
  emit("page-change", { page: 0, pageSize: next })
}

function setPageSize(next: number): void {
  pageSize.value = next
  page.value = 0
  emit("page-change", { page: 0, pageSize: next })
  if (state.isServer) scheduleFetch(false, { page: 0, pageSize: next })
}

// ── Server-Modus ─────────────────────────────────────────────────────

/**
 * Was der nächste Server-Abruf gegenüber den Modellen abweichend verwenden soll.
 *
 * Nötig, weil Vue bei GEBUNDENEM `v-model` den lokalen Wert eines
 * `defineModel` nicht sofort setzt: die Aktualisierung kommt erst über den Prop
 * der Eltern. Ein Lesen direkt nach dem Schreiben liefert also den alten Wert —
 * unbemerkt, solange niemand `v-model:sort` & Co. bindet, und beim ersten
 * Sortierklick sichtbar falsch, sobald doch.
 */
type RequestOverrides = Partial<Pick<DataTableRequest, "sort" | "filters" | "search" | "page" | "pageSize">>
let pendingRequest: RequestOverrides = {}

function buildRequest(signal: AbortSignal): DataTableRequest {
  const request: DataTableRequest = {
    sort: pendingRequest.sort ?? sort.value,
    filters: pendingRequest.filters ?? filters.value,
    search: pendingRequest.search ?? search.value,
    page: pendingRequest.page ?? page.value,
    pageSize: pendingRequest.pageSize ?? pageSize.value,
    signal,
  }
  pendingRequest = {}
  return request
}

function scheduleFetch(debounced: boolean, overrides: RequestOverrides = {}): void {
  if (!state.isServer) return
  pendingRequest = { ...pendingRequest, ...overrides }
  if (debounceTimer) window.clearTimeout(debounceTimer)
  if (!debounced) {
    void fetchRows()
    return
  }
  debounceTimer = window.setTimeout(() => {
    debounceTimer = 0
    void fetchRows()
  }, props.filterDebounce)
}

async function fetchRows(): Promise<void> {
  abortController?.abort()
  abortController = new AbortController()
  const request = buildRequest(abortController.signal)

  if (!props.dataSource) {
    emit("data-request", request)
    return
  }

  state.fetching = true
  try {
    const response = await props.dataSource(request)
    if (request.signal.aborted) return
    state.serverRows = response.rows as typeof state.serverRows
    state.serverTotal = response.total
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return
    emit("data-error", { error, request })
    console.warn("[DataTable] Datenabruf fehlgeschlagen", error)
  } finally {
    if (!request.signal.aborted) state.fetching = false
  }
}

function reload(): void {
  scheduleFetch(false)
  // Ohne dataSource ersetzt der Aufrufer props.data selbst (der Watch oben
  // greift dann); den Nachlade-Baum setzen wir in jedem Fall zurück.
  if (!props.dataSource) resetLazyTree()
}

// ── Kopieren & CSV ───────────────────────────────────────────────────

interface ExportOptions {
  columnIds?: string[]
  includeHeaders?: boolean
  delimiter?: string
  escapeFormulas?: boolean
}

function exportColumns(columnIds?: string[]): ResolvedColumn<R>[] {
  const visible = (layout.state.visibleColumns as LayoutColumn<R>[]).map((col) => col.column)
  if (!columnIds) return visible
  const resolved: ResolvedColumn<R>[] = []
  for (const id of columnIds) {
    const column = cols().find((item) => item.id === id)
    if (column) resolved.push(column)
  }
  return resolved
}

function escapeCell(text: string, delimiter: string, escapeFormulas: boolean): string {
  let value = text
  if (escapeFormulas && /^[=+\-@]/.test(value) && Number.isNaN(Number(value))) value = `'${value}`
  return value.includes(delimiter) || value.includes('"') || value.includes("\n")
    ? `"${value.replace(/"/g, '""')}"`
    : value
}

function serializeRows(rows: R[], options: ExportOptions = {}): string {
  const delimiter = options.delimiter ?? ","
  const columns = exportColumns(options.columnIds)
  const lines: string[] = []
  if (options.includeHeaders !== false) {
    lines.push(columns.map((column) => escapeCell(column.label, delimiter, false)).join(delimiter))
  }
  for (const row of rows) {
    lines.push(
      columns.map((column) => escapeCell(column.text(row), delimiter, options.escapeFormulas ?? false)).join(delimiter)
    )
  }
  return lines.join("\n")
}

function getDataAsCsv(options: ExportOptions = {}): string {
  return serializeRows(dataRowsOf(), options)
}

function exportDataAsCsv(options: ExportOptions & { fileName?: string } = {}): void {
  const csv = getDataAsCsv(options)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = options.fileName ?? "export.csv"
  link.click()
  URL.revokeObjectURL(url)
}

async function copySelectedRows(options: ExportOptions & { format?: "tsv" | "csv" } = {}): Promise<number> {
  const selected = resolveSelectedRows(selectedKeys.value)
  const rows = selected.length ? selected : dataRowsOf()
  const text = serializeRows(rows, {
    ...options,
    delimiter: options.format === "csv" ? "," : "\t",
  })
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    // Clipboard kann verweigert werden (Berechtigung, unsicherer Kontext).
  }
  state.announcement = t("dataTable.rowsCopied", { count: rows.length })
  return rows.length
}

// ── Zustand sichern / laden ──────────────────────────────────────────

function getState(): DataTableState {
  return {
    version: 1,
    columnOrder: layout.currentOrder(),
    columnWidths: { ...layout.state.widths },
    columnVisibility: Object.fromEntries(cols().map((column) => [column.id, layout.isVisible(column)])),
    columnPinning: {
      start: cols()
        .filter((column) => layout.pinOf(column) === "start")
        .map((column) => column.id),
      end: cols()
        .filter((column) => layout.pinOf(column) === "end")
        .map((column) => column.id),
    },
    sort: sort.value,
    filters: filters.value,
    search: search.value,
    selectedKeys: selectedKeys.value,
    expandedKeys: expandedKeys.value,
    page: page.value,
    pageSize: pageSize.value,
  }
}

function setState(next: Partial<DataTableState>): void {
  if (next.columnOrder) layout.state.order = [...next.columnOrder]
  if (next.columnWidths) layout.state.widths = { ...next.columnWidths }
  if (next.columnVisibility) layout.state.visibility = { ...next.columnVisibility }
  if (next.columnPinning) {
    const pinning: Record<string, PinSide | false> = {}
    for (const id of next.columnPinning.start) pinning[id] = "start"
    for (const id of next.columnPinning.end) pinning[id] = "end"
    layout.state.pinning = pinning
  }
  if (next.sort) sort.value = [...next.sort]
  if (next.filters) filters.value = [...next.filters]
  if (next.search !== undefined) search.value = next.search
  if (next.selectedKeys) selectedKeys.value = [...next.selectedKeys]
  if (next.expandedKeys) expandedKeys.value = [...next.expandedKeys]
  if (next.page !== undefined) page.value = next.page
  if (next.pageSize !== undefined) pageSize.value = next.pageSize
  layout.pruneUnknown()
}

function resetState(): void {
  layout.resetColumns()
  sort.value = []
  filters.value = []
  search.value = ""
  expandedKeys.value = []
}

defineExpose({
  // Zeilen
  getVisibleRows: (): R[] =>
    displayed()
      .filter((row) => row.kind === "data")
      .map((row) => row.row!),
  getProcessedRows: (): R[] => dataRowsOf(),
  getSelectedRows: (): R[] => resolveSelectedRows(selectedKeys.value),
  scrollToIndex: virtual.scrollToIndex,
  // Aufklappen
  expandRow: (key: RowKey) => {
    if (!expandedKeys.value.includes(key)) expandedKeys.value = [...expandedKeys.value, key]
  },
  collapseRow: (key: RowKey) => {
    expandedKeys.value = expandedKeys.value.filter((item) => item !== key)
  },
  expandAllRows: () => {
    expandedKeys.value = allExpandableKeys()
  },
  collapseAllRows: () => {
    expandedKeys.value = []
  },
  // Spalten
  toggleColumn: (id: string, visible: boolean) => layout.toggleColumn(id, visible, true),
  pinColumn: (id: string, side: PinSide | false) => layout.pinColumn(id, side, true),
  getColumnPin: layout.getColumnPin,
  autoSizeColumn,
  autoSizeColumns,
  sizeColumnsToFit,
  resetColumns,
  getColumnFacets: (id: string): ColumnFacets => (state.facets as Record<string, ColumnFacets>)[id] ?? { values: [] },
  // Daten
  reload,
  /** Nachlade-Baum zurücksetzen: Pfeile zu, Kinder-Cache leer (frisch beim Aufklappen). */
  resetTree: resetLazyTree,
  /** Nachgeladene Kinder einer Zeile verwerfen und erneut holen. */
  reloadChildren: async (key: RowKey): Promise<void> => {
    const row = findRowByKey(key)
    if (!row) return
    delete state.loadedChildren[String(key)]
    await fetchChildren(row, true)
  },
  /** Nachgeladene Kinder einer Zeile (undefined = noch nicht geladen). */
  getLoadedChildren: (key: RowKey): R[] | undefined => state.loadedChildren[String(key)] as R[] | undefined,
  getDataAsCsv,
  exportDataAsCsv,
  copySelectedRows,
  // Zustand
  getState,
  setState,
  resetState,
  focus: () => void nav.focusActive(),
})

// ── Messen, Beobachten, Reagieren ────────────────────────────────────

/** Kopfzellen messen — die Breiten sind die Grundlage der Sticky-Abstände. */
function observeHeaderCells(): void {
  const scroller = scrollerEl.value
  if (!scroller || !headerObserver) return
  headerObserver.disconnect()
  for (const cell of scroller.querySelectorAll<HTMLElement>(".vi-dt-hcell[data-column]")) {
    headerObserver.observe(cell)
  }
}

/** Detail-Panels haben freie Höhe → für die Virtualisierung messen. */
function measureDetailRows(): void {
  const body = bodyEl.value
  if (!body || !detailObserver) return
  detailObserver.disconnect()
  for (const row of body.querySelectorAll<HTMLElement>("[data-detail]")) {
    virtual.measureRow(row.dataset.detail!, row.getBoundingClientRect().height)
    detailObserver.observe(row)
  }
}

onMounted(() => {
  headerObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.column
      if (id && !id.startsWith("__")) layout.setMeasured(id, entry.contentRect.width)
    }
  })
  detailObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const key = (entry.target as HTMLElement).dataset.detail
      if (key) virtual.measureRow(key, entry.contentRect.height)
    }
  })
  virtual.syncViewport()
  void nextTick(() => {
    observeHeaderCells()
    measureDetailRows()
  })
  if (state.isServer) scheduleFetch(false)
})

onBeforeUnmount(() => {
  headerObserver?.disconnect()
  detailObserver?.disconnect()
  abortController?.abort()
  if (debounceTimer) window.clearTimeout(debounceTimer)
})

watch(
  () => layout.state.visibleColumns.length,
  () => void nextTick(observeHeaderCells)
)

watch(
  () => props.columns,
  () => {
    layout.pruneUnknown()
    void nextTick(observeHeaderCells)
  }
)

watch(
  () => state.displayRows.length,
  () => {
    nav.clamp()
    void nextTick(measureDetailRows)
  }
)

watch(
  () => expandedKeys.value.length,
  () => void nextTick(measureDetailRows)
)

// Datenwechsel: Seite in den gültigen Bereich ziehen.
watch(
  () => state.filteredCount,
  () => {
    if (page.value > state.pageCount - 1) page.value = state.pageCount - 1
  }
)
</script>

<style scoped>
/* Größen und Farben spiegeln die CSS-Variablen von <wa-data-grid>. */
.vi-dt {
  --dt-border-color: var(--wa-color-surface-border);
  --dt-border-width: var(--wa-border-width-s);
  --dt-header-background: var(--wa-color-surface-lowered);
  --dt-row-hover: var(--wa-color-neutral-fill-quiet);
  --dt-selected: var(--wa-color-brand-fill-quiet);
  --dt-stripe: color-mix(in oklab, var(--wa-color-neutral-fill-quiet) 55%, transparent);
  --dt-accent: var(--wa-color-brand-fill-loud);
  --dt-cell-padding: var(--wa-space-m);
  --dt-indent: 1.5em;
  --dt-toggle-size: 1.5rem;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  /* Bezugsrahmen für absolut positionierte Kinder — vor allem .vi-dt-live.
     Ohne das hängt die Live-Region am initialen Container (body) und entkommt
     JEDEM `overflow: hidden` der Vorfahren: sie liegt dann auf der
     Dokument-Position ihres Gitters und spannt den Scrollbereich der ganzen
     Seite auf (bei acht Gittern untereinander mehrere Tausend Pixel). */
  position: relative;
  color: var(--wa-color-text-normal);
  font-size: var(--wa-font-size-s);
}
.vi-dt.is-outlined {
  border: var(--dt-border-width) solid var(--dt-border-color);
  border-radius: var(--wa-border-radius-m);
  background-color: var(--wa-color-surface-default);
  overflow: hidden;
}

/* Größen: Zeilenhöhe, Polsterung und Textskala zusammen. */
.vi-dt.is-size-xs {
  --dt-row-height: 2rem;
  --dt-cell-padding: var(--wa-space-xs);
  font-size: var(--wa-font-size-xs);
}
.vi-dt.is-size-s {
  --dt-row-height: 2.5rem;
  --dt-cell-padding: var(--wa-space-s);
  font-size: var(--wa-font-size-s);
}
.vi-dt.is-size-l {
  --dt-row-height: 3.5rem;
  --dt-cell-padding: var(--wa-space-l);
  font-size: var(--wa-font-size-m);
}
.vi-dt.is-size-xl {
  --dt-row-height: 4rem;
  --dt-cell-padding: var(--wa-space-xl);
  font-size: var(--wa-font-size-l);
}

.vi-dt-toolbar {
  padding: var(--wa-space-s);
  border-block-end: var(--dt-border-width) solid var(--dt-border-color);
}
.vi-dt-search {
  min-inline-size: 14rem;
}

/* Ein Scroll-Bereich für Kopf, Körper und Fuß — nur so bleiben gepinnte
   Spalten und die Kopfzeile beim Scrollen in beiden Richtungen bündig. */
.vi-dt-scroller {
  position: relative;
  overflow: auto;
  /* Streckt sich, wenn die Tabelle eine feste Höhe hat (z. B. in einer
     füllenden Ansicht) — sonst bleibt sie inhaltshoch. Der Deckel gilt
     weiterhin für inhaltshohe Tabellen; wer füllen will, setzt von aussen
     `--dt-max-height: none`. */
  flex: 1 1 auto;
  min-block-size: 0;
  max-block-size: var(--dt-max-height, 30rem);
}
.vi-dt-head {
  position: sticky;
  inset-block-start: 0;
  z-index: 3;
}
/* Die Zeile gibt nur den Farbton als Variable vor und ordnet die Zellen an —
   gemalt wird in den ZELLEN.
   Grund: Die Zeilenbox ist nur so breit wie der sichtbare Bereich, ihre
   Spalten-Tracks können aber darüber hinausragen (waagerechtes Scrollen).
   Ein Hintergrund oder Rahmen auf der Zeile bricht deshalb mitten im Gitter
   ab — sichtbar als fehlende Trennlinie unter gepinnten Spalten, sobald man
   scrollt. Die Zellen decken dagegen die gesamte Breite ab. */
.vi-dt-row {
  --dt-row-bg: var(--wa-color-surface-default);
  display: grid;
  align-items: stretch;
  min-block-size: var(--dt-row-height, 2.75rem);
  background-color: transparent;
}
.vi-dt-headrow,
.vi-dt-footrow {
  --dt-row-bg: var(--dt-header-background);
  font-weight: 600;
}
.vi-dt.is-striped .vi-dt-row.is-odd {
  --dt-row-bg: var(--dt-stripe);
}
/* Rangfolge der Zeilenfarbe: Auswahl > Hover > Streifen > Grundfläche.
   Die Streifenregel braucht `.is-striped` am Wurzelelement und wiegt damit
   schwerer als ein schlichtes `.vi-dt-row.is-data:hover` — ohne die folgenden
   Präfixe bliebe auf ungeraden Zeilen weder Hover noch Auswahl sichtbar. */
.vi-dt .vi-dt-row.is-data:hover {
  --dt-row-bg: var(--dt-row-hover);
}
/* Auswahl per Zeilenklick: die Zeile signalisiert Klickbarkeit. */
.vi-dt.is-selectable .vi-dt-row.is-data {
  cursor: pointer;
}
.vi-dt .vi-dt-row.is-data.is-selected {
  --dt-row-bg: var(--dt-selected);
}
.vi-dt .vi-dt-row.is-data.is-selected:hover {
  --dt-row-bg: color-mix(in oklab, var(--dt-selected) 75%, var(--dt-row-hover));
}
.vi-dt-row.is-group {
  --dt-row-bg: var(--wa-color-surface-lowered);
  font-weight: 600;
}

.vi-dt-badges {
  display: inline-flex;
  gap: var(--wa-space-2xs, 0.25rem);
  flex-wrap: wrap;
  min-inline-size: 0;
}
.vi-dt-badge {
  --dt-badge-color: var(--wa-color-neutral-60, #71717a);
  display: inline-block;
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0.1em 0.55em;
  border-radius: var(--wa-border-radius-pill, 999px);
  font-size: 0.85em;
  font-weight: 600;
  line-height: 1.4;
  background: color-mix(in oklab, var(--dt-badge-color) 16%, var(--wa-color-surface-default, #fff));
  border: 1px solid color-mix(in oklab, var(--dt-badge-color) 45%, transparent);
  color: color-mix(in oklab, var(--dt-badge-color) 80%, var(--wa-color-text-normal, #222));
}
.vi-dt-cell {
  display: flex;
  align-items: center;
  gap: var(--wa-space-2xs);
  min-inline-size: 0;
  padding-inline: var(--dt-cell-padding);
  /* Farbton und Trennlinie trägt jede Zelle selbst (siehe .vi-dt-row). */
  background-color: var(--dt-row-bg);
  border-block-end: var(--dt-border-width) solid var(--dt-border-color);
  overflow: hidden;
}
.vi-dt-cell.is-lead {
  padding-inline: var(--wa-space-2xs);
  justify-content: center;
}
.vi-dt-cell.is-align-center {
  justify-content: center;
}
.vi-dt-cell.is-align-end {
  justify-content: flex-end;
}
.vi-dt-cell:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: -2px;
}
/* Gepinnte Zellen liegen ÜBER dem waagerecht scrollenden Inhalt und müssen ihn
   deckend verbergen. Die Zeilentöne (Streifen, Hover, Auswahl) sind
   teiltransparent (color-mix mit transparent), eine einfache
   `background-color: var(--dt-row-bg)` ließe den Inhalt also durchscheinen.
   Deshalb: deckende Grundfläche als Farbe, der Zeilenton als Auflage — das
   Ergebnis ist derselbe Farbwert wie bei den frei scrollenden Zellen. */
.vi-dt-cell.is-sticky {
  background-color: var(--wa-color-surface-default);
  background-image: linear-gradient(var(--dt-row-bg), var(--dt-row-bg));
}
.vi-dt-cell.is-pin-edge.is-pin-start {
  box-shadow: inset -1px 0 0 var(--dt-accent);
}
.vi-dt-cell.is-pin-edge.is-pin-end {
  box-shadow: inset 1px 0 0 var(--dt-accent);
}

.vi-dt-hcell.is-sortable {
  cursor: pointer;
  user-select: none;
}
.vi-dt-hcell.is-dragging {
  opacity: 0.5;
}
.vi-dt-hcell.is-drop-target {
  box-shadow: inset 2px 0 0 var(--dt-accent);
}
.vi-dt-hcell {
  padding-inline: var(--wa-space-s);
}
/* Die Beschriftung füllt den freien Platz — sonst rutschen Filter- und
   Menüknopf in die Mitte der Zelle und fangen den Sortier-Klick ab. */
.vi-dt-hcell .vi-dt-hlabel {
  flex: 1 1 auto;
  min-inline-size: 0;
  align-self: center;
}
.vi-dt-hcell.is-align-end .vi-dt-hlabel {
  text-align: end;
}
.vi-dt-hcell.is-align-center .vi-dt-hlabel {
  text-align: center;
}
/* Spaltenmenü nur zeigen, wenn die Spalte im Fokus/Hover ist — sonst frisst es
   die Beschriftung. (wa-dropdown selbst ist display:contents, also am Trigger.)
   Aktive Filter bleiben immer sichtbar. */
/* visibility statt display: der Knopf ist unsichtbar und NICHT anklickbar
   (fängt also den Sortier-Klick in der Zellmitte nicht ab), behält aber seinen
   Platz im Layout. Beides ist wichtig:
   - Mit display:none verlässt der Knopf das Layout. Ist sein Menü offen, hat
     das Popup plötzlich keinen Anker mehr und springt in die linke obere Ecke.
   - Außerdem würde die Kopfzeile bei jedem Hover-Wechsel umbrechen und offene
     Filter-Popover um die Knopfbreite verschieben. */
.vi-dt-column-menu-button {
  visibility: hidden;
}
.vi-dt-hcell:hover .vi-dt-column-menu-button,
.vi-dt-hcell:focus-within .vi-dt-column-menu-button,
.vi-dt-column-menu[open] .vi-dt-column-menu-button {
  visibility: visible;
}
.vi-dt-filter-button {
  opacity: 0.55;
}
.vi-dt-hcell:hover .vi-dt-filter-button,
.vi-dt-hcell:focus-within .vi-dt-filter-button,
.vi-dt-filter-button.is-active {
  opacity: 1;
}
.vi-dt-sort,
.vi-dt-pin {
  flex: 0 0 auto;
  font-size: 0.75em;
  color: var(--dt-accent);
}
.vi-dt-pin {
  cursor: pointer;
}
.vi-dt-sortnum {
  flex: 0 0 auto;
  font-size: 0.7em;
  font-variant-numeric: tabular-nums;
  padding-inline: 0.25em;
  border-radius: var(--wa-border-radius-s);
  background-color: var(--wa-color-brand-fill-quiet);
  color: var(--wa-color-brand-on-quiet);
}
.vi-dt-filter-button,
.vi-dt-column-menu-button {
  flex: 0 0 auto;
  font-size: 0.75em;
}
.vi-dt-filter-button::part(base),
.vi-dt-column-menu-button::part(base) {
  min-inline-size: 1.4rem;
  min-block-size: 1.4rem;
  padding: 0;
}
.vi-dt-filter-button.is-active::part(base) {
  color: var(--dt-accent);
}
.vi-dt-resize {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  inline-size: 10px;
  z-index: 1;
  cursor: col-resize;
  touch-action: none;
}
.vi-dt-resize:hover {
  background-color: color-mix(in oklab, var(--dt-accent) 35%, transparent);
}
.vi-dt-hcell {
  position: relative;
}

/* ── Baumstruktur sichtbar machen ──────────────────────────────────── */
/* Einrückung allein liest sich schlecht. Deshalb pro Ebene eine senkrechte
   Führungslinie (als Hintergrund-Muster über die eingerückte Fläche) und ein
   kurzer Winkel zur Zeile selbst — wie in einem Dateibaum. */
.vi-dt {
  --dt-guide: var(--wa-color-surface-border);
}
.vi-dt-cell.is-tree-cell {
  position: relative;
}
/* Ein Feld je Ebene. Die senkrechte Linie sitzt auf der MITTE des Feldes, damit
   sie durch die Aufklapp-Pfeile der jeweiligen Ebene läuft.
     is-line    → durchgehende Linie (Vorfahre hat noch Geschwister)
     is-tee     → „├" (diese Zeile hat noch Geschwister)
     is-corner  → „└" (letztes Kind: darunter bleibt es leer)
     ohne alles → leeres Feld (der Teilbaum ist dort zu Ende)
   Der Arm endet am Rand des Feldes — er läuft NICHT über den Pfeil oder den
   Blatt-Platzhalter hinweg bis zum Text. */
.vi-dt-guide {
  position: relative;
  flex: 0 0 auto;
  inline-size: var(--dt-indent);
  align-self: stretch;
}
.vi-dt-guide.is-line::before,
.vi-dt-guide.is-tee::before,
.vi-dt-guide.is-corner::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(50% - 0.5px);
  inline-size: 1px;
  background-color: var(--dt-guide);
}
/* Ecke: die senkrechte Linie endet auf halber Höhe. */
.vi-dt-guide.is-corner::before {
  inset-block: 0 50%;
}
/* Kurzer Arm von der Mitte zum Rand des Feldes. */
.vi-dt-guide.is-tee::after,
.vi-dt-guide.is-corner::after {
  content: "";
  position: absolute;
  inset-block-start: calc(50% - 0.5px);
  inset-inline: 50% 0;
  block-size: 1px;
  background-color: var(--dt-guide);
}

/* Pfeil und Blatt-Platzhalter MÜSSEN gleich breit sein — sonst stehen die
   Beschriftungen einer Ebene nicht untereinander und die Einrückung wird
   teilweise aufgefressen (der wa-button ist von sich aus breiter). */
.vi-dt-expand {
  flex: 0 0 auto;
  inline-size: var(--dt-toggle-size);
}
/* Nachgeladen und leer: der Pfeil bleibt an seinem Platz (kein Layoutsprung),
   ist aber sichtbar außer Betrieb. */
.vi-dt-expand.is-empty {
  opacity: 0.3;
  cursor: default;
}
.vi-dt-expand-spinner {
  font-size: 0.75em;
  --track-width: 2px;
}
/* Blätter: gleicher Abstand wie zwischen Pfeil und Führungslinien. */
.vi-dt-leaf-gap {
  flex: 0 0 auto;
  inline-size: var(--wa-space-2xs);
}

/* ── Feste Reihenfolge: Griff und Einfügemarke ─────────────────────── */
.vi-dt-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  color: var(--wa-color-text-quiet);
  cursor: grab;
  opacity: 0.55;
  font-size: 0.85em;
}
.vi-dt-row:hover .vi-dt-grip {
  opacity: 1;
}
.vi-dt-grip.is-disabled {
  cursor: not-allowed;
  opacity: 0.25;
}
.vi-dt-row.is-dragging {
  opacity: 0.5;
}
/* Marke, wo die Zeile landen würde. Als inset-Schatten, damit sie keine
   Layout-Höhe kostet und die Zeilen beim Ziehen nicht springen. */
.vi-dt-row.is-drop-before .vi-dt-cell {
  box-shadow: inset 0 2px 0 var(--dt-accent);
}
.vi-dt-row.is-drop-after .vi-dt-cell {
  box-shadow: inset 0 -2px 0 var(--dt-accent);
}
/* „Hinein": die Zeile wird Elternteil — deshalb ein Rahmen um die ganze Zeile
   statt einer Linie an der Kante. */
.vi-dt-row.is-drop-inside .vi-dt-cell {
  box-shadow:
    inset 0 2px 0 var(--dt-accent),
    inset 0 -2px 0 var(--dt-accent);
}
.vi-dt-row.is-drop-inside {
  --dt-row-bg: color-mix(in oklab, var(--dt-selected) 60%, transparent);
}

/* Die Aufklapp-Spalte liegt links der Baumzelle — ihre Linie führt weiter,
   damit Pfeil und Struktur zusammenhängen. */
.vi-dt-cell.is-lead.is-expand-cell {
  position: relative;
}
.vi-dt-expand::part(base) {
  inline-size: var(--dt-toggle-size);
  min-inline-size: var(--dt-toggle-size);
  block-size: var(--dt-toggle-size);
  min-block-size: var(--dt-toggle-size);
  padding: 0;
}
.vi-dt-group-count {
  padding-inline: var(--wa-space-2xs);
  border-radius: var(--wa-border-radius-pill);
  background-color: var(--wa-color-neutral-fill-quiet);
  font-size: 0.8em;
  font-variant-numeric: tabular-nums;
}
.vi-dt-aggregate {
  color: var(--wa-color-text-quiet);
  font-variant-numeric: tabular-nums;
}

.vi-dt-detailrow {
  border-block-end: var(--dt-border-width) solid var(--dt-border-color);
  background-color: var(--wa-color-surface-lowered);
}
.vi-dt-detail {
  padding: var(--wa-space-m);
}

.vi-dt-foot {
  position: sticky;
  inset-block-end: 0;
  z-index: 3;
}
.vi-dt-footrow .vi-dt-cell {
  border-block-end: none;
  border-block-start: var(--dt-border-width) solid var(--dt-border-color);
}

.vi-dt-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: var(--wa-space-2xl);
  color: var(--wa-color-text-quiet);
}
.vi-dt-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in oklab, var(--wa-color-surface-default) 65%, transparent);
  z-index: 4;
}
.vi-dt-spinner {
  font-size: 2rem;
}

.vi-dt-pager,
.vi-dt-more {
  padding: var(--wa-space-s);
  border-block-start: var(--dt-border-width) solid var(--dt-border-color);
  font-size: var(--wa-font-size-s);
}
.vi-dt-more > * {
  flex: 0 0 auto;
}
.vi-dt-moreinfo {
  color: var(--wa-color-text-quiet);
  white-space: nowrap;
}
.vi-dt-pager > * {
  flex: 0 0 auto;
}
.vi-dt-pagesize,
.vi-dt-pageinfo {
  white-space: nowrap;
}
.vi-dt-pageinfo {
  color: var(--wa-color-text-quiet);
}
.vi-dt-pagesize {
  font: inherit;
  min-inline-size: 6.5rem;
  padding: 0.15rem 0.35rem;
  border: var(--dt-border-width) solid var(--dt-border-color);
  border-radius: var(--wa-border-radius-s);
  background-color: var(--wa-color-surface-default);
  color: inherit;
}

.vi-dt-checkbox {
  accent-color: var(--dt-accent);
  inline-size: 1rem;
  block-size: 1rem;
}
.vi-dt-colopt {
  font-size: var(--wa-font-size-s);
  cursor: pointer;
}
/* Nur für Screenreader: unsichtbar, aber vorhanden. Bezugsrahmen ist .vi-dt
   (position: relative), damit die Region im Gitter geclippt bleibt. */
.vi-dt-live {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
