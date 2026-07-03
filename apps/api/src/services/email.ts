import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@nexus-corp.com";

// ==========================
// MAGIC LINK EMAIL
// ==========================

export async function sendMagicLinkEmail(
    to: string,
    template: string,
    linkUrl: string
): Promise<{ sent: boolean }> {
    if (!resend) {
        return { sent: false };
    }

    const html = template.replace(/{{link}}/g, linkUrl);

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: "Tu enlace de acceso",
            html,
        });

        return { sent: true };
    } catch (error) {
        console.error("Failed to send magic link email:", error);
        return { sent: false };
    }
}
