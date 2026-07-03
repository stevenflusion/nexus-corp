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
    return { success: false, error: "Por favor completa todos los campos." }
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
      if (response.status === 401) {
        return { success: false, error: "Email o contraseña incorrectos." }
      }
      if (response.status === 403) {
        return { success: false, error: "Tu cuenta está inactiva. Contacta al administrador." }
      }
      if (response.status === 500) {
        return { success: false, error: "Error del servidor. Intenta de nuevo más tarde." }
      }
      return { success: false, error: "No se pudo iniciar sesión. Verifica tus credenciales." }
    }

    const data = (await response.json()) as { token?: string }
    const token = data.token

    if (!token) {
      return { success: false, error: "Respuesta inválida del servidor." }
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
    return { success: false, error: "No se pudo conectar al servidor. Verifica tu conexión." }
  }
}
