import { reactive } from 'vue'

export function createMainformState(skel = {}, readonly = false) {
  return reactive({ skel, readonly, renderer: 'json' })
}
