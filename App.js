import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  PermissionsAndroid,
  Platform,
  NativeModules,
  NativeEventEmitter,
  FlatList,
  DrawerLayoutAndroid,
  useColorScheme,
} from 'react-native';

// Theme and styles
import { lightTheme, darkTheme } from './src/theme/colors';
import { commonStyles } from './src/styles/commonStyles';

// Services
import { storageService } from './src/services/storage';
import { emailService } from './src/services/emailService';

// Components
import { Card } from './src/components/Card';
import { MessageItem } from './src/components/MessageItem';
import { Drawer } from './src/components/Drawer';

// Modals
import { HowItWorksModal } from './src/screens/modals/HowItWorksModal';
import { SetupGuideModal } from './src/screens/modals/SetupGuideModal';
import { AboutModal } from './src/screens/modals/AboutModal';

const { SmsReceiverModule } = NativeModules;
const smsEmitter = SmsReceiverModule ? new NativeEventEmitter(SmsReceiverModule) : null;

const App = () => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
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

  // Determine active theme
  const theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    serviceEnabledRef.current = serviceEnabled;
  }, [serviceEnabled]);

  useEffect(() => {
    loadConfiguration();
    requestPermissions();
    registerSmsListener();

    return () => {
      if (smsSubscriptionRef.current) {
        try {
          smsSubscriptionRef.current.remove();
        } catch (e) {
          /* ignore */
        }
        smsSubscriptionRef.current = null;
      }
    };
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = await storageService.getConfig();
      if (config) {
        setTargetEmail(config.targetEmail || '');
        setSmtpEmail(config.smtpEmail || '');
        setSmtpPassword(config.smtpPassword || '');
        setIsConfigured(true);
      }

      const enabled = await storageService.getServiceEnabled();
      setServiceEnabled(enabled);

      const savedMessages = await storageService.getMessages();
      setMessages(savedMessages.slice(0, 20));

      const savedTheme = await storageService.getTheme();
      if (savedTheme) {
        setThemeMode(savedTheme);
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

    try {
      await storageService.saveConfig(targetEmail, smtpEmail, smtpPassword);
      setIsConfigured(true);

      if (SmsReceiverModule?.syncConfigToNative) {
        SmsReceiverModule.syncConfigToNative(targetEmail, smtpEmail, smtpPassword, serviceEnabled);
        console.log('[App] Config synced to native');
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
      console.warn('[App] smsEmitter not available');
      return;
    }
    if (smsSubscriptionRef.current) {
      try {
        smsSubscriptionRef.current.remove();
      } catch (e) {
        /* ignore */
      }
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
    await storageService.setServiceEnabled(newState);

    if (SmsReceiverModule?.syncConfigToNative) {
      SmsReceiverModule.syncConfigToNative(targetEmail, smtpEmail, smtpPassword, newState);
      console.log('[App] service state synced to native:', newState);
    }

    Alert.alert(
      'Service ' + (newState ? 'Started' : 'Stopped'),
      newState
        ? 'SMS forwarding is now active (works even when app is closed!)'
        : 'SMS forwarding has been stopped'
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

    setMessages((prev) => {
      const updated = [newMessage, ...prev.slice(0, 19)];
      storageService.saveMessages(updated).catch((e) => console.warn(e));
      messagesRef.current = updated;
      return updated;
    });

    forwardSmsViaEmail(newMessage).catch((err) => {
      console.warn('[handleSmsReceived] forwardSmsViaEmail error:', err);
    });
  }, []);

  const forwardSmsViaEmail = async (message) => {
    setIsSending(true);
    try {
      const config = { targetEmail, smtpEmail, smtpPassword };
      const success = await emailService.sendEmail(message, config);

      if (success) {
        setMessages((prev) => {
          const updated = prev.map((m) => (m.id === message.id ? { ...m, forwarded: true } : m));
          storageService.saveMessages(updated).catch((e) => console.warn(e));
          messagesRef.current = updated;
          return updated;
        });
      }
      return success;
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
    await forwardSmsViaEmail(testMessage);
    Alert.alert('Test Email Sent', 'Check your inbox!');
  };

  const toggleTheme = async () => {
    const modes = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
    await storageService.saveTheme(nextMode);
  };

  const handleDrawerNavigation = (screen) => {
    drawerRef.current?.closeDrawer();
    if (screen === 'howItWorks') setShowHowItWorks(true);
    else if (screen === 'setupGuide') setShowSetupGuide(true);
    else if (screen === 'about') setShowAbout(true);
  };

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={280}
      drawerPosition="left"
      renderNavigationView={() => (
        <Drawer theme={theme} onNavigate={handleDrawerNavigation} onToggleTheme={toggleTheme} themeMode={themeMode} />
      )}
    >
      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[commonStyles.header, { backgroundColor: theme.statusBar }]}>
            <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
              <Text style={commonStyles.menuButton}>☰</Text>
            </TouchableOpacity>
            <View style={commonStyles.headerContent}>
              <Text style={commonStyles.title}>SMS Gateway</Text>
              <Text style={commonStyles.subtitle}>Automatic SMS Forwarding</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Status Badge */}
          <View
            style={[
              commonStyles.statusBadge,
              {
                backgroundColor: serviceEnabled ? theme.successLight : theme.errorLight,
                borderColor: serviceEnabled ? theme.success : theme.error,
              },
            ]}
          >
            <Text style={[commonStyles.statusText, { color: serviceEnabled ? theme.success : theme.error }]}>
              {serviceEnabled ? '● Active (Background)' : '● Inactive'}
            </Text>
          </View>

          {/* Configuration Card */}
          <Card theme={theme}>
            <Text style={[commonStyles.cardTitle, { color: theme.text }]}>⚙️ Configuration</Text>

            <Text style={[commonStyles.label, { color: theme.textSecondary }]}>Target Email</Text>
            <TextInput
              style={[
                commonStyles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
              ]}
              value={targetEmail}
              onChangeText={setTargetEmail}
              placeholder="your.email@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[commonStyles.label, { color: theme.textSecondary }]}>Sender Email (Verified in Brevo)</Text>
            <TextInput
              style={[
                commonStyles.input,
                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
              ]}
              value={smtpEmail}
              onChangeText={setSmtpEmail}
              placeholder="noreply@yourdomain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[commonStyles.label, { color: theme.textSecondary }]}>Brevo API Key</Text>
            <View
              style={[
                commonStyles.passwordContainer,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[commonStyles.passwordInput, { color: theme.text }]}
                value={smtpPassword}
                onChangeText={setSmtpPassword}
                placeholder="xkeysib-xxxxxxxxxxxx"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={[commonStyles.showButton, { color: theme.primary }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[commonStyles.button, { backgroundColor: theme.primary }]} onPress={saveConfiguration}>
              <Text style={commonStyles.buttonText}>💾 Save Configuration</Text>
            </TouchableOpacity>

            {isConfigured && (
              <>
                <View
                  style={[
                    commonStyles.successBanner,
                    { backgroundColor: theme.successLight, borderLeftColor: theme.success },
                  ]}
                >
                  <Text style={[commonStyles.successText, { color: theme.success }]}>✓ Configuration Saved & Synced</Text>
                </View>

                <TouchableOpacity style={[commonStyles.testButton, { backgroundColor: theme.success }]} onPress={testEmail}>
                  <Text style={commonStyles.testButtonText}>📨 Send Test Email</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Service Control Card */}
          <Card theme={theme}>
            <View style={commonStyles.serviceControl}>
              <View>
                <Text style={[commonStyles.serviceTitle, { color: theme.text }]}>Forwarding Service</Text>
                <Text style={[commonStyles.serviceSubtitle, { color: theme.textTertiary }]}>
                  {serviceEnabled ? '✓ Active (works when app is closed)' : 'Service is stopped'}
                </Text>
              </View>
              <Switch
                value={serviceEnabled}
                onValueChange={toggleService}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={serviceEnabled ? theme.primary : theme.textMuted}
              />
            </View>
            {isSending && <Text style={[commonStyles.sendingText, { color: theme.primary }]}>📤 Sending email...</Text>}
          </Card>

          {/* Messages Card */}
          <Card theme={theme}>
            <View style={commonStyles.messagesHeader}>
              <Text style={[commonStyles.cardTitle, { color: theme.text }]}>📱 Recent Messages</Text>
              <Text
                style={[
                  commonStyles.messageCount,
                  { color: theme.primary, backgroundColor: theme.primaryLight },
                ]}
              >
                {messages.length}/20
              </Text>
            </View>
            {messages.length === 0 ? (
              <Text style={[commonStyles.emptyText, { color: theme.textMuted }]}>
                No messages yet. Enable the service and send an SMS!
              </Text>
            ) : (
              <FlatList
                data={messages}
                renderItem={({ item }) => <MessageItem item={item} theme={theme} />}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                style={commonStyles.messagesList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Card>

          {/* Info Section */}
          <View
            style={[
              commonStyles.infoSection,
              { backgroundColor: theme.primaryLight, borderLeftColor: theme.primary },
            ]}
          >
            <Text style={[commonStyles.infoSectionTitle, { color: theme.primary }]}>💡 Quick Tips</Text>
            <Text style={[commonStyles.infoText, { color: theme.primary }]}>
              • Tap the menu (☰) for setup guide and more info{'\n'}• Service works in background automatically{'\n'}•
              Max 20 recent messages are stored locally
            </Text>
          </View>
        </ScrollView>

        <HowItWorksModal visible={showHowItWorks} onClose={() => setShowHowItWorks(false)} theme={theme} />
        <SetupGuideModal visible={showSetupGuide} onClose={() => setShowSetupGuide(false)} theme={theme} />
        <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} theme={theme} />
      </SafeAreaView>
    </DrawerLayoutAndroid>
  );
};

export default App;
