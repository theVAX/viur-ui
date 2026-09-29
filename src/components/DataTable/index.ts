// Public surface of the DataTable widget.
export { default as DataTable } from "./DataTable.vue"
export { default as ColumnFilterPanel } from "./ColumnFilterPanel.vue"
export * from "./types"
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
} from "./columns"
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
} from "./rows"
export { useColumnLayout, type ColumnLayout, type LayoutColumn } from "./useColumnLayout"
export { useGridNavigation } from "./useGridNavigation"
export { useVirtualRows } from "./useVirtualRows"
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
} from "./viurColumns"
// ViurDataTable is (like ViurBrowser) a JS SFC — its types live in
// ViurDataTable.d.vue.ts (import: ".../DataTable/ViurDataTable.d.vue", as
// with ViForm).
// @ts-expect-error — JS SFC without embedded typing
export { default as ViurDataTable } from "./ViurDataTable.vue"
