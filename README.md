# BitXfer Mobile

A cross-platform FTP client for iOS and Android with SSL/TLS support, built with React Native and Expo.

## Features

- **Multi-platform Support**: Works on both iOS and Android
- **FTP/FTPS/SFTP**: Support for multiple FTP protocols with SSL/TLS encryption
- **File Management**: Browse, upload, download, and delete files
- **Connection Management**: Save and manage multiple FTP connections
- **Transfer Tracking**: Monitor active transfers with progress indicators
- **Secure Connections**: Full SSL/TLS support with certificate validation
- **Offline-first**: Local caching of connections and transfers
- **Customizable Settings**: Adjust app behavior to your needs

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode or Expo Go app
- Android: Android Studio or Expo Go app

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bitxfer-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure

```
bitxfer-mobile/
├── src/
│   ├── screens/          # App screens
│   │   ├── ConnectionScreen.js
│   │   ├── FileManagerScreen.js
│   │   ├── TransfersScreen.js
│   │   └── SettingsScreen.js
│   ├── services/         # Business logic
│   │   ├── FTPService.js
│   │   └── SSLService.js
│   └── components/       # Reusable components
├── App.js                # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── babel.config.js       # Babel configuration
```

## Configuration

### SSL/TLS Settings

The app supports multiple FTP protocols:

- **Explicit FTPS**: FTP with STARTTLS command (port 21)
- **Implicit FTPS**: SSL/TLS from the start (port 990)
- **SFTP**: SSH File Transfer Protocol (port 22)

Configure in the Connection settings within the app.

### Connection Management

Connections are stored locally and encrypted using AsyncStorage.

**Connection Object**:
```javascript
{
  id: string,
  name: string,
  host: string,
  port: number,
  username: string,
  password: string,
  isSSL: boolean,
  implicitSSL: boolean,
  rejectUnauthorized: boolean,
}
```

## Building for Production

### Android

```bash
# EAS Build (recommended)
npm run build:android

# Local build with Expo
eas build --platform android --local
```

### iOS

```bash
# EAS Build (requires Apple Developer account)
npm run build:ios

# Local build
eas build --platform ios --local
```

## API Reference

### FTPService

```javascript
import FTPService from './src/services/FTPService';

// Test connection
await FTPService.testConnection(connection);

// List files
await FTPService.listFiles(connection, '/path/');

// Download file
await FTPService.downloadFile(connection, '/remote/path', '/local/path');

// Upload file
await FTPService.uploadFile(connection, '/local/path', '/remote/path');

// Delete file
await FTPService.deleteFile(connection, '/remote/path');
```

### SSLService

```javascript
import SSLService from './src/services/SSLService';

// Get SSL config
SSLService.getExplicitFTPSConfig();
SSLService.getImplicitFTPSConfig();
SSLService.getSFTPConfig();

// Validate certificate
SSLService.validateCertificate(cert);

// Validate hostname
SSLService.validateHostname('example.com', cert);
```

## Troubleshooting

### Connection Issues

1. **"Could not connect to server"**
   - Verify hostname and port are correct
   - Check firewall settings
   - Ensure FTP server is running

2. **"SSL certificate error"**
   - Check certificate validity dates
   - Enable "Reject Unauthorized" if testing
   - Update system certificates

3. **"Authentication failed"**
   - Verify username and password
   - Check user permissions on FTP server

### Build Issues

1. **Dependencies conflicts**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Expo cache issues**
   ```bash
   expo start --clear
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Mesonsoft License Version 1.0 - see the LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/mesonsoft/bitxfer-mobile/issues)
- Email: support@mesonsoft.com
- Documentation: [https://docs.mesonsoft.com](https://docs.mesonsoft.com)

## Changelog

### Version 1.0.0
- Initial release
- FTP/FTPS/SFTP support
- SSL/TLS encryption
- File upload/download
- Connection management
- Transfer tracking
- Settings management

## Acknowledgments

- Built with [React Native](https://reactnative.dev/)
- Powered by [Expo](https://expo.dev/)
- Navigation by [React Navigation](https://reactnavigation.org/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)
