import React from 'react';
import { Modal, SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const SetupGuideModal = ({ visible, onClose, theme }) => {
  const steps = [
    {
      title: 'Step 1: Create Brevo Account',
      desc: 'Sign up at https://www.brevo.com (FREE - includes 300 emails/day)',
    },
    {
      title: 'Step 2: Get API Key',
      desc: '1. Log in to Brevo\n2. Go to Settings → API & Apps\n3. Copy your API key\n4. Paste it in the "Brevo API Key" field above',
    },
    {
      title: 'Step 3: Verify Sender Email',
      desc: '1. In Brevo, go to Settings → Sender & Domains\n2. Add your email address as a sender\n3. Verify the email (Brevo sends a confirmation link)\n4. Use this verified email in the "Sender Email" field',
    },
    {
      title: 'Step 4: Configure App',
      desc: '1. Open SMS Gateway\n2. Enter your target email (where SMS will be forwarded)\n3. Enter your verified sender email\n4. Paste your Brevo API key\n5. Click "Save Configuration"',
    },
    {
      title: 'Step 5: Enable Service',
      desc: '1. Click "Send Test Email" to verify everything works\n2. Check your email for the test message\n3. Toggle "Forwarding Service" ON\n4. Done! SMS forwarding is now active',
    },
    {
      title: '⚠️ Important Notes',
      desc: '• If you "Force Stop" the app, SMS forwarding stops\n• Some phones require: Allow autostart + Exempt from battery optimization\n• The app works in the background even when closed (swipe away is OK)\n• All SMS are logged locally (max 20 recent messages)',
    },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.statusBar }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Setup Guide</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          {steps.map((step, index) => (
            <View
              key={index}
              style={[styles.setupStep, { backgroundColor: theme.cardBackground, borderLeftColor: theme.primary }]}
            >
              <Text style={[styles.setupStepTitle, { color: theme.primary }]}>{step.title}</Text>
              <Text style={[styles.setupStepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
            </View>
          ))}
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
  setupStep: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  setupStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  setupStepDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
});
