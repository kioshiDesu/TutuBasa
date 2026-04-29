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
      style: 'DEFAULT',
      overlaysWebView: false,
      backgroundColor: '#ffffff'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidScaleType: "CENTER_CROP"
    }
  },
  android: {
    buildOptions: {
      keystorePath: null,
      releaseType: 'APK'
    }
  }
};

export default config;
