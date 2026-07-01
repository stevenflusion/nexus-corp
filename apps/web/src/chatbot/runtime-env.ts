const importMetaEnv = (import.meta.env ?? {}) as Record<
  string,
  string | undefined
>

export const readEnv = (name: string, fallback = "") => {
  const runtimeValue =
    typeof process !== "undefined" ? process.env[name] : undefined

  return runtimeValue ?? importMetaEnv[name] ?? fallback
}

export const readFirstEnv = (names: string[], fallback = "") => {
  for (const name of names) {
    const value = readEnv(name)

    if (value.trim()) {
      return value
    }
  }

  return fallback
}

export const normalizePhoneNumber = (value = "") => value.replace(/[^\d]/g, "")

export const isConfigured = (value?: string) => Boolean(value?.trim())
