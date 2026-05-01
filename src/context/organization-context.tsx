"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, writeBatch, addDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"


// Types
export type SubscriptionPlan = "Free" | "Pro" | "Enterprise"

export interface Organization {
    id: string
    name: string
    ownerId: string
    subscriptionPlan: SubscriptionPlan
    createdAt: string
    memberIds?: string[]
    settings: {
        currency: string
        locale: string
        googleSheetId?: string
        googleDriveFolderId?: string
        logoUrl?: string
        taxId?: string
        address?: string
        addressEn?: string
        nameEn?: string
        phone?: string
        email?: string
        website?: string
        description?: string
        paymentInfo?: string
        signatureName?: string
        financialTargets?: {
            incomeMin: number
            incomeMax: number
            expenseWarning: number
            expenseLimit: number
        }
        moodThresholds?: {
            relaxed: number
            chill: number
            pumped: number
        }
        notifications?: {
            warnDaysTasks: number
            warnDaysExpenses: number
            notifyOnTaskAssignment: boolean
            notifyOnOverdue: boolean
            notifyOnPaymentDue: boolean
        }
        googleDriveTokens?: {
            refresh_token: string
            access_token: string
            expiry_date: number
            updatedAt: any
        }
    }
    members?: OrgMember[]
}

export interface OrgMember {
    userId: string
    role: "Owner" | "Admin" | "Manager" | "Accountant" | "Staff"
    joinedAt: string
}

interface OrganizationContextType {
    currentOrg: Organization | null
    userOrgs: Organization[]
    isLoading: boolean
    setCurrentOrg: (org: Organization) => void
    refreshOrgs: () => Promise<void>
    createOrganization: (name: string) => Promise<string>
    joinOrganization: (orgId: string) => Promise<void>
    joinOrganizationByCode: (code: string) => Promise<string> // Returns Team Name
    getOrganizationPreview: (code: string) => Promise<{ id: string, name: string, memberCount: number } | null>
    deleteOrganization: (orgId: string) => Promise<void>
    ensureInviteCode: (orgId: string) => Promise<string> // Returns invite code
}


const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null)
    const [userOrgs, setUserOrgs] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)

    // We need to listen to auth state separately effectively, or just rely on ProjectContext?
    // ProjectContext is huge. Let's try to get auth from firebase direct or depend on ProjectContext if stable.
    // Ideally OrgContext wraps ProjectContext. But ProjectContext handles Auth.
    // For now, let's listen to Auth independently to ensure this can be a parent or sibling.

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setFirebaseUser(user)
            if (!user) {
                setCurrentOrgState(null)
                setUserOrgs([])
                setIsLoading(false)
            }
        })
        return () => unsubscribe()
    }, [])

    const fetchUserOrgs = React.useCallback(async () => {
        if (!firebaseUser) return

        setIsLoading(true)
        try {
            const userRef = doc(db, "users", firebaseUser.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                const userData = userSnap.data()
                const orgList: Organization[] = []

                // Support both legacy "organizations" array of objects and newer "orgIds" array of strings
                const rawOrgIds: string[] = []

                if (userData.orgIds && Array.isArray(userData.orgIds)) {
                    rawOrgIds.push(...userData.orgIds)
                }

                if (userData.organizations && Array.isArray(userData.organizations)) {
                    userData.organizations.forEach((org: any) => {
                        const id = typeof org === 'string' ? org : org.orgId
                        if (id && !rawOrgIds.includes(id)) rawOrgIds.push(id)
                    })
                }

                if (rawOrgIds.length > 0) {
                    const orgPromises = rawOrgIds.map(async (id: string) => {
                        try {
                            const orgRef = doc(db, "organizations", id)
                            const orgSnap = await getDoc(orgRef)
                            if (orgSnap.exists()) {
                                const orgData = { id: orgSnap.id, ...orgSnap.data() } as Organization

                                // AUTO-PROMOTION: If the organization has only one member, 
                                // and it's this user, ensure they are the Owner.
                                if (orgData.members?.length === 1 && orgData.members[0].userId === firebaseUser.uid) {
                                    if (orgData.ownerId !== firebaseUser.uid || orgData.members[0].role !== 'Owner') {
                                        console.log(`Auto-promoting user ${firebaseUser.uid} to Owner of org ${id}`)
                                        const updatedOrgData = {
                                            ...orgData,
                                            ownerId: firebaseUser.uid,
                                            members: [{
                                                ...orgData.members[0],
                                                role: 'Owner' as const
                                            }]
                                        }
                                        await setDoc(orgRef, updatedOrgData, { merge: true })
                                        return updatedOrgData
                                    }
                                }

                                return orgData
                            }
                        } catch (e) {
                            console.warn(`Failed to fetch org ${id}:`, e)
                        }
                        return null
                    })

                    const results = await Promise.all(orgPromises)
                    results.forEach(org => {
                        if (org) orgList.push(org)
                    })
                }

                setUserOrgs(orgList)

                // Auto-Migration: Ensure 'memberIds' legacy backfill
                // Only run this if we have organizations and the user might be an owner/admin of some
                for (const org of orgList) {
                    if (!org.memberIds && org.members && org.members.length > 0) {
                        try {
                            const currentUserRole = org.members.find(m => m.userId === firebaseUser.uid)?.role
                            if (currentUserRole === 'Owner' || currentUserRole === 'Admin') {
                                const extractedMemberIds = Array.from(new Set(org.members.map(m => m.userId)))
                                const orgRef = doc(db, "organizations", org.id)
                                setDoc(orgRef, { memberIds: extractedMemberIds }, { merge: true })
                                    .catch(e => console.warn(`Migration failed for org ${org.id}`, e))
                            }
                        } catch (e) {
                            console.warn("Migration check error", e)
                        }
                    }
                }

                // SELF-HEALING: Ensure User's 'orgIds' contains all orgs they are a member of.
                // This creates consistency for Firestore Rules (Option #2 in isOrgMember).
                if (orgList.length > 0) {
                    const currentOrgIds = userData.orgIds || []
                    const missingParams = orgList
                        .filter(o => !currentOrgIds.includes(o.id))
                        .map(o => o.id)

                    if (missingParams.length > 0) {
                        console.log("Syncing missing orgIds to user profile:", missingParams)
                        const updatedOrgIds = Array.from(new Set([...currentOrgIds, ...missingParams]))
                        try {
                            await setDoc(userRef, { orgIds: updatedOrgIds }, { merge: true })
                        } catch (err) {
                            console.error("Failed to sync user orgIds", err)
                        }
                    }
                }

                // Update currentOrg if it exists in the new list (refresh content)
                // or set default if none selected
                if (orgList.length > 0) {
                    const savedOrgId = localStorage.getItem("lastOrgId")

                    // If we have a currentOrg, try to find it in the new list to update its data
                    if (currentOrg) {
                        const updatedCurrent = orgList.find(o => o.id === currentOrg.id)
                        if (updatedCurrent) {
                            setCurrentOrgState(updatedCurrent)
                        } else {
                            // Current org was removed? Fallback.
                            const found = orgList.find(o => o.id === savedOrgId)
                            setCurrentOrgState(found || orgList[0])
                        }
                    } else {
                        // Initial Load logic
                        const found = orgList.find(o => o.id === savedOrgId)
                        setCurrentOrgState(found || orgList[0])
                    }
                } else {
                    setCurrentOrgState(null)
                }
            }
        } catch (error) {
            console.error("Error fetching orgs:", error)
        } finally {
            setIsLoading(false)
        }
    }, [firebaseUser])

    useEffect(() => {
        if (firebaseUser) {
            fetchUserOrgs()
        }
    }, [firebaseUser, fetchUserOrgs])

    const createOrganization = React.useCallback(async (name: string): Promise<string> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. Create Org Document
        const newOrgRef = doc(collection(db, "organizations"))
        const newOrg: Organization = {
            id: newOrgRef.id,
            name,
            ownerId: firebaseUser.uid,
            subscriptionPlan: "Free",
            createdAt: new Date().toISOString(),
            memberIds: [firebaseUser.uid],
            settings: {
                currency: "THB",
                locale: "th",
                // Copy settings from current legacy user profile if needed?
            }
        }

        // 2. Add creator as Owner
        newOrg.members = [{
            userId: firebaseUser.uid,
            role: "Owner",
            joinedAt: new Date().toISOString()
        }]

        // Critical Path: Create the Org Document
        await setDoc(newOrgRef, newOrg)

        // 3. Update User Profile to include this Org (Background -> Foreground)
        // We MUST await this to ensure the user has the org in their profile
        // before the app reloads/re-initializes.
        const updateUserProfile = async () => {
            try {
                const userRef = doc(db, "users", firebaseUser.uid)
                const userSnap = await getDoc(userRef)

                if (userSnap.exists()) {
                    const userData = userSnap.data()
                    const existingOrgs = userData.organizations || []
                    const existingTeamIds = userData.orgIds || []
                    await setDoc(userRef, {
                        ...userData,
                        organizations: [...existingOrgs, { orgId: newOrg.id, role: "Owner" }],
                        orgIds: Array.from(new Set([...existingTeamIds, newOrg.id]))
                    }, { merge: true })
                } else {
                    await setDoc(userRef, {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        organizations: [{ orgId: newOrg.id, role: "Owner" }],
                        orgIds: [newOrg.id]
                    })
                }
            } catch (err) {
                console.error("User Profile Update Failed:", err)
                throw err // Re-throw to block navigation if this fails
            }
        }

        await updateUserProfile()

        // 4. Update Local State & Redirect
        // Now it is safe to reload because Firestore has the link.
        const updatedOrgs = [...userOrgs, newOrg]
        setUserOrgs(updatedOrgs)
        setCurrentOrgState(newOrg)

        return newOrg.id
    }, [firebaseUser, userOrgs])

    const joinOrganization = React.useCallback(async (orgId: string): Promise<void> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. Check if Org Exists
        const orgRef = doc(db, "organizations", orgId)
        const orgSnap = await getDoc(orgRef)

        if (!orgSnap.exists()) {
            throw new Error("Organization not found")
        }

        // 2. Check if already a member in the organization document
        const orgData = orgSnap.data() as Organization
        const isAlreadyInOrgList = orgData.members?.some(m => m.userId === firebaseUser.uid)

        // If they are already in the list, we don't 'throw', we 'heal' 
        // by making sure their user profile is correctly linked below.

        // 3. Prepare User to Org Members update
        const newMember: OrgMember = {
            userId: firebaseUser.uid,
            role: "Staff",
            joinedAt: new Date().toISOString()
        }

        // Only add if not already present
        const updatedMembers = isAlreadyInOrgList
            ? (orgData.members || [])
            : [...(orgData.members || []), newMember]

        const updatedMemberIds = Array.from(new Set([...(orgData.memberIds || []), firebaseUser.uid]))

        // 4. Update User Profile
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()
        const existingOrgs = userData?.organizations || []

        // ATOMIC UPDATE: Use WriteBatch to ensure both docs sync at once
        const batch = writeBatch(db)

        // Update Org
        batch.set(orgRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds
        }, { merge: true })

        // Update User
        if (!existingOrgs.some((o: any) => o.orgId === orgId)) {
            const orgIds = userData?.orgIds || []
            const teamIds = userData?.teamIds || [] // Legacy rules support
            const organizationIds = userData?.organizationIds || [] // Robustness check

            batch.set(userRef, {
                organizations: [...existingOrgs, { orgId: orgId, role: "Staff" }],
                orgIds: Array.from(new Set([...orgIds, orgId])),
                teamIds: Array.from(new Set([...teamIds, orgId])),
                organizationIds: Array.from(new Set([...organizationIds, orgId])) // Add for extra safety
            }, { merge: true })
        }

        await batch.commit()

        // 5. Update Local State
        const joinedOrg = { ...orgData, id: orgSnap.id, members: updatedMembers }
        setUserOrgs([...userOrgs, joinedOrg])
        setCurrentOrgState(joinedOrg)
    }, [firebaseUser, userOrgs])

    const joinOrganizationByCode = React.useCallback(async (code: string): Promise<string> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        const trimmedCode = code.trim()
        let targetOrgId = ""

        // 1. Try Find Invite
        const q = query(collection(db, "invites"), where("code", "==", trimmedCode))
        const snap = await getDocs(q)

        if (!snap.empty) {
            const inviteData = snap.docs[0].data()
            targetOrgId = inviteData.teamId
        } else {
            // 2. FALLBACK: Try checking if code is a valid Org ID directly
            const possibleOrgRef = doc(db, "organizations", trimmedCode)
            const possibleOrgSnap = await getDoc(possibleOrgRef)

            if (possibleOrgSnap.exists()) {
                targetOrgId = trimmedCode
            } else {
                throw new Error("Invalid or expired invite code")
            }
        }

        // 3. Join
        await joinOrganization(targetOrgId)

        // 4. Return Team Name for UI feedback
        const orgRef = doc(db, "organizations", targetOrgId)
        const teamSnap = await getDoc(orgRef)
        return teamSnap.exists() ? teamSnap.data().name : "Unknown Team"
    }, [firebaseUser, joinOrganization])

    const setCurrentOrg = React.useCallback((org: Organization) => {
        // Prevent reload if setting the same org
        if (currentOrg?.id === org.id) return

        // Persist the selection
        localStorage.setItem("lastOrgId", org.id)
        setCurrentOrgState(org)

        // RELOAD: Force a full app refresh to ensure all contexts (Settings, Projects, etc.)
        // are completely re-initialized with the new organization's data.
        window.location.reload()
    }, [currentOrg])

    const getOrganizationPreview = React.useCallback(async (code: string): Promise<{ id: string, name: string, memberCount: number } | null> => {
        const trimmedCode = code.trim()
        let targetOrgId = ""

        // 1. Try Find Invite
        const q = query(collection(db, "invites"), where("code", "==", trimmedCode))
        const snap = await getDocs(q)

        if (!snap.empty) {
            targetOrgId = snap.docs[0].data().teamId
        } else {
            targetOrgId = trimmedCode
        }

        // 2. Fetch Org Data
        const orgRef = doc(db, "organizations", targetOrgId)
        const orgSnap = await getDoc(orgRef)

        if (orgSnap.exists()) {
            const data = orgSnap.data()
            return {
                id: orgSnap.id,
                name: data.name,
                memberCount: data.members?.length || 0
            }
        }

        return null
    }, [])

    const ensureInviteCode = React.useCallback(async (orgId: string): Promise<string> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. ลองหา invite ที่มีอยู่แล้วสำหรับ org นี้
        const q = query(
            collection(db, "invites"),
            where("code", "==", orgId)
        )
        const snap = await getDocs(q)

        if (!snap.empty) {
            // มีแล้ว คืน code กลับ
            return snap.docs[0].data().code as string
        }

        // 2. ถ้าไม่มี สร้างใหม่
        const inviteData = {
            code: orgId,           // ใช้ orgId เป็น code เพื่อ simplicity
            teamId: orgId,         // org ที่จะ join
            createdBy: firebaseUser.uid,
            createdAt: new Date().toISOString(),
        }

        await addDoc(collection(db, "invites"), inviteData)

        return orgId
    }, [firebaseUser])

    const deleteOrganization = React.useCallback(async (orgId: string): Promise<void> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. Verify Ownership (Security check)
        const orgRef = doc(db, "organizations", orgId)
        const orgSnap = await getDoc(orgRef)

        if (!orgSnap.exists()) throw new Error("Organization not found")

        const orgData = orgSnap.data() as Organization
        const member = orgData.members?.find(m => m.userId === firebaseUser.uid)

        if (!member || member.role !== 'Owner') {
            throw new Error("Only the owner can delete this organization")
        }

        // 2. Delete Org Document
        await deleteDoc(orgRef)

        // 3. Remove from User Profile
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
            const userData = userSnap.data()
            const existingOrgs = userData.organizations || []
            const existingIds = userData.orgIds || []

            // Filter out the deleted org
            const updatedOrgs = existingOrgs.filter((o: any) => o.orgId !== orgId)
            const updatedIds = existingIds.filter((id: string) => id !== orgId)

            await setDoc(userRef, {
                ...userData,
                organizations: updatedOrgs,
                orgIds: updatedIds
            }, { merge: true })
        }

        // 4. Cleanup Local Storage
        if (localStorage.getItem("lastOrgId") === orgId) {
            localStorage.removeItem("lastOrgId")
        }

        // 5. Hard Reload to Reset State
        window.location.href = '/'
    }, [firebaseUser])

    const value = React.useMemo(() => ({
        currentOrg,
        userOrgs,
        setCurrentOrg,
        isLoading,
        refreshOrgs: fetchUserOrgs,
        createOrganization,
        joinOrganization,
        joinOrganizationByCode,
        getOrganizationPreview,
        deleteOrganization,
        ensureInviteCode
    }), [
        currentOrg,
        userOrgs,
        setCurrentOrg,
        isLoading,
        fetchUserOrgs,
        createOrganization,
        joinOrganization,
        joinOrganizationByCode,
        getOrganizationPreview,
        deleteOrganization,
        ensureInviteCode
    ])

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = React.useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error("useOrganization must be used within an OrganizationProvider")
    }
    return context
}
