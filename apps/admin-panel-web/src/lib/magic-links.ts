// Repository facade — real HTTP calls to the Nexus API.
// All methods preserve the same signatures as the previous mock implementation.

import { apiGet, apiPost, ApiError } from "./api-client"
import type {
  MagicLink,
  CreateMagicLinkInput,
  MagicLinkFilters,
  ActivityLogEntry,
} from "./types"

interface MagicLinksListResponse {
  items: MagicLink[]
  pagination: unknown
}

function toQueryParams(
  filters?: MagicLinkFilters
): Record<string, string> | undefined {
  if (!filters) return undefined

  const params: Record<string, string> = {}
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== "all") params.status = filters.status
  if (filters.role && filters.role !== "all") params.role = filters.role
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo

  return params
}

// Get all links with optional filters
export async function getMagicLinks(
  filters?: MagicLinkFilters
): Promise<MagicLink[]> {
  const response = await apiGet<MagicLinksListResponse>(
    "/magic-links",
    toQueryParams(filters)
  )
  return response.items
}

// Get a single link by ID. Returns null when the API responds with 404.
export async function getMagicLinkById(id: string): Promise<MagicLink | null> {
  try {
    return await apiGet<MagicLink>(`/magic-links/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// Create a new link
export async function createMagicLink(
  input: CreateMagicLinkInput
): Promise<MagicLink> {
  return apiPost<MagicLink>("/magic-links", {
    ...input,
    createdBy: "Admin Nexus",
  })
}

// Revoke a link (irreversible)
export async function revokeMagicLink(id: string): Promise<MagicLink> {
  return apiPost<MagicLink>(`/magic-links/${id}/revoke`)
}

// Resend a link (generates new URL, resets status to active if was used)
export async function resendMagicLink(id: string): Promise<MagicLink> {
  return apiPost<MagicLink>(`/magic-links/${id}/resend`)
}

// Extend a link's expiration
export async function extendMagicLink(
  id: string,
  newExpiration: string | null
): Promise<MagicLink> {
  if (newExpiration === null) {
    throw new Error("newExpiration is required")
  }

  return apiPost<MagicLink>(`/magic-links/${id}/extend`, {
    expirationDate: newExpiration,
  })
}

// Get activity log for a link
export async function getMagicLinkActivity(
  id: string
): Promise<ActivityLogEntry[]> {
  return apiGet<ActivityLogEntry[]>(`/magic-links/${id}/activity`)
}
