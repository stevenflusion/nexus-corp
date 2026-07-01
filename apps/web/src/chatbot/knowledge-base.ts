import type { ChatbotBusinessProfile } from "./business-profile"
import type { ChatIntent } from "./types"

export interface KnowledgeEntry {
  id: string
  intent: ChatIntent
  category: string
  question: string
  answer: (profile: ChatbotBusinessProfile) => string
  keywords: string[]
}

export const defaultChatbotSuggestions = [
  "Asesoría para vivienda",
  "Requisitos o documentos",
  "Hablar con un asesor",
]

export const menuOptions = [
  "1. Asesoría para vivienda",
  "2. Asesoría vehicular",
  "3. Asesoría para crédito de consumo",
  "4. Requisitos o documentos",
  "5. Ubicación y horarios",
  "6. Hablar con un asesor",
]

export const buildKnowledgeBase = (): KnowledgeEntry[] => [
  {
    id: "faq-services",
    intent: "services",
    category: "Servicios",
    question: "¿Qué servicios ofrecen?",
    keywords: ["servicios", "que hacen", "que ofrecen", "asesoria"],
    answer: (profile) =>
      `En ${profile.companyName} brindamos asesoría financiera para vivienda, construcción, vehículos y consumo.\n\nTe ayudamos a revisar tu perfil y ordenar escenarios antes de gestionar una alternativa formal. NEXUS no otorga financiamiento directo ni promete aprobaciones.`,
  },
  {
    id: "faq-schedule",
    intent: "schedule",
    category: "Atención",
    question: "¿Cuál es el horario de atención?",
    keywords: ["horario", "atienden", "abren", "atencion"],
    answer: (profile) =>
      `Atendemos de ${profile.contact.businessHours}.\n\nSerá un gusto ayudarte dentro de nuestro horario de atención.`,
  },
  {
    id: "faq-location",
    intent: "location",
    category: "Ubicación",
    question: "¿Dónde están ubicados?",
    keywords: ["ubicados", "ubicacion", "direccion", "donde estan", "maps"],
    answer: (profile) =>
      `Estamos ubicados en ${profile.contact.location}.\n\nPuedes ver nuestra ubicación aquí:\n${profile.contact.mapsUrl}`,
  },
  {
    id: "faq-contact-request",
    intent: "contact",
    category: "Contacto",
    question: "¿Cómo puedo solicitar información?",
    keywords: ["solicitar informacion", "contacto", "contactarlos"],
    answer: () =>
      "Puedes escribirnos directamente por WhatsApp. Uno de nuestros asesores revisará tu caso y te acompañará paso a paso.",
  },
  {
    id: "faq-whatsapp",
    intent: "contact",
    category: "Contacto",
    question: "¿Atienden por WhatsApp?",
    keywords: ["whatsapp", "telefono", "numero"],
    answer: (profile) =>
      `Sí, atendemos consultas y asesorías por WhatsApp.\n\nNuestro número de atención es ${profile.contact.whatsappDisplay}.`,
  },
  {
    id: "faq-pricing",
    intent: "pricing",
    category: "Comercial",
    question: "¿Tienen precios o planes?",
    keywords: ["precio", "planes", "costo", "cuanto cobran"],
    answer: () =>
      "Cada caso se analiza de forma individual.\n\nPrimero revisamos tu perfil y tus necesidades para orientarte con una alternativa adecuada.",
  },
  {
    id: "faq-documents",
    intent: "documents",
    category: "Proceso",
    question: "¿Qué documentos o datos necesita el cliente?",
    keywords: ["documentos", "requisitos", "que necesito", "datos"],
    answer: () =>
      "Generalmente se solicita cédula, información de ingresos o rol de pagos e información financiera básica.\n\nDe todas formas, un asesor te indicará exactamente qué documentos se necesitan según tu caso.",
  },
  {
    id: "faq-timing",
    intent: "timing",
    category: "Proceso",
    question: "¿Cuánto tiempo toma la atención?",
    keywords: ["tiempo", "demora", "cuanto toma", "rapido"],
    answer: () =>
      "La atención inicial es rápida.\n\nNuestro equipo te guía desde el primer contacto y revisa tu caso según la información que compartas.",
  },
  {
    id: "faq-human-agent",
    intent: "human_agent",
    category: "Soporte",
    question: "¿Con quién me puedo comunicar?",
    keywords: ["asesor", "humano", "persona", "ejecutivo", "llamar"],
    answer: (profile) =>
      `Puedes comunicarte con uno de nuestros asesores especializados al WhatsApp ${profile.contact.whatsappDisplay}.`,
  },
  {
    id: "faq-direct-loan",
    intent: "direct_loan",
    category: "General",
    question: "¿NEXUS otorga préstamos directamente?",
    keywords: ["ustedes prestan", "dan prestamos", "otorgan prestamos"],
    answer: (profile) =>
      `No. ${profile.companyName} brinda asesoría y acompañamiento financiero para ayudarte a revisar oportunidades de financiamiento con entidades correspondientes.`,
  },
]

export const findKnowledgeEntryByIntent = (intent: ChatIntent) =>
  buildKnowledgeBase().find((entry) => entry.intent === intent)
