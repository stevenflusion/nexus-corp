import { useCallback, useEffect, useRef, useState } from "react"

const WEBHOOK_URL =
  "https://steventest0411.app.n8n.cloud/webhook/a69dee65-cceb-4807-abbf-86bd86791bfd/chat"

const N8N_CHAT_CSS =
  "https://cdn.jsdelivr.net/npm/@n8n/chat@1.27.1/dist/style.css"
const N8N_CHAT_JS =
  "https://cdn.jsdelivr.net/npm/@n8n/chat@1.27.1/dist/chat.bundle.es.js"

export default function N8nChat() {
  const loaded = useRef(false)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Load n8n chat from CDN once ──
  const loadN8nChat = useCallback(async () => {
    if (loaded.current) return
    loaded.current = true

    // 1. Inject CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = N8N_CHAT_CSS
    document.head.appendChild(link)

    // 2. Inject <script type="module"> that imports from CDN and stores createChat globally
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.type = "module"
      script.textContent = `
        import { createChat } from '${N8N_CHAT_JS}';
        window.__n8nCreateChat = createChat;
        window.__n8nChatReady = true;
      `
      script.onerror = () => {
        console.warn("Failed to load n8n chat script from CDN")
        loaded.current = false
        reject(new Error("Script load failed"))
      }
      document.body.appendChild(script)

      // Poll for ready flag
      const check = setInterval(() => {
        if ((window as any).__n8nChatReady) {
          clearInterval(check)
          resolve()
        }
      }, 50)

      // Timeout after 15s
      setTimeout(() => {
        clearInterval(check)
        if (!(window as any).__n8nChatReady) {
          loaded.current = false
          reject(new Error("n8n chat load timeout"))
        }
      }, 15_000)
    })
  }, [])

  // ── Initialize chat instance ──
  const initChat = useCallback(async () => {
    try {
      await loadN8nChat()
      const createChat = (window as any).__n8nCreateChat as (
        opts: Record<string, unknown>
      ) => void

      if (!createChat) {
        console.warn("n8n createChat not available")
        return
      }

      createChat({
        webhookUrl: WEBHOOK_URL,
        target: "#n8n-chat-container",
        mode: "fullscreen",
        defaultLanguage: "es",
        initialMessages: [
          [
            "¡Hola! 👋",
            "",
            "Bienvenido a **NEXUS** — asesoría financiera para tus metas.",
            "",
            "¿En qué podemos ayudarte hoy?",
            "",
            "🏠 Créditos de vivienda",
            "🚗 Créditos vehiculares",
            "💳 Créditos de consumo",
            "👤 Hablar con un asesor",
            "ℹ️ Información general",
          ].join("\n"),
        ],
        i18n: {
          es: {
            title: "Asistente NEXUS",
            subtitle: "Asesoría financiera para tus metas",
            footer: "",
            getStarted: "Nueva conversación",
            inputPlaceholder: "Escribe tu mensaje...",
            closeButtonTooltip: "Cerrar chat",
          },
        },
        loadPreviousSession: true,
        showWelcomeScreen: false,
        enableStreaming: false,
      })
    } catch (error) {
      console.warn("Error loading n8n chat:", error)
    }
  }, [loadN8nChat])

  // ── Track visibility changes (close button inside n8n chat) ──
  useEffect(() => {
    if (!visible) return

    const check = () => {
      const container = containerRef.current
      if (!container) return

      // If n8n chat removed its window or minimized, hide our container
      const chatEl = container.querySelector('[class*="chat"]')
      if (!chatEl) {
        setVisible(false)
      }
    }

    const observer = new MutationObserver(check)
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true })
    }

    return () => observer.disconnect()
  }, [visible])

  // ── Handle toggle click ──
  const handleToggle = useCallback(() => {
    if (!loaded.current) {
      // First click: load + open
      void initChat()
      setVisible(true)
    } else {
      // Subsequent clicks: toggle
      setVisible((v) => !v)
    }
  }, [initChat])

  return (
    <>
      {/* ── Chat window container (hidden by default) ── */}
      <div
        id="n8n-chat-container"
        ref={containerRef}
        className="n8n-chat-container"
        data-visible={visible ? "true" : "false"}
      />

      {/* ── Toggle button ── */}
      <button
        type="button"
        onClick={handleToggle}
        className="n8n-chat-toggle"
        aria-label={visible ? "Cerrar chat" : "Abrir chat"}
        data-active={visible ? "true" : "false"}
      >
        {visible ? (
          /* X icon when open */
          <svg
            className="n8n-chat-toggle-icon"
            viewBox="0 0 256 256"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z" />
          </svg>
        ) : (
          /* Chat dots icon when closed */
          <svg
            className="n8n-chat-toggle-icon"
            viewBox="0 0 256 256"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M128 24a104 104 0 0 0-91.33 154.13l-8.52 29.82a16 16 0 0 0 19.9 19.9l29.82-8.52A104 104 0 1 0 128 24Zm52 112a12 12 0 1 1-12-12 12 12 0 0 1 12 12Zm-40 0a12 12 0 1 1-12-12 12 12 0 0 1 12 12Zm-40 0a12 12 0 1 1-12-12 12 12 0 0 1 12 12Z" />
          </svg>
        )}
      </button>

      <style>{`
        /* ── Chat container (fullscreen mode inside this box) ── */
        .n8n-chat-container {
          position: fixed;
          bottom: calc(1.5rem + 72px);
          right: 1.5rem;
          z-index: 9999;
          width: 430px;
          height: min(72dvh, 620px);
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid rgba(200, 155, 60, 0.35);
          box-shadow: 0 28px 90px rgba(0, 31, 61, 0.24);
          background: #ffffff;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
          transform-origin: bottom right;
        }

        .n8n-chat-container[data-visible="false"] {
          pointer-events: none;
          opacity: 0;
          transform: scale(0.92) translateY(8px);
        }

        .n8n-chat-container[data-visible="true"] {
          pointer-events: auto;
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        /* ── Toggle button ── */
        .n8n-chat-toggle {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9998;
          display: grid;
          width: 64px;
          height: 64px;
          place-items: center;
          border: none;
          border-radius: 50%;
          background: #009933;
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(0, 153, 51, 0.34);
          cursor: pointer;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
        }

        .n8n-chat-toggle:hover {
          background: #007f2a;
          transform: scale(1.04);
        }

        .n8n-chat-toggle:active {
          background: #006b24;
          transform: scale(0.97);
        }

        .n8n-chat-toggle[data-active="true"] {
          background: #002b55;
          box-shadow: 0 18px 40px rgba(0, 31, 61, 0.34);
        }

        .n8n-chat-toggle[data-active="true"]:hover {
          background: #001f3d;
        }

        .n8n-chat-toggle-icon {
          width: 2rem;
          height: 2rem;
        }

        /* ── NEXUS Branding for n8n Chat CSS variables ── */
        :root {
          --chat--color--primary: #009933;
          --chat--color--primary-shade-50: #007f2a;
          --chat--color--primary--shade-100: #006b24;
          --chat--color--secondary: #009933;
          --chat--color-secondary-shade-50: #007f2a;
          --chat--color-white: #ffffff;
          --chat--color-light: #f5f8fb;
          --chat--color-light-shade-50: #eef1f5;
          --chat--color-light-shade-100: #d9dee5;
          --chat--color-medium: #a9b3c1;
          --chat--color-dark: #001f3d;
          --chat--color-disabled: #9db4a4;
          --chat--color-typing: #002b55;

          --chat--spacing: 1rem;
          --chat--border-radius: 0.5rem;
          --chat--transition-duration: 0.18s;
          --chat--font-family: inherit;

          --chat--header-height: auto;
          --chat--header--padding: 0.75rem 0.875rem;
          --chat--header--background: #001f3d;
          --chat--header--color: #ffffff;
          --chat--header--border-top: none;
          --chat--header--border-bottom: none;
          --chat--header--border-left: none;
          --chat--header--border-right: none;

          --chat--heading--font-size: 0.88rem;
          --chat--subtitle--font-size: 0.72rem;
          --chat--subtitle--line-height: 1.4;

          --chat--message--font-size: 0.92rem;
          --chat--message--padding: 0.75rem 0.875rem;
          --chat--message--border-radius: 0.5rem;
          --chat--message-line-height: 1.6;
          --chat--message--margin-bottom: 0.625rem;
          --chat--message--bot--background: #ffffff;
          --chat--message--bot--color: #001f3d;
          --chat--message--bot--border: 1px solid rgba(200, 155, 60, 0.3);
          --chat--message--user--background: #009933;
          --chat--message--user--color: #ffffff;
          --chat--message--user--border: none;
          --chat--message--pre--background: rgba(0, 0, 0, 0.05);
          --chat--messages-list--padding: 0.75rem 0.875rem;

          --chat--textarea--height: auto;
          --chat--textarea--max-height: 7rem;

          --chat--input--font-size: 0.875rem;
          --chat--input--padding: 0.75rem 1rem;
          --chat--input--background: #ffffff;
          --chat--input--text-color: #001f3d;
          --chat--input--line-height: 1.5;
          --chat--input--border: 1px solid rgba(200, 155, 60, 0.45);
          --chat--input--border-radius: 0.5rem;
          --chat--input--border-active: 1px solid #009933;
          --chat--input--placeholder--font-size: 0.875rem;
          --chat--input--container--background: #ffffff;
          --chat--input--container--border: none;
          --chat--input--container--border-radius: 0;
          --chat--input--container--padding: 0.625rem;
          --chat--input--left--panel--width: 0;
          --chat--input--button--border-radius: 0.5rem;

          --chat--button--border-radius: 0.5rem;
          --chat--button--font-size: 0.875rem;
          --chat--button--line-height: 1;
          --chat--button--color--primary: #ffffff;
          --chat--button--background--primary: #009933;
          --chat--button--background--primary-hover: #007f2a;
          --chat--body--background: var(--chat--color-light);
          --chat--footer--background: var(--chat--color-light);
          --chat--footer--color: var(--chat--color-dark);
          --chat--close--button--color-hover: #009933;
        }

        /* ── Dark Mode ── */
        :root[data-theme="dark"] {
          --chat--color-white: #0b1727;
          --chat--color-light: #0b1727;
          --chat--color-light-shade-50: #14243a;
          --chat--color-light-shade-100: #1a3050;
          --chat--color-medium: #7f91a8;
          --chat--color-dark: #07111f;
          --chat--color-typing: #f4f8fd;

          --chat--header--background: #07111f;
          --chat--header--color: #f4f8fd;

          --chat--message--bot--background: #14243a;
          --chat--message--bot--color: #f4f8fd;
          --chat--message--bot--border: 1px solid rgba(200, 155, 60, 0.3);

          --chat--message--user--background: #007127;
          --chat--message--user--color: #ffffff;

          --chat--input--background: #0f1d30;
          --chat--input--text-color: #f4f8fd;
          --chat--input--border: 1px solid rgba(200, 155, 60, 0.32);
          --chat--input--container--background: #07111f;
          --chat--body--background: #0b1727;
          --chat--footer--background: #07111f;
          --chat--footer--color: #f4f8fd;

          .n8n-chat-container {
            border-color: rgba(200, 155, 60, 0.32);
            box-shadow: 0 28px 90px rgba(0, 0, 0, 0.48);
            background: #07111f;
          }
        }

        /* ── Input focus ring ── */
        .n8n-chat textarea:focus {
          outline: none !important;
          box-shadow: 0 0 0 4px rgba(0, 153, 51, 0.15) !important;
          border-color: #009933 !important;
        }

        /* ── Messages area ── */
        .n8n-chat [data-test-id="messages"] {
          padding: 0.75rem 0.875rem !important;
        }

        /* ── Bot message content — extra left padding so text doesn't touch the edge ── */
        .n8n-chat .chat-message-from-bot .chat-message-markdown {
          padding-left: 0.5rem !important;
        }

        /* ── Ensure text area doesn't get pre-wrap (only for input) ── */
        .n8n-chat textarea {
          white-space: normal !important;
        }

        @media (max-width: 480px) {
          .n8n-chat-container {
            width: calc(100vw - 1.5rem);
            height: min(80dvh, 600px);
            bottom: calc(1rem + 64px);
            right: 0.75rem;
          }

          .n8n-chat-toggle {
            bottom: 1rem;
            right: 0.75rem;
            width: 56px;
            height: 56px;
          }

          .n8n-chat-toggle-icon {
            width: 1.75rem;
            height: 1.75rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .n8n-chat-container {
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}
