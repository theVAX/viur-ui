import rawBone from "./widgets/rawBone.vue"
import keyBone from "./widgets/keyBone.vue"
import stringBone from "./widgets/stringBone.vue"
import emailBone from "./widgets/emailBone.vue"
import dateBone from "./widgets/dateBone.vue"
import selectBone from "./widgets/selectBone.vue"
import booleanBone from "./widgets/booleanBone.vue"
import passwordBone from "./widgets/passwordBone.vue"
import recordBone from "./widgets/recordBone.vue"
import addressBone from "./widgets/addressBone.vue"
import colorBone from "./widgets/colorBone.vue"
import numericBone from "./widgets/numericBone.vue"
import relationalBone from "./widgets/relationalBone.vue"
import fileBone from "./widgets/fileBone.vue"
import spatialBone from "./widgets/spatialBone.vue"

import booleanBoneSelect from "./widgets/booleanBoneSelect.vue"
import booleanBoneChoose from "./widgets/booleanBoneChoose.vue"
import selectBoneChoose from "./widgets/selectBoneChoose.vue"
import relationalBoneSelect from "./widgets/relationalBoneSelect.vue"

import defaultBar from "./actionbar/defaultBar.vue"
import relationalBar from "./actionbar/relationalBar.vue"
import fileBar from "./actionbar/fileBar.vue"

import { reactive, shallowRef, defineAsyncComponent } from "vue"
import { defineStore } from "pinia"

// Heavy bones — lazy loaded so consumers don't pay for their deps unless used.
// json-editor-vue (~60KB+), libphonenumber-js (~150KB), CodeMirror suite (~200KB+),
// CKEditor5 suite (~400KB+) only land in the bundle when a form actually renders
// the corresponding bone type.
const jsonBone = defineAsyncComponent(() => import("./widgets/jsonBone.vue"))
const phoneBone = defineAsyncComponent(() => import("./widgets/phoneBone.vue"))
const codeBone = defineAsyncComponent(() => import("./widgets/codeBone.vue"))
const textBone = defineAsyncComponent(() => import("./widgets/textBone.vue"))

export const useBoneStore = defineStore("boneStore", () => {
  const state = reactive({
    additionalBones: shallowRef({}),
    defaultBones: shallowRef({
      rawBone,
      keyBone,
      stringBone,
      emailBone,
      dateBone,
      booleanBone,
      selectBone,
      passwordBone,
      recordBone,
      addressBone,
      numericBone,
      colorBone,
      relationalBone,
      jsonBone,
      fileBone,
      textBone,
      spatialBone,
      phoneBone,
      booleanBoneSelect,
      booleanBoneChoose,
      selectBoneChoose,
      relationalBoneSelect,
      codeBone,
    }),
    actionbars: shallowRef({
      "relational.tree.leaf.file.file": fileBar,
      "relational.": relationalBar,
    }),
    multibones: shallowRef(["select", "select."]),
  })

  function addBoneWidget(boneType, widget) {
    state.additionalBones[boneType] = widget
  }

  function importWidgets() {
    let bones = state.defaultBones
    for (const [k, v] of Object.entries(state.additionalBones)) {
      bones.add(v)
    }
    return bones
  }

  function getBoneWidget(boneType) {
    if (Object.keys(state.additionalBones).includes(boneType)) {
      //exact match
      return state.additionalBones[boneType]
    } else {
      let typeParts = boneType.split(".") //prefix match
      let matchingPrefixes = Object.entries(state.additionalBones).filter((prefix) =>
        prefix[0].startsWith(typeParts[0] + ".")
      )
      if (matchingPrefixes.length > 0) {
        matchingPrefixes.sort((a, b) => b.length - a.length)
        for (let prefix of matchingPrefixes) {
          if (boneType.startsWith(prefix[0])) {
            return state.additionalBones[prefix[0]]
          }
        }
      }
    }

    if (boneType === "date" || boneType.startsWith("date.")) {
      return dateBone
    } else if (boneType === "key") {
      return keyBone
    } else if (boneType === "str.email") {
      return emailBone
    } else if (boneType === "str.phone") {
      return phoneBone
    } else if (boneType === "str" || boneType.startsWith("str.")) {
      return stringBone
    } else if (boneType === "select.choose") {
      return selectBoneChoose
    } else if (boneType === "select" || boneType.startsWith("select.")) {
      return selectBone
    } else if (boneType === "bool.choose") {
      return booleanBoneChoose
    } else if (boneType === "bool.select") {
      return booleanBoneSelect
    } else if (boneType === "bool" || boneType.startsWith("bool.")) {
      return booleanBone
    } else if (boneType === "password" || boneType.startsWith("password.")) {
      return passwordBone
    } else if (boneType === "record.address" || boneType.startsWith("record.address.")) {
      return addressBone
    } else if (boneType === "record" || boneType.startsWith("record.")) {
      return recordBone
    } else if (boneType === "numeric" || boneType.startsWith("numeric.")) {
      return numericBone
    } else if (boneType === "relational.tree.leaf.file.file" || boneType.startsWith("relational.tree.leaf.file.")) {
      return fileBone
    } else if (boneType === "relational.select" || boneType.startsWith("relational.select.")) {
      return relationalBoneSelect
    } else if (boneType === "relational" || boneType.startsWith("relational.")) {
      return relationalBone
    } else if (boneType === "raw.json") {
      return jsonBone
    } else if (boneType.startsWith("raw.code.")) {
      return codeBone
    } else if (boneType === "color" || boneType.startsWith("color.")) {
      return colorBone
    } else if (boneType === "text" || boneType.startsWith("text.")) {
      return textBone
    } else if (boneType === "spatial" || boneType.startsWith("spatial.")) {
      return spatialBone
    }

    return rawBone
  }

  function addBoneActionbar(boneType, widget) {
    state.actionbars[boneType] = widget
  }

  function getBoneActionbar(boneType) {
    if (Object.keys(state.actionbars).includes(boneType)) {
      //exact match
      return state.actionbars[boneType]
    } else {
      let typeParts = boneType.split(".") //prefix match
      let matchingPrefixes = Object.entries(state.actionbars).filter((prefix) =>
        prefix[0].startsWith(typeParts[0] + ".")
      )
      if (matchingPrefixes.length > 0) {
        matchingPrefixes.sort((a, b) => b.length - a.length)
        for (let prefix of matchingPrefixes) {
          if (boneType.startsWith(prefix[0])) {
            return state.actionbars[prefix[0]]
          }
        }
      }
    }

    return defaultBar
  }

  return {
    state,
    addBoneWidget,
    getBoneWidget,
    importWidgets,

    addBoneActionbar,
    getBoneActionbar,
  }
})

export function addBoneActionbar(boneType, widget) {
  const boneStore = useBoneStore()
  return boneStore.addBoneActionbar(boneType, widget)
}

export function getBoneActionbar(boneType) {
  const boneStore = useBoneStore()
  return boneStore.getBoneActionbar(boneType)
}

export function getBoneWidget(boneType) {
  const boneStore = useBoneStore()
  return boneStore.getBoneWidget(boneType)
}

export function addBoneWidget(boneType, widget) {
  const boneStore = useBoneStore()
  boneStore.addBoneWidget(boneType, widget)
}

export function BoneHasMultipleHandling(boneType) {
  const boneStore = useBoneStore()
  if (boneStore.state.multibones.includes(boneType)) {
    return true
  } else {
    let typeParts = boneType.split(".") //prefix match
    let matchingPrefixes = Object.entries(boneStore.state.multibones).filter((prefix) =>
      prefix[1].startsWith(typeParts[0] + ".")
    )
    if (matchingPrefixes.length > 0) {
      matchingPrefixes.sort((a, b) => b.length - a.length)
      for (let prefix of matchingPrefixes) {
        if (boneType.startsWith(prefix[1])) {
          return true
        }
      }
    }
  }
  return false
}
