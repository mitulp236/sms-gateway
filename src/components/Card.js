import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Card = ({ children, theme, style }) => {
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
