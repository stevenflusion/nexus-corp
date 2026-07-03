"use server"

import { cookies } from "next/headers"

const COOKIE_NAME = "auth-token"
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60

export type LoginState = {
  success: boolean
  error?: string
}

/**
 * Server Action that authenticates an admin user against the backend API.
 *
 * The server-only API_KEY and API_URL are read from process.env, so they are
 * never exposed to the client bundle. On success the returned JWT is stored in
 * an httpOnly cookie.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const apiKey = process.env.API_KEY
  const apiUrl = process.env.API_URL

  if (!apiKey || !apiUrl) {
    return { success: false, error: "Configuración incompleta del servidor" }
  }

  const email = formData.get("email")?.toString().trim() ?? ""
  const password = formData.get("password")?.toString() ?? ""

  if (!email || !password) {
    return { success: false, error: "Credenciales inválidas" }
  }

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        email_admin_users: email,
        password_admin_users: password,
      }),
    })

    if (!response.ok) {
      return { success: false, error: "Credenciales inválidas" }
    }

    const data = (await response.json()) as { token?: string }
    const token = data.token

    if (!token) {
      return { success: false, error: "Credenciales inválidas" }
    }

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EIGHT_HOURS_IN_SECONDS,
      path: "/",
    })

    return { success: true }
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." }
  }
}
