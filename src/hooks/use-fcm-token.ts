"use client"

import { useEffect, useState } from 'react'
import { messaging, db } from '@/lib/firebase'
import { getToken } from 'firebase/messaging'
import { useProjects } from '@/context/project-context'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { useRouter } from 'next/navigation'

export function useFcmToken() {
    const router = useRouter()
    const { currentUser } = useProjects()
    const [token, setToken] = useState<string | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    const saveTokenToFirestore = async (fcmToken: string) => {

        if (!currentUser?.id) return
        try {
            const existingTokens = (currentUser as any).fcmTokens as string[] || []
            if (!existingTokens.includes(fcmToken)) {
                const userRef = doc(db, 'users', currentUser.id)
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(fcmToken),
                    lastLoginAt: new Date().toISOString()
                })
                console.log('FCM Token saved to Firestore:', fcmToken)
            }
        } catch (error) {
            console.error('Error saving FCM token:', error)
        }
    }

    const setupNativePush = async () => {
        try {
            let permStatus = await PushNotifications.checkPermissions()

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions()
            }

            if (permStatus.receive !== 'granted') {
                setPermission('denied')
                return
            }

            setPermission('granted')

            // On iOS/Android, we need to register to get a token
            await PushNotifications.register()

            // Listeners
            PushNotifications.addListener('registration', (token) => {
                const fcmToken = token.value
                setToken(fcmToken)
                saveTokenToFirestore(fcmToken)
            })

            PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error:', error)
            })

            PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('Push received:', notification)
            })

            PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
                const data = notification.notification.data
                console.log('Push action performed:', data)

                if (data.taskId && data.projectId) {
                    router.push(`/projects/detail?id=${data.projectId}&taskId=${data.taskId}`)
                } else if (data.postId) {
                    router.push(`/wall?postId=${data.postId}`)
                } else if (data.url) {
                    router.push(data.url)
                }
            })
        } catch (error) {
            console.error('Error setting up native push:', error)
        }
    }

    const setupWebPush = async () => {
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
                    saveTokenToFirestore(currentToken)
                }
            }
        } catch (error) {
            console.error('An error occurred while retrieving web token:', error)
        }
    }

    const requestPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            await setupNativePush()
        } else {
            await setupWebPush()
        }
    }

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            // Check status silently
            PushNotifications.checkPermissions().then(res => setPermission(res.receive === 'granted' ? 'granted' : 'default'))
        } else if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    return { token, permission, requestPermission }
}
