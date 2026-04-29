import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abakada.app',
  appName: 'Abakada Flashcards',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
