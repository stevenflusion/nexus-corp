"use client"

import { createContext, useContext, useEffect, useState } from "react"

type ThemeMode = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContext {
  mode: ThemeMode
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContext | null>(null)

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system")
  const [theme, setTheme] = useState<ResolvedTheme>("light")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null
    const initialMode = stored ?? "system"
    setModeState(initialMode)

    const resolved =
      initialMode === "system" ? getSystemTheme() : (initialMode as ResolvedTheme)
    setTheme(resolved)
    applyTheme(resolved)

    if (initialMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light"
        setTheme(next)
        applyTheme(next)
      }
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem("theme", newMode)

    const resolved = newMode === "system" ? getSystemTheme() : (newMode as ResolvedTheme)
    setTheme(resolved)
    applyTheme(resolved)
  }

  const toggleTheme = () => {
    setMode(theme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}