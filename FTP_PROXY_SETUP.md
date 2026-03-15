# FTP Proxy Server Setup

This BitXfer Mobile app includes an FTP proxy server that allows the web browser version to connect to real FTP servers.

## Overview

Since web browsers cannot make direct FTP connections (due to security restrictions), FTP operations are proxied through a Node.js backend server. This server:

- Manages FTP connections to real FTP servers
- Handles file listing, download, upload, and delete operations
- Provides HTTP/JSON API for the web app

## Starting the Proxy Server

### Prerequisites

Ensure you have Node.js installed, then install dependencies:

```bash
npm install express cors body-parser basic-ftp
```

### Run the Proxy Server

From the app directory:

```bash
node ftp-proxy.js
```

You should see:

```
╔════════════════════════════════════════╗
║      FTP Proxy Server Running          ║
╠════════════════════════════════════════╣
║ Port:     http://localhost:3001        ║
║ Health:   http://localhost:3001/api/health ║
╚════════════════════════════════════════╝
```

## Using the Web App

1. **Start the proxy server** (see above)
2. **Start the Expo dev server** in another terminal:
   ```bash
   npm start -- --web
   ```
3. **Open the app** at http://localhost:19006
4. **Add an FTP connection** in the "Connections" tab:
   - Host: `ftp.example.com`
   - Port: `21` (or `990` for FTPS)
   - Username: your FTP username
   - Password: your FTP password
   - SSL: Check if using FTPS

5. **Test the connection** - you'll see real success/error messages

## Testing with Public FTP Servers

You can test with these public FTP servers:

### Example 1: FTP.Ubuntu.com
- Host: `ftp.ubuntu.com`
- Username: anonymous
- Password: (leave empty or enter any email)
- SSL: No
- Port: 21

### Example 2: Ftp.gnu.org
- Host: `ftp.gnu.org`
- Username: anonymous
- Password: (leave empty)
- SSL: No
- Port: 21

## API Endpoints

The proxy server provides these HTTP endpoints:

### Test Connection
```bash
POST /api/ftp/connect
{
  "id": "conn-id",
  "host": "ftp.example.com",
  "port": 21,
  "username": "user",
  "password": "pass",
  "secure": false
}
```

### List Files
```bash
POST /api/ftp/list
{
  "connectionId": "conn-id",
  "path": "/"
}
```

### Download File
```bash
POST /api/ftp/download
{
  "connectionId": "conn-id",
  "remotePath": "/path/to/file.txt"
}
```

### Upload File
```bash
POST /api/ftp/upload
{
  "connectionId": "conn-id",
  "remotePath": "/path/to/file.txt",
  "fileContent": "file contents as string"
}
```

### Delete File
```bash
POST /api/ftp/delete
{
  "connectionId": "conn-id",
  "remotePath": "/path/to/file.txt"
}
```

### Disconnect
```bash
POST /api/ftp/disconnect
{
  "connectionId": "conn-id"
}
```

### Health Check
```bash
GET /api/health
```

## Troubleshooting

### "FTP Proxy server not running" Error
- Start the proxy server: `node ftp-proxy.js`
- Ensure it's running on port 3001

### "Connection failed" Error
- Verify hostname is correct
- Check port number (usually 21 for FTP, 990 for FTPS)
- Ensure server is reachable (try ping)
- Check firewall settings

### "Failed to list files" Error
- Verify FTP server connection is active
- Check file path exists
- Ensure you have permission to access the path

## Production Deployment

For production use:

1. **Deploy the proxy server** to a public server (e.g., Heroku, AWS, DigitalOcean)
2. **Update FTP_PROXY_URL** in `src/services/FTPService.js`:
   ```javascript
   const FTP_PROXY_URL = 'https://your-ftp-proxy.com/api/ftp';
   ```
3. **Use HTTPS** for all connections
4. **Add authentication** to FTP proxy (optional)
5. **Rebuild and deploy** the app

## Native App Usage

For iOS/Android native apps, replace the proxy approach with:
- Expo native modules for FTP
- Or native iOS/Android FTP libraries
- Direct FTP client implementation

## Security Considerations

- **Don't hardcode credentials** in the frontend
- **Use HTTPS** for production proxy server
- **Validate all user input** on the backend
- **Implement rate limiting** to prevent abuse
- **Use environment variables** for proxy server configuration
- **Add authentication** to proxy API if exposed publicly

## More Information

- [basic-ftp Documentation](https://www.npmjs.com/package/basic-ftp)
- [Express.js Documentation](https://expressjs.com/)
- [FTP Protocol Details](https://en.wikipedia.org/wiki/File_Transfer_Protocol)
