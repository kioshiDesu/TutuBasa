import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abakada.app',
  appName: 'Abakada Flashcards',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  },
  android: {
    buildOptions: {
      keystorePath: null,
      releaseType: 'debug'
    }
  }
};

export default config;
