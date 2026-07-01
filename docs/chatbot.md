# Chatbot NEXUS

El sitio usa Astro + React y expone un chatbot reutilizable para web y WhatsApp.

## Módulos principales

- `apps/web/src/chatbot/intent-detector.ts`: detección básica de intención por palabras clave.
- `apps/web/src/chatbot/knowledge-base.ts`: base de preguntas frecuentes de NEXUS.
- `apps/web/src/chatbot/responses.ts`: textos de bienvenida, menú, respuestas, derivación y fallback.
- `apps/web/src/chatbot/business-hours.ts`: validación de horario de atención en `America/Guayaquil`.
- `apps/web/src/chatbot/engine.ts`: generación de respuesta final.
- `apps/web/src/chatbot/whatsapp-service.ts`: extracción de mensajes y envío por WhatsApp Cloud API.
- `apps/web/src/chatbot/lead-service.ts`: persistencia simple de consultas de WhatsApp.
- `apps/web/src/pages/webhook.ts`: webhook principal para Meta.
- `apps/web/src/pages/api/chatbot/message.ts`: endpoint del widget web.

## Comandos

```bash
npm run dev
npm run lint
npm run test
npm run build
```

La configuración completa de WhatsApp está en `docs/whatsapp-setup.md`.
