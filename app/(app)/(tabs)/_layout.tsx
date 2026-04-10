import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Alert } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import * as authService from '@/services/authService';

export default function TabsLayout() {
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: '#8BA3C2',
      tabBarPosition: 'top' as const,
      tabBarStyle: {
        backgroundColor: '#1D3B5C',
        borderBottomWidth: 1,
        borderBottomColor: '#13263E',
        height: 64,
        elevation: 0,
        shadowOpacity: 0,
        paddingTop: 4,
      },
      tabBarLabelStyle: { 
        fontSize: 12, 
        fontWeight: '600' as const,
        marginBottom: 8,
      },
      tabBarIndicatorStyle: {
        backgroundColor: '#4BC0C8',
        height: 3,
        borderRadius: 3,
      },
      headerShown: false,
    }),
    []
  );

  async function handleSignOut() {
    await authService.signOut();
    useAuthStore.getState().signOutLocal();
    router.replace('/(auth)/login');
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pdv"
        options={{
          title: 'PDV',
          tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => <FontAwesome name="cube" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Crediário',
          tabBarIcon: ({ color }) => <FontAwesome name="money" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config.',
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Sair',
          tabBarIcon: ({ color }) => <FontAwesome name="sign-out" size={22} color={color} />,
          tabBarButton: ({ style, children }) => (
            <Pressable
              style={style as any}
              onPress={handleSignOut}
            >
              {children}
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
