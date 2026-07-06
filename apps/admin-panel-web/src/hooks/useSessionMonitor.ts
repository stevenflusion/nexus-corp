"use client"

import { useContext } from "react"
import {
  SessionMonitorContext,
  type SessionMonitorState,
} from "@/components/session-monitor-provider"

export function useSessionMonitor(): SessionMonitorState {
  return useContext(SessionMonitorContext)
}
