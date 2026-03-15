# BitXfer Mobile - Setup Guide

Complete step-by-step guide to get BitXfer Mobile running on your devices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Running on iOS](#running-on-ios)
4. [Running on Android](#running-on-android)
5. [Testing](#testing)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Node.js**: Version 14 or higher
  - Download from https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- **Expo CLI**
  ```bash
  npm install -g expo-cli
  ```

### For iOS Development

- **macOS**: Xcode is required
- **Xcode**: Download from App Store or https://developer.apple.com/
- **CocoaPods**:
  ```bash
  sudo gem install cocoapods
  ```
- **iOS Simulator** (included with Xcode) or physical iPhone

### For Android Development

- **Android Studio**: Download from https://developer.android.com/studio
- **Android SDK**: Installed via Android Studio
- **Android Emulator** (included with Studio) or physical Android device

### Optional

- **VS Code**: Recommended editor
- **React Native Tools extension** for VS Code
- **Expo Go app**: For rapid testing (available on App Store and Google Play)

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd bitxfer-mobile

# Install dependencies
npm install

# Verify installation
expo --version
```

### 2. Start Development Server

```bash
npm start

# Or use expo directly
expo start
```

This launches the Expo development server and displays a QR code.

### 3. Choose Your Platform

```
# After running npm start, you'll see options:
i - open iOS simulator
a - open Android emulator
w - open web preview
j - open debugger
r - reload app
m - toggle menu
o - open project in Xcode
```

## Running on iOS

### Using Expo Go (Quickest)

1. Install Expo Go from App Store
2. In terminal, press `i` to open iOS simulator
3. Or scan QR code with device camera and open link in Expo Go

### Using iOS Simulator

```bash
# Ensure you have Xcode installed
npm start

# In another terminal, press 'i'
# Or run directly:
npm run ios
```

### Using Physical iPhone

1. Install Expo Go from App Store
2. Ensure iPhone is on same WiFi as computer
3. In terminal, select tunnel connection: `npm start` → choose "Tunnel"
4. Scan QR code with iPhone camera
5. Open link in Expo Go

## Running on Android

### Using Android Emulator

```bash
# Start Android emulator first through Android Studio
# Then run:
npm start

# In another terminal, press 'a'
# Or run directly:
npm run android
```

### Using Physical Android Device

1. Enable Developer Mode:
   - Go to Settings → About phone
   - Tap "Build number" 7 times
   - Enable USB Debugging in Developer options

2. Connect via USB

3. Run app:
   ```bash
   npm start
   npm run android
   ```

4. Or use Expo:
   - Install Expo Go from Google Play
   - Run `npm start` with tunnel connection
   - Scan QR code with device camera

## Testing

### Run Tests

```bash
npm test

# With coverage
npm test -- --coverage
```

### Run ESLint

```bash
npm run lint

# Fix issues automatically
npm run lint -- --fix
```

## Building for Production

### Android APK/AAB

```bash
# Using EAS (Recommended)
npm run build:android

# Or locally (requires Android SDK)
expo build:android --release-channel production
```

### iOS IPA

```bash
# Using EAS (requires Apple Developer account)
npm run build:ios

# Or locally (macOS only, requires Xcode)
expo build:ios --release-channel production
```

## Project Structure

```
bitxfer-mobile/
├── src/
│   ├── screens/              # App screens
│   │   ├── ConnectionScreen.js    # FTP connection management
│   │   ├── FileManagerScreen.js   # Remote file browsing
│   │   ├── TransfersScreen.js     # Transfer monitoring
│   │   └── SettingsScreen.js      # App settings
│   ├── services/             # Business logic
│   │   ├── FTPService.js     # FTP operations
│   │   └── SSLService.js     # SSL/TLS configuration
│   └── components/           # Reusable components
│       └── Button.js         # Custom button component
├── App.js                    # Root app component
├── app.json                  # Expo configuration
├── babel.config.js           # Babel configuration
├── package.json              # NPM dependencies
├── eas.json                  # EAS build configuration
├── jest.config.js            # Jest testing config
├── .eslintrc.json            # ESLint configuration
├── .prettierrc                # Code formatting config
└── README.md                 # Project README
```

## Key Files Explained

- **App.js**: Root component with navigation setup
- **app.json**: Expo configuration (permissions, icons, build settings)
- **ConnectionScreen.js**: Create and manage FTP connections
- **FileManagerScreen.js**: Browse and transfer files
- **FTPService.js**: All FTP operations
- **SSLService.js**: SSL/TLS certificate handling

## Environmental Configuration

### Create .env file (if needed)

```bash
# .env
EXPO_DEBUG=false
FTP_DEFAULT_PORT=21
FTPS_DEFAULT_PORT=990
SFTP_DEFAULT_PORT=22
```

### Add credentials securely

Store sensitive data in AsyncStorage, never in source code:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('password', encryptedPassword);

// Retrieve
const password = await AsyncStorage.getItem('password');
```

## Debugging

### Enable Debug Menu

- **iOS**: Shake device or press Cmd+D in simulator
- **Android**: Shake device or press Cmd+M in emulator

### Remote Debugging

1. Open debug menu
2. Select "Debug Remote JS"
3. Browser opens at http://localhost:19001
4. Open DevTools (F12)

### View Logs

```bash
# All logs
npm start

# Specific log level
expo start --clear
expo start --verbose
```

## Performance Tips

1. Use `React.memo` for expensive components
2. Implement FlatList for large file lists
3. Optimize images and assets
4. Use AsyncStorage for caching
5. Profile with React DevTools

## Security Best Practices

1. **Never commit credentials** to git
2. Use `.env` with `.gitignore`
3. Validate certificates with `SSLService`
4. Use HTTPS/FTPS for all connections
5. Implement certificate pinning for production
6. Clear sensitive data on logout

## Common Issues & Solutions

### Issue: "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
expo start --clear
```

### Issue: Emulator/Simulator won't start

```bash
# Kill existing processes
pkill -f "Android Device Monitor"
pkill -f "emulator64"

# Restart emulator
```

### Issue: Port 19000 already in use

```bash
# Find and kill process
lsof -i :19000
kill -9 <PID>

# Or use different port
expo start --port 19001
```

### Issue: SSL certificate errors

- Check system date/time is correct
- Update certificates: `npm install`
- Check `rejectUnauthorized` setting in connection

## Next Steps

1. **Customize branding**: Update app icons in `app.json`
2. **Add push notifications**: Install `expo-notifications`
3. **Implement real FTP**: Replace mock with actual FTP library
4. **Add authentication**: Implement user login
5. **Deploy to stores**: Use EAS Submit

## Support & Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **React Navigation**: https://reactnavigation.org/
- **Community**: https://expo.io/community

## License

See LICENSE file for details.
