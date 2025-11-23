import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getThemeIcon, getThemeLabel } from '../theme/colors';

export const Drawer = ({ theme, onNavigate, onToggleTheme, themeMode }) => {
  return (
    <View style={[styles.drawer, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: theme.drawerDivider }]}>
        <Text style={[styles.drawerTitle, { color: theme.primary }]}>SMS Gateway</Text>
      </View>

      <TouchableOpacity style={styles.drawerItem} onPress={() => onNavigate('howItWorks')}>
        <Text style={[styles.drawerItemText, { color: theme.textSecondary }]}>📚 How It Works</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => onNavigate('setupGuide')}>
        <Text style={[styles.drawerItemText, { color: theme.textSecondary }]}>🔧 Setup Guide</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => onNavigate('about')}>
        <Text style={[styles.drawerItemText, { color: theme.textSecondary }]}>ℹ️ About</Text>
      </TouchableOpacity>

      <View style={[styles.drawerDivider, { borderTopColor: theme.drawerDivider }]} />

      <TouchableOpacity style={styles.drawerItem} onPress={onToggleTheme}>
        <Text style={[styles.drawerItemText, { color: theme.primary }]}>
          {getThemeIcon(themeMode)} {getThemeLabel(themeMode)}
        </Text>
      </TouchableOpacity>

      <View style={[styles.drawerDivider, { borderTopColor: theme.drawerDivider }]} />

      <Text style={[styles.drawerFooter, { color: theme.textMuted }]}>v1.0.0 • SMS Gateway</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    paddingTop: 16,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  drawerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  drawerDivider: {
    borderTopWidth: 1,
    marginVertical: 16,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    fontSize: 12,
  },
});
