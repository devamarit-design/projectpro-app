"use server";

import { adminAuth } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function sendPasswordResetLink(email: string) {
    try {
        // 1. Generate the Password Reset Link using Firebase Admin SDK
        const link = await adminAuth.generatePasswordResetLink(email);

        // 2. Prepare the Email Content
        // You can customize this HTML to match your Hipsloth branding
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            background-color: #2563eb; 
            color: #ffffff; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin-top: 20px;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your Hipsloth account associated with <strong>${email}</strong>.</p>
          <p>Click the button below to reset it:</p>
          <a href="${link}" class="button">Reset Password</a>
          <p>If you didn't ask to reset your password, you can safely ignore this email.</p>
          <div class="footer">
            <p>Hipsloth App</p>
          </div>
        </div>
      </body>
      </html>
    `;

        // 3. Send the Email via Resend
        // Important: Ensure 'noreply@hipsloth.app' is verified in your Resend Dashboard
        const result = await sendEmail({
            to: email,
            subject: "Reset your Hipsloth password",
            html,
            from: "Hipsloth Support <support@hipsloth.app>"
        });

        if (!result.success) {
            throw new Error("Failed to send email via Resend");
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error sending password reset link:", error);
        // Return a generic error to the client, or specific if needed
        return { success: false, error: error.message };
    }
}
