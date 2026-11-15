import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FTP Proxy Server URL - change this to match your server
const FTP_PROXY_URL = process.env.EXPO_PUBLIC_FTP_PROXY_URL || 'https://example-ftp-proxy.mesonsoft.com/api/ftp';

// Store for active FTP connections (maps connection name to proxy connection)
const ftpConnections = {};

class FTPService {
  /**
   * Get proxy server URL
   */
  static getProxyURL() {
    // In web, try localhost:3001
    // In native, use your production proxy server
    return FTP_PROXY_URL;
  }

  /**
   * Test FTP connection via proxy
   */
  static async testConnection(connection) {
    console.log('=== FTPService.testConnection called ===');
    console.log('Connection object:', connection);
    
    try {
      // Validate connection object
      const validation = this.validateConnection(connection);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        const errorMsg = validation.errors.join(', ');
        console.error('Validation failed:', errorMsg);
        return {
          success: false,
          message: 'Validation error: ' + errorMsg,
        };
      }

      console.log('Validation passed, attempting to connect...');
      
      try {
        const proxyUrl = this.getProxyURL();
        console.log('Proxy URL:', proxyUrl);
        
        const requestBody = {
          id: `test-${Date.now()}`,
          host: connection.host,
          port: connection.port || 21,
          username: connection.username,
          password: connection.password ?? '',
          secure: connection.isSSL === true || connection.protocol === 'ftps' || connection.protocol === 'sftp',
        };
        
        console.log('Request body:', JSON.stringify(requestBody));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('Request timeout!');
          controller.abort();
        }, 15000); // 15 second timeout

        console.log('Making fetch request to:', `${proxyUrl}/connect`);
        
        const response = await fetch(`${proxyUrl}/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
          // Close the test connection
          try {
            await fetch(`${proxyUrl}/disconnect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connectionId: data.connectionId }),
            });
          } catch (e) {
            console.log('Could not close test connection:', e.message);
          }

          return {
            success: true,
            message: 'Connected successfully to ' + connection.host,
          };
        } else {
          return {
            success: false,
            message: data.message || 'Connection failed',
          };
        }
      } catch (error) {
        console.error('Fetch error:', error);
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: 'Connection timeout. The FTP server took too long to respond.',
          };
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          return {
            success: false,
            message: 'Cannot reach FTP Proxy server at ' + this.getProxyURL() + '. Is it running? Start it with: node ftp-proxy.js',
          };
        }
        return {
          success: false,
          message: `Connection error: ${error.message}`,
        };
      }
    } catch (error) {
      console.error('Test connection outer error:', error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  static async listFiles(connection, path = '/') {
    try {
      console.log('Listing files from', connection.host, 'at path:', path);

      // Create a temporary connection for this operation
      const tempConnectionId = `list-${Date.now()}`;
      const proxyUrl = this.getProxyURL();

      // First establish connection on proxy
      console.log('Creating temporary FTP connection for listing files...');
      const connectBody = {
        id: tempConnectionId,
        host: connection.host,
        port: connection.port || 21,
        username: connection.username,
        password: connection.password ?? '',
        secure: connection.isSSL === true || connection.protocol === 'ftps' || connection.protocol === 'sftp',
      };

      const connectResponse = await fetch(`${proxyUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectBody),
      });

      const connectData = await connectResponse.json();
      if (!connectResponse.ok || !connectData.success) {
        throw new Error(connectData.message || 'Failed to connect to FTP server');
      }

      const connectionId = connectData.connectionId;
      console.log('✓ Connected to proxy with ID:', connectionId);

      // Now list files
      const response = await fetch(`${proxyUrl}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connectionId,
          path: path,
        }),
      });

      const data = await response.json();

      // Disconnect after listing
      try {
        await fetch(`${proxyUrl}/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId: connectionId }),
        });
        console.log('✓ Disconnected from proxy');
      } catch (e) {
        console.log('Warning: Could not disconnect properly:', e.message);
      }

      if (response.ok && data.success) {
        return data.files || [];
      } else {
        throw new Error(data.message || 'Failed to list files');
      }
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  static async downloadFile(connection, remotePath, localPath) {
    try {
      console.log('Downloading from', remotePath);

      const proxyUrl = this.getProxyURL();
      const tempConnectionId = `download-${Date.now()}`;

      // Log transfer
      const transfer = await this.addTransfer({
        fileName: remotePath.split('/').pop(),
        type: 'download',
        status: 'transferring',
        progress: 0,
        transferred: '0 KB',
        total: 'unknown',
      });

      try {
        // Create temporary connection
        const connectBody = {
          id: tempConnectionId,
          host: connection.host,
          port: connection.port || 21,
          username: connection.username,
          password: connection.password ?? '',
          secure: connection.isSSL === true || connection.protocol === 'ftps' || connection.protocol === 'sftp',
        };

        const connectResponse = await fetch(`${proxyUrl}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(connectBody),
        });

        const connectData = await connectResponse.json();
        if (!connectResponse.ok || !connectData.success) {
          throw new Error(connectData.message || 'Failed to connect to FTP server');
        }

        const connectionId = connectData.connectionId;

        // Download file
        const response = await fetch(`${proxyUrl}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId: connectionId,
            remotePath: remotePath,
          }),
        });

        const data = await response.json();

        // Disconnect
        try {
          await fetch(`${proxyUrl}/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: connectionId }),
          });
        } catch (e) {
          console.log('Warning: Could not disconnect:', e.message);
        }

        if (response.ok && data.success) {
          // In web environment, trigger download
          if (typeof window !== 'undefined' && data.content) {
            const blob = new Blob([data.content], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }

          await this.updateTransferStatus(remotePath, 'completed');
          return;
        } else {
          throw new Error(data.message || 'Download failed');
        }
      } catch (error) {
        await this.updateTransferStatus(remotePath, 'error');
        throw error;
      }
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);;
    }
  }

  static async uploadFile(connection, localUri, remotePath) {
    try {
      console.log('Uploading to', remotePath);

      const proxyUrl = this.getProxyURL();
      const tempConnectionId = `upload-${Date.now()}`;
      const fileName = remotePath.split('/').pop();

      // Log transfer
      await this.addTransfer({
        fileName,
        type: 'upload',
        status: 'transferring',
        progress: 0,
        transferred: '0 KB',
        total: 'unknown',
      });

      try {
        // Create temporary connection
        const connectBody = {
          id: tempConnectionId,
          host: connection.host,
          port: connection.port || 21,
          username: connection.username,
          password: connection.password ?? '',
          secure: connection.isSSL === true || connection.protocol === 'ftps' || connection.protocol === 'sftp',
        };

        const connectResponse = await fetch(`${proxyUrl}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(connectBody),
        });

        const connectData = await connectResponse.json();
        if (!connectResponse.ok || !connectData.success) {
          throw new Error(connectData.message || 'Failed to connect to FTP server');
        }

        const connectionId = connectData.connectionId;

        // For web, get file content from input
        let fileContent = '';
        if (typeof window !== 'undefined' && localUri) {
          // In web, localUri is a File object from DocumentPicker
          fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(localUri);
          });
        } else {
          // In native, read from FileSystem
          fileContent = await FileSystem.readAsStringAsync(localUri);
        }

        const response = await fetch(`${proxyUrl}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId: connectionId,
            remotePath: remotePath,
            fileContent: fileContent,
          }),
        });

        const data = await response.json();

        // Disconnect
        try {
          await fetch(`${proxyUrl}/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: connectionId }),
          });
        } catch (e) {
          console.log('Warning: Could not disconnect:', e.message);
        }

        if (response.ok && data.success) {
          await this.updateTransferStatus(fileName, 'completed');
          return;
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (error) {
        await this.updateTransferStatus(fileName, 'error');
        throw error;
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  static async deleteFile(connection, remotePath) {
    try {
      console.log('Deleting file:', remotePath);

      const proxyUrl = this.getProxyURL();
      const tempConnectionId = `delete-${Date.now()}`;

      // Create temporary connection
      const connectBody = {
        id: tempConnectionId,
        host: connection.host,
        port: connection.port || 21,
        username: connection.username,
        password: connection.password ?? '',
        secure: connection.isSSL === true || connection.protocol === 'ftps' || connection.protocol === 'sftp',
      };

      const connectResponse = await fetch(`${proxyUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectBody),
      });

      const connectData = await connectResponse.json();
      if (!connectResponse.ok || !connectData.success) {
        throw new Error(connectData.message || 'Failed to connect to FTP server');
      }

      const connectionId = connectData.connectionId;

      const response = await fetch(`${proxyUrl}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connectionId,
          remotePath: remotePath,
        }),
      });

      const data = await response.json();

      // Disconnect
      try {
        await fetch(`${proxyUrl}/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId: connectionId }),
        });
      } catch (e) {
        console.log('Warning: Could not disconnect:', e.message);
      }

      if (response.ok && data.success) {
        return;
      } else {
        throw new Error(data.message || 'Delete failed');
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  static async addTransfer(transfer) {
    try {
      const transfers = await this.getTransfers();
      const newTransfer = {
        id: Date.now().toString(),
        ...transfer,
      };
      transfers.push(newTransfer);
      await AsyncStorage.setItem('transfers', JSON.stringify(transfers));
      return newTransfer;
    } catch (error) {
      console.error('Failed to add transfer:', error);
    }
  }

  static async getTransfers() {
    try {
      const stored = await AsyncStorage.getItem('transfers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  static async updateTransferStatus(fileName, status) {
    try {
      const transfers = await this.getTransfers();
      const updated = transfers.map(t => 
        t.fileName === fileName ? { ...t, status } : t
      );
      await AsyncStorage.setItem('transfers', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update transfer:', error);
    }
  }

  // Connection validation
  static validateConnection(connection) {
    const errors = [];
    
    console.log('Validating connection:', connection);

    if (!connection || typeof connection !== 'object') {
      return {
        isValid: false,
        errors: ['Connection object is invalid'],
      };
    }

    if (!connection.host || (typeof connection.host === 'string' && connection.host.trim() === '')) {
      errors.push('Host is required');
    }
    
    const port = parseInt(connection.port, 10);
    if (!connection.port || isNaN(port)) {
      errors.push('Port is required and must be a number');
    } else if (port < 1 || port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }
    
    if (!connection.username || (typeof connection.username === 'string' && connection.username.trim() === '')) {
      errors.push('Username is required');
    }
    
    // Allow undefined/null password for anonymous FTP, but it must be present as a key
    if (!connection.hasOwnProperty('password')) {
      errors.push('Password field is required (can be empty for anonymous FTP)');
    }

    console.log('Validation errors:', errors);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // SSL/TLS Configuration
  static getSSLConfig(connection) {
    if (!connection.isSSL) {
      return null;
    }

    return {
      protocol: 'ftps',
      implicit: connection.implicitSSL || false,
      rejectUnauthorized: connection.rejectUnauthorized !== false,
      certificatePath: connection.certificatePath || null,
    };
  }
}

export default FTPService;
