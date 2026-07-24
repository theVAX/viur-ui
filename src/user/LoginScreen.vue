<template>
  <div class="viur-login">
    <div class="viur-login__card">
      <slot name="header">
        <h1 class="viur-login__title">{{ title }}</h1>
      </slot>

      <sl-alert
        v-if="store.state.errorMessage"
        variant="danger"
        open
        class="viur-login__alert"
      >
        <wa-icon
          slot="icon"
          name="triangle-exclamation"
        ></wa-icon>
        {{ store.state.errorMessage }}
      </sl-alert>

      <!-- loading -->
      <div
        v-if="store.state.step === 'loading'"
        class="viur-login__loading"
      >
        <wa-spinner></wa-spinner>
        <span>{{ tr("waiting", "lade...") }}</span>
      </div>

      <!-- primary provider chooser -->
      <div
        v-else-if="store.state.step === 'provider'"
        class="viur-login__providers"
      >
        <p class="viur-login__hint">{{ tr("choose_method", "Anmeldemethode wählen") }}</p>
        <wa-button
          v-for="(name, url) in store.passwordProviders"
          :key="url"
          variant="brand"
          appearance="filled"
          @click="store.chooseProvider(url)"
        >
          {{ name }}
        </wa-button>

        <template v-if="showGoogle">
          <div
            v-if="Object.keys(store.passwordProviders).length"
            class="viur-login__sep"
          >
            {{ tr("or", "oder") }}
          </div>
          <div
            ref="googleBtn"
            class="viur-login__google"
          ></div>
        </template>
      </div>

      <!-- username / password -->
      <form
        v-else-if="store.state.step === 'userpassword'"
        class="viur-login__form"
        @submit.prevent="submitPassword"
      >
        <wa-input
          :label="tr('email', 'E-Mail Adresse')"
          type="email"
          name="name"
          autocomplete="username"
          autofocus
          required
          :value="creds.name"
          :help-text="fieldError('name')"
          @input="creds.name = $event.target.value"
        ></wa-input>
        <wa-input
          :label="tr('password', 'Passwort')"
          type="password"
          name="password"
          autocomplete="current-password"
          password-toggle
          required
          :value="creds.password"
          :help-text="fieldError('password')"
          @input="creds.password = $event.target.value"
        ></wa-input>
        <wa-button
          type="submit"
          variant="brand"
          appearance="filled"
          :loading="busy"
        >
          {{ tr("login", "Anmelden") }}
        </wa-button>
        <a
          v-if="canGoBack"
          class="viur-login__back"
          @click="store.backToProviders"
        >
          {{ tr("back", "zurück") }}
        </a>
      </form>

      <!-- second-factor chooser -->
      <div
        v-else-if="store.state.step === 'secondfactor_choice'"
        class="viur-login__providers"
      >
        <p class="viur-login__hint">{{ tr("choose_second_factor", "Zweiten Faktor wählen") }}</p>
        <wa-button
          v-for="(name, url) in store.state.secondFactors"
          :key="url"
          variant="brand"
          appearance="filled"
          @click="store.chooseSecondFactor(url)"
        >
          {{ name }}
        </wa-button>
      </div>

      <!-- second-factor OTP -->
      <form
        v-else-if="store.state.step === 'secondfactor'"
        class="viur-login__form"
        @submit.prevent="submitOtp"
      >
        <p class="viur-login__hint">{{ tr("second_factor", "Zwei-Faktor-Bestätigung") }}</p>
        <wa-input
          :label="tr('otp_label', 'Einmal-Code')"
          name="otptoken"
          inputmode="numeric"
          autocomplete="one-time-code"
          autofocus
          required
          :value="otp"
          :help-text="fieldError('otptoken')"
          @input="otp = $event.target.value"
        ></wa-input>
        <wa-button
          type="submit"
          variant="brand"
          appearance="filled"
          :loading="busy"
        >
          {{ tr("otp", "Bestätigen") }}
        </wa-button>
      </form>

      <!-- done -->
      <div
        v-else-if="store.state.step === 'done'"
        class="viur-login__done"
      >
        <slot name="done">
          <wa-icon name="circle-check"></wa-icon>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import { useUserStore } from "./store.js"
import { renderGoogleButton } from "./google.js"

const props = defineProps({
  title: { type: String, default: "Login" },
  // override the request renderer (default: VITE_DEFAULT_RENDERER || "json")
  renderer: { type: String, default: null },
  // OAuth client id for "Sign in with Google"; omit to hide the Google button
  googleClientId: { type: String, default: null },
  // start the login flow (GET /user/login) on mount
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

const creds = reactive({ name: "", password: "" })
const otp = ref("")
const googleBtn = ref(null)

const busy = computed(() => store.state.step === "loading")
const showGoogle = computed(() => store.hasGoogle && !!store.state.googleClientId)
const canGoBack = computed(() => Object.keys(store.passwordProviders).length + (store.hasGoogle ? 1 : 0) > 1)

function fieldError(path) {
  const err = (store.state.fieldErrors || []).find(
    (e) => e.fieldPath === path || (typeof e.fieldPath === "string" && e.fieldPath.endsWith(path))
  )
  return err?.errorMessage || ""
}

function submitPassword() {
  store.loginWithPassword({ name: creds.name, password: creds.password })
}
function submitOtp() {
  store.submitSecondFactor({ otptoken: otp.value })
}

watch(
  () => store.state.step,
  (step) => {
    if (step === "done") emit("success", store.state.user)
  }
)
watch(
  () => store.state.errorMessage,
  (message) => {
    if (message) emit("error", message)
  }
)

// (re)render the Google button whenever the provider step shows it
watch(
  [() => store.state.step, showGoogle],
  async ([step, visible]) => {
    if (step !== "provider" || !visible) return
    try {
      await nextTick()
      await renderGoogleButton(googleBtn.value, store.state.googleClientId, (token) => store.loginWithGoogle(token))
    } catch {
      /* SDK failed to load — password login still works */
    }
  },
  { immediate: true }
)

onMounted(() => {
  store.configure({ renderer: props.renderer ?? undefined, googleClientId: props.googleClientId })
  if (props.autoStart) store.loadLogin()
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

.viur-login__providers,
.viur-login__form {
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-m, 1rem);
}

.viur-login__hint {
  margin: 0;
  color: var(--wa-color-text-quiet, #6b7280);
  font-size: 0.9rem;
}

.viur-login__loading,
.viur-login__done {
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

.viur-login__back {
  align-self: center;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--wa-color-text-quiet, #6b7280);
}

.viur-login__back:hover {
  text-decoration: underline;
}
</style>
