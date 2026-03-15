import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransfersScreen = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = setInterval(() => {
      loadTransfers();
    }, 1000);
    return () => clearInterval(unsubscribe);
  }, []);

  const loadTransfers = async () => {
    try {
      const stored = await AsyncStorage.getItem('transfers');
      if (stored) {
        setTransfers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load transfers:', error);
    }
  };

  const cancelTransfer = async (id) => {
    const updated = transfers.filter(t => t.id !== id);
    await AsyncStorage.setItem('transfers', JSON.stringify(updated));
    setTransfers(updated);
  };

  const clearCompleted = async () => {
    const active = transfers.filter(t => t.status !== 'completed');
    await AsyncStorage.setItem('transfers', JSON.stringify(active));
    setTransfers(active);
  };

  const renderTransfer = ({ item }) => (
    <View style={styles.transferCard}>
      <View style={styles.transferHeader}>
        <Ionicons
          name={item.type === 'download' ? 'download' : 'upload'}
          size={24}
          color={item.type === 'download' ? '#4CAF50' : '#FF9800'}
        />
        <View style={styles.transferInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.fileName}
          </Text>
          <Text style={styles.transferSize}>
            {item.transferred} / {item.total}
          </Text>
        </View>
        <Text style={[
          styles.status,
          {
            color: item.status === 'completed' ? '#4CAF50' 
              : item.status === 'error' ? '#f44336' 
              : '#2196F3'
          }
        ]}>
          {item.status}
        </Text>
      </View>

      {item.status === 'transferring' && (
        <>
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(item.progress * 100)}%
          </Text>
        </>
      )}

      {item.status === 'transferring' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelTransfer(item.id)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Active Transfers</Text>
        {transfers.some(t => t.status === 'completed') && (
          <TouchableOpacity onPress={clearCompleted}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={transfers}
        renderItem={renderTransfer}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transfers</Text>
            <Text style={styles.emptySubtext}>Files will appear here when you transfer them</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  transferCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  transferInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transferSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  progress: {
    marginVertical: 8,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#2196F3',
    textAlign: 'right',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cancelText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 12,
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
});

export default TransfersScreen;
