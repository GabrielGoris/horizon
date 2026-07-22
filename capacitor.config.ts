import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.horizon.library',
  appName: 'Horizon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
