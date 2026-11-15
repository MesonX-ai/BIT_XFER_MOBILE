/**
 * FTP Proxy Server
 * Acts as a bridge between the web app and FTP servers
 * Run with: node ftp-proxy.js
 */

const express = require('express');
const { Client } = require('basic-ftp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store active connections
const connections = new Map();

/**
 * POST /api/ftp/connect
 * Test FTP connection
 */
app.post('/api/ftp/connect', async (req, res) => {
  const { id, host, port = 21, username, password, secure = true } = req.body;

  // Allow empty password for anonymous FTP
  if (!id || !host || !username || password === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: id, host, username, password (can be empty for anonymous)',
    });
  }

  try {
    const client = new Client();
    
    console.log(`[FTP] Connecting to ${host}:${port}...`);
    
    await client.access({
      host,
      port: parseInt(port),
      user: username,
      password,
      secure: secure === true || secure === 'true',
    });

    // Store connection
    connections.set(id, { client, lastUsed: Date.now() });

    console.log(`[FTP] Connected to ${host}:${port}`);
    
    res.json({
      success: true,
      message: 'Connected successfully',
      connectionId: id,
    });
  } catch (error) {
    console.error('[FTP] Connection failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
});

/**
 * POST /api/ftp/list
 * List files in a directory
 */
app.post('/api/ftp/list', async (req, res) => {
  const { connectionId, path = '/' } = req.body;

  if (!connectionId) {
    return res.status(400).json({
      success: false,
      message: 'Missing connectionId',
    });
  }

  const connection = connections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found or expired',
    });
  }

  try {
    const client = connection.client;
    const files = await client.list(path);

    const fileList = files.map(file => ({
      name: file.name,
      type: file.isDirectory ? 'folder' : 'file',
      size: file.size,
      modified: file.modifiedAt.toISOString(),
    }));

    connection.lastUsed = Date.now();
    res.json({
      success: true,
      files: fileList,
    });
  } catch (error) {
    console.error('[FTP] List failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to list files: ${error.message}`,
    });
  }
});

/**
 * POST /api/ftp/download
 * Download a file (returns file content or URL)
 */
app.post('/api/ftp/download', async (req, res) => {
  const { connectionId, remotePath } = req.body;

  if (!connectionId || !remotePath) {
    return res.status(400).json({
      success: false,
      message: 'Missing connectionId or remotePath',
    });
  }

  const connection = connections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found or expired',
    });
  }

  try {
    const client = connection.client;
    let fileContent = '';

    // Stream the file content
    await client.downloadTo(
      stream => {
        stream.on('data', chunk => {
          fileContent += chunk.toString('utf-8', 0, Math.min(chunk.length, 10000));
        });
      },
      remotePath
    );

    connection.lastUsed = Date.now();
    res.json({
      success: true,
      fileName: remotePath.split('/').pop(),
      content: fileContent.substring(0, 10000), // Limit to 10KB for preview
    });
  } catch (error) {
    console.error('[FTP] Download failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to download file: ${error.message}`,
    });
  }
});

/**
 * POST /api/ftp/upload
 * Upload a file
 */
app.post('/api/ftp/upload', async (req, res) => {
  const { connectionId, remotePath, fileContent } = req.body;

  if (!connectionId || !remotePath || !fileContent) {
    return res.status(400).json({
      success: false,
      message: 'Missing connectionId, remotePath, or fileContent',
    });
  }

  const connection = connections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found or expired',
    });
  }

  try {
    const client = connection.client;
    const buffer = Buffer.from(fileContent, 'utf-8');

    await client.uploadFrom(buffer, remotePath);

    connection.lastUsed = Date.now();
    res.json({
      success: true,
      message: 'File uploaded successfully',
      remotePath,
    });
  } catch (error) {
    console.error('[FTP] Upload failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to upload file: ${error.message}`,
    });
  }
});

/**
 * POST /api/ftp/delete
 * Delete a file or directory
 */
app.post('/api/ftp/delete', async (req, res) => {
  const { connectionId, remotePath } = req.body;

  if (!connectionId || !remotePath) {
    return res.status(400).json({
      success: false,
      message: 'Missing connectionId or remotePath',
    });
  }

  const connection = connections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found or expired',
    });
  }

  try {
    const client = connection.client;
    await client.remove(remotePath);

    connection.lastUsed = Date.now();
    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('[FTP] Delete failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to delete file: ${error.message}`,
    });
  }
});

/**
 * POST /api/ftp/disconnect
 * Close a connection
 */
app.post('/api/ftp/disconnect', async (req, res) => {
  const { connectionId } = req.body;

  if (!connectionId) {
    return res.status(400).json({
      success: false,
      message: 'Missing connectionId',
    });
  }

  const connection = connections.get(connectionId);
  if (connection) {
    connection.client.close();
    connections.delete(connectionId);
    console.log(`[FTP] Connection ${connectionId} closed`);
  }

  res.json({
    success: true,
    message: 'Disconnected successfully',
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FTP Proxy Server is running',
    connections: connections.size,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      FTP Proxy Server Running          ║
╠════════════════════════════════════════╣
║ Port:     http://localhost:${PORT}        ║
║ Health:   http://localhost:${PORT}/api/health ║
╚════════════════════════════════════════╝
  `);
});

// Cleanup connections on shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  connections.forEach((conn, id) => {
    conn.client.close();
  });
  connections.clear();
  process.exit(0);
});
