import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import ConnectionScreen from './src/screens/ConnectionScreen';
import FileManagerScreen from './src/screens/FileManagerScreen';
import TransfersScreen from './src/screens/TransfersScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ConnectionStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ConnectionList" 
        component={ConnectionScreen}
        options={{ title: 'FTP Connections' }}
      />
    </Stack.Navigator>
  );
}

function FileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="FileManager" 
        component={FileManagerScreen}
        options={{ title: 'File Manager' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'link' : 'link-outline';
            } else if (route.name === 'Files') {
              iconName = focused ? 'folder' : 'folder-outline';
            } else if (route.name === 'Transfers') {
              iconName = focused ? 'arrow-redo' : 'arrow-redo-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#f5f5f5',
            borderTopColor: '#ddd',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={ConnectionStack}
          options={{ title: 'Connections' }}
        />
        <Tab.Screen 
          name="Files" 
          component={FileStack}
          options={{ title: 'Files' }}
        />
        <Tab.Screen 
          name="Transfers" 
          component={TransfersScreen}
          options={{ title: 'Transfers' }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
