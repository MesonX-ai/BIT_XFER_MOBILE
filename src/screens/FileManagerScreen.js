import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import FTPService from '../services/FTPService';

const FileManagerScreen = ({ route, navigation }) => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState(null);
  
  // Load connection when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadConnection = async () => {
        try {
          console.log('FileManagerScreen focused, checking for connection');
          console.log('Route params:', route?.params);
          
          // First check if connection is passed via route params
          if (route?.params?.connection) {
            console.log('✓ Connection from route params:', route.params.connection);
            setConnection(route.params.connection);
            // Save it as the active connection
            await AsyncStorage.setItem('activeConnection', JSON.stringify(route.params.connection));
          } else {
            // Otherwise try to load from AsyncStorage
            const saved = await AsyncStorage.getItem('activeConnection');
            if (saved) {
              console.log('✓ Connection from AsyncStorage:', saved);
              setConnection(JSON.parse(saved));
            } else {
              console.log('✗ No connection found');
            }
          }
        } catch (error) {
          console.error('Error loading connection:', error);
          Alert.alert('Error', 'Failed to load connection');
        }
      };
      
      loadConnection();
    }, [route?.params?.connection])
  );

  useEffect(() => {
    if (connection) {
      console.log('Loading remote files with connection:', connection.name);
      loadRemoteFiles();
    }
  }, [connection, currentPath]);

  const loadRemoteFiles = async () => {
    if (!connection) return;
    try {
      setLoading(true);
      const fileList = await FTPService.listFiles(connection, currentPath);
      setFiles(fileList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file) => {
    try {
      setLoading(true);
      // For web, just simulate the download
      if (typeof window !== 'undefined') {
        // Web platform
        console.log('Downloading file:', file.name);
        Alert.alert('Success', `Downloaded ${file.name}`);
      } else {
        // Native platform
        const localPath = `${FileSystem.documentDirectory}/${file.name}`;
        await FTPService.downloadFile(connection, `${currentPath}${file.name}`, localPath);
        Alert.alert('Success', `Downloaded ${file.name}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Download failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async () => {
    try {
      const result = Platform.OS === 'web' 
        ? null  // Web doesn't support DocumentPicker
        : await DocumentPicker.getDocumentAsync({
            type: '*/*',
          });
      
      if (result && !result.cancelled) {
        setLoading(true);
        await FTPService.uploadFile(
          connection,
          result.uri,
          `${currentPath}${result.name}`
        );
        Alert.alert('Success', 'File uploaded');
        loadRemoteFiles();
      } else if (Platform.OS === 'web') {
        Alert.alert('Info', 'File upload via web browser coming soon');
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateFolder = (folderName) => {
    const newPath = currentPath === '/' 
      ? `/${folderName}/` 
      : `${currentPath}${folderName}/`;
    setCurrentPath(newPath);
  };

  const navigateUp = () => {
    if (currentPath !== '/') {
      const parts = currentPath.split('/').filter(p => p);
      parts.pop();
      const newPath = parts.length ? `/${parts.join('/')}/` : '/';
      setCurrentPath(newPath);
    }
  };

  const renderFile = ({ item }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => {
        if (item.type === 'folder') {
          navigateFolder(item.name);
        } else {
          downloadFile(item);
        }
      }}
      onLongPress={() => {
        if (item.type !== 'folder') {
          Alert.alert(
            'File Options',
            item.name,
            [
              { text: 'Download', onPress: () => downloadFile(item) },
              { text: 'Delete', onPress: () => deleteFile(item) },
              { text: 'Cancel', onPress: () => {} },
            ]
          );
        }
      }}
    >
      <Ionicons
        name={item.type === 'folder' ? 'folder' : 'document'}
        size={28}
        color={item.type === 'folder' ? '#2196F3' : '#FF9800'}
      />
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileSize}>
          {item.type === 'folder' ? 'Folder' : `${(item.size / 1024).toFixed(2)} KB`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const deleteFile = async (file) => {
    Alert.alert('Delete', `Are you sure you want to delete ${file.name}?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setLoading(true);
            await FTPService.deleteFile(connection, `${currentPath}${file.name}`);
            loadRemoteFiles();
          } catch (error) {
            Alert.alert('Error', 'Delete failed: ' + error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (!connection) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.noConnectionText}>No Connection Selected</Text>
          <Text style={styles.noConnectionSubtext}>Go to the Connections tab and click Connect on an FTP server</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.selectButtonText}>Go to Connections</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateUp}
          disabled={currentPath === '/'}
        >
          <Ionicons name="arrow-back" size={24} color={currentPath === '/' ? '#ccc' : '#2196F3'} />
        </TouchableOpacity>
        <Text style={styles.pathText} numberOfLines={1}>
          {connection.name} - {currentPath}
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />}

      <FlatList
        data={files}
        renderItem={renderFile}
        keyExtractor={item => `${item.name}-${item.type}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No files</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={uploadFile}
      >
        <Ionicons name="cloud-upload" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 8,
  },
  pathText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  noConnectionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  noConnectionSubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  selectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FileManagerScreen;
