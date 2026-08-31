import "server-only"

import type { DecodedIdToken } from "firebase-admin/auth"
import { adminAuth, db } from "@/lib/firebase-admin"

export type OrganizationRole = "Owner" | "Admin" | "Manager" | "Accountant" | "Staff"

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
    try {
        return await adminAuth.verifyIdToken(getBearerToken(request))
    } catch (error) {
        if (error instanceof ApiAuthError) throw error
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
}

export function authErrorResponse(error: unknown): Response | null {
    if (!(error instanceof ApiAuthError)) return null
    return Response.json({ error: error.message }, { status: error.status })
}
