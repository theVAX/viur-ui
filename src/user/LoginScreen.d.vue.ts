import type { DefineComponent } from "vue"

/** Props von LoginScreen.vue (siehe defineProps dort). */
export interface LoginScreenProps {
  /** Überschrift der Karte; per `header`-Slot ersetzbar. */
  title?: string
  /**
   * Endpunkt unterhalb des `user`-Moduls, der den Ablauf startet. Envelope v2
   * fährt die ganze Kette ab "login". viur-core 3.9 (klassisches v1) antwortet
   * auf "login" mit der Provider-Auswahl; die Kette führt der LoginScreen dann
   * selbst wie vi-vue-utils (Passwort, Passwort vergessen, zweiter Faktor).
   */
  action?: string
  /** Renderer für die Requests; Standard: VITE_DEFAULT_RENDERER oder "json". */
  renderer?: string | null
  /** Protokollversion festnageln; null → unversioniert (Server wählt v2). */
  version?: string | number | null
  /**
   * OAuth-Client-ID für „Sign in with Google". Ohne Angabe wird die vom Server
   * per `/vi/config` ("admin.user.google.clientID") gelieferte ID genutzt;
   * `false` blendet den Knopf immer aus.
   */
  googleClientId?: string | false | null
  /**
   * Hintergrundbild der App, falls die Konfiguration keines setzt
   * ("admin.login.background" leer). Wie dort: absolute URLs bleiben, "/…" ist
   * ein Pfad auf dem Backend, alles andere ein Asset der App (unter BASE_URL).
   */
  backgroundImage?: string | null
  /** Logo über dem Login, falls "admin.login.logo" leer ist (Auflösung wie oben). */
  logo?: string | null
  /** Fortschrittsleiste des Multistep-Formulars zeigen. */
  showSteps?: boolean
  /** Beim Mounten eine bestehende Session prüfen und den Login überspringen. */
  autoStart?: boolean
  /**
   * Ziel nach erfolgreicher Anmeldung (auch wenn `autoStart` eine bestehende
   * Session findet). Läuft über vue-router, falls die Anwendung einen hat,
   * sonst über `location`. Ohne Angabe bleibt die Ansicht stehen und der
   * Aufrufer entscheidet in `@success`.
   */
  redirect?: string
}

/** Ereignisse als `on*`-Props, damit `@success` / `@error` im Template typen. */
export interface LoginScreenEmitProps {
  /** Angemeldet — mit den Werten des UserSkel. */
  onSuccess?: (user: Record<string, any> | null) => void
  /** Login fehlgeschlagen (Formularfehler, Transport, "google"). */
  onError?: (error: unknown) => void
}

declare const LoginScreen: DefineComponent<LoginScreenProps & LoginScreenEmitProps, {}, any>
export default LoginScreen
