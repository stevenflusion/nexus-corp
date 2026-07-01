# WhatsApp Cloud API - NEXUS

## Variables de entorno

Coloca estas variables en Coolify para la aplicacion existente:

```env
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_VERSION=v25.0
WHATSAPP_API_BASE_URL=https://graph.facebook.com
WEBHOOK_PUBLIC_URL=https://www.nexuscorpec.com/webhook
```

Mantener tambien las variables del negocio:

```env
BUSINESS_NAME=NEXUS
BUSINESS_WEBSITE=https://www.nexuscorpec.com
BUSINESS_PHONE_NUMBER=+593981371278
BUSINESS_EMAIL=info@nexuscorpec.com
HUMAN_AGENT_PHONE=+593981371278
WHATSAPP_LEADS_FILE=/app/storage/whatsapp-leads.jsonl
```

El archivo de deduplicacion se crea automaticamente junto a `WHATSAPP_LEADS_FILE`. En Coolify monta un volumen persistente en `/app/storage`.

## Donde obtener cada variable

- `META_VERIFY_TOKEN`: lo creas tu. Debe ser privado y debe coincidir exactamente con el token configurado en Meta Developers.
- `META_ACCESS_TOKEN`: Meta Developers o Business Manager, en la configuracion de WhatsApp Cloud API. Para produccion usa un token permanente o un mecanismo controlado de renovacion.
- `META_APP_ID`: panel de la app en Meta Developers.
- `META_APP_SECRET`: panel de la app en Meta Developers, seccion de configuracion basica.
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp > API Setup o configuracion del numero conectado.
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: WhatsApp Business Account asociado al negocio.
- `WHATSAPP_API_VERSION`: usar `v25.0`.
- `WHATSAPP_API_BASE_URL`: usar `https://graph.facebook.com`.
- `WEBHOOK_PUBLIC_URL`: usar `https://www.nexuscorpec.com/webhook`.

## Webhook

URL publica:

```text
https://www.nexuscorpec.com/webhook
```

En Meta Developers configura:

```text
Callback URL: https://www.nexuscorpec.com/webhook
Verify token: el valor de META_VERIFY_TOKEN
Campo a suscribir: messages
```

## Probar GET del webhook

Cuando el deploy este activo y las variables esten cargadas:

```bash
curl "https://www.nexuscorpec.com/webhook?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=12345"
```

Respuesta esperada:

```text
12345
```

## Probar un mensaje real

1. Verifica el webhook desde Meta Developers.
2. Suscribe el campo `messages`.
3. Escribe desde un WhatsApp externo al numero conectado de NEXUS.
4. El servidor debe responder usando la misma logica del chatbot web.

La integracion responde solo a mensajes iniciados por el usuario. No envia campanas, mensajes promocionales ni plantillas comerciales.

## Revisar errores

En Coolify revisa los logs de la aplicacion. Mensajes esperados:

```text
Webhook verificado correctamente
Mensaje de WhatsApp recibido
Mensaje duplicado ignorado
Respuesta enviada correctamente
Error HTTP de Meta
```

Los logs no muestran tokens, app secrets, firmas completas ni cuerpos completos del webhook.

## Cambiar de token temporal a permanente

1. Genera o configura el token permanente segun el esquema aprobado en Meta Business.
2. Reemplaza solo `META_ACCESS_TOKEN` en Coolify.
3. Redeploy o reinicia la aplicacion si Coolify no recarga variables automaticamente.
4. Envia un mensaje real para confirmar que Graph API responde correctamente.

## Configuracion manual en Meta Developers

1. Usar la app asociada al negocio NEXUS CORP.
2. Agregar el producto WhatsApp si aun no existe.
3. Conectar el numero `+593 98 137 1278`.
4. Copiar `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_BUSINESS_ACCOUNT_ID`.
5. Configurar el webhook con la URL publica y el verify token.
6. Suscribir el campo `messages`.
7. Verificar el webhook.
8. Probar un mensaje real desde WhatsApp.
