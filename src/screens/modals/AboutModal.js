import React from 'react';
import { Modal, SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const AboutModal = ({ visible, onClose, theme }) => {
  const sections = [
    {
      title: 'What is SMS Gateway?',
      content:
        'SMS Gateway is an Android app that automatically forwards incoming SMS messages to your email address. Perfect for:\n\n📱 Receiving SMS on multiple devices\n🌍 SMS forwarding across regions\n📧 Centralizing all communications\n🔔 Never missing important messages',
    },
    {
      title: 'Use Cases',
      content:
        '✅ Business: Forward customer SMS to team email\n✅ Travel: Get SMS notifications while abroad\n✅ Work: Combine SMS and email communication\n✅ Backup: Automatic SMS archiving',
    },
    {
      title: 'Technology',
      content:
        'Built with React Native for cross-platform compatibility. Uses Brevo API for email delivery and WorkManager for background processing.',
    },
    {
      title: 'Privacy & Security',
      content:
        '✓ All SMS are processed locally\n✓ No data stored on external servers\n✓ Your API key is stored locally\n✓ Open source and auditable',
    },
    {
      title: 'Support & Feedback',
      content: 'Found a bug? Have a feature request? Contribute on GitHub!\n\nGitHub: sms-gateway\nLicense: MIT',
    },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.statusBar }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>About SMS Gateway</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutTitle, { color: theme.primary }]}>SMS Gateway v1.0.0</Text>
            <Text style={[styles.aboutSubtitle, { color: theme.textTertiary }]}>
              Intelligent SMS Forwarding System
            </Text>

            {sections.map((section, index) => (
              <View
                key={index}
                style={[styles.aboutBox, { backgroundColor: theme.cardBackground, borderLeftColor: theme.success }]}
              >
                <Text style={[styles.aboutBoxTitle, { color: theme.success }]}>{section.title}</Text>
                <Text style={[styles.aboutBoxText, { color: theme.textSecondary }]}>{section.content}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: { fontSize: 24, color: 'white', fontWeight: 'bold', width: 40 },
  title: { fontSize: 18, fontWeight: '700', color: 'white' },
  content: { flex: 1, padding: 16 },
  aboutSection: { marginBottom: 20 },
  aboutTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  aboutSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  aboutBox: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  aboutBoxTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  aboutBoxText: { fontSize: 13, lineHeight: 20 },
});
