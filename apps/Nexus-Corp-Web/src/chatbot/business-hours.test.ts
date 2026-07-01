import assert from "node:assert/strict"
import test from "node:test"

import { isBusinessOpen } from "./business-hours"

test("abre de lunes a viernes desde las 09h00 en America/Guayaquil", () => {
  assert.equal(isBusinessOpen(new Date("2026-05-25T14:00:00.000Z")), true)
})

test("cierra a las 18h00 en America/Guayaquil", () => {
  assert.equal(isBusinessOpen(new Date("2026-05-29T22:59:00.000Z")), true)
  assert.equal(isBusinessOpen(new Date("2026-05-29T23:00:00.000Z")), false)
})

test("permanece cerrado fines de semana", () => {
  assert.equal(isBusinessOpen(new Date("2026-05-30T16:00:00.000Z")), false)
})
