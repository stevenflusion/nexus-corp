import type { ChatbotBusinessProfile } from "./business-profile"
import { getBusinessHoursLabel } from "./business-hours"
import { findKnowledgeEntryByIntent, menuOptions } from "./knowledge-base"
import type { ChatIntent } from "./types"

const advisorQuestion =
  "¿Deseas que te comunique con un asesor para revisar tu caso?"

const menuText = () => menuOptions.join("\n")

export const buildWelcomeMessage = (profile: ChatbotBusinessProfile) =>
  `Hola, gracias por comunicarte con ${profile.companyName}.\nTe ayudamos con asesoría financiera para vivienda, construcción, vehículos y consumo.\n\n¿En qué podemos ayudarte hoy?\n\n${menuText()}`

export const buildFallbackMessage = () =>
  `Gracias por tu mensaje.\nPara ayudarte mejor, puedes elegir una de estas opciones:\n\n${menuText()}`

export const buildHumanHandoffMessage = (profile: ChatbotBusinessProfile) =>
  `Claro, voy a dejar tu consulta para que uno de nuestros asesores especializados pueda revisarla y darte una atención más personalizada.\n\nTambién puedes comunicarte directamente al ${profile.contact.whatsappDisplay}.`

export const buildOutOfHoursMessage = (profile: ChatbotBusinessProfile) =>
  `Gracias por escribir a ${profile.companyName}.\nEn este momento estamos fuera de horario de atención.\n\nNuestro horario es de ${getBusinessHoursLabel()}.\n\nHemos recibido tu mensaje y un asesor podrá responderte apenas esté disponible.`

export const buildOutOfHoursNote = () =>
  `Nota: en este momento estamos fuera de horario de atención. Nuestro horario es de ${getBusinessHoursLabel()}. Si requieres atención personalizada, un asesor podrá responderte en el próximo horario laboral.`

const appendAdvisorOffer = (message: string) =>
  `${message}\n\n${advisorQuestion}`

const getFaqAnswer = (
  intent: ChatIntent,
  profile: ChatbotBusinessProfile,
  fallback: string
) => findKnowledgeEntryByIntent(intent)?.answer(profile) ?? fallback

export const buildIntentResponse = (
  intent: ChatIntent,
  profile: ChatbotBusinessProfile
) => {
  switch (intent) {
    case "greeting":
      return buildWelcomeMessage(profile)

    case "services":
      return appendAdvisorOffer(
        getFaqAnswer(
          "services",
          profile,
          `En ${profile.companyName} brindamos asesoría financiera para vivienda, construcción, vehículos y consumo.`
        )
      )

    case "housing_credit":
      return appendAdvisorOffer(
        "Para vivienda o construcción, te ayudamos a revisar tu perfil, capacidad de pago, objetivo, documentos y posibles escenarios antes de avanzar con una gestión formal.\n\nLa asesoría es referencial y no representa aprobación de crédito ni financiamiento directo."
      )

    case "vehicle_credit":
      return appendAdvisorOffer(
        "Para asesoría vehicular, podemos orientarte en la revisión de monto, entrada, plazo, cuota estimada y documentos necesarios según tu caso.\n\nNEXUS brinda asesoría y acompañamiento; no otorga préstamos directamente."
      )

    case "consumer_credit":
      return appendAdvisorOffer(
        "Para crédito de consumo, revisamos tu necesidad, capacidad mensual e información financiera básica para orientarte con una alternativa acorde a tu perfil.\n\nLa evaluación final siempre depende de las condiciones y políticas de la entidad correspondiente."
      )

    case "schedule":
      return getFaqAnswer(
        "schedule",
        profile,
        `Atendemos de ${profile.contact.businessHours}.`
      )

    case "location":
      return `${getFaqAnswer(
        "location",
        profile,
        `Estamos ubicados en ${profile.contact.location}.`
      )}\n\nNuestro horario de atención es de ${getBusinessHoursLabel()}.`

    case "contact":
      return appendAdvisorOffer(
        `${getFaqAnswer(
          "contact",
          profile,
          "Puedes escribirnos directamente por WhatsApp."
        )}\n\nCorreo: ${profile.contact.email}`
      )

    case "pricing":
      return appendAdvisorOffer(
        getFaqAnswer(
          "pricing",
          profile,
          "Cada caso se analiza de forma individual."
        )
      )

    case "documents":
      return appendAdvisorOffer(
        getFaqAnswer(
          "documents",
          profile,
          "Un asesor te indicará exactamente qué documentos se necesitan según tu caso."
        )
      )

    case "timing":
      return appendAdvisorOffer(
        getFaqAnswer(
          "timing",
          profile,
          "La atención inicial es rápida y depende de la información que compartas."
        )
      )

    case "human_agent":
      return buildHumanHandoffMessage(profile)

    case "direct_loan":
      return appendAdvisorOffer(
        getFaqAnswer(
          "direct_loan",
          profile,
          `${profile.companyName} no otorga préstamos directamente. Brinda asesoría y acompañamiento financiero.`
        )
      )

    case "thanks":
      return `Gracias por comunicarte con ${profile.companyName}.\nFue un gusto ayudarte.\n\nEstamos atentos a cualquier consulta adicional.`

    case "empty":
      return `Necesito que me envíes una pregunta o mensaje para poder ayudarte.\n\n${menuText()}`

    case "fallback":
    default:
      return buildFallbackMessage()
  }
}
