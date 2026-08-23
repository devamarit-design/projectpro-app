import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hipsloth.app',
  appName: 'Hipsloth',
  webDir: 'out',
  server: {
    url: 'https://www.hipsloth.app',
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#09090b"
    }
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
