import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hipsloth.app',
  appName: 'Hipsloth',
  webDir: 'out',
  server: {
    url: 'https://www.hipsloth.app',
    androidScheme: 'https'
  }
};

export default config;
