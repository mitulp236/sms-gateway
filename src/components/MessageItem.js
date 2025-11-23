import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MessageItem = ({ item, theme }) => {
  return (
    <View style={[styles.messageCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderLight }]}>
      <View style={styles.messageHeader}>
        <Text style={[styles.messageSender, { color: theme.text }]}>📱 {item.sender}</Text>
        <Text style={[styles.messageTime, { color: theme.textMuted }]}>{item.time}</Text>
      </View>
      <Text style={[styles.messageBody, { color: theme.textSecondary }]}>{item.body}</Text>
      {item.forwarded && (
        <View style={[styles.forwardedBadge, { backgroundColor: theme.successLight }]}>
          <Text style={[styles.forwardedText, { color: theme.success }]}>✓ Emailed</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    fontWeight: '700',
    fontSize: 14,
  },
  messageTime: {
    fontSize: 12,
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  forwardedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  forwardedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
