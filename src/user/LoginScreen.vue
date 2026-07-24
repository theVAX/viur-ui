<template>
  <div class="viur-login">
    <div class="viur-login__card">
      <slot name="header">
        <h1 class="viur-login__title">{{ title }}</h1>
      </slot>

      <!-- checking for an existing session -->
      <div
        v-if="checking"
        class="viur-login__loading"
      >
        <wa-spinner></wa-spinner>
        <span>{{ tr("waiting", "lade...") }}</span>
      </div>

      <template v-else-if="!store.isLoggedIn">
        <!-- The login flow is driven generically by the multistep form: it
             GET-renders /user/login and walks the v2 status/follow chain
             (chooser → userpassword → 2FA → success). -->
        <ViForm
          ref="viform"
          module="user"
          action="login"
          :secure="true"
          multistep
          :renderer="renderer ?? undefined"
          :version="version ?? undefined"
          :show-steps="showSteps"
          :submit-label="tr('login', 'Anmelden')"
          @success="onFormSuccess"
          @failed="onFailed"
        />

        <!-- Google is the one provider that isn't a form step (Identity SDK
             token), so it lives beside the form. -->
        <template v-if="googleClientId">
          <div class="viur-login__sep">{{ tr("or", "oder") }}</div>
          <div
            ref="googleBtn"
            class="viur-login__google"
          ></div>
          <p
            v-if="googleError"
            class="viur-login__error"
          >
            {{ googleError }}
          </p>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import ViForm from "../forms/ViForm.vue"
import { useUserStore } from "./store.js"
import { renderGoogleButton } from "./google.js"

const props = defineProps({
  title: { type: String, default: "Login" },
  // override the request renderer (default: VITE_DEFAULT_RENDERER || "json")
  renderer: { type: String, default: null },
  // optionally pin the protocol version (default null → unversioned, server
  // aliases to the newest wire format / envelope v2)
  version: { type: [String, Number, null], default: null },
  // OAuth client id for "Sign in with Google"; omit to hide the Google button
  googleClientId: { type: String, default: null },
  // render the multistep progress bar
  showSteps: { type: Boolean, default: false },
  // check for an existing session on mount (and skip login if authenticated)
  autoStart: { type: Boolean, default: true },
})
const emit = defineEmits(["success", "error"])

const store = useUserStore()
const { t } = useI18n()

// use a translation when present, else the German fallback
function tr(key, fallback) {
  const full = `login.${key}`
  const value = t(full)
  return value === full ? fallback : value
}

const viform = ref(null)
const googleBtn = ref(null)
const checking = ref(true)
const googleError = ref("")

async function onFormSuccess() {
  await store.fetchSelf()
  emit("success", store.state.user)
}

function onFailed(error) {
  emit("error", error)
}

async function onGoogleToken(token) {
  googleError.value = ""
  const body = await store.loginWithGoogle(token)
  if (!body) {
    googleError.value = tr("google_error", "Ein Fehler ist beim Login aufgetreten.")
    emit("error", "google")
    return
  }
  if (body.status === "success" || body.action === "login_success") {
    emit("success", store.state.user)
    return
  }
  // Google login needs a second factor → continue in the generic form flow.
  // loadStep manages its own loading/error state, so it need not be awaited.
  if (body.follow && viform.value?.loadStep) {
    viform.value.loadStep(body.follow)
  }
}

async function mountGoogleButton() {
  if (checking.value || store.isLoggedIn || !props.googleClientId) return
  try {
    await nextTick()
    await renderGoogleButton(googleBtn.value, props.googleClientId, onGoogleToken)
  } catch {
    /* SDK failed to load — the form login still works */
  }
}

onMounted(async () => {
  store.configure({ renderer: props.renderer ?? undefined, googleClientId: props.googleClientId })
  try {
    if (props.autoStart) {
      await store.fetchSelf()
      if (store.isLoggedIn) {
        emit("success", store.state.user)
        return
      }
    }
    await mountGoogleButton()
  } finally {
    checking.value = false
    // button lives behind v-else-if; (re)mount it now that `checking` is false
    if (!store.isLoggedIn) mountGoogleButton()
  }
})
</script>

<style scoped>
.viur-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--wa-space-l, 1.5rem);
}

.viur-login__card {
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-m, 1rem);
  width: 100%;
  max-width: 24rem;
  padding: var(--wa-space-xl, 2rem);
  border-radius: var(--wa-border-radius-l, 0.75rem);
  background: var(--wa-color-surface-default, #fff);
  box-shadow: var(--wa-shadow-m, 0 4px 16px rgb(0 0 0 / 12%));
}

.viur-login__title {
  margin: 0;
  text-align: center;
  font-size: 1.25rem;
}

.viur-login__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wa-space-s, 0.5rem);
  padding: var(--wa-space-l, 1.5rem);
  font-size: 1.5rem;
}

.viur-login__sep {
  text-align: center;
  color: var(--wa-color-text-quiet, #6b7280);
  font-size: 0.85rem;
}

.viur-login__google {
  display: flex;
  justify-content: center;
}

.viur-login__error {
  margin: 0;
  color: var(--wa-color-danger-fill-loud, #dc2626);
  font-size: 0.85rem;
  text-align: center;
}
</style>
