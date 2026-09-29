// Public surface of the DataTable widget.
export { default as DataTable } from "./DataTable.vue"
export { default as ColumnFilterPanel } from "./ColumnFilterPanel.vue"
export * from "./types.ts"
export {
  aggregate,
  aggregateColumn,
  compareValues,
  computeFacets,
  defaultText,
  findColumn,
  firstValueOf,
  getPath,
  isEmptyFilter,
  isEmptyValue,
  matchesFilter,
  nextSortState,
  resolveColumns,
  rowMatchesFilters,
  rowMatchesSearch,
  sortRows,
} from "./columns.ts"
export {
  buildRows,
  collectKeys,
  flattenNodes,
  isDescendant,
  locateNode,
  nestByParent,
  orderValueFor,
  paginateNodes,
  selectionStateFor,
  type BuildRowsOptions,
  type BuiltRows,
  type ChildRowsAccessor,
  type NestedTree,
  type NodeLocation,
  type OrderValue,
  type SelectionState,
} from "./rows.ts"
export { useColumnLayout, type ColumnLayout, type LayoutColumn } from "./useColumnLayout.ts"
export { useGridNavigation } from "./useGridNavigation.ts"
export { useVirtualRows } from "./useVirtualRows.ts"
export {
  badgesForBone,
  boneFamily,
  boneText,
  columnsFromStructure,
  selectToneMap,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  type BoneDescription,
  type BoneStructure,
  type ColumnsFromStructureOptions,
} from "./viurColumns.ts"
// ViurDataTable is (like ViurBrowser) a JS SFC — its types live in
// ViurDataTable.d.vue.ts (import: ".../DataTable/ViurDataTable.d.vue", as
// with ViForm).
// @ts-expect-error — JS SFC without embedded typing
export { default as ViurDataTable } from "./ViurDataTable.vue"
