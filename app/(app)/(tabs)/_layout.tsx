import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';

export default function TabsLayout() {
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: '#5E8BF7',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarPosition: 'top' as const,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#EDF1F9',
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
        backgroundColor: '#5E8BF7',
        height: 3,
        borderRadius: 3,
      },
      headerShown: false,
    }),
    []
  );

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
    </Tabs>
  );
}
