"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE_NAME = "auth-token"

/**
 * Server Action that clears the auth session and redirects to the login page.
 *
 * The backend logout endpoint is called best-effort; even if it fails the
 * local cookie is removed so the user is signed out of the admin panel.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  // Best-effort backend logout audit call.
  if (token) {
    const apiUrl = process.env.API_URL
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })
      } catch {
        // Ignore backend errors; the cookie is the source of truth for the UI.
      }
    }
  }

  cookieStore.delete(COOKIE_NAME)
  redirect("/")
}
