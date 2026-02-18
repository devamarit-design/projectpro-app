importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBTwH7aBFdmK94IWoy9Yys26494nfWaXMs",
    authDomain: "projectpro-app-76535.firebaseapp.com",
    projectId: "projectpro-app-76535",
    storageBucket: "projectpro-app-76535.firebasestorage.app",
    messagingSenderId: "343498206325",
    appId: "1:343498206325:web:44243bb7a9375b7693dc3c",
    measurementId: "G-FJKYP026ZP"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png', // For Android/iOS PWA badge
            data: payload.data // Pass data to notification for click handling
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', function (event) {
        console.log('[firebase-messaging-sw.js] Notification click received', event);
        event.notification.close();

        // Retrieve URL from notification data
        const urlToOpen = event.notification.data?.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
                // Check if there's already a tab open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        if (urlToOpen && urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    });

} catch (error) {
    console.error('Firebase messaging service worker initialization failed:', error);
}
