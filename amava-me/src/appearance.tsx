import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeName = 'soft' | 'garden' | 'simple'
const THEME_KEY = 'amava.theme'
const FS_KEY = 'amava.fsUser'
const FS_MIN = 0.9, FS_MAX = 1.35
function clampFs(n: number): number { return Math.min(FS_MAX, Math.max(FS_MIN, n)) }

function readTheme(): ThemeName {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'garden' || v === 'simple' ? v : 'soft'
}
function readFs(): number {
  const v = Number(localStorage.getItem(FS_KEY))
  return Number.isFinite(v) && v > 0 ? clampFs(v) : 1
}

interface AppearanceValue {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  fsUser: number
  setFsUser: (n: number) => void
}
const Ctx = createContext<AppearanceValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readTheme)
  const [fsUser, setFsState] = useState<number>(readFs)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--fs-user', String(fsUser))
  }, [theme, fsUser])

  function setTheme(t: ThemeName) { localStorage.setItem(THEME_KEY, t); setThemeState(t) }
  function setFsUser(n: number) {
    const clamped = clampFs(n)
    localStorage.setItem(FS_KEY, String(clamped)); setFsState(clamped)
  }

  return <Ctx.Provider value={{ theme, setTheme, fsUser, setFsUser }}>{children}</Ctx.Provider>
}

export function useAppearance(): AppearanceValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppearance must be used within AppearanceProvider')
  return v
}
