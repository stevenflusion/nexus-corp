import assert from "node:assert/strict"
import test from "node:test"

import { detectIntent } from "./intent-detector"

test("detecta saludos y opciones numeradas", () => {
  assert.equal(detectIntent("hola, buenos días").intent, "greeting")
  assert.equal(detectIntent("1").intent, "housing_credit")
  assert.equal(detectIntent("opción 6").intent, "human_agent")
})

test("detecta intenciones comerciales principales", () => {
  assert.equal(
    detectIntent("quiero crédito para casa").intent,
    "housing_credit"
  )
  assert.equal(
    detectIntent("crédito vehicular para auto").intent,
    "vehicle_credit"
  )
  assert.equal(
    detectIntent("necesito crédito personal").intent,
    "consumer_credit"
  )
  assert.equal(detectIntent("qué documentos necesito").intent, "documents")
  assert.equal(detectIntent("cuánto cobran por la asesoría").intent, "pricing")
})

test("detecta consulta de préstamo directo antes que servicios", () => {
  assert.equal(detectIntent("ustedes prestan dinero?").intent, "direct_loan")
})
