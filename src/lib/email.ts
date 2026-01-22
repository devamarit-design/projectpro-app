
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Email sending skipped.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        const data = await resend.emails.send({
            from: 'ProjectPro <onboarding@resend.dev>', // Default Resend testing domain, user should configure this later
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
