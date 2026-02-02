import { Resend } from 'resend';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams & { from?: string }) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Email sending skipped.");
        return { success: false, error: "Missing API Key" };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const data = await resend.emails.send({
            from: from || 'Hipsloth <noreply@hipsloth.app>', // Prioritize custom from, fallback to default
            to,
            subject,
            html,
        });

        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}
