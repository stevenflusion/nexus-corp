import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
console.log("[Email Service] RESEND_API_KEY present?", !!RESEND_API_KEY);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// ==========================
// MAGIC LINK EMAIL
// ==========================

export async function sendMagicLinkEmail(
    to: string,
    template: string,
    linkUrl: string
): Promise<{ sent: boolean; error?: string }> {
    console.log("[Email Service] sendMagicLinkEmail called", { to, hasTemplate: !!template, hasLinkUrl: !!linkUrl });
    
    if (!resend) {
        console.error("[Email Service] Resend client is null — check RESEND_API_KEY");
        return { sent: false, error: "Resend not configured" };
    }

    const html = template.replace(/{{link}}/g, linkUrl);

    try {
        console.log("[Email Service] Sending email via Resend...", { from: FROM_EMAIL, to });
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: "Tu enlace de acceso",
            html,
        });
        console.log("[Email Service] Resend response:", JSON.stringify(result, null, 2));

        if (result.error) {
            console.error("[Email Service] Resend returned error:", result.error);
            return { sent: false, error: JSON.stringify(result.error) };
        }

        return { sent: true };
    } catch (error) {
        console.error("[Email Service] Exception sending email:", error);
        return { sent: false, error: error instanceof Error ? error.message : String(error) };
    }
}
