"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useProjects } from "./project-context"

// Types
export type SubscriptionPlan = "Free" | "Pro" | "Enterprise"

export interface Organization {
    id: string
    name: string
    ownerId: string
    subscriptionPlan: SubscriptionPlan
    createdAt: string
    settings: {
        currency: string
        locale: string
        logoUrl?: string
        taxId?: string
        address?: string
        phone?: string
        email?: string
        website?: string
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

    const fetchUserOrgs = async () => {
        if (!firebaseUser) return

        setIsLoading(true)
        try {
            const userRef = doc(db, "users", firebaseUser.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                const userData = userSnap.data()
                const orgList: Organization[] = []

                if (userData.organizations && Array.isArray(userData.organizations)) {
                    const orgPromises = userData.organizations.map(async (orgMeta: any) => {
                        const orgRef = doc(db, "organizations", orgMeta.orgId)
                        const orgSnap = await getDoc(orgRef)
                        if (orgSnap.exists()) {
                            return { id: orgSnap.id, ...orgSnap.data() } as Organization
                        }
                        return null
                    })

                    const results = await Promise.all(orgPromises)
                    results.forEach(org => {
                        if (org) orgList.push(org)
                    })
                }

                setUserOrgs(orgList)

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
    }

    useEffect(() => {
        if (firebaseUser) {
            fetchUserOrgs()
        }
    }, [firebaseUser])

    const createOrganization = async (name: string): Promise<string> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. Create Org Document
        const newOrgRef = doc(collection(db, "organizations"))
        const newOrg: Organization = {
            id: newOrgRef.id,
            name,
            ownerId: firebaseUser.uid,
            subscriptionPlan: "Free",
            createdAt: new Date().toISOString(),
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
        setCurrentOrg(newOrg)

        return newOrg.id
    }

    const joinOrganization = async (orgId: string): Promise<void> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        // 1. Check if Org Exists
        const orgRef = doc(db, "organizations", orgId)
        const orgSnap = await getDoc(orgRef)

        if (!orgSnap.exists()) {
            throw new Error("Organization not found")
        }

        // 2. Check if already a member
        const orgData = orgSnap.data() as Organization
        const isMember = orgData.members?.some(m => m.userId === firebaseUser.uid)
        if (isMember) {
            throw new Error("You are already a member of this organization")
        }

        // 3. Add User to Org Members
        const newMember: OrgMember = {
            userId: firebaseUser.uid,
            role: "Staff",
            joinedAt: new Date().toISOString()
        }
        const updatedMembers = [...(orgData.members || []), newMember]
        await setDoc(orgRef, { members: updatedMembers }, { merge: true })


        // 4. Update User Profile
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()
        const existingOrgs = userData?.organizations || []

        // Avoid duplicates in user profile too
        if (!existingOrgs.some((o: any) => o.orgId === orgId)) {
            const orgIds = userData?.orgIds || []
            await setDoc(userRef, {
                organizations: [...existingOrgs, { orgId: orgId, role: "Staff" }],
                orgIds: Array.from(new Set([...orgIds, orgId])) // Legacy compatibility
            }, { merge: true })
        }

        // 5. Update Local State
        const joinedOrg = { ...orgData, id: orgSnap.id, members: updatedMembers }
        setUserOrgs([...userOrgs, joinedOrg])
        setCurrentOrg(joinedOrg)
    }

    const joinOrganizationByCode = async (code: string): Promise<string> => {
        if (!firebaseUser) throw new Error("Not authenticated")

        let targetOrgId = ""

        // 1. Try Find Invite
        const q = query(collection(db, "invites"), where("code", "==", code))
        const snap = await getDocs(q)

        if (!snap.empty) {
            const inviteData = snap.docs[0].data()
            targetOrgId = inviteData.teamId
        } else {
            // 2. FALLBACK: Try checking if code is a valid Org ID directly
            const possibleOrgRef = doc(db, "organizations", code)
            const possibleOrgSnap = await getDoc(possibleOrgRef)

            if (possibleOrgSnap.exists()) {
                targetOrgId = code
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
    }

    const setCurrentOrg = (org: Organization) => {
        // Prevent reload if setting the same org
        if (currentOrg?.id === org.id) return

        // Persist the selection
        localStorage.setItem("lastOrgId", org.id)
        setCurrentOrgState(org)

        // NO RELOAD: ProjectContext handles switching teams via useEffect cleanup and re-subscription.
        // Reloading caused infinite loops and memory crashes.
        // window.location.reload() 
    }

    const refreshOrgs = async () => {
        await fetchUserOrgs()
    }

    return (
        <OrganizationContext.Provider value={{
            currentOrg,
            userOrgs,
            isLoading,
            setCurrentOrg,
            refreshOrgs,
            createOrganization,
            joinOrganization,
            joinOrganizationByCode
        }}>

            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error("useOrganization must be used within an OrganizationProvider")
    }
    return context
}
