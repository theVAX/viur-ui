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
        <span>{{ t("login.waiting") }}</span>
      </div>

      <template v-else-if="!store.isLoggedIn">
        <!-- The login flow is driven generically by the multistep form: it
             GET-renders /user/login and walks the v2 status/follow chain
             (chooser → userpassword → 2FA → success). -->
        <ViForm
          ref="viform"
          module="user"
          :action="action"
          :secure="true"
          multistep
          :renderer="renderer ?? undefined"
          :version="version ?? undefined"
          :show-steps="showSteps"
          :submit-label="t('login.login')"
          @success="onFormSuccess"
          @failed="onFailed"
        >
          <!-- Pass the form's own slots through so an app can supply its own
               chrome (the default action bar is Shoelace; a WebAwesome app
               replaces it here). Only forwarded when the consumer provides the
               slot, otherwise ViForm keeps its default. -->
          <template
            v-if="$slots.actions"
            #actions="actionProps"
          >
            <slot
              name="actions"
              v-bind="actionProps"
            />
          </template>
        </ViForm>

        <!-- Google is the one provider that isn't a form step (Identity SDK
             token), so it lives beside the form. -->
        <template v-if="effectiveGoogleClientId">
          <div class="viur-login__sep">{{ t("login.or") }}</div>
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
import { ref, computed, onMounted, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import ViForm from "../forms/ViForm.vue"
import { useRouter } from "vue-router"
import { useUserStore } from "./store.js"
import { useConfigStore } from "../request/configStore.js"
import { renderGoogleButton } from "./google.js"

const props = defineProps({
  title: { type: String, default: "Login" },
  // Endpoint below the `user` module that starts the flow. Envelope v2 drives
  // the whole chain from "login" (chooser → provider → 2FA). A classic v1
  // backend answers the chooser with the SAME step and no `follow`, so there
  // the provider is addressed directly, e.g. "auth_userpassword/login".
  action: { type: String, default: "login" },
  // override the request renderer (default: VITE_DEFAULT_RENDERER || "json")
  renderer: { type: String, default: null },
  // optionally pin the protocol version (default null → unversioned, server
  // aliases to the newest wire format / envelope v2)
  version: { type: [String, Number, null], default: null },
  // OAuth client id for "Sign in with Google". Omit to take the one the server
  // advertises via /vi/config ("admin.user.google.clientID"); pass `false` to
  // never show the Google button.
  googleClientId: { type: [String, Boolean], default: null },
  // render the multistep progress bar
  showSteps: { type: Boolean, default: false },
  // check for an existing session on mount (and skip login if authenticated)
  autoStart: { type: Boolean, default: true },
  // Where to go once the session stands (also when `autoStart` finds an
  // existing one). Routed through vue-router when the app has one, otherwise a
  // plain location change. Omit to stay put and handle it in `@success`.
  redirect: { type: String, default: null },
})
const emit = defineEmits(["success", "error"])

const store = useUserStore()
const configStore = useConfigStore()
const { t } = useI18n()
// Optional: ohne installierten Router ist das undefined — dann wird per
// location navigiert.
const router = useRouter()

// explicit prop wins; `false` disables; otherwise the server config decides
const effectiveGoogleClientId = computed(() => {
  if (props.googleClientId === false) return null
  return props.googleClientId || configStore.googleClientId
})

const viform = ref(null)
const googleBtn = ref(null)
const checking = ref(true)
const googleError = ref("")

// after a login: admin/root unlock the module part of /vi/config, so refresh
// it for them (skipped for everyone else). Config is optional for the login
// itself, so a failure is swallowed.
function loadAdminConfig() {
  return configStore.fetchConfig({ user: store.state.user }).catch(() => null)
}

async function onFormSuccess() {
  try {
    await store.fetchSelf()
    await loadAdminConfig()
  } finally {
    emit("success", store.state.user)
  }
  await goRedirect().catch(() => null)
}

function onFailed(error) {
  emit("error", error)
}

/**
 * Nach dem Anmelden weiterleiten, wenn `redirect` gesetzt ist. Läuft NACH dem
 * success-Emit, damit der Aufrufer den Benutzer noch in seinen eigenen Zustand
 * übernehmen kann (Rechte, Persona-Sichtbarkeit), bevor das Ziel rendert.
 */
async function goRedirect() {
  if (!props.redirect) return
  if (router) {
    await router.replace(props.redirect).catch(() => null)
    return
  }
  window.location.assign(props.redirect)
}

async function onGoogleToken(token) {
  googleError.value = ""
  // loginWithGoogle resolves null on a transport error and never rejects
  const body = await store.loginWithGoogle(token).catch(() => null)
  if (!body) {
    googleError.value = t("login.google_error")
    emit("error", "google")
    return
  }
  if (body.status === "success" || body.action === "login_success") {
    await configStore.fetchConfig({ user: store.state.user }).catch(() => null)
    emit("success", store.state.user)
    await goRedirect().catch(() => null)
    return
  }
  // Google login needs a second factor → continue in the generic form flow.
  // loadStep manages its own loading/error state, so it need not be awaited.
  if (body.follow && viform.value?.loadStep) {
    viform.value.loadStep(body.follow)
  }
}

async function mountGoogleButton() {
  if (checking.value || store.isLoggedIn || !effectiveGoogleClientId.value) return
  try {
    await nextTick()
    await renderGoogleButton(googleBtn.value, effectiveGoogleClientId.value, onGoogleToken)
  } catch {
    /* SDK failed to load — the form login still works */
  }
}

onMounted(async () => {
  store.configure({ renderer: props.renderer ?? undefined })
  try {
    // public settings (google client id, languages) BEFORE anything renders;
    // without config the form login still works
    if (!configStore.isLoaded) await configStore.fetchConfig().catch(() => null)
    store.configure({ googleClientId: effectiveGoogleClientId.value })
    if (props.autoStart) {
      await store.fetchSelf()
      if (store.isLoggedIn) {
        await loadAdminConfig()
        emit("success", store.state.user)
        await goRedirect()
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
