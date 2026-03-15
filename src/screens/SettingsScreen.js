import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    autoConnect: false,
    showHiddenFiles: false,
    confirmDelete: true,
    usePassiveMode: true,
    enableSSL: true,
    theme: 'light',
  });
  const [appVersion] = useState('1.0.0');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('appSettings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await AsyncStorage.setItem('appSettings', JSON.stringify(updated));
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all connections and settings. This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'ftpConnections',
                'transfers',
                'appSettings',
              ]);
              Alert.alert('Success', 'All data cleared');
              loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const SettingRow = ({ label, value, onPress, onValueChange, isSwitch }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <Text style={styles.settingTitle}>{label}</Text>
        {value && !isSwitch && (
          <Text style={styles.settingValue}>{value}</Text>
        )}
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          color="#2196F3"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Connection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <SettingRow
          label="Enable SSL/TLS"
          value={settings.enableSSL}
          onValueChange={(val) => updateSetting('enableSSL', val)}
          isSwitch
        />
        <SettingRow
          label="Use Passive Mode"
          value={settings.usePassiveMode}
          onValueChange={(val) => updateSetting('usePassiveMode', val)}
          isSwitch
        />
        <SettingRow
          label="Auto Connect"
          value={settings.autoConnect}
          onValueChange={(val) => updateSetting('autoConnect', val)}
          isSwitch
        />
      </View>

      {/* File Manager Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>File Manager</Text>
        <SettingRow
          label="Show Hidden Files"
          value={settings.showHiddenFiles}
          onValueChange={(val) => updateSetting('showHiddenFiles', val)}
          isSwitch
        />
        <SettingRow
          label="Confirm Before Delete"
          value={settings.confirmDelete}
          onValueChange={(val) => updateSetting('confirmDelete', val)}
          isSwitch
        />
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingValue}>Light</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>App Version</Text>
            <Text style={styles.settingValue}>{appVersion}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.linkText}>Check for Updates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={clearAllData}
        >
          <Ionicons name="trash" size={20} color="#f44336" />
          <Text style={styles.dangerText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BitXfer Mobile {appVersion}
        </Text>
        <Text style={styles.footerSubtext}>
          © 2026 Mesonsoft LLC
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingLabel: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingValue: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  linkText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dangerText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default SettingsScreen;
