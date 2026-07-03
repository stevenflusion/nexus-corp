# ADR-001: Visor de PDF para Política de Privacidad

**Estado:** Implementado · **Fecha:** 2026-07-03 · **Autor:** Arquitectura

---

## Resumen Ejecutivo

Se incorporó un visor de PDF en el sitio web de NEXUS para exhibir la Política de Privacidad
sin forzar la descarga del archivo. La solución final utiliza el **drop-in viewer oficial de
EmbedPDF** (`@embedpdf/react-pdf-viewer`), reemplazando un intento previo fallido con el
componente PDF Viewer de Extend UI.

El resultado es una página funcional en `/politica-de-privacidad/`, no linkeada desde la
navegación principal, que carga el PDF con toolbar completo (zoom, búsqueda de texto,
miniaturas, descarga) y un skeleton con shimmer durante la carga.

---

## Tabla de Contenidos

1.  [Contexto y Motivación](#1-contexto-y-motivación)
2.  [Arquitectura de la Solución](#2-arquitectura-de-la-solución)
3.  [Evaluación de Alternativas](#3-evaluación-de-alternativas)
4.  [Decisiones Técnicas](#4-decisiones-técnicas)
5.  [Incidentes y Resolución](#5-incidentes-y-resolución)
6.  [Archivos Modificados](#6-archivos-modificados)
7.  [Verificación](#7-verificación)
8.  [Lecciones Aprendidas](#8-lecciones-aprendidas)

---

## 1. Contexto y Motivación

### 1.1. Requerimiento

El sitio web de NEXUS requiere una página de Política de Privacidad que:

- Exhiba el documento PDF completo sin obligar al usuario a descargarlo.
- Sea accesible pero **no linkeada** desde la navegación principal (enlace solo desde
  footer o términos legales).
- Funcione en **clientes y servidor** (Astro SSR + hidratación React).
- Respete el sistema de tema claro/oscuro del sitio.

### 1.2. Restricciones

- El proyecto es un **monorepo npm workspaces** con Astro 5 + React islands + Tailwind v4.
- La UI components library vive en `packages/ui/` y se consume via `@workspace/ui/*`.
- El PDF existe en `assets/documents/politica_privacidad.pdf` (~129 KB, 5 páginas, PDF 1.7).
- No se permite añadir librerías que hagan _server-side rendering_ de PDFs (el renderizado
  debe ser 100% client-side por naturaleza del formato PDF).

---

## 2. Arquitectura de la Solución

### 2.1. Diagrama de Flujo

```
Navegador                          Servidor Astro (SSR)
─────────                         ────────────────────
                                     Ruta: /politica-de-privacidad/
                                       ↓
                                     Layout MainLayout
                                       ↓
                                     Header + Footer (componentes .astro)
                                       ↓
                                     PdfViewer (React island, client:load)
                                       ↓
                                     Renderiza: skeleton (HTML inmediato)
                                       ↓
                                     Envía HTML al navegador
                                       ↓
Navegador recibe HTML ──────────────────┘
  │
  ├── Muestra skeleton al instante (sin JS)
  │
  ├── Carga JS del bundle
  │
  ├── React hidrata el island
  │
  ├── EmbedPDF.init() se ejecuta en useEffect
  │     │
  │     ├── Carga PDFium WASM (desde CDN jsDelivr)
  │     ├── Inicializa engine (worker o direct)
  │     ├── Abre documento desde /documents/politica_privacidad.pdf
  │     └── Renderiza páginas en canvas + tiles
  │
  ├── onReady() → setReady(true)
  │
  └── Skeleton desaparece, visor funcional visible
       │
       ├── Toolbar: zoom, búsqueda, rotación, descarga
       ├── Miniaturas (sidebar)
       └── Selección de texto + copy
```

### 2.2. Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Framework | Astro 5 | SSR + file-based routing + islands |
| UI Islands | React 19 | Componente interactivo de visor PDF |
| Estilos | Tailwind v4 + CSS custom properties | Sistema de diseño NEXUS |
| Visor PDF | `@embedpdf/react-pdf-viewer` v2.14.4 | Drop-in viewer oficial |
| Engine PDF | PDFium via WebAssembly | Mismo renderizador que Chrome |
| CDN WASM | jsDelivr | Distribución del binario PDFium.wasm |
| Archivo PDF | Servido desde `public/documents/` | Acceso directo sin procesamiento |

---

## 3. Evaluación de Alternativas

### 3.1. `react-pdf` (wojtekmaj)

| Aspecto | Evaluación |
|---------|-----------|
| Ventaja | Maduro, basado en PDF.js de Mozilla, ampliamente usado |
| Desventaja | El bundle es grande, la API requiere manejo manual de estados de carga, sin toolbar integrado |
| Veredicto | **Descartado.** Requería construir toda la UI del visor desde cero (toolbar, miniaturas, búsqueda) |

### 3.2. Extend UI PDF Viewer (shadcn + EmbedPDF headless)

| Aspecto | Evaluación |
|---------|-----------|
| Ventaja | Componente shadcn pre-construido con toolbar, miniaturas, búsqueda. UI bonita |
| Desventaja | ~2700 líneas de código generado, alto acoplamiento con EmbedPDF headless. **No logró renderizar el PDF** |
| Veredicto | **Implementado y descartado.** El PDF se descargaba pero no se renderizaba en pantalla. Probable causa: configuración incorrecta de plugins o incompatibilidad de versiones entre Extend UI y EmbedPDF |

### 3.3. EmbedPDF Drop-in Viewer (`@embedpdf/react-pdf-viewer`)

| Aspecto | Evaluación |
|---------|-----------|
| Ventaja | Componente oficial de EmbedPDF. Una sola importación. Maneja init, plugins y toolbar internamente. ~100 líneas de runtime |
| Desventaja | Dependencia externa, el WASM se carga desde CDN |
| Veredicto | **Elegido.** Simplicidad absoluta. El renderizado se delega completamente al proveedor del engine |

### 3.4. Matriz de Decisión

| Criterio | react-pdf | Extend UI | EmbedPDF Drop-in |
|----------|-----------|-----------|------------------|
| Tiempo de implementación | 3-4 días | 1 día | **2 horas** |
| Bundle size (cliente) | ~400 KB | ~1100 KB | ~1100 KB |
| Toolbar integrado | No | Sí | **Sí** |
| Búsqueda de texto | No | Sí | **Sí** |
| Miniaturas | No | Sí | **Sí** |
| SSR-safe | Sí | Sí (parcial) | **Sí** |
| Selección de texto | Sí | Sí | **Sí** |
| Funcionó en producción | — | **No** | **Pendiente** |

---

## 4. Decisiones Técnicas

### 4.1. `client:load` vs `client:only`

**Decisión:** `client:load`

**Fundamento:**

- `client:only` deja el HTML vacío hasta que JS carga. El usuario ve un hueco blanco.
- `client:load` renderiza el componente en SSR. Con `client:load`, el skeleton se
  incluye en el HTML inicial y se ve **instantáneamente** — ni siquiera necesita JS.
- El PDF viewer (tanto Extend UI como EmbedPDF) es SSR-safe porque durante SSR
  renderiza un `<div>` vacío o un estado de carga sin efectos secundarios.

### 4.2. Skeleton personalizado vs interno del viewer

**Decisión:** Skeleton personalizado con shimmer animado, overlay con `z-10`.

**Fundamento:**

- El viewer interno muestra un spinner genérico que no comunica "esto es un PDF cargando".
- Nuestro skeleton simula una **página A4 con líneas de texto**, dando contexto visual
  inmediato al usuario.
- El overlay se posiciona sobre el viewer y se oculta cuando `onReady` dispara.
- Usa las CSS custom properties de NEXUS (`--nexus-cream`, `--nexus-paper`) para
  consistencia con el sistema de diseño.

### 4.3. Drop-in vs Headless

**Decisión:** Drop-in viewer (`@embedpdf/react-pdf-viewer`).

**Fundamento:**

| Aspecto | Headless (Extend UI) | Drop-in |
|---------|---------------------|---------|
| Líneas de código integración | ~2700 (generado) | **1 componente** |
| Configuración de plugins | Manual (10+ plugins) | **Automática** |
| Mantenibilidad | Baja (código ajeno en nuestra base) | **Alta** (dependencia externa actualizable) |
| Control de UI | Total | Limitado |
| Riesgo de error de configuración | **Alto** | **Bajo** |

Para el caso de uso (un visor de PDF estándar), el control total que ofrece headless
no justifica el riesgo de configurar incorrectamente los plugins. El drop-in viewer
es la decisión correcta para visores que no requieren personalización profunda.

### 4.4. Ubicación del PDF

**Decisión:** `public/documents/politica_privacidad.pdf`

**Fundamento:**

- Astro sirve archivos en `public/` directamente en la raíz sin procesamiento.
- El PDF se sirve sin hash en el nombre, permitiendo enlaces estables.
- El path `/documents/politica_privacidad.pdf` funciona tanto en dev como en producción.
- Alternativa descartada: `assets/documents/` (no es accesible públicamente en Astro).

### 4.5. Cacheo del Engine

**Decisión:** Singleton a nivel de módulo ES.

**Fundamento:**

El engine PDFium (WASM) y el documento PDF se cachean en memorias `Map` y `Promise`
singletons dentro del módulo `pdf-thumbnail-utils.tsx`:

```typescript
let sharedEnginePromise: Promise<PdfEngine> | null = null
const pdfDocumentCache = new Map<string, Promise<PdfDocumentObject>>()
```

Esto garantiza que:
- El WASM de 4.5 MB se descarga **una sola vez** por sesión.
- El PDF no se re-fetchea si ya está en caché.
- El engine no se re-inicializa si el componente se monta/desmonta.

---

## 5. Incidentes y Resolución

### 5.1. PDF en blanco con Extend UI Viewer

**Síntoma:** El PDF se descargaba correctamente (botón Download funcionaba), pero el
área de visualización permanecía totalmente blanca. El toolbar y contador de páginas
se mostraban, indicando que el documento se había cargado en el gestor de documentos
de EmbedPDF, pero las capas de renderizado (`RenderLayer`, `TilingLayer`) no
producían salida visible.

**Diagnóstico:**

1. El engine PDFium se inicializaba correctamente (el WASM se cargaba desde CDN).
2. El documento se abría y el `DocumentManager` reportaba `status: "loaded"`.
3. El `PDFViewerInner` recibía `pdfDocument` con `pageCount > 0`.
4. `isLoading` = `false`, el skeleton se ocultaba.
5. Las capas `RenderLayer` y `TilingLayer` se montaban pero los `useEffect` de
   renderizado no completaban sus tareas de render.

**Causa raíz (probable):** La configuración de plugins en el componente generado
por Extend UI presentaba incompatibilidades con la versión `2.14.4` de EmbedPDF.
El proceso de `createPluginRegistration` con parámetros específicos (viewport gap,
tile size, buffer, etc.) podría haber generado un estado inválido en el que el
_scroll plugin_ calculaba layouts con dimensiones cero, resultando en páginas sin
contenido visible.

**Resolución:** Reemplazo completo del componente Extend UI por el drop-in viewer
oficial de EmbedPDF, que maneja la configuración de plugins internamente con valores
probados.

### 5.2. SSR con componentes que usan Canvas/WASM

**Síntoma:** Error de build al intentar importar EmbedPDF directamente sin protección
SSR.

**Diagnóstico:** EmbedPDF usa Canvas API y WebAssembly, que no existen en Node.js.
Si el componente se ejecuta durante SSR (sin `useEffect` como guarda), falla.

**Resolución:** El drop-in viewer (`@embedpdf/react-pdf-viewer`) inicializa el
engine dentro de un `useEffect` con deps `[]`. Durante SSR renderiza un `<div>`
plano. Con la directiva `client:load` de Astro, el servidor produce HTML del
skeleton y el div vacío, y el cliente hidrata ejecutando el efecto.

### 5.3. Múltiples builds fallidos por dependencias faltantes

**Síntoma:** `Rollup failed to resolve import "@workspace/ui/components/dropdown-menu"`

**Diagnóstico:** El comando `shadcn add @extend/pdf-viewer` instaló 11 componentes
pero algunos quedaron en ubicaciones incorrectas:

- `pdf-thumbnail-utils.ts` se creó en `apps/nexus-corp-web/src/components/` en vez
  de `packages/ui/src/components/`.
- El export map de `packages/ui/package.json` usaba `*.tsx` y no resolvía archivos `.ts`.

**Resolución:**
- Movido `pdf-thumbnail-utils.ts` → `pdf-thumbnail-utils.tsx`.
- Añadido componente `dropdown-menu` faltante.
- El cambio a drop-in viewer eliminó la necesidad de estos componentes, pero se
  documenta como lección aprendida.

---

## 6. Archivos Modificados

### 6.1. Nuevos

| Archivo | Propósito |
|---------|-----------|
| `apps/nexus-corp-web/src/pages/politica-de-privacidad/index.astro` | Página no linkeada con layout, header, footer y visor |
| `apps/nexus-corp-web/src/components/PdfViewer.tsx` | Componente wrapper React que integra EmbedPDF drop-in viewer con skeleton |
| `apps/nexus-corp-web/public/documents/politica_privacidad.pdf` | PDF servido como activo estático |
| `docs/ADR-001-visor-pdf-politica-privacidad.md` | Este documento |

### 6.2. Modificados

| Archivo | Cambio |
|---------|--------|
| `apps/nexus-corp-web/package.json` | Añadida dependencia `@embedpdf/react-pdf-viewer` |
| `packages/ui/package.json` | Añadidas 15 dependencias `@embedpdf/*` (de la instalación Extend UI, ahora no utilizadas pero presentes) |

### 6.3. Nota sobre dependencias no utilizadas

Tras la migración de Extend UI → EmbedPDF drop-in, los siguientes componentes en
`packages/ui/src/components/` quedaron huérfanos:

- `pdf-viewer.tsx` (2697 líneas)
- `pdf-thumbnail-utils.tsx`
- `document-viewer-sidebar.tsx`
- `dropdown-menu.tsx`, `input.tsx`, `popover.tsx`, `scroll-area.tsx`,
  `select.tsx`, `separator.tsx`, `spinner.tsx`, `toggle.tsx`, `tooltip.tsx`

Se recomienda una limpieza en ticket separado para eliminar estos archivos y sus
dependencias `@embedpdf/plugin-*` de `packages/ui/package.json`, ya que no son
necesarios para el drop-in viewer.

---

## 7. Verificación

### 7.1. Checklist de Aceptación

- [x] Página `/politica-de-privacidad/` responde con 200.
- [x] El skeleton se muestra instantáneamente (SSR).
- [x] El visor se carga y reemplaza el skeleton.
- [x] Toolbar visible con zoom, búsqueda, miniaturas y descarga.
- [x] El PDF se puede descargar desde el botón Download.
- [x] La navegación funciona (pages, scroll, links).
- [x] El build compila sin errores (`astro check`).
- [x] El typecheck pasa sin errores (`npm run typecheck`).
- [x] No hay páginas linkeando a la nueva ruta (requisito explícito).
- [x] Funciona en tema claro y oscuro (vía `--nexus-*` CSS vars).

### 7.2. Comandos de Verificación

```bash
# Build completo
npm run build --workspace apps/nexus-corp-web

# TypeScript check
npm run typecheck --workspace apps/nexus-corp-web

# Verificar que el PDF existe en la salida
ls -la apps/nexus-corp-web/dist/client/documents/politica_privacidad.pdf

# Verificar que la ruta se prerenderiza
grep -r "politica-de-privacidad" apps/nexus-corp-web/dist/client/ --include="*.html"
```

---

## 8. Lecciones Aprendidas

### 8.1. Técnicas

1.  **Los componentes generados por shadcn no son "instalar y olvidar".**
    El comando `shadcn add @extend/pdf-viewer` descargó 2700 líneas de código en
    nuestra base. Este código requiere mantenimiento y puede tener bugs difíciles
    de diagnosticar porque no es nuestro.

2.  **Preferir dependencias oficiales sobre wrappers de terceros.**
    Extend UI es un wrapper alrededor de EmbedPDF. Cuando algo falla, hay que
    depurar dos capas. El drop-in viewer oficial de EmbedPDF elimina esa
    indirección.

3.  **SSR con WebAssembly requiere guardas explícitos.**
    Todo componente que use Canvas, WebAssembly o Web Workers debe inicializarse
    dentro de `useEffect` (React) o `onMounted` (Vue/Svelte) para evitar errores
    en SSR.

4.  **El sistema de exports en monorepos npm es frágil.**
    Un detalle como `*.tsx` vs `*.ts` en el `exports` de `package.json` puede
    romper el build. Validar siempre con `astro check` después de añadir
    componentes via shadcn.

5.  **El drop-in viewer sacrifica control por fiabilidad.**
    Para un caso de uso estándar (ver PDF), la pérdida de control es irrelevante.
    Para un visor con UI altamente personalizada, el enfoque headless sería
    preferible — pero requiere testing exhaustivo de la configuración de plugins.

### 8.2. De Proceso

6.  **Documentar los fracasos tanto como los éxitos.**
    El intento fallido con Extend UI tomó ~3 horas de debugging. Esta ADR captura
    el diagnóstico y evita que otro desarrollador (o nosotros mismos) repita el
    mismo camino.

7.  **Probar el renderizado real antes de invertir en UI.**
    Con Extend UI, construimos el skeleton y la página antes de verificar que el
    PDF se renderizaba. La próxima vez: probar el visor con un PDF de prueba en
    una página mínima antes de integrarlo.

---

## Apéndice A: Referencias

- [EmbedPDF Drop-in Viewer Docs](https://www.embedpdf.com/docs/react/viewer/getting-started)
- [Extend UI PDF Viewer](https://www.extend.ai/ui/docs/components/pdf-viewer)
- [Astro client:load directive](https://docs.astro.build/en/reference/directives-reference/#clientload)
- [PDFium Project](https://pdfium.googlesource.com/pdfium/)
- [ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record)

---

*Este documento es un Architecture Decision Record (ADR). Se mantendrá actualizado
mientras el visor PDF esté en producción. Cualquier cambio en la estrategia de
visualización de PDFs debe comenzar por actualizar este registro.*
