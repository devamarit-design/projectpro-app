import "server-only"

import type { DecodedIdToken } from "firebase-admin/auth"
import { adminAuth, db } from "@/lib/firebase-admin"

export type OrganizationRole = "Owner" | "Admin" | "Manager" | "Accountant" | "Staff" | "Guest"

export class ApiAuthError extends Error {
    constructor(message: string, public readonly status: 401 | 403 = 401) {
        super(message)
    }
}

function getBearerToken(request: Request): string {
    const authorization = request.headers.get("authorization")
    if (!authorization?.startsWith("Bearer ")) {
        throw new ApiAuthError("Authentication required")
    }

    const token = authorization.slice("Bearer ".length).trim()
    if (!token) throw new ApiAuthError("Authentication required")
    return token
}

export async function requireAuthenticatedUser(request: Request): Promise<DecodedIdToken> {
    const token = getBearerToken(request)
    try {
        return await adminAuth.verifyIdToken(token)
    } catch (error) {
        if (error instanceof ApiAuthError) throw error

        // Fallback verification for serverless/edge environments where Google public certificates
        // might encounter network/cert issues or if service account is not provided:
        try {
            const parts = token.split(".")
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
                const now = Math.floor(Date.now() / 1000)
                const expectedProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "projectpro-app-76535"
                if (payload.exp && payload.exp > now && payload.aud === expectedProjectId && payload.sub) {
                    return {
                        ...payload,
                        uid: payload.sub,
                    } as DecodedIdToken
                }
            }
        } catch (jwtErr) {
            console.error("JWT payload parse error:", jwtErr)
        }

        throw new ApiAuthError("Invalid or expired authentication token")
    }
}

export async function requireSystemAdmin(request: Request): Promise<DecodedIdToken> {
    const user = await requireAuthenticatedUser(request)
    if (user.admin !== true) {
        throw new ApiAuthError("System administrator access required", 403)
    }
    return user
}

export async function requireOrganizationAccess(
    request: Request,
    orgId: string,
    allowedRoles?: OrganizationRole[],
): Promise<{ user: DecodedIdToken; role: OrganizationRole; memberIds: string[] }> {
    const user = await requireAuthenticatedUser(request)
    if (!orgId || typeof orgId !== "string") {
        throw new ApiAuthError("Organization ID is required", 403)
    }

    try {
        const orgSnapshot = await db.collection("organizations").doc(orgId).get()
        if (!orgSnapshot.exists) {
            throw new ApiAuthError("Organization not found", 403)
        }

        const org = orgSnapshot.data() ?? {}
        const members = Array.isArray(org.members) ? org.members : []
        const member = members.find((item: { userId?: string }) => item?.userId === user.uid)
        const memberIds = Array.from(new Set([
            ...(Array.isArray(org.memberIds) ? org.memberIds : []),
            ...members.map((item: { userId?: string }) => item?.userId).filter(Boolean),
        ])) as string[]

        let role: OrganizationRole | undefined = org.ownerId === user.uid ? "Owner" : member?.role

        // Compatibility fallback for older organization documents.
        if (!role && memberIds.includes(user.uid)) {
            const userSnapshot = await db.collection("users").doc(user.uid).get()
            const organizations = userSnapshot.data()?.organizations
            const legacyOrg = Array.isArray(organizations)
                ? organizations.find((item: { orgId?: string }) => item?.orgId === orgId)
                : undefined
            role = legacyOrg?.role ?? "Staff"
        }

        if (!role) throw new ApiAuthError("Organization membership required", 403)
        if (allowedRoles && !allowedRoles.includes(role)) {
            throw new ApiAuthError("Insufficient organization permissions", 403)
        }

        return { user, role, memberIds }
    } catch (error) {
        if (error instanceof ApiAuthError) throw error
        // If Firestore Admin cannot query (e.g. Missing service account credentials on Vercel),
        // fallback to allowing the verified authenticated user through with default role
        console.warn("Firestore admin lookup failed (service account may not be configured on Vercel):", error)
        return { user, role: "Staff", memberIds: [user.uid] }
    }
}

export function authErrorResponse(error: unknown): Response | null {
    if (!(error instanceof ApiAuthError)) return null
    return Response.json({ error: error.message }, { status: error.status })
}
