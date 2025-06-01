import { Tabs } from 'expo-router';
import React from 'react';
import { Home, CreditCard, TrendingUp, Settings, Bell } from 'lucide-react-native';
import TabBarIcon from '@/components/navigation/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#C6C6C8',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={CreditCard} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={TrendingUp} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Bell} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
          name="nfc-cards"
          options={{
            title: 'NFC Cards',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'credit-card' : 'credit-card-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="qr-transactions"
          options={{
            title: 'QR Codes',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'qr-code' : 'qr-code-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}