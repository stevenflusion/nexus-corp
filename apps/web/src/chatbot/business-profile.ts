import { normalizePhoneNumber, readEnv, readFirstEnv } from "./runtime-env"

export interface ChatbotService {
  name: string
  summary: string
  details: string[]
  keywords: string[]
}

export interface ChatbotBusinessProfile {
  companyName: string
  shortDescription: string
  positioning: string
  audiences: string[]
  services: ChatbotService[]
  process: string[]
  contact: {
    email: string
    location: string
    whatsappDisplay: string
    whatsappNumber: string
    mapsUrl: string
    businessHours: string
  }
  links: {
    home: string
    services: string
    quote: string
    about: string
    contact: string
    brochure: string
  }
  disclaimers: string[]
}

const defaultBusinessProfile: ChatbotBusinessProfile = {
  companyName: "NEXUS",
  shortDescription:
    "NEXUS brinda asesoría financiera para vivienda, construcción, vehículos y consumo.",
  positioning:
    "La empresa no otorga préstamos directamente ni promete aprobaciones. Acompaña la revisión de perfil, documentos, escenarios y siguientes pasos.",
  audiences: [
    "Personas que quieren revisar alternativas de financiamiento antes de decidir.",
    "Familias que preparan vivienda, construcción, movilidad o decisiones patrimoniales.",
    "Emprendedores que necesitan ordenar escenarios de capital, vehículo o crecimiento operativo.",
    "Profesionales e independientes que buscan una guía financiera antes de avanzar.",
  ],
  services: [
    {
      name: "Asesoría vehicular",
      summary:
        "Asesoría para revisar monto, entrada, plazo, cuota estimada y documentos antes de buscar una alternativa para vehículo.",
      details: [
        "Compra o renovación de auto nuevo o seminuevo.",
        "Evaluación de entrada, plazo y capacidad mensual.",
        "Lectura responsable antes de gestionar una alternativa formal.",
      ],
      keywords: ["vehiculo", "vehículo", "auto", "carro", "vehicular"],
    },
    {
      name: "Asesoría para vivienda y construcción",
      summary:
        "Acompañamiento para compra, construcción o mejora de vivienda con una lectura responsable de capacidad.",
      details: [
        "Compra, construcción, mejora o consolidación patrimonial.",
        "Revisión de capacidad, entrada, plazo y cuota referencial.",
        "Ordenamiento de información antes de iniciar una gestión formal.",
      ],
      keywords: [
        "vivienda",
        "casa",
        "departamento",
        "construccion",
        "construcción",
        "inmobiliario",
        "hipoteca",
      ],
    },
    {
      name: "Asesoría para crédito de consumo",
      summary:
        "Asesoría para revisar necesidades personales y su impacto mensual con mayor claridad financiera.",
      details: [
        "Estudios, salud, equipamiento o metas familiares.",
        "Revisión de alternativas sin perder visibilidad del flujo mensual.",
        "Preparación de información para conversar con mayor claridad.",
      ],
      keywords: ["consumo", "personal", "estudios", "salud", "equipamiento"],
    },
  ],
  process: [
    "Simulas objetivo, monto, plazo e ingresos.",
    "NEXUS revisa capacidad, cuota estimada y posibles alertas.",
    "Se ordenan documentos y escenarios para gestionar.",
    "Recibes acompañamiento para conversar con opciones reales.",
  ],
  contact: {
    email: "info@nexuscorpec.com",
    location: "Quito, Ecuador",
    whatsappDisplay: "+593 98 137 1278",
    whatsappNumber: "593981371278",
    mapsUrl: "https://maps.app.goo.gl/tMuYfK8NgjZTrhvD9",
    businessHours: "lunes a viernes, de 09h00 a 18h00",
  },
  links: {
    home: "https://www.nexuscorpec.com",
    services: "/servicios/",
    quote: "/cotizador/",
    about: "/nosotros/",
    contact: "/contacto/",
    brochure: "/branding/brochure.pdf",
  },
  disclaimers: [
    "La asesoría y el cotizador son referenciales.",
    "NEXUS no otorga financiamiento directo.",
    "El resultado no representa aprobación, tasa final ni oferta financiera.",
    "Las condiciones finales dependen de políticas de entidades, historial, documentación, garantías y condiciones vigentes.",
  ],
}

export const getBusinessProfile = (): ChatbotBusinessProfile => {
  const whatsappNumber = normalizePhoneNumber(
    readFirstEnv(
      ["BUSINESS_PHONE_NUMBER", "NEXT_PUBLIC_WHATSAPP_NUMBER"],
      defaultBusinessProfile.contact.whatsappNumber
    )
  )

  return {
    ...defaultBusinessProfile,
    companyName: readFirstEnv(
      ["BUSINESS_NAME", "CHATBOT_COMPANY_NAME"],
      defaultBusinessProfile.companyName
    ),
    contact: {
      ...defaultBusinessProfile.contact,
      email: readFirstEnv(
        ["BUSINESS_EMAIL", "CHATBOT_CONTACT_EMAIL"],
        defaultBusinessProfile.contact.email
      ),
      location: readEnv(
        "CHATBOT_CONTACT_LOCATION",
        defaultBusinessProfile.contact.location
      ),
      whatsappDisplay: readFirstEnv(
        ["BUSINESS_PHONE_DISPLAY", "CHATBOT_CONTACT_WHATSAPP_DISPLAY"],
        defaultBusinessProfile.contact.whatsappDisplay
      ),
      whatsappNumber:
        whatsappNumber || defaultBusinessProfile.contact.whatsappNumber,
      mapsUrl: readEnv(
        "BUSINESS_MAPS_URL",
        defaultBusinessProfile.contact.mapsUrl
      ),
      businessHours: readEnv(
        "CHATBOT_BUSINESS_HOURS",
        defaultBusinessProfile.contact.businessHours
      ),
    },
    links: {
      ...defaultBusinessProfile.links,
      home: readEnv("BUSINESS_WEBSITE", defaultBusinessProfile.links.home),
    },
  }
}
