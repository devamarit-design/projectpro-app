"use client"

import { useEffect, useState } from 'react'
import { messaging } from '@/lib/firebase'
import { getToken } from 'firebase/messaging'
import { useProjects } from '@/context/project-context'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useFcmToken() {
    const { currentUser } = useProjects()
    const [token, setToken] = useState<string | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async () => {
        try {
            if (typeof window === 'undefined' || !messaging) return

            const permission = await Notification.requestPermission()
            setPermission(permission)

            if (permission === 'granted') {
                const currentToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                })

                if (currentToken) {
                    setToken(currentToken)
                    if (currentUser?.id) {
                        // Save token to user profile
                        const userRef = doc(db, 'users', currentUser.id)
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(currentToken),
                            lastLoginAt: new Date().toISOString()
                        })
                        console.log('FCM Token generated and saved:', currentToken)
                    }
                }
            }
        } catch (error) {
            console.error('An error occurred while retrieving token:', error)
        }
    }

    return { token, permission, requestPermission }
}
