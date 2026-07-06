// Repository facade — real HTTP calls to the Nexus API for leads management.

import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "./api-client"
import type { Lead, Quote, LeadNote, LeadFilters, LeadStatus } from "./types"

function toQueryParams(
  filters?: LeadFilters
): Record<string, string> | undefined {
  if (!filters) return undefined

  const params: Record<string, string> = {}
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== "all") params.status = filters.status
  if (filters.source && filters.source !== "all") params.source = filters.source

  return params
}

// Get all leads with their quotes
// The backend returns Lead[] directly (not { items: [...] })
export async function getLeadsWithQuotes(
  filters?: LeadFilters
): Promise<Lead[]> {
  return apiGet<Lead[]>("/leads/with-quotes", toQueryParams(filters))
}

// Get a single lead by ID. Returns null when the API responds with 404.
export async function getLeadById(id: number): Promise<Lead | null> {
  try {
    return await apiGet<Lead>(`/leads/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// Update lead status
export async function updateLeadStatus(
  id: number,
  status: LeadStatus
): Promise<Lead> {
  return apiPut<Lead>(`/leads/${id}`, { status_leads: status })
}

// Get notes for a lead
export async function getLeadNotes(id: number): Promise<LeadNote[]> {
  return apiGet<LeadNote[]>(`/notes/lead/${id}`)
}

// Create a note for a lead
export async function createLeadNote(input: {
  manager_lead_notes: string
  note_lead_notes: string
  id_leads: number
}): Promise<LeadNote> {
  return apiPost<LeadNote>("/notes", input)
}

// Update a note
export async function updateLeadNote(
  id: number,
  partial: Partial<Omit<LeadNote, "id_lead_notes" | "id_leads" | "createdAt">>
): Promise<LeadNote> {
  return apiPut<LeadNote>(`/notes/${id}`, partial)
}

// Delete a note
export async function deleteLeadNote(id: number): Promise<void> {
  await apiDelete<void>(`/notes/${id}`)
}
