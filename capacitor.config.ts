import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suavagaia.app',
  appName: 'Sua Vaga IA',
  webDir: 'dist',
  server: {
    // Em desenvolvimento, aponta para o dev server local
    // Comente estas duas linhas para o build final de produção
    // url: 'http://192.168.x.x:8080',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#0a0f1e',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0f1e',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#10b981',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0f1e',
    },
  },
};

export default config;
