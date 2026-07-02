import assert from "node:assert/strict"
import test from "node:test"

import { processChatMessage } from "./engine"

const openTime = new Date("2026-05-27T15:00:00.000Z")
const closedTime = new Date("2026-05-27T23:30:00.000Z")

test("genera menú de bienvenida para primer contacto", () => {
  const response = processChatMessage("hola", {
    channel: "whatsapp",
    now: openTime,
  })

  assert.equal(response.intent, "greeting")
  assert.match(response.message, /gracias por comunicarte con NEXUS/i)
  assert.match(response.message, /1\. Asesoría para vivienda/)
  assert.equal(response.handoffRecommended, false)
})

test("responde una opción de asesoría y ofrece asesor", () => {
  const response = processChatMessage("1", {
    channel: "whatsapp",
    now: openTime,
  })

  assert.equal(response.intent, "housing_credit")
  assert.match(response.message, /vivienda/i)
  assert.match(response.message, /asesor para revisar tu caso/i)
  assert.match(response.message, /no representa aprobación/i)
  assert.match(response.message, /financiamiento directo/i)
  assert.doesNotMatch(
    response.message,
    /te aprobamos|crédito garantizado|financiamiento inmediato/i
  )
})

test("agrega nota fuera de horario sin dejar de responder la consulta", () => {
  const response = processChatMessage("qué documentos necesito", {
    channel: "whatsapp",
    now: closedTime,
  })

  assert.equal(response.intent, "documents")
  assert.match(response.message, /cédula/i)
  assert.match(response.message, /fuera de horario de atención/i)
})

test("mantiene fallback breve con menú", () => {
  const response = processChatMessage("necesito algo muy específico", {
    channel: "whatsapp",
    now: openTime,
  })

  assert.equal(response.intent, "fallback")
  assert.equal(response.handoffRecommended, true)
  assert.match(response.message, /puedes elegir una de estas opciones/i)
})
