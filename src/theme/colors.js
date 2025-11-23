export const lightTheme = {
  background: '#F8F9FA',
  cardBackground: 'white',
  text: '#1C1C1E',
  textSecondary: '#555',
  textTertiary: '#888',
  textMuted: '#999',
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  success: '#34C759',
  successLight: '#E8F5E9',
  error: '#FF3B30',
  errorLight: 'rgba(255, 59, 48, 0.2)',
  border: '#E0E0E0',
  borderLight: '#EBEBEB',
  inputBackground: '#F9F9F9',
  shadowColor: '#000',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  drawerDivider: '#F0F0F0',
  statusBar: '#007AFF',
};

export const darkTheme = {
  background: '#000000',
  cardBackground: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#E5E5E7',
  textTertiary: '#AEAEB2',
  textMuted: '#8E8E93',
  primary: '#0A84FF',
  primaryLight: '#1C2938',
  success: '#30D158',
  successLight: '#1C2E1F',
  error: '#FF453A',
  errorLight: 'rgba(255, 69, 58, 0.2)',
  border: '#38383A',
  borderLight: '#48484A',
  inputBackground: '#2C2C2E',
  shadowColor: '#000',
  modalOverlay: 'rgba(0, 0, 0, 0.8)',
  drawerDivider: '#38383A',
  statusBar: '#1C1C1E',
};

export const getThemeIcon = (themeMode) => {
  if (themeMode === 'system') return '🔄';
  if (themeMode === 'light') return '☀️';
  return '🌙';
};

export const getThemeLabel = (themeMode) => {
  if (themeMode === 'system') return 'Theme: System';
  if (themeMode === 'light') return 'Theme: Light';
  return 'Theme: Dark';
};
