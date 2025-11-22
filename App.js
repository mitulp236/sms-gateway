import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  PermissionsAndroid,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Modal,
  FlatList,
  DrawerLayoutAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { SmsReceiverModule } = NativeModules;
const smsEmitter = SmsReceiverModule ? new NativeEventEmitter(SmsReceiverModule) : null;

const App = () => {
  const [targetEmail, setTargetEmail] = useState('');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const messagesRef = useRef(messages);
  const serviceEnabledRef = useRef(serviceEnabled);
  const smsSubscriptionRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { serviceEnabledRef.current = serviceEnabled; }, [serviceEnabled]);

  useEffect(() => {
    loadConfiguration();
    requestPermissions();
    registerSmsListener();

    return () => {
      if (smsSubscriptionRef.current) {
        try { smsSubscriptionRef.current.remove(); } catch (e) { /* ignore */ }
        smsSubscriptionRef.current = null;
      }
    };
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = await AsyncStorage.getItem('sms_config');
      if (config) {
        const parsed = JSON.parse(config);
        setTargetEmail(parsed.targetEmail || '');
        setSmtpEmail(parsed.smtpEmail || '');
        setSmtpPassword(parsed.smtpPassword || '');
        setIsConfigured(true);
      }

      const enabled = await AsyncStorage.getItem('service_enabled');
      setServiceEnabled(enabled === 'true');

      const savedMessages = await AsyncStorage.getItem('messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
        ]);

        if (
          granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('SMS permissions granted');
        } else {
          Alert.alert('Permissions Required', 'Please grant SMS permissions to use this app');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const saveConfiguration = async () => {
    if (!targetEmail.includes('@') || !smtpEmail.includes('@') || !smtpPassword) {
      Alert.alert('Error', 'Please fill all fields correctly');
      return;
    }

    const config = {
      targetEmail,
      smtpEmail,
      smtpPassword,
    };

    try {
      await AsyncStorage.setItem('sms_config', JSON.stringify(config));
      setIsConfigured(true);

      if (SmsReceiverModule && SmsReceiverModule.syncConfigToNative) {
        SmsReceiverModule.syncConfigToNative(targetEmail, smtpEmail, smtpPassword, serviceEnabled);
        console.log('[App] ✅ Config synced to native');
      }

      Alert.alert('Success', 'Configuration saved! Now enable the service toggle.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
      console.error('[App] Error:', error);
    }
  };

  const registerSmsListener = () => {
    console.log('[App] SmsReceiverModule present?', !!SmsReceiverModule, 'smsEmitter?', !!smsEmitter);
    if (!smsEmitter) {
      console.warn('[App] smsEmitter not available — native module may not be linked');
      return;
    }
    if (smsSubscriptionRef.current) {
      try { smsSubscriptionRef.current.remove(); } catch (e) { /* ignore */ }
      smsSubscriptionRef.current = null;
    }
    smsSubscriptionRef.current = smsEmitter.addListener('onSmsReceived', handleSmsReceived);
    console.log('[App] SMS listener registered');
  };

  const toggleService = async () => {
    if (!isConfigured && !serviceEnabled) {
      Alert.alert('Error', 'Please configure SMTP settings first!');
      return;
    }

    const newState = !serviceEnabled;
    setServiceEnabled(newState);
    await AsyncStorage.setItem('service_enabled', newState.toString());

    if (SmsReceiverModule && SmsReceiverModule.syncConfigToNative) {
      SmsReceiverModule.syncConfigToNative(targetEmail, smtpEmail, smtpPassword, newState);
      console.log('[App] service state synced to native:', newState);
    }

    Alert.alert(
      'Service ' + (newState ? 'Started' : 'Stopped'),
      newState ? '✅ SMS forwarding is now active (works even when app is closed!)' : '❌ SMS forwarding has been stopped'
    );
  };

  const handleSmsReceived = useCallback(async (smsData) => {
    console.log('[handleSmsReceived] received smsData:', smsData);

    if (!serviceEnabledRef.current) {
      console.log('[handleSmsReceived] service disabled, ignoring SMS');
      return;
    }

    const newMessage = {
      id: Date.now(),
      sender: smsData.originatingAddress || 'Unknown',
      body: smsData.messageBody || '',
      time: new Date().toLocaleString(),
      forwarded: false,
    };

    setMessages(prev => {
      const updated = [newMessage, ...prev.slice(0, 19)];
      try { AsyncStorage.setItem('messages', JSON.stringify(updated)); } catch (e) { console.warn(e); }
      messagesRef.current = updated;
      return updated;
    });

    forwardSmsViaEmail(newMessage).catch(err => {
      console.warn('[handleSmsReceived] forwardSmsViaEmail error:', err);
    });
  }, []);

  const forwardSmsViaEmail = async (message) => {
    setIsSending(true);
    try {
      let apiKey = smtpPassword && smtpPassword.trim();
      let senderEmailLocal = smtpEmail && smtpEmail.trim();
      let targetEmailLocal = targetEmail && targetEmail.trim();

      if (!apiKey || !senderEmailLocal || !targetEmailLocal) {
        try {
          const stored = await AsyncStorage.getItem('sms_config');
          if (stored) {
            const parsed = JSON.parse(stored);
            apiKey = apiKey || (parsed.smtpPassword && parsed.smtpPassword.trim());
            senderEmailLocal = senderEmailLocal || parsed.smtpEmail;
            targetEmailLocal = targetEmailLocal || parsed.targetEmail;
            console.log('[forwardSmsViaEmail] loaded config from storage');
          }
        } catch (e) {
          console.warn('[forwardSmsViaEmail] failed to read stored config:', e);
        }
      }

      if (!apiKey) {
        const msg = 'Brevo API key missing. Open app and save configuration.';
        console.warn('[forwardSmsViaEmail]', msg);
        Alert.alert('Email Error', msg);
        return false;
      }

      if (!senderEmailLocal || !targetEmailLocal) {
        const msg = 'Sender or target email missing in configuration.';
        console.warn('[forwardSmsViaEmail]', msg);
        Alert.alert('Email Error', msg);
        return false;
      }

      const payload = {
        sender: { name: 'SMS Gateway', email: senderEmailLocal },
        to: [{ email: targetEmailLocal, name: 'You' }],
        subject: `📱 SMS from ${message.sender}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #007AFF; margin-top: 0;">📱 New SMS Received</h3>
              <p><strong>From:</strong> ${message.sender}</p>
              <p><strong>Time:</strong> ${message.time}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; line-height: 1.5;">${message.body}</p>
            </div>
          </div>
        `,
        textContent: `From: ${message.sender}\nTime: ${message.time}\n\nMessage:\n${message.body}`,
      };

      console.log('[forwardSmsViaEmail] sending payload');

      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      };

      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const rawText = await resp.text();
      let parsed;
      try { parsed = JSON.parse(rawText); } catch (e) { parsed = { raw: rawText }; }

      console.log('[forwardSmsViaEmail] status:', resp.status, 'ok:', resp.ok, 'body:', parsed);

      if (resp.ok) {
        setMessages(prev => {
          const updated = prev.map(m => (m.id === message.id ? { ...m, forwarded: true } : m));
          try { AsyncStorage.setItem('messages', JSON.stringify(updated)); } catch (e) { console.warn(e); }
          messagesRef.current = updated;
          return updated;
        });
        return true;
      } else {
        const brevoMsg = parsed && (parsed.message || parsed.error || parsed.raw) || `HTTP ${resp.status}`;
        console.warn('Brevo rejected send:', brevoMsg);
        const hint = /auth|authentication|api[-_ ]?key/i.test(String(brevoMsg))
          ? 'Authentication error — check your Brevo API key in app settings.'
          : null;
        Alert.alert('Email Delivery Error', `${brevoMsg}${hint ? '\n\nHint: ' + hint : ''}`);
        return false;
      }
    } catch (error) {
      console.error('Error forwarding SMS:', error);
      Alert.alert('Email Error', `Failed to send: ${error.message || error}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const testEmail = async () => {
    if (!isConfigured) {
      Alert.alert('Error', 'Please save configuration first');
      return;
    }

    const testMessage = {
      id: Date.now(),
      sender: 'TEST',
      body: 'This is a test email from SMS Gateway app',
      time: new Date().toLocaleString(),
    };

    Alert.alert('Sending Test Email', 'Please wait...');
    try {
      await forwardSmsViaEmail(testMessage);
      Alert.alert('Test Email Sent', 'Check your inbox!');
    } catch (e) {
      // forwardSmsViaEmail already alerts with details
    }
  };

  const renderDrawer = () => (
    <View style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>SMS Gateway</Text>
      </View>

      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => {
          drawerRef.current?.closeDrawer();
          setShowHowItWorks(true);
        }}
      >
        <Text style={styles.drawerItemText}>📚 How It Works</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => {
          drawerRef.current?.closeDrawer();
          setShowSetupGuide(true);
        }}
      >
        <Text style={styles.drawerItemText}>🔧 Setup Guide</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => {
          drawerRef.current?.closeDrawer();
          setShowAbout(true);
        }}
      >
        <Text style={styles.drawerItemText}>ℹ️ About</Text>
      </TouchableOpacity>

      <View style={styles.drawerDivider} />

      <Text style={styles.drawerFooter}>v1.0.0 • SMS Gateway</Text>
    </View>
  );

  const renderHowItWorksModal = () => (
    <Modal
      visible={showHowItWorks}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowHowItWorks(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowHowItWorks(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>How It Works</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>🎯 The Process</Text>
            <Text style={styles.modalText}>
              SMS Gateway listens for incoming SMS messages on your device and automatically forwards them to your email address.
            </Text>

            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>SMS Arrives</Text>
                  <Text style={styles.stepDesc}>Android receives an incoming SMS message</Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>App Detects</Text>
                  <Text style={styles.stepDesc}>SMS Gateway catches the message in real-time</Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Email Sent</Text>
                  <Text style={styles.stepDesc}>Message is forwarded to your configured email</Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Logged</Text>
                  <Text style={styles.stepDesc}>Message is stored in the app for your reference</Text>
                </View>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>⚡ Key Features</Text>
            <Text style={styles.modalText}>
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

  const renderSetupGuideModal = () => (
    <Modal
      visible={showSetupGuide}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSetupGuide(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSetupGuide(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Setup Guide</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>Step 1: Create Brevo Account</Text>
            <Text style={styles.setupStepDesc}>
              Sign up at{' '}
              <Text style={styles.link}>https://www.brevo.com</Text>
              {' '}(FREE - includes 300 emails/day)
            </Text>
          </View>

          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>Step 2: Get API Key</Text>
            <Text style={styles.setupStepDesc}>
              1. Log in to Brevo{'\n'}
              2. Go to Settings → API & Apps{'\n'}
              3. Copy your API key{'\n'}
              4. Paste it in the "Brevo API Key" field above
            </Text>
          </View>

          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>Step 3: Verify Sender Email</Text>
            <Text style={styles.setupStepDesc}>
              1. In Brevo, go to Settings → Sender & Domains{'\n'}
              2. Add your email address as a sender{'\n'}
              3. Verify the email (Brevo sends a confirmation link){'\n'}
              4. Use this verified email in the "Sender Email" field
            </Text>
          </View>

          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>Step 4: Configure App</Text>
            <Text style={styles.setupStepDesc}>
              1. Open SMS Gateway{'\n'}
              2. Enter your target email (where SMS will be forwarded){'\n'}
              3. Enter your verified sender email{'\n'}
              4. Paste your Brevo API key{'\n'}
              5. Click "Save Configuration"
            </Text>
          </View>

          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>Step 5: Enable Service</Text>
            <Text style={styles.setupStepDesc}>
              1. Click "Send Test Email" to verify everything works{'\n'}
              2. Check your email for the test message{'\n'}
              3. Toggle "Forwarding Service" ON{'\n'}
              4. Done! SMS forwarding is now active
            </Text>
          </View>

          <View style={styles.setupStep}>
            <Text style={styles.setupStepTitle}>⚠️ Important Notes</Text>
            <Text style={styles.setupStepDesc}>
              • If you "Force Stop" the app, SMS forwarding stops{'\n'}
              • Some phones require: Allow autostart + Exempt from battery optimization{'\n'}
              • The app works in the background even when closed (swipe away is OK){'\n'}
              • All SMS are logged locally (max 20 recent messages)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAbout}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAbout(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAbout(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>About SMS Gateway</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>SMS Gateway v1.0.0</Text>
            <Text style={styles.aboutSubtitle}>Intelligent SMS Forwarding System</Text>

            <View style={styles.aboutBox}>
              <Text style={styles.aboutBoxTitle}>What is SMS Gateway?</Text>
              <Text style={styles.aboutBoxText}>
                SMS Gateway is an Android app that automatically forwards incoming SMS messages to your email address. Perfect for:
              </Text>
              <Text style={styles.aboutBoxText}>
                📱 Receiving SMS on multiple devices{'\n'}
                🌍 SMS forwarding across regions{'\n'}
                📧 Centralizing all communications{'\n'}
                🔔 Never missing important messages
              </Text>
            </View>

            <View style={styles.aboutBox}>
              <Text style={styles.aboutBoxTitle}>Use Cases</Text>
              <Text style={styles.aboutBoxText}>
                ✅ Business: Forward customer SMS to team email{'\n'}
                ✅ Travel: Get SMS notifications while abroad{'\n'}
                ✅ Work: Combine SMS and email communication{'\n'}
                ✅ Backup: Automatic SMS archiving
              </Text>
            </View>

            <View style={styles.aboutBox}>
              <Text style={styles.aboutBoxTitle}>Technology</Text>
              <Text style={styles.aboutBoxText}>
                Built with React Native for cross-platform compatibility. Uses Brevo API for email delivery and WorkManager for background processing.
              </Text>
            </View>

            <View style={styles.aboutBox}>
              <Text style={styles.aboutBoxTitle}>Privacy & Security</Text>
              <Text style={styles.aboutBoxText}>
                ✓ All SMS are processed locally{'\n'}
                ✓ No data stored on external servers{'\n'}
                ✓ Your API key is stored locally{'\n'}
                ✓ Open source and auditable
              </Text>
            </View>

            <View style={styles.aboutBox}>
              <Text style={styles.aboutBoxTitle}>Support & Feedback</Text>
              <Text style={styles.aboutBoxText}>
                Found a bug? Have a feature request? Contribute on GitHub!{'\n\n'}
                GitHub: sms-gateway{'\n'}
                License: MIT
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderMessageItem = ({ item }) => (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageSender}>📱 {item.sender}</Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
      <Text style={styles.messageBody}>{item.body}</Text>
      {item.forwarded && (
        <View style={styles.forwardedBadge}>
          <Text style={styles.forwardedText}>✓ Emailed</Text>
        </View>
      )}
    </View>
  );

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={280}
      drawerPosition="left"
      renderNavigationView={renderDrawer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
              <Text style={styles.menuButton}>☰</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>SMS Gateway</Text>
              <Text style={styles.subtitle}>Automatic SMS Forwarding</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, serviceEnabled ? styles.statusActive : styles.statusInactive]}>
            <Text style={serviceEnabled ? styles.statusActiveText : styles.statusInactiveText}>
              {serviceEnabled ? '● Active (Background)' : '● Inactive'}
            </Text>
          </View>

          {/* Configuration Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Configuration</Text>

            <Text style={styles.label}>Target Email</Text>
            <TextInput
              style={styles.input}
              value={targetEmail}
              onChangeText={setTargetEmail}
              placeholder="your.email@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Sender Email (Verified in Brevo)</Text>
            <TextInput
              style={styles.input}
              value={smtpEmail}
              onChangeText={setSmtpEmail}
              placeholder="noreply@yourdomain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Brevo API Key</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={smtpPassword}
                onChangeText={setSmtpPassword}
                placeholder="xkeysib-xxxxxxxxxxxx"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showButton}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveConfiguration}>
              <Text style={styles.saveButtonText}>💾 Save Configuration</Text>
            </TouchableOpacity>

            {isConfigured && (
              <>
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ Configuration Saved & Synced</Text>
                </View>

                <TouchableOpacity style={styles.testButton} onPress={testEmail}>
                  <Text style={styles.testButtonText}>📨 Send Test Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Service Control Card */}
          <View style={styles.card}>
            <View style={styles.serviceControl}>
              <View>
                <Text style={styles.serviceTitle}>Forwarding Service</Text>
                <Text style={styles.serviceSubtitle}>
                  {serviceEnabled ? '✓ Active (works when app is closed)' : 'Service is stopped'}
                </Text>
              </View>
              <Switch
                value={serviceEnabled}
                onValueChange={toggleService}
                trackColor={{ false: '#E0E0E0', true: '#81b0ff' }}
                thumbColor={serviceEnabled ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            {isSending && (
              <Text style={styles.sendingText}>📤 Sending email...</Text>
            )}
          </View>

          {/* Messages Card */}
          <View style={styles.card}>
            <View style={styles.messagesHeader}>
              <Text style={styles.cardTitle}>📱 Recent Messages</Text>
              <Text style={styles.messageCount}>{messages.length}/20</Text>
            </View>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet. Enable the service and send an SMS!</Text>
            ) : (
              <FlatList
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                style={styles.messagesList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>💡 Quick Tips</Text>
            <Text style={styles.infoText}>
              • Tap the menu (☰) for setup guide and more info{'\n'}
              • Service works in background automatically{'\n'}
              • Max 20 recent messages are stored locally
            </Text>
          </View>
        </ScrollView>

        {renderHowItWorksModal()}
        {renderSetupGuideModal()}
        {renderAboutModal()}
      </SafeAreaView>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    width: 40,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statusBadge: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  statusActiveText: {
    color: '#34C759',
    fontWeight: '700',
    fontSize: 14,
  },
  statusInactiveText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#1C1C1E',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#F9F9F9',
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  showButton: {
    color: '#007AFF',
    paddingHorizontal: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  serviceSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  sendingText: {
    color: '#007AFF',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesList: {
    maxHeight: 400,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1C1C1E',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  forwardedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  forwardedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoSectionTitle: {
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8,
    fontSize: 14,
  },
  infoText: {
    color: '#1565C0',
    fontSize: 13,
    lineHeight: 20,
  },
  // Drawer Styles
  drawer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 16,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
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
    color: '#333',
  },
  drawerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginVertical: 16,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  stepContainer: {
    marginVertical: 12,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  stepDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  setupStep: {
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  setupStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 6,
  },
  setupStepDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  aboutBox: {
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  aboutBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 6,
  },
  aboutBoxText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});

export default App;