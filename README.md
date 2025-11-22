# SMS Gateway 📱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-green.svg)](https://www.android.com/)
[![React Native](https://img.shields.io/badge/Built%20with-React%20Native-61dafb.svg)](https://reactnative.dev/)
[![Latest Release](https://img.shields.io/badge/Version-1.0.0-blue.svg)](https://github.com/mitulp236/sms-gateway/releases)

> **Automatic SMS Forwarding to Email** — Never miss important messages, get OTPs anywhere, forward SMS globally.

![SMS Gateway Demo](https://via.placeholder.com/1200x400/007AFF/ffffff?text=SMS+Gateway+-+Automatic+SMS+Forwarding)

## 🎯 Overview

**SMS Gateway** is an open-source Android app that automatically forwards incoming SMS messages to your email address in real-time. Perfect for travelers, remote workers, or anyone who needs SMS notifications on multiple devices.

### ✨ Key Features

- ✅ **Automatic SMS Forwarding** — Receive SMS via email instantly
- ✅ **Background Processing** — Works even when app is closed
- ✅ **Global Coverage** — Works in any country with any carrier
- ✅ **Local Storage** — Keep 20 recent SMS messages locally
- ✅ **Free Email Service** — Uses Brevo (300 free emails/day)
- ✅ **Simple Setup** — Configure in 5 minutes
- ✅ **Privacy Focused** — All data processed locally
- ✅ **Open Source** — MIT License, fully auditable

---

## 💡 Use Cases

### 🌍 **Traveling Abroad**
```
Scenario: You moved to another country for work
Problem: Your home country's SIM is inactive, missing OTP messages
Solution: Activate SMS Gateway on an old phone with a local SIM
Result: All SMS sent to your email automatically
```

### 🏢 **Business Communication**
```
Scenario: Team members spread across different locations
Problem: Can't coordinate SMS notifications
Solution: SMS Gateway centralizes all SMS to team email
Result: No missed important messages
```

### 📧 **OTP Management**
```
Scenario: Receiving 2FA codes from banks/apps
Problem: Need phone to verify, not always available
Solution: Enable SMS Gateway
Result: OTPs arrive in email within seconds
```

### 🔐 **Backup Communication**
```
Scenario: Need SMS archive for compliance
Problem: Manual recording is tedious
Solution: SMS Gateway automatically archives all SMS
Result: Complete SMS history in your email
```

### 🚀 **Multi-Device Setup**
```
Scenario: Want SMS on laptop/tablet
Problem: SMS only arrives on phone
Solution: SMS Gateway forwards to your email
Result: Access SMS from any device
```

---

## 🚀 Quick Start

### Prerequisites

- ✅ Android 8.0+ device
- ✅ Active mobile number (any carrier)
- ✅ Free Brevo account (https://www.brevo.com)
- ✅ Email address

### 30-Second Setup

1. **Get Brevo API Key** (5 min)
   - Sign up at https://www.brevo.com (FREE)
   - Go to Settings → API & Apps → Copy API key
   
2. **Verify Sender Email** (2 min)
   - In Brevo: Settings → Sender & Domains
   - Add your email and verify it

3. **Configure App** (1 min)
   - Enter Target Email (where SMS arrives)
   - Enter Sender Email (verified in Brevo)
   - Paste Brevo API key
   - Click "Save Configuration"

4. **Enable Service** (30 sec)
   - Toggle "Forwarding Service" ON
   - Send test SMS
   - Check your email ✓

---

## 📲 Installation

### Option 1: Download APK (Easiest)

1. Download latest APK from [Releases](https://github.com/mitulp236/sms-gateway/releases)
2. Enable "Unknown Sources" in Android Settings
3. Install APK file
4. Grant SMS permissions
5. Done!

### Option 2: Build from Source (Developers)

#### Prerequisites
```bash
Node.js >= 20
Android SDK
Java Development Kit (JDK)
React Native CLI
```

#### Steps

```bash
# 1. Clone repository
git clone https://github.com/mitulp236/sms-gateway.git
cd sms-gateway

# 2. Install dependencies
npm install

# 3. Install Android dependencies
cd android && ./gradlew clean && cd ..

# 4. Connect Android device or start emulator
adb devices

# 5. Build and run
npx react-native run-android

# 6. To build APK
cd android
./gradlew assembleRelease
cd ..
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

#### Generate Release APK (for GitHub Releases)

```bash
# Build signed release APK
cd android
./gradlew bundleRelease
# Then sign the bundle and generate APK

# Or use this for debug APK
./gradlew assembleDebug
cd ..
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 How It Works

### Architecture Flow

```
┌─────────────────┐
│  Incoming SMS   │
│   (Carrier)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  SmsReceiver.java           │
│  (BroadcastReceiver)        │
│  Catches SMS in real-time   │
└────────┬────────────────────┘
         │
         ▼
    ┌────────────────────────────┐
    │ Check if service enabled?  │
    │ (SharedPreferences)        │
    └────────┬────────┬──────────┘
    Yes      │        │      No
    │        └────────┘
    ▼                  ▼
┌─────────────────┐   (Ignore)
│ WorkManager Job │
│ SmsSendWorker   │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────┐
│  Build Email Payload           │
│  - From: Verified Sender Email │
│  - To: Target Email            │
│  - Body: SMS content           │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Send via Brevo API            │
│  https://api.brevo.com/v3/...  │
└────────┬───────────────────────┘
         │
         ▼
    ✓ Success        ✗ Failed
    │                │
    ▼                ▼
┌──────────────┐   Retry
│ Email Sent   │   (Auto-retry)
│ to Inbox     │
└──────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native 0.82.1 |
| State Management | AsyncStorage |
| Background Jobs | Android WorkManager |
| Email Delivery | Brevo API v3 |
| SMS Receiver | BroadcastReceiver |
| Build Tool | Gradle |
| Build System | React Native CLI |

---

## 📸 Screenshots

### Setup & Configuration

| Configuration Screen | Service Status | Recent Messages |
|---|---|---|
| ![Config](https://via.placeholder.com/300x600/007AFF/ffffff?text=Configuration) | ![Status](https://via.placeholder.com/300x600/34C759/ffffff?text=Active+Service) | ![Messages](https://via.placeholder.com/300x600/FF9500/ffffff?text=Recent+SMS) |

### Navigation & Help

| Home Screen | Drawer Menu | How It Works |
|---|---|---|
| ![Home](https://via.placeholder.com/300x600/F8F9FA/007AFF?text=Home+Screen) | ![Drawer](https://via.placeholder.com/300x600/FFFFFF/333333?text=Navigation+Drawer) | ![Guide](https://via.placeholder.com/300x600/E3F2FD/1976D2?text=Setup+Guide) |

> 💡 Replace placeholder images with actual screenshots from your device

---

## 🔒 Security & Privacy

### What We Do NOT Store

- ❌ SMS messages on external servers
- ❌ Your email addresses anywhere
- ❌ API keys on cloud
- ❌ Phone number data
- ❌ Message history on servers

### What You Control

- ✅ All data stored locally on your device
- ✅ You manage Brevo API key
- ✅ You choose recipient email
- ✅ You can delete messages anytime
- ✅ Open source code (fully auditable)

### Permissions Required

```xml
<!-- Receive incoming SMS -->
<uses-permission android:name="android.permission.RECEIVE_SMS" />

<!-- Read SMS (for history) -->
<uses-permission android:name="android.permission.READ_SMS" />

<!-- Internet (to send emails) -->
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 📖 Detailed Setup Guide

### Step 1: Create Free Brevo Account

1. Visit https://www.brevo.com
2. Click "Sign Up Free"
3. Complete registration
4. Verify your email
5. Dashboard opens (FREE: 300 emails/day)

### Step 2: Get API Key

```
Brevo Dashboard
├── Settings (gear icon)
├── API & Apps
├── SMTP & API (tab)
├── API Keys section
├── Copy your API key (starts with xkeysib-)
└── Keep it safe!
```

### Step 3: Verify Sender Email

```
Brevo Dashboard
├── Settings
├── Sender & Domains
├── Add Sender Email
├── Verify email (confirmation link)
├── Wait for verification
└── Now you can use it in SMS Gateway
```

### Step 4: Configure SMS Gateway App

1. **Open App**
   - Install SMS Gateway

2. **Fill Configuration**
   ```
   Target Email: your.email@gmail.com
   Sender Email: noreply@yourdomain.com (verified in Brevo)
   Brevo API Key: xkeysib-xxxxxxxxxxxx
   ```

3. **Save Configuration**
   - Tap "💾 Save Configuration"
   - See green checkmark

4. **Test Email**
   - Tap "📨 Send Test Email"
   - Check your email for test message

5. **Enable Service**
   - Toggle "Forwarding Service" ON
   - See green "● Active (Background)"

6. **Done!** 🎉
   - Now all SMS → Email automatically

---

## 🐛 Troubleshooting

### ❌ Email Not Arriving

**Check 1: Service Enabled?**
```
✓ Toggle should be green/ON
✓ Says "● Active (Background)"
```

**Check 2: Configuration Saved?**
```
✓ Green banner shows "✓ Configuration Saved & Synced"
✓ Test email works first
```

**Check 3: Brevo Setup**
```
✓ Sender email verified in Brevo (not pending)
✓ API key correct (starts with xkeysib-)
✓ Brevo account not out of daily quota
```

**Check 4: SMS Received?**
```
✓ Sender number appears in "Recent Messages"
✓ Message shows in SMS app
```

**Check 5: Check Spam Folder**
```
✓ Gmail: Check "All Mail", Promotions, Spam
✓ Outlook: Check Junk folder
✓ Other: Add sender to contacts
```

### ❌ Service Stops Working

**Possible Causes:**
1. **Force Stopped App** → Solution: Open app, toggle service back ON
2. **Battery Optimization** → Solution: Settings → Battery → Exempt SMS Gateway
3. **Device Sleep** → Solution: Keep device on or disable deep sleep
4. **Brevo Down** → Solution: Check status at status.brevo.com

### ⚠️ "Missing Config" Error

```
Solution:
1. Tap "Save Configuration" button
2. Fill ALL three fields (don't leave blank)
3. Test email first
4. Then toggle service ON
```

---

## 🤝 Contributing

We welcome contributions! 

### How to Contribute

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sms-gateway.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run android

# Run linter
npm run lint

# Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### Development Guidelines

- ✅ Follow React Native best practices
- ✅ Add comments for complex logic
- ✅ Test on real Android device
- ✅ Update README if adding features
- ✅ Keep native code clean and documented

### 🐛 Found a Bug?

Create an [Issue](https://github.com/mitulp236/sms-gateway/issues):
1. Describe the bug
2. Steps to reproduce
3. Expected vs actual behavior
4. Device info (Model, Android version)

---

## 📋 Project Structure

```
sms-gateway/
├── App.js                          # Main React Native component
├── android/
│   ├── app/src/main/
│   │   ├── java/com/smsforwarder/
│   │   │   ├── MainActivity.kt     # Android main activity
│   │   │   ├── SmsReceiver.java    # BroadcastReceiver for SMS
│   │   │   ├── SmsSendWorker.java  # WorkManager job
│   │   │   ├── SmsReceiverModule.java
│   │   │   └── SmsReceiverPackage.java
│   │   ├── AndroidManifest.xml     # Permissions & receivers
│   │   └── res/                    # Resources
│   ├── build.gradle                # Dependencies
│   └── gradlew                     # Gradle wrapper
├── ios/                            # iOS placeholder (Android only)
├── package.json                    # Node dependencies
├── README.md                       # This file
└── LICENSE                         # MIT License
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.82.1 | Mobile framework |
| @react-native-async-storage/async-storage | 2.2.0 | Local storage |
| axios | 1.13.2 | HTTP requests |
| react-native-safe-area-context | 5.5.2 | Safe UI rendering |

---

## ⚖️ License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Mitul Patel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software...
```

---

## 👨‍💻 About Developer

**Mitul Patel**
- 📧 Email: [mitulp236@gmail.com](mailto:mitulp236@gmail.com)
- 🌐 Website: [mitulpatel.in/about](https://mitulpatel.in/about)
- 💻 GitHub: [@mitulp236](https://github.com/mitulp236)

---

## 🌟 Show Your Support

Give a ⭐ if this project helped you!

```bash
# You can also support by:
# 1. Sharing with others
# 2. Contributing code
# 3. Reporting bugs
# 4. Suggesting features
```

---

## 🗺️ Roadmap

### v1.0.0 (Current) ✅
- ✅ SMS forwarding to email
- ✅ Background processing
- ✅ Message history
- ✅ Brevo integration

### v1.1.0 (Planned) 🔜
- 🔜 Multiple recipient emails
- 🔜 SMS filtering (keywords)
- 🔜 Email templates
- 🔜 Dark mode

### v2.0.0 (Future Ideas) 💭
- 💭 Web dashboard
- 💭 SMS reply via email
- 💭 Cloud backup
- 💭 iOS support (may require fork)

---

## ❓ FAQ

**Q: Does this work without internet?**
> A: SMS receiving works without internet. Email forwarding requires internet to reach Brevo API.

**Q: Is my data safe?**
> A: Yes! All data is stored locally. We don't send SMS content anywhere except to your email.

**Q: Can I use my own email service?**
> A: Currently Brevo only. Contributions welcome to add other providers!

**Q: What if app crashes?**
> A: WorkManager automatically retries failed emails (5+ attempts).

**Q: How many SMS can I forward?**
> A: Unlimited! Brevo gives 300 free emails/day. Pay plans available for more.

**Q: Does battery drain?**
> A: Minimal. WorkManager is battery optimized. SMS receiving is system event (negligible impact).

**Q: Can I forward SMS to multiple emails?**
> A: v1.0.0 supports one target email. Multi-recipient in v1.1.0!

---

## 📞 Support

- 💬 **GitHub Issues**: Report bugs or request features
- 📧 **Email**: mitulp236@gmail.com
- 🌐 **Website**: mitulpatel.in/about

---

## 🎓 Learning Resources

New to Android development? Check these resources:

- [React Native Docs](https://reactnative.dev/)
- [Android BroadcastReceiver](https://developer.android.com/guide/components/broadcasts)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Brevo API Docs](https://developers.brevo.com/docs/)

---

## 📊 Stats

- 📱 Platform: Android 8.0+
- 🔧 Built with: React Native
- 📦 Size: ~40MB
- ⚡ Performance: Optimized for background operation
- 🔒 Security: Local-first, privacy-focused
- 📄 License: MIT (Open Source)

---

## 🙏 Acknowledgments

- React Native community
- Brevo team for free email API
- All contributors and testers
- You for reading this! 👋

---

## 📝 Changelog

### v1.0.0 - 2025-11-22
- ✨ Initial release
- ✅ SMS to email forwarding
- ✅ Background processing
- ✅ Message history
- ✅ Professional UI/UX

---

<div align="center">

**Made with ❤️ by [Mitul Patel](https://mitulpatel.in/about)**

[⬆ back to top](#sms-gateway-)

</div>