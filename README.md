# Astro + React + TypeScript + shadcn/ui (Monorepo)

This is a monorepo template for Astro with React, TypeScript, and shadcn/ui.

## Structure

- `apps/web` - Astro application
- `packages/ui` - Shared UI components (shadcn/ui)

## Deploy en VPS Hostinger con Coolify

La app principal es `apps/web` y se despliega como Astro SSR con `@astrojs/node` en modo `standalone`. El repositorio incluye un `Dockerfile` listo para Coolify.

Configuracion recomendada en Coolify:

- Build pack: `Dockerfile`
- Dockerfile path: `Dockerfile`
- Port interno: `4321`
- Health check path: `/`
- Dominio: `https://www.nexuscorpec.com`

Variables minimas de produccion:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4321
NEXT_PUBLIC_SITE_URL=https://www.nexuscorpec.com
NEXT_PUBLIC_WHATSAPP_NUMBER=593981371278
BUSINESS_WEBSITE=https://www.nexuscorpec.com
CHATBOT_ALLOWED_ORIGINS=https://www.nexuscorpec.com,https://nexuscorpec.com
WEBHOOK_PUBLIC_URL=https://www.nexuscorpec.com/webhook
WHATSAPP_LEADS_FILE=/app/storage/whatsapp-leads.jsonl
QUOTE_LEADS_FILE=/app/storage/nexus-quote-leads.csv
WEBINAR_REGISTRATIONS_FILE=/app/storage/nexus-webinar-registrations.csv
```

Si se habilita WhatsApp Cloud API o el registro del webinar por correo, cargar tambien:

```env
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
RESEND_API_KEY=
WEBINAR_REGISTRATION_TO=info@nexuscorpec.com
WEBINAR_REGISTRATION_FROM=NEXUS Webinar <notificaciones@nexuscorpec.com>
```

Para conservar leads entre redeploys, montar un volumen persistente de Coolify en `/app/storage`.

Comandos equivalentes sin Dockerfile:

```bash
npm ci
npm run build:web
npm start
```

## Adding components

To add components, run the following command from the root:

```bash
npx shadcn@latest add button -c apps/web
```

## Using components

To use the components in your app, import them in an `.astro` file:

```astro
---
import { Button } from "@workspace/ui/components/button"
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Astro App</title>
  </head>
  <body>
    <div class="grid h-screen place-items-center content-center">
      <Button>Button</Button>
    </div>
  </body>
</html>
```
