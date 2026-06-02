import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeName = 'soft' | 'garden' | 'simple'
const THEME_KEY = 'amava.theme'
const FS_KEY = 'amava.fsUser'

function readTheme(): ThemeName {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'garden' || v === 'simple' ? v : 'soft'
}
function readFs(): number {
  const v = Number(localStorage.getItem(FS_KEY))
  return v >= 0.9 && v <= 1.35 ? v : 1
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
    const clamped = Math.min(1.35, Math.max(0.9, n))
    localStorage.setItem(FS_KEY, String(clamped)); setFsState(clamped)
  }

  return <Ctx.Provider value={{ theme, setTheme, fsUser, setFsUser }}>{children}</Ctx.Provider>
}

export function useAppearance(): AppearanceValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppearance must be used within AppearanceProvider')
  return v
}
