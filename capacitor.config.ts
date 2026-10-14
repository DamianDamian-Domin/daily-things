import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.dailythings',
  appName: 'Daily Things',
  webDir: 'dist',
  plugins: {
    // Ikona z native/android/res (kopiuje ją `npm run android`)
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#EC8A3F',
    },
  },
};

export default config;
