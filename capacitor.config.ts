import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.efcfootball.app',
  appName: 'EFC Football',
  webDir: 'mobile/dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#06101F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    CapacitorUpdater: {
      autoUpdate: false,
      keepUrlPathAfterReload: true,
    },
  },
}

export default config
