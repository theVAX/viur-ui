import { defineAsyncComponent } from "vue"

// --------------------------------------------------------------------------- //
// Global registration of the form wrappers                                    //
// --------------------------------------------------------------------------- //
//
// The form templates reference their wrappers by NAME (`<bone>`, `<bone-label>`,
// `<bone-actions>`, …). Vue resolves those names in the scope of the component
// that RENDERS them — inside this package — so a consumer app has to register
// them GLOBALLY. The bone widgets themselves are resolved dynamically through
// the bone store and need no registration.
//
// Registration is async on purpose: the form tree is large (every bone widget,
// plus their editors), and an app that merely embeds a login must not pay for
// it on every page load. `defineAsyncComponent` defers each import until a
// form is actually rendered.
//
// Keeping the list here instead of in every consumer means a rename inside the
// package cannot silently break the apps that embed the forms.
//
//   import { installViurForms } from "viur-ui/src/forms/install.js"
//   installViurForms(app)
//
const components = {
  ViForm: () => import("./ViForm.vue"),
  "vi-form": () => import("./ViForm.vue"),
  "vi-form-category": () => import("./ViFormCategory.vue"),
  Bone: () => import("./bones/Bone.vue"),
  bone: () => import("./bones/Bone.vue"),
  "bone-label": () => import("./bones/BoneLabel.vue"),
  "bone-actions": () => import("./bones/BoneActions.vue"),
  "bone-single-entry": () => import("./bones/BoneSingleEntry.vue"),
  "bone-multiple-list": () => import("./bones/BoneMultipleList.vue"),
  "bone-multiple-wrapper": () => import("./bones/BoneMultipleWrapper.vue"),
  "bone-nested-wrapper": () => import("./bones/BoneNestedWrapper.vue"),
}

/** @param {import("vue").App} app */
export function installViurForms(app) {
  for (const [name, loader] of Object.entries(components)) {
    if (!app.component(name)) app.component(name, defineAsyncComponent(loader))
  }
}
