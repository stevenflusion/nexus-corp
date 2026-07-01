import type { APIRoute } from "astro"
import {
  handleMethodNotAllowed,
  handleWhatsAppWebhookGet,
  handleWhatsAppWebhookPost,
} from "@/chatbot/webhook-handler"

export const prerender = false

export const GET: APIRoute = ({ request }) => handleWhatsAppWebhookGet(request)

export const POST: APIRoute = ({ request }) =>
  handleWhatsAppWebhookPost(request)

export const ALL: APIRoute = () => handleMethodNotAllowed()
