/**
 * Werte des UserSkel, wie das Backend sie liefert. Nur die Felder, auf die sich
 * der Store selbst stützt, sind benannt — der Rest bleibt offen, weil das Skel
 * pro Projekt erweitert wird.
 */
export interface UserSkelValues {
  key?: string
  name?: string
  firstname?: string
  lastname?: string
  access?: string[]
  status?: number | string
  [field: string]: unknown
}

export type UserStatus = "unknown" | "loading" | "authenticated" | "anonymous"

export interface UserStoreState {
  /** Angemeldeter Benutzer oder null. */
  user: UserSkelValues | null
  status: UserStatus
  /** Renderer der Requests (Standard: VITE_DEFAULT_RENDERER oder "json"). */
  renderer: string
  googleClientId: string | null
}

/**
 * Der Store, wie ihn `useUserStore()` liefert. Die Getter stehen als Werte da,
 * weil Pinia die Refs eines Setup-Stores am Store-Objekt entpackt.
 */
export interface UserStore {
  state: UserStoreState
  isLoggedIn: boolean
  /** Rechte des Benutzers (leer, wenn keiner angemeldet ist). */
  access: string[]
  isRoot: boolean
  isAdmin: boolean
  /** Root gilt immer als berechtigt. */
  hasAccess: (right: string) => boolean
  /** Kurzform des Namens für Oberflächen, "-" ohne Benutzer. */
  shortName: string
  configure: (options?: { renderer?: string; googleClientId?: string | null }) => void
  /** Session laden. Ergibt null, wenn niemand angemeldet ist (401). */
  fetchSelf: () => Promise<UserSkelValues | null>
  logout: () => Promise<void>
  reset: () => void
  /**
   * Klassische Kette (viur-core 3.9): einen Schritt per GET rendern — Endpunkt
   * unterhalb von `user` (Standard "login") oder eine Server-URL. Liefert die
   * normalisierte Antwort; wirft bei einem Transportfehler.
   */
  loadLoginStep: (target?: string) => Promise<Record<string, any>>
  /** Primären Provider ohne eigenes Widget wählen; `next_url` ist sein erster Schritt. */
  selectAuthenticationProvider: (provider: string) => Promise<Record<string, any>>
  /** Google-Identity-Token anmelden; liefert die normalisierte Antwort. */
  loginWithGoogle: (token: string) => Promise<Record<string, any> | null>
}

export declare function useUserStore(): UserStore
