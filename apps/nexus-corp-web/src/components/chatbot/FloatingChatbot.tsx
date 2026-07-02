import { Bot, Loader2, Minus, Send, Trash2, X } from "lucide-react"
import { WhatsappLogoIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { processChatMessage } from "../../chatbot/engine"

type ChatRole = "bot" | "user"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

interface FloatingChatbotProps {
  config: {
    companyName: string
    assistantName: string
    apiEndpoint: string
    welcomeMessage: string
    whatsappNumber?: string
    whatsappPrompt: string
    suggestions: string[]
  }
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `message_${Date.now()}_${Math.random().toString(36).slice(2)}`

const createBotMessage = (content: string): ChatMessage => ({
  id: createId(),
  role: "bot",
  content,
  createdAt: Date.now(),
})

const createUserMessage = (content: string): ChatMessage => ({
  id: createId(),
  role: "user",
  content,
  createdAt: Date.now(),
})

const normalizeSuggestionLabel = (suggestion: string) => {
  switch (suggestion) {
    case "Créditos de vivienda":
      return "Asesoría para vivienda"
    case "Créditos vehiculares":
      return "Asesoría vehicular"
    case "Créditos de consumo":
      return "Asesoría para crédito de consumo"
    default:
      return suggestion
  }
}

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === "string" &&
    (candidate.role === "bot" || candidate.role === "user") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "number"
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const getInitialMessages = (storageKey: string, welcomeMessage: string) => {
  if (typeof window === "undefined") {
    return [createBotMessage(welcomeMessage)]
  }

  try {
    const storedMessages = window.localStorage.getItem(storageKey)

    if (!storedMessages) {
      return [createBotMessage(welcomeMessage)]
    }

    const parsedMessages: unknown = JSON.parse(storedMessages)

    if (Array.isArray(parsedMessages) && parsedMessages.every(isChatMessage)) {
      return parsedMessages.slice(-30)
    }
  } catch {
    window.localStorage.removeItem(storageKey)
  }

  return [createBotMessage(welcomeMessage)]
}

export default function FloatingChatbot({ config }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState(config.suggestions)
  const scrollRef = useRef<HTMLDivElement>(null)
  const preservedScrollTopRef = useRef<number | null>(null)

  const storageKey = useMemo(
    () =>
      `nexus-chatbot:${config.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
    [config.companyName]
  )

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialMessages(storageKey, config.welcomeMessage)
  )

  const whatsappHref = useMemo(() => {
    if (!config.whatsappNumber) {
      return ""
    }

    return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
      config.whatsappPrompt
    )}`
  }, [config.whatsappNumber, config.whatsappPrompt])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(messages.slice(-30))
      )
    } catch {
      // Local storage can be unavailable in private browsing or restricted contexts.
    }
  }, [messages, storageKey])

  useEffect(() => {
    const messagesElement = scrollRef.current

    if (!isOpen || !messagesElement) {
      return
    }

    const preservedScrollTop = preservedScrollTopRef.current

    if (preservedScrollTop !== null) {
      window.requestAnimationFrame(() => {
        messagesElement.scrollTop = preservedScrollTop
      })
      return
    }

    const distanceFromBottom =
      messagesElement.scrollHeight -
      messagesElement.scrollTop -
      messagesElement.clientHeight

    if (distanceFromBottom < 120) {
      messagesElement.scrollTo({
        top: messagesElement.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [isOpen, isTyping, messages])

  const resetConversation = () => {
    const initialMessage = createBotMessage(config.welcomeMessage)
    setMessages([initialMessage])
    setQuickReplies(config.suggestions)

    try {
      window.localStorage.setItem(storageKey, JSON.stringify([initialMessage]))
    } catch {
      // Local storage can be unavailable in private browsing or restricted contexts.
    }
  }

  const getLocalResponse = (cleanMessage: string) =>
    processChatMessage(cleanMessage, {
      channel: "web",
      metadata: {
        page: typeof window !== "undefined" ? window.location.pathname : "/",
      },
    })

  const sendMessage = async (
    value: string,
    options: { preserveScroll?: boolean } = {}
  ) => {
    const cleanMessage = value.replace(/\s+/g, " ").trim().slice(0, 700)

    if (!cleanMessage || isTyping) {
      return
    }

    if (options.preserveScroll) {
      preservedScrollTopRef.current = scrollRef.current?.scrollTop ?? 0
    }

    const userMessage = createUserMessage(cleanMessage)
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput("")
    setIsTyping(true)

    try {
      if (!config.apiEndpoint.trim()) {
        await new Promise((resolve) => window.setTimeout(resolve, 350))

        const localResponse = getLocalResponse(cleanMessage)
        setMessages((currentMessages) => [
          ...currentMessages,
          createBotMessage(localResponse.message),
        ])
        setQuickReplies(
          localResponse.suggestions.slice(0, 3).map(normalizeSuggestionLabel)
        )
        return
      }

      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 4500)

      const response = await fetch(config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: cleanMessage,
          context: {
            channel: "web",
            page:
              typeof window !== "undefined" ? window.location.pathname : "/",
          },
        }),
      })

      window.clearTimeout(timeout)
      const payload: unknown = await response.json()

      if (!response.ok) {
        const localResponse = getLocalResponse(cleanMessage)

        setMessages((currentMessages) => [
          ...currentMessages,
          createBotMessage(localResponse.message),
        ])
        setQuickReplies(
          localResponse.suggestions.slice(0, 3).map(normalizeSuggestionLabel)
        )
        return
      }

      if (isRecord(payload)) {
        const reply = payload.reply

        if (typeof reply !== "string") {
          return
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          createBotMessage(reply),
        ])

        if (
          "suggestions" in payload &&
          Array.isArray(payload.suggestions) &&
          payload.suggestions.every((item) => typeof item === "string")
        ) {
          setQuickReplies(
            payload.suggestions.slice(0, 3).map(normalizeSuggestionLabel)
          )
        }
      }
    } catch {
      const localResponse = getLocalResponse(cleanMessage)

      setMessages((currentMessages) => [
        ...currentMessages,
        createBotMessage(localResponse.message),
      ])
      setQuickReplies(
        localResponse.suggestions.slice(0, 3).map(normalizeSuggestionLabel)
      )
    } finally {
      setIsTyping(false)

      if (options.preserveScroll) {
        window.setTimeout(() => {
          preservedScrollTopRef.current = null
        }, 180)
      }
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {isOpen && (
        <section
          className="nexus-chatbot-panel flex h-[min(72dvh,620px)] w-[calc(100vw-2rem)] max-w-[430px] flex-col overflow-hidden rounded-lg border border-[#C89B3C]/35 bg-white shadow-[0_28px_90px_rgba(0,31,61,0.24)]"
          aria-label={`Chat de ${config.companyName}`}
        >
          <header className="flex items-center justify-between gap-3 bg-[#001F3D] px-3.5 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#009933] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.82rem] leading-tight font-black">
                  {config.assistantName}
                </p>
                <p className="mt-0.5 text-[0.68rem] leading-tight font-semibold text-white/62">
                  En linea
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                className="grid size-9 place-items-center rounded-lg text-white/72 transition hover:bg-white/10 hover:text-white"
                aria-label="Limpiar conversacion"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-white/72 transition hover:bg-white/10 hover:text-white"
                aria-label="Minimizar chat"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="nexus-chatbot-messages flex-1 space-y-2.5 overflow-y-auto bg-[#f5f8fb] px-3.5 py-4"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[94%] rounded-lg px-3.5 py-3 text-[0.92rem] leading-6 shadow-sm ${
                    message.role === "user"
                      ? "nexus-chatbot-message-user bg-[#009933] text-white"
                      : "nexus-chatbot-message-bot border border-[#C89B3C]/30 bg-white text-[#001F3D]"
                  }`}
                >
                  {message.content.split("\n").map((line, index) => (
                    <span key={`${message.id}-${index}`} className="block">
                      {line || "\u00A0"}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="nexus-chatbot-typing inline-flex items-center gap-2 rounded-lg border border-[#C89B3C]/30 bg-white px-3.5 py-2.5 text-[0.86rem] font-bold text-[#002B55] shadow-sm">
                  <Loader2
                    className="size-4 animate-spin text-[#009933]"
                    aria-hidden="true"
                  />
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          <div className="nexus-chatbot-composer border-t border-[#C89B3C]/30 bg-white p-2.5">
            {quickReplies.length > 0 && (
              <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
                {quickReplies.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      void sendMessage(suggestion, { preserveScroll: true })
                    }
                    disabled={isTyping}
                    className="nexus-chatbot-quick-reply min-h-9 shrink-0 rounded-md border border-[#C89B3C]/40 bg-[#f7fbff] px-2.5 text-[0.72rem] font-black whitespace-nowrap text-[#002B55] transition hover:border-[#009933]/50 hover:text-[#009933] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage(input)
              }}
              className="flex items-end gap-2"
            >
              <label className="sr-only" htmlFor="nexus-chatbot-message">
                Mensaje
              </label>
              <textarea
                id="nexus-chatbot-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe tu mensaje"
                rows={1}
                maxLength={700}
                className="nexus-chatbot-input max-h-28 min-h-12 flex-1 resize-none rounded-lg border border-[#C89B3C]/45 bg-white px-4 py-3 text-sm font-semibold text-[#001F3D] transition outline-none placeholder:text-[#6d7b88] focus:border-[#009933] focus:ring-4 focus:ring-[#009933]/15"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage(input)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#009933] text-white transition hover:bg-[#007f2a] disabled:cursor-not-allowed disabled:bg-[#9db4a4]"
                aria-label="Enviar mensaje"
              >
                <Send className="size-5" aria-hidden="true" />
              </button>
            </form>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="nexus-whatsapp-panel-link mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#009933]/25 bg-[#eef8f1] px-4 text-sm font-black text-[#002B55] transition hover:border-[#009933]/45 hover:bg-[#e2f5e7]"
              >
                <WhatsappLogoIcon
                  className="size-4"
                  weight="fill"
                  aria-hidden="true"
                />
                Continuar por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={
          isOpen
            ? "group grid size-14 place-items-center rounded-full bg-[#002B55] text-white shadow-[0_18px_50px_rgba(0,31,61,0.34)] transition hover:bg-[#001F3D] focus-visible:outline-[#C89B3C] sm:size-16"
            : "nexus-whatsapp-launcher group flex items-center gap-3 rounded-full text-white focus-visible:outline-[#C89B3C]"
        }
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="size-7" aria-hidden="true" />
        ) : (
          <>
            <span
              className="nexus-whatsapp-hint pointer-events-none rounded-full bg-white/96 px-3.5 py-2 text-xs font-black whitespace-nowrap text-[#002B55] shadow-[0_10px_30px_rgba(0,31,61,0.16)] backdrop-blur"
              aria-hidden="true"
            >
              Contacta con nosotros
            </span>
            <span className="nexus-whatsapp-bubble grid size-16 place-items-center rounded-full bg-[#25D366] shadow-[0_18px_40px_rgba(0,153,51,0.34)] sm:size-[4.5rem]">
              <WhatsappLogoIcon
                className="size-12 text-white transition group-hover:scale-105 sm:size-14"
                weight="fill"
                aria-hidden="true"
              />
            </span>
          </>
        )}
      </button>

      <style>{`
        @keyframes nexus-whatsapp-breathe {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 18px 28px rgba(0, 153, 51, 0.24));
          }
          50% {
            transform: scale(1.07);
            filter: drop-shadow(0 22px 34px rgba(37, 211, 102, 0.34));
          }
        }

        .nexus-whatsapp-bubble {
          animation: nexus-whatsapp-breathe 2.4s ease-in-out infinite;
          transform-origin: center;
          will-change: transform;
        }

        .nexus-whatsapp-hint {
          transform: translateX(0);
          opacity: 0.96;
          transition:
            opacity 180ms ease,
            transform 180ms ease;
        }

        .nexus-whatsapp-launcher:hover .nexus-whatsapp-bubble,
        .nexus-whatsapp-launcher:focus-visible .nexus-whatsapp-bubble {
          animation-play-state: paused;
          transform: scale(1.04);
        }

        .nexus-whatsapp-launcher:hover .nexus-whatsapp-hint,
        .nexus-whatsapp-launcher:focus-visible .nexus-whatsapp-hint {
          transform: translateX(-0.15rem);
          opacity: 1;
        }

        :root[data-theme="dark"] .nexus-whatsapp-hint {
          border: 1px solid rgba(199, 211, 226, 0.18);
          background: rgba(7, 17, 31, 0.86);
          color: #ffffff;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.34);
        }

        :root[data-theme="dark"] .nexus-chatbot-panel {
          border-color: rgba(200, 155, 60, 0.32);
          background: #07111f !important;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.48);
        }

        :root[data-theme="dark"] .nexus-chatbot-messages {
          background: #0b1727;
        }

        :root[data-theme="dark"] .nexus-chatbot-message-bot,
        :root[data-theme="dark"] .nexus-chatbot-typing {
          border-color: rgba(200, 155, 60, 0.3);
          background: #14243a !important;
          color: #f4f8fd;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
        }

        :root[data-theme="dark"] .nexus-chatbot-message-user {
          background: #007127;
          color: #ffffff;
        }

        :root[data-theme="dark"] .nexus-chatbot-composer {
          border-color: rgba(200, 155, 60, 0.26);
          background: #07111f !important;
        }

        :root[data-theme="dark"] .nexus-chatbot-quick-reply {
          border-color: rgba(200, 155, 60, 0.32);
          background: #10213a;
          color: #f4f8fd;
        }

        :root[data-theme="dark"] .nexus-chatbot-quick-reply:hover {
          border-color: rgba(56, 232, 111, 0.5);
          color: #38e86f;
        }

        :root[data-theme="dark"] .nexus-chatbot-input {
          border-color: rgba(200, 155, 60, 0.32);
          background: #0f1d30 !important;
          color: #f4f8fd !important;
        }

        :root[data-theme="dark"] .nexus-chatbot-input::placeholder {
          color: rgba(199, 211, 226, 0.66);
        }

        :root[data-theme="dark"] .nexus-whatsapp-panel-link {
          border-color: rgba(56, 232, 111, 0.32);
          background: #102f22;
          color: #ffffff;
        }

        :root[data-theme="dark"] .nexus-whatsapp-panel-link:hover {
          border-color: rgba(56, 232, 111, 0.52);
          background: #123f2a;
        }

        @media (prefers-reduced-motion: reduce) {
          .nexus-whatsapp-bubble {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
