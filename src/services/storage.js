import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SMS_CONFIG: 'sms_config',
  SERVICE_ENABLED: 'service_enabled',
  MESSAGES: 'messages',
  THEME_MODE: 'theme_mode',
};

export const storageService = {
  // Configuration
  async saveConfig(targetEmail, smtpEmail, smtpPassword) {
    const config = { targetEmail, smtpEmail, smtpPassword };
    await AsyncStorage.setItem(KEYS.SMS_CONFIG, JSON.stringify(config));
  },

  async getConfig() {
    const config = await AsyncStorage.getItem(KEYS.SMS_CONFIG);
    return config ? JSON.parse(config) : null;
  },

  // Service state
  async setServiceEnabled(enabled) {
    await AsyncStorage.setItem(KEYS.SERVICE_ENABLED, enabled.toString());
  },

  async getServiceEnabled() {
    const enabled = await AsyncStorage.getItem(KEYS.SERVICE_ENABLED);
    return enabled === 'true';
  },

  // Messages
  async saveMessages(messages) {
    await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  },

  async getMessages() {
    const messages = await AsyncStorage.getItem(KEYS.MESSAGES);
    return messages ? JSON.parse(messages) : [];
  },

  // Theme
  async saveTheme(themeMode) {
    await AsyncStorage.setItem(KEYS.THEME_MODE, themeMode);
  },

  async getTheme() {
    return await AsyncStorage.getItem(KEYS.THEME_MODE);
  },
};
