# Configuración de WhatsApp Cloud API para NEXUS

## Endpoints

Endpoint principal para Meta:

```text
GET  /webhook
POST /webhook
```

También se mantiene `/api/whatsapp/webhook` como ruta de compatibilidad interna.

## Variables de entorno

Copia `.env.example` a `.env` solo en el servidor o entorno local. No versionar `.env`.

```env
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_VERSION=v25.0
WEBHOOK_PUBLIC_URL=https://www.nexuscorpec.com/webhook
NODE_ENV=production
PORT=4321
BUSINESS_PHONE_NUMBER=+593981371278
BUSINESS_EMAIL=info@nexuscorpec.com
BUSINESS_NAME=NEXUS
BUSINESS_WEBSITE=https://www.nexuscorpec.com
BUSINESS_MAPS_URL=https://maps.app.goo.gl/tMuYfK8NgjZTrhvD9
HUMAN_AGENT_PHONE=+593981371278
WHATSAPP_LEADS_FILE=storage/whatsapp-leads.jsonl
```

`META_ACCESS_TOKEN`, `META_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_BUSINESS_ACCOUNT_ID` deben venir desde Meta Business o Meta Developers.

## Datos que debe entregar el cliente

- Meta App ID.
- App Secret.
- Access Token permanente o mecanismo acordado de renovación.
- Phone Number ID.
- WhatsApp Business Account ID.
- Verify Token privado acordado para `META_VERIFY_TOKEN`.
- Número conectado: `+593 98 137 1278`.
- Confirmación de que el Meta Business correcto es `NEXUS CORP`.

## Configuración en Meta Developers

1. Crear o usar una app de Meta Developers asociada al Business `NEXUS CORP`.
2. Agregar el producto WhatsApp.
3. Conectar el número `+593 98 137 1278`.
4. Obtener `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_BUSINESS_ACCOUNT_ID`.
5. Generar el token de acceso según el esquema aprobado para producción.
6. Configurar el webhook:

```text
Callback URL: https://www.nexuscorpec.com/webhook
Verify token: valor de META_VERIFY_TOKEN
Campos a suscribir: messages
```

7. Guardar y verificar el webhook desde Meta.

## Prueba local con túnel

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` local a partir de `.env.example`.
3. Levantar el sitio:

```bash
npm run dev
```

4. Exponer el puerto local con ngrok o un túnel equivalente:

```bash
ngrok http 4321
```

5. Configurar temporalmente:

```env
WEBHOOK_PUBLIC_URL=https://tu-subdominio.ngrok-free.app/webhook
```

6. En Meta, usar esa URL pública como Callback URL y el mismo `META_VERIFY_TOKEN`.

## Pruebas básicas

Verificar el challenge local:

```bash
curl "http://localhost:4321/webhook?hub.mode=subscribe&hub.verify_token=replace-with-a-private-verify-token&hub.challenge=12345"
```

Debe responder:

```text
12345
```

Probar el chatbot web:

```bash
curl -X POST http://localhost:4321/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"hola\"}"
```

Enviar un mensaje de prueba por Cloud API:

```bash
curl -X POST "https://graph.facebook.com/v25.0/WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"messaging_product\":\"whatsapp\",\"to\":\"593981371278\",\"type\":\"text\",\"text\":{\"body\":\"Mensaje de prueba NEXUS\"}}"
```

Reemplazar los placeholders por valores reales solo en consola o variables de entorno.

## Despliegue en VPS

Build:

```bash
npm run build
```

Arranque recomendado con PM2:

```bash
pm2 start apps/web/dist/server/entry.mjs --name nexus-web
pm2 save
```

Nginx debe actuar como reverse proxy hacia el puerto definido en `PORT`. Activar HTTPS antes de configurar el webhook definitivo.

## Logs y persistencia

- Los logs no imprimen tokens ni secretos.
- Los leads de WhatsApp se guardan en `WHATSAPP_LEADS_FILE`.
- El archivo usa JSON Lines e incluye número, nombre de perfil si llega desde WhatsApp, último mensaje, intención, fecha, estado, derivación y fuente.
- Para una fase de panel administrativo, conviene migrar esta persistencia a base de datos y agregar una vista protegida de consultas.

## Ventana de conversación y plantillas

El servidor responde mensajes libres dentro de la ventana activa permitida por WhatsApp. Para iniciar conversaciones o contactar fuera de esa ventana, se deben usar plantillas aprobadas por Meta.

Las plantillas sugeridas están en `docs/whatsapp-templates.md`. No enviarlas hasta que estén aprobadas en Meta Business.

## Pendientes si faltan credenciales

- Completar `META_ACCESS_TOKEN`.
- Completar `META_APP_SECRET`.
- Completar `WHATSAPP_PHONE_NUMBER_ID`.
- Completar `WHATSAPP_BUSINESS_ACCOUNT_ID`.
- Confirmar `META_VERIFY_TOKEN`.
- Verificar el webhook desde Meta.
- Probar un mensaje real desde el número conectado.
