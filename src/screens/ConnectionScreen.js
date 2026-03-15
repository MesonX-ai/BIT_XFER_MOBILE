import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FTPService from '../services/FTPService';

const ConnectionScreen = ({ navigation }) => {
  const [connections, setConnections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSSL, setIsSSL] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '21',
    username: '',
    password: '',
    privateKey: '',
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('ftpConnections');
      if (stored) {
        setConnections(JSON.parse(stored));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async () => {
    console.log('=== saveConnection called ===');
    console.log('formData:', formData);
    console.log('isSSL:', isSSL);
    
    // Check which fields are missing
    const missingFields = [];
    if (!formData.name || formData.name.trim() === '') missingFields.push('Name');
    if (!formData.host || formData.host.trim() === '') missingFields.push('Host');
    if (!formData.username || formData.username.trim() === '') missingFields.push('Username');
    
    if (missingFields.length > 0) {
      const errorMsg = `Please fill in these required fields: ${missingFields.join(', ')}`;
      console.log('Validation failed:', errorMsg);
      Alert.alert('Missing Fields', errorMsg);
      return;
    }

    try {
      const newConnection = {
        id: Date.now().toString(),
        ...formData,
        isSSL,
        port: parseInt(formData.port),
      };

      console.log('newConnection:', newConnection);

      const updated = [...connections, newConnection];
      console.log('Saving to AsyncStorage:', updated);
      
      await AsyncStorage.setItem('ftpConnections', JSON.stringify(updated));
      
      console.log('AsyncStorage save successful');
      
      setConnections(updated);
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Connection saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save connection: ' + error.message);
    }
  };

  const testConnection = async (connection) => {
    console.log('=== ConnectionScreen.testConnection called ===');
    console.log('Connection object being tested:', connection);
    try {
      setLoading(true);
      console.log('Starting FTPService.testConnection...');
      const result = await FTPService.testConnection(connection);
      console.log('FTPService.testConnection result:', result);
      if (result.success) {
        Alert.alert('Success', 'Connection successful!');
      } else {
        Alert.alert('Error', result.message || 'Connection failed');
      }
    } catch (error) {
      console.error('testConnection error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = (id) => {
    Alert.alert(
      'Delete Connection',
      'Are you sure?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            const updated = connections.filter(c => c.id !== id);
            await AsyncStorage.setItem('ftpConnections', JSON.stringify(updated));
            setConnections(updated);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '21',
      username: '',
      password: '',
      privateKey: '',
    });
    setIsSSL(false);
  };

  const renderConnection = ({ item }) => (
    <View style={styles.connectionCard}>
      <View style={styles.connectionHeader}>
        <Ionicons name={item.isSSL ? 'lock-closed' : 'link'} size={24} color="#2196F3" />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.name}</Text>
          <Text style={styles.connectionDetails}>
            {item.username}@{item.host}:{item.port}
          </Text>
        </View>
      </View>
      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={() => testConnection(item)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={async () => {
            // Save connection to AsyncStorage and navigate to file manager
            try {
              console.log('Connect button pressed for connection:', item);
              await AsyncStorage.setItem('activeConnection', JSON.stringify(item));
              console.log('Saved activeConnection to AsyncStorage');
              // Navigate to Files tab
              navigation.navigate('Files', { connection: item });
              console.log('Navigated to Files tab');
            } catch (error) {
              console.error('Error connecting:', error);
              Alert.alert('Error', 'Failed to connect: ' + error.message);
            }
          }}
        >
          <Ionicons name="folder-open" size={20} color="#fff" />
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteConnection(item.id)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#2196F3" />}
      
      <FlatList
        data={connections}
        renderItem={renderConnection}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No connections yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a new FTP connection</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New FTP Connection</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#2196F3" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Connection Name"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Host"
              value={formData.host}
              onChangeText={text => setFormData({ ...formData, host: text })}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Port"
                value={formData.port}
                onChangeText={text => setFormData({ ...formData, port: text })}
                keyboardType="number-pad"
              />
              <View style={styles.sslToggle}>
                <Text style={styles.sslLabel}>SSL/TLS</Text>
                <Switch
                  value={isSSL}
                  onValueChange={setIsSSL}
                  color="#2196F3"
                />
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={formData.username}
              onChangeText={text => setFormData({ ...formData, username: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={text => setFormData({ ...formData, password: text })}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveConnection}
            >
              <Text style={styles.saveButtonText}>Save Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  connectionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {},
      web: {},
    }),
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  connectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: '#2196F3',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    width: 44,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {},
      web: {},
    }),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sslToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  sslLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConnectionScreen;
