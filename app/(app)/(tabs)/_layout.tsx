import { Tabs } from 'expo-router';
import React from 'react';
import { BookOpen, Compass, Home, SmilePlus, User } from 'lucide-react-native';
import { Colors } from '../../../src/constants/theme';
import { useTranslation } from '../../../src/i18n/useTranslation';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: '#F0F0F0',
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => <Home size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: t.tabs.mood,
          tabBarIcon: ({ color, size }) => <SmilePlus size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t.tabs.journal,
          tabBarIcon: ({ color, size }) => <BookOpen size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t.tabs.discover,
          tabBarIcon: ({ color, size }) => <Compass size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, size }) => <User size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
