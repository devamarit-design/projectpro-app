
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { authErrorResponse, requireAuthenticatedUser, requireOrganizationAccess } from '@/lib/api-auth';
import { db } from '@/lib/firebase-admin';

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character] ?? character)
}

export async function POST(req: Request) {
    try {
        await requireAuthenticatedUser(req);
        const body = await req.json();
        const { to, orgId, inviteLink, inviteCode } = body;

        if (!to || !orgId || !inviteLink) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await requireOrganizationAccess(req, orgId, ['Owner', 'Admin']);
        const orgSnapshot = await db.collection('organizations').doc(orgId).get();
        const orgName = escapeHtml(String(orgSnapshot.data()?.name || 'your organization'));
        const safeInviteLink = escapeHtml(String(inviteLink));
        const safeInviteCode = escapeHtml(String(inviteCode || orgId));

        const result = await sendEmail({
            to,
            subject: `Join ${orgName} on Hipsloth`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>You have been invited to join ${orgName}</h2><p>You have been invited to join <strong>${orgName}</strong> on Hipsloth.</p><p><a href="${safeInviteLink}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Join Organization</a></p><p style="color:#666">Invite Code: <strong>${safeInviteCode}</strong></p><hr style="margin:24px 0;border:0;border-top:1px solid #eee"><p style="font-size:12px;color:#999">If you did not expect this invitation, you can ignore this email.</p></div>`,
        });

        if (result.success) {
            return NextResponse.json(result.data);
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        const authResponse = authErrorResponse(error);
        if (authResponse) return authResponse;
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
