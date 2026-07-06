"use client"

import {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { toast } from "sonner"
import { logoutAction } from "@/app/actions/logout"

export type SessionMonitorState = {
  valid: boolean
  reason?: string
  expiresAt?: string
  isMagicLink: boolean
}

const SessionMonitorContext = createContext<SessionMonitorState>({
  valid: true,
  isMagicLink: false,
})

const POLL_INTERVAL_MS = 30_000

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;)\\s*${name}\\s*=\\s*([^;]+)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

function broadcastInvalidate(reason: string) {
  if (typeof BroadcastChannel !== "undefined") {
    const bc = new BroadcastChannel("magic-link-session")
    bc.postMessage({ type: "magic-link-invalidated", reason })
    bc.close()
  }
  localStorage.setItem(
    "magic-link-invalidated",
    JSON.stringify({ reason, time: Date.now() })
  )
  setTimeout(() => {
    localStorage.removeItem("magic-link-invalidated")
  }, 100)
}

export function SessionMonitorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<
    Omit<SessionMonitorState, "isMagicLink"> | null
  >(null)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const logoutTriggered = useRef(false)

  const triggerLogout = useCallback((reason: string) => {
    if (logoutTriggered.current) return
    logoutTriggered.current = true

    if (reason === "revoked") {
      toast("link revocado", {
        description:
          "Tu acceso fue revocado. Serás redirigido en unos segundos.",
      })
    } else {
      toast("tiempo superado", {
        description:
          "Tu sesión expiró. Serás redirigido en unos segundos.",
      })
    }

    broadcastInvalidate(reason)

    setTimeout(() => {
      logoutAction()
    }, 3500)
  }, [])

  useEffect(() => {
    const expCookie = getCookieValue("magic-link-exp")
    if (!expCookie) {
      setIsMagicLink(false)
      return
    }

    setIsMagicLink(true)
    setState({ valid: true, expiresAt: expCookie })

    let intervalId: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const res = await fetch("/api/auth/magic-link/session", {
          method: "GET",
          credentials: "same-origin",
        })

        if (!res.ok) {
          triggerLogout("expired")
          return
        }

        const data = await res.json()
        const nextState = {
          valid: !!data.valid,
          reason: typeof data.reason === "string" ? data.reason : undefined,
          expiresAt:
            typeof data.expiresAt === "string" ? data.expiresAt : undefined,
        }
        setState(nextState)

        if (!nextState.valid) {
          triggerLogout(nextState.reason || "expired")
        }
      } catch {
        // Ignore network errors on poll; the next interval will retry.
      }
    }

    poll()
    intervalId = setInterval(poll, POLL_INTERVAL_MS)

    let bc: BroadcastChannel | null = null
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "magic-link-invalidated" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue)
          triggerLogout(payload.reason || "expired")
        } catch {
          triggerLogout("expired")
        }
      }
    }

    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("magic-link-session")
      bc.onmessage = (ev) => {
        if (ev.data?.type === "magic-link-invalidated") {
          triggerLogout(ev.data.reason || "expired")
        }
      }
    } else {
      window.addEventListener("storage", handleStorage)
    }

    return () => {
      clearInterval(intervalId)
      if (bc) bc.close()
      else window.removeEventListener("storage", handleStorage)
    }
  }, [triggerLogout])

  const value: SessionMonitorState = {
    valid: state?.valid ?? true,
    reason: state?.reason,
    expiresAt: state?.expiresAt,
    isMagicLink,
  }

  return (
    <SessionMonitorContext.Provider value={value}>
      {children}
    </SessionMonitorContext.Provider>
  )
}

export { SessionMonitorContext }
