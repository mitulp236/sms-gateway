import React from 'react';
import { Modal, SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const HowItWorksModal = ({ visible, onClose, theme }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.statusBar }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>How It Works</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🎯 The Process</Text>
            <Text style={[styles.text, { color: theme.textSecondary }]}>
              SMS Gateway listens for incoming SMS messages on your device and automatically forwards them to your
              email address.
            </Text>

            <View style={styles.stepContainer}>
              {[
                { title: 'SMS Arrives', desc: 'Android receives an incoming SMS message' },
                { title: 'App Detects', desc: 'SMS Gateway catches the message in real-time' },
                { title: 'Email Sent', desc: 'Message is forwarded to your configured email' },
                { title: 'Logged', desc: 'Message is stored in the app for your reference' },
              ].map((step, index) => (
                <View key={index} style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                    <Text style={[styles.stepDesc, { color: theme.textTertiary }]}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.primary }]}>⚡ Key Features</Text>
            <Text style={[styles.text, { color: theme.textSecondary }]}>
              ✅ Works in background (even when app is closed){'\n'}
              ✅ Automatic SMS forwarding{'\n'}
              ✅ Real-time notifications{'\n'}
              ✅ Message history stored locally{'\n'}
              ✅ No internet required on device (carrier network works)
            </Text>
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  text: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  stepContainer: { marginVertical: 12 },
  step: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stepNumber: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumberText: { color: 'white', fontWeight: '700', fontSize: 16 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { fontSize: 13, marginTop: 4 },
});
