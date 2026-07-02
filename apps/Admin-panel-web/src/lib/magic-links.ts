// Repository facade — client-side mock with simulated async.
// All methods return Promises with setTimeout delay to simulate API calls.
// Mutations persist in-memory for the session.

import {
  MagicLink,
  CreateMagicLinkInput,
  MagicLinkFilters,
  ActivityLogEntry,
} from "./types"
import { MOCK_MAGIC_LINKS } from "@/data/mock-magic-links"

// In-memory state (mutated by operations)
let mockDb: MagicLink[] = [...MOCK_MAGIC_LINKS]

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function delayReject(error: Error, ms = 300): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms))
}

function generateId(prefix = "ml"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
}

function generateToken(): string {
  return Math.random().toString(36).slice(2, 14)
}

function generateUrl(token: string): string {
  return `https://app.nexus-corp.com/auth/magic-link?token=${token}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function matchesSearch(link: MagicLink, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (!term) return true

  return (
    link.recipientName.toLowerCase().includes(term) ||
    (link.recipientEmail?.toLowerCase().includes(term) ?? false) ||
    (link.recipientPhone?.toLowerCase().includes(term) ?? false) ||
    link.scope.toLowerCase().includes(term) ||
    link.createdBy.toLowerCase().includes(term)
  )
}

function matchesDateRange(
  link: MagicLink,
  dateFrom: string | null,
  dateTo: string | null
): boolean {
  const created = new Date(link.createdAt)

  if (dateFrom) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)
    if (created < from) return false
  }

  if (dateTo) {
    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)
    if (created > to) return false
  }

  return true
}

// Get all links with optional filters
export async function getMagicLinks(
  filters?: MagicLinkFilters
): Promise<MagicLink[]> {
  let result = [...mockDb]

  if (filters) {
    if (filters.search) {
      result = result.filter((link) => matchesSearch(link, filters.search))
    }

    if (filters.status && filters.status !== "all") {
      result = result.filter((link) => link.status === filters.status)
    }

    if (filters.role && filters.role !== "all") {
      result = result.filter((link) => link.role === filters.role)
    }

    result = result.filter((link) =>
      matchesDateRange(link, filters.dateFrom, filters.dateTo)
    )
  }

  // Sort by creation date descending
  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return delay(result)
}

// Get a single link by ID
export async function getMagicLinkById(id: string): Promise<MagicLink | null> {
  const link = mockDb.find((item) => item.id === id) ?? null
  return delay(link)
}

// Create a new link
export async function createMagicLink(
  input: CreateMagicLinkInput
): Promise<MagicLink> {
  const token = generateToken()
  const now = nowIso()

  const link: MagicLink = {
    ...input,
    id: generateId(),
    status: "active",
    url: generateUrl(token),
    usageCount: 0,
    createdBy: "Admin Nexus",
    createdAt: now,
    updatedAt: now,
    activity: [],
  }

  mockDb = [link, ...mockDb]
  return delay(link)
}

// Revoke a link (irreversible)
export async function revokeMagicLink(id: string): Promise<MagicLink> {
  const index = mockDb.findIndex((item) => item.id === id)
  if (index === -1) {
    return delayReject(new Error(`MagicLink ${id} not found`))
  }

  const now = nowIso()
  const revoked: ActivityLogEntry = {
    id: generateId("act"),
    timestamp: now,
    result: "failed_revoked",
    ip: "127.0.0.1",
    device: "Admin Panel",
  }

  mockDb[index] = {
    ...mockDb[index],
    status: "revoked",
    updatedAt: now,
    activity: [...mockDb[index].activity, revoked],
  }

  return delay(mockDb[index])
}

// Resend a link (generates new URL, resets status to active if was used)
export async function resendMagicLink(id: string): Promise<MagicLink> {
  const index = mockDb.findIndex((item) => item.id === id)
  if (index === -1) {
    return delayReject(new Error(`MagicLink ${id} not found`))
  }

  const now = nowIso()
  const token = generateToken()
  const current = mockDb[index]

  const resendEvent: ActivityLogEntry = {
    id: generateId("act"),
    timestamp: now,
    result: "success",
    ip: "127.0.0.1",
    device: "Admin Panel",
  }

  mockDb[index] = {
    ...current,
    status: current.status === "used" ? "active" : current.status,
    url: generateUrl(token),
    updatedAt: now,
    activity: [...current.activity, resendEvent],
  }

  return delay(mockDb[index])
}

// Extend a link's expiration
export async function extendMagicLink(
  id: string,
  newExpiration: string | null
): Promise<MagicLink> {
  const index = mockDb.findIndex((item) => item.id === id)
  if (index === -1) {
    return delayReject(new Error(`MagicLink ${id} not found`))
  }

  const now = nowIso()
  const current = mockDb[index]

  const extendEvent: ActivityLogEntry = {
    id: generateId("act"),
    timestamp: now,
    result: "success",
    ip: "127.0.0.1",
    device: "Admin Panel",
  }

  mockDb[index] = {
    ...current,
    expirationType: newExpiration ? "absolute" : current.expirationType,
    expirationDate: newExpiration,
    updatedAt: now,
    activity: [...current.activity, extendEvent],
  }

  return delay(mockDb[index])
}

// Get activity log for a link
export async function getMagicLinkActivity(
  id: string
): Promise<ActivityLogEntry[]> {
  const link = mockDb.find((item) => item.id === id)
  return delay(link?.activity ?? [])
}
