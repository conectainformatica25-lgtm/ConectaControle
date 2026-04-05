import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'conectacontrole_jwt';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
