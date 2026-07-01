import { appendFile, mkdir, readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"

import { readEnv } from "./runtime-env"
import type { WhatsAppInboundMessage } from "./whatsapp.types"

const DEFAULT_LEADS_FILE = "storage/whatsapp-leads.jsonl"
const DEFAULT_DEDUPE_FILE_NAME = "whatsapp-message-ids.jsonl"
const MAX_DEDUPED_MESSAGE_IDS = 1000

const processedMessageIds = new Set<string>()
let hasLoadedPersistedIds = false
let loadingPersistedIds: Promise<void> | undefined

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error

const sanitizeMessageId = (messageId: string) =>
  messageId.replace(/[\r\n]/g, "").trim().slice(0, 160)

const getDedupeFilePath = () => {
  const configuredFile = readEnv("WHATSAPP_DEDUP_FILE")

  if (configuredFile.trim()) {
    return resolve(configuredFile)
  }

  const leadsFile = resolve(readEnv("WHATSAPP_LEADS_FILE", DEFAULT_LEADS_FILE))
  return join(dirname(leadsFile), DEFAULT_DEDUPE_FILE_NAME)
}

const rememberMessageIdInMemory = (messageId: string) => {
  processedMessageIds.add(messageId)

  while (processedMessageIds.size > MAX_DEDUPED_MESSAGE_IDS) {
    const oldestMessageId = processedMessageIds.values().next().value

    if (!oldestMessageId) {
      break
    }

    processedMessageIds.delete(oldestMessageId)
  }
}

const loadPersistedMessageIds = async () => {
  if (hasLoadedPersistedIds) {
    return
  }

  loadingPersistedIds ??= (async () => {
    try {
      const fileContents = await readFile(getDedupeFilePath(), "utf8")

      for (const line of fileContents.split("\n")) {
        const cleanLine = line.trim()

        if (!cleanLine) {
          continue
        }

        try {
          const parsed: unknown = JSON.parse(cleanLine)
          const messageId =
            typeof parsed === "object" &&
            parsed !== null &&
            "messageId" in parsed &&
            typeof parsed.messageId === "string"
              ? sanitizeMessageId(parsed.messageId)
              : ""

          if (messageId) {
            rememberMessageIdInMemory(messageId)
          }
        } catch {
          const messageId = sanitizeMessageId(cleanLine)

          if (messageId) {
            rememberMessageIdInMemory(messageId)
          }
        }
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== "ENOENT") {
        console.warn("Could not load WhatsApp message dedupe state")
      }
    } finally {
      hasLoadedPersistedIds = true
    }
  })()

  await loadingPersistedIds
}

export const markWhatsAppMessageProcessed = async (messageId: string) => {
  const safeMessageId = sanitizeMessageId(messageId)

  if (!safeMessageId) {
    return false
  }

  await loadPersistedMessageIds()

  if (processedMessageIds.has(safeMessageId)) {
    return false
  }

  rememberMessageIdInMemory(safeMessageId)

  try {
    const filePath = getDedupeFilePath()
    await mkdir(dirname(filePath), { recursive: true })
    await appendFile(
      filePath,
      `${JSON.stringify({
        messageId: safeMessageId,
        processedAt: new Date().toISOString(),
      })}\n`,
      "utf8"
    )
  } catch {
    console.warn("Could not persist WhatsApp message dedupe state")
  }

  return true
}

export const filterUnprocessedWhatsAppMessages = async (
  messages: WhatsAppInboundMessage[]
) => {
  const unprocessedMessages: WhatsAppInboundMessage[] = []

  for (const message of messages) {
    if (await markWhatsAppMessageProcessed(message.id)) {
      unprocessedMessages.push(message)
    }
  }

  return unprocessedMessages
}

export const resetWhatsAppMessageDedupeForTests = () => {
  processedMessageIds.clear()
  hasLoadedPersistedIds = false
  loadingPersistedIds = undefined
}
