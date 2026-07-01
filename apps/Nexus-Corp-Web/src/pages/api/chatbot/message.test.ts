import assert from "node:assert/strict"
import test from "node:test"

import { POST } from "./message"

test("el endpoint del chatbot web sigue respondiendo con la logica central", async () => {
  const request = new Request("http://localhost:4321/api/chatbot/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:4321",
    },
    body: JSON.stringify({
      message: "hola",
    }),
  })

  const response = await POST({
    request,
    clientAddress: "127.0.0.1",
  } as Parameters<typeof POST>[0])
  const payload: unknown = await response.json()

  assert.equal(response.status, 200)
  assert.equal(
    typeof payload === "object" && payload !== null && "intent" in payload
      ? payload.intent
      : "",
    "greeting"
  )
  assert.match(
    typeof payload === "object" && payload !== null && "reply" in payload
      ? String(payload.reply)
      : "",
    /gracias por comunicarte con NEXUS/i
  )
})
