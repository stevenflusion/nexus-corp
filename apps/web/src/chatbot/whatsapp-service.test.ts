import assert from "node:assert/strict"
import test from "node:test"

import {
  extractWhatsAppTextMessages,
  splitWhatsAppTextMessage,
} from "./whatsapp-service"

test("extrae mensajes de texto entrantes con nombre de perfil", () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  profile: {
                    name: "Cliente Prueba",
                  },
                  wa_id: "593981371278",
                },
              ],
              messages: [
                {
                  from: "593981371278",
                  id: "wamid.test.1",
                  timestamp: "1779894000",
                  type: "text",
                  text: {
                    body: "Hola",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  }

  const messages = extractWhatsAppTextMessages(payload)

  assert.equal(messages.length, 1)
  assert.equal(messages[0].from, "593981371278")
  assert.equal(messages[0].body, "Hola")
  assert.equal(messages[0].profileName, "Cliente Prueba")
})

test("divide mensajes largos sin superar el limite configurado", () => {
  const chunks = splitWhatsAppTextMessage(
    `Primer parrafo con informacion importante.\n\n${"detalle ".repeat(
      12
    )}\n\nCierre de la respuesta.`,
    80
  )

  assert.ok(chunks.length > 1)
  assert.ok(chunks.every((chunk) => chunk.length <= 80))
  assert.match(chunks[0], /Primer parrafo/)
  assert.match(chunks.at(-1) ?? "", /Cierre/)
})

test("ignora statuses, payloads vacíos y mensajes no soportados", () => {
  assert.deepEqual(extractWhatsAppTextMessages({ entry: [] }), [])
  assert.deepEqual(
    extractWhatsAppTextMessages({
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: "wamid.status",
                    status: "sent",
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
    []
  )
  assert.deepEqual(
    extractWhatsAppTextMessages({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "593981371278",
                    id: "wamid.test.2",
                    timestamp: "1779894000",
                    type: "image",
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
    []
  )
})
