module.exports = {
  name: 'SuiSend NFC Wallet',
  slug: 'suisend-nfc-wallet',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  experiments: {
    tsconfigPaths: true
  },
  plugins: [
    'expo-router'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.suisend.app',
    infoPlist: {
      NFCReaderUsageDescription: 'We need access to NFC to read and write wallet cards',
      'com.apple.developer.nfc.readersession.formats': ['NDEF']
    }
  },
  android: {
    package: 'com.suisend.app',
    permissions: [
      'NFC',
      'android.permission.NFC',
      'android.permission.BIND_NFC_SERVICE'
    ],
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff'
    }
  }
};
