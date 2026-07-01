# Webinar y tema visual

## Ruta

- `/webinar/`: landing de registro para el webinar gratuito de NEXUS.

## Archivos principales

- `apps/web/src/pages/webinar/index.astro`: vista de Webinar, secciones de conversion y constante `WHATSAPP_WEBINAR_URL`.
- `apps/web/src/components/ThemeToggle.astro`: toggle global de modo claro/oscuro con iconos de sol y luna.
- `apps/web/src/components/Header.astro`: navegacion principal con `Webinar` entre `Nosotros` y `Contacto`.
- `apps/web/src/components/Footer.astro`: enlace `Webinar` en la navegacion secundaria.
- `apps/web/src/layouts/main.astro`: script temprano de tema y estilos globales para modo claro/oscuro.
- `apps/web/public/webinar/`: imagenes usadas por la landing.

## WhatsApp

Los botones principales de la landing usan:

```ts
const WHATSAPP_WEBINAR_URL =
  "https://wa.me/593981371278?text=Hola%20NEXUS%2C%20quiero%20registrarme%20al%20webinar%20y%20recibir%20la%20guia%20gratuita."
```

Para cambiar el destino, actualizar solo esa constante en `apps/web/src/pages/webinar/index.astro`.

## Modo claro y oscuro

El tema se guarda en `localStorage` con la clave `nexus-site-theme`. El layout aplica `data-theme="light"` o `data-theme="dark"` antes de pintar la pagina para evitar parpadeos. El toggle cambia el valor y actualiza los botones asociados.
