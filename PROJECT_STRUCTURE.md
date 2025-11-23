# SMS Gateway - Project Structure

## Overview
This project has been refactored into a clean, production-ready architecture with proper separation of concerns.

## Directory Structure

```
SMSForwarder/
├── App.js                          # Main app entry point
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── Card.js                # Card container component
│   │   ├── MessageItem.js         # Message list item component
│   │   ├── Drawer.js              # Navigation drawer component
│   │   └── index.js               # Component exports
│   │
│   ├── screens/                    # Screen components
│   │   └── modals/                # Modal screens
│   │       ├── HowItWorksModal.js # How It Works information
│   │       ├── SetupGuideModal.js # Setup instructions
│   │       ├── AboutModal.js      # About app information
│   │       └── index.js           # Modal exports
│   │
│   ├── services/                   # Business logic & services
│   │   ├── storage.js             # AsyncStorage wrapper
│   │   └── emailService.js        # Email sending logic
│   │
│   ├── theme/                      # Theme configuration
│   │   └── colors.js              # Light/dark theme colors
│   │
│   ├── styles/                     # Shared styles
│   │   └── commonStyles.js        # Common UI styles
│   │
│   └── constants.ts               # App constants
│
└── email-template.json            # Email HTML template

```

## Architecture

### 1. **Components** (`src/components/`)
Reusable UI components that accept `theme` as a prop for dynamic theming.

- **Card.js**: Wrapper component for card-style containers
- **MessageItem.js**: Displays individual SMS messages
- **Drawer.js**: Navigation drawer with menu items and theme toggle

### 2. **Screens** (`src/screens/modals/`)
Full-screen modal components for different app sections.

- **HowItWorksModal**: Explains how the app works
- **SetupGuideModal**: Step-by-step setup instructions
- **AboutModal**: App information and use cases

### 3. **Services** (`src/services/`)
Business logic separated from UI components.

#### storage.js
Handles all AsyncStorage operations:
- Configuration (email settings)
- Service state
- Message history
- Theme preference

#### emailService.js
Email sending logic:
- Validates configuration
- Formats email content
- Sends via Brevo API
- Error handling

### 4. **Theme** (`src/theme/`)
Centralized theme configuration:
- `lightTheme`: Light mode colors
- `darkTheme`: Dark mode colors
- Theme helper functions

### 5. **Styles** (`src/styles/`)
Common styles shared across components:
- Layout styles
- Typography
- Form elements
- Buttons and badges

## Key Features

### Dark/Light Mode
- System theme detection
- Manual theme switching (System/Light/Dark)
- Theme persistence
- Dynamic theming for all components

### Modular Architecture
- Clean separation of concerns
- Reusable components
- Service layer for business logic
- Easy to test and maintain

### State Management
- React hooks for local state
- AsyncStorage for persistence
- Refs for SMS listener callbacks

## Usage

### Importing Components
```javascript
import { Card, MessageItem, Drawer } from './src/components';
import { HowItWorksModal, SetupGuideModal, AboutModal } from './src/screens/modals';
```

### Using Services
```javascript
import { storageService } from './src/services/storage';
import { emailService } from './src/services/emailService';

// Save configuration
await storageService.saveConfig(targetEmail, smtpEmail, smtpPassword);

// Send email
await emailService.sendEmail(message, config);
```

### Using Theme
```javascript
import { lightTheme, darkTheme } from './src/theme/colors';

const theme = useMemo(() => {
  if (themeMode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return themeMode === 'dark' ? darkTheme : lightTheme;
}, [themeMode, systemColorScheme]);
```

## Benefits

1. **Maintainability**: Easy to locate and update specific features
2. **Scalability**: Simple to add new components or services
3. **Testability**: Business logic separated from UI
4. **Reusability**: Components can be used across the app
5. **Consistency**: Centralized styling and theming
6. **Code Organization**: Clear structure for team collaboration

## Development Guidelines

### Adding New Components
1. Create component in `src/components/`
2. Accept `theme` prop for theming
3. Export from `src/components/index.js`

### Adding New Services
1. Create service in `src/services/`
2. Export functions as an object
3. Keep services pure and testable

### Updating Styles
1. Add common styles to `src/styles/commonStyles.js`
2. Component-specific styles stay in component files
3. Use theme colors for dynamic theming

## File Size Comparison

**Before Refactoring:**
- App.js: ~1,210 lines (all code in one file)

**After Refactoring:**
- App.js: ~472 lines (main logic only)
- Components: ~150 lines
- Modals: ~300 lines
- Services: ~150 lines
- Theme & Styles: ~200 lines

**Result**: More organized, easier to navigate, and production-ready!
