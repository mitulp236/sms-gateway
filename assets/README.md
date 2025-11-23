# SMS Gateway App Icon

This directory contains the source icon file and generation script for the SMS Gateway app.

## Icon Design

The app icon features:
- **Modern design** with dark black and blue gradient background
- **SMS bubble** in the foreground (blue gradient with white message dots)
- **Email envelope** in the background (cyan gradient)
- **Gateway arrow** showing message forwarding with motion lines
- **Signal waves** indicating transmission
- **Tech aesthetic** with subtle grid pattern and glowing effects

## Files

- `icon.svg` - Source SVG file (1024x1024)
- `../generate_icons.js` - Node.js script to generate all icon sizes

## Generating Icons

If you modify the `icon.svg` file, regenerate all app icons by running:

```bash
node generate_icons.js
```

This will automatically create:

### Android Icons
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

Plus round icon variants for each size.

### iOS Icons
All required sizes from 20x20 to 1024x1024 with proper @1x, @2x, @3x scales, including:
- iPhone app icons (various sizes)
- App Store icon (1024x1024)
- Contents.json with proper metadata

## Icon Configuration

The icons are already configured in:
- **Android**: `android/app/src/main/AndroidManifest.xml`
- **iOS**: `ios/SMSForwarder/Images.xcassets/AppIcon.appiconset/Contents.json`

No additional configuration needed after running the generator.

## Customization

To customize the icon:
1. Edit `icon.svg` with any SVG editor
2. Run `node generate_icons.js` to regenerate all sizes
3. Rebuild your app

The icon uses web colors that are easily editable in the SVG file:
- Background: `#0F172A` → `#0C4A6E` (dark black to blue)
- SMS bubble: `#3B82F6` → `#1D4ED8` (blue gradient)
- Email: `#06B6D4` → `#0891B2` (cyan gradient)
- Arrow: `#60A5FA` → `#3B82F6` (electric blue)
