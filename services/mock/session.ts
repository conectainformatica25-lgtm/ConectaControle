import AsyncStorage from '@react-native-async-storage/async-storage';

const UID_KEY = 'conectacontrole_mock_uid';

export async function persistMockUserId(userId: string) {
  await AsyncStorage.setItem(UID_KEY, userId);
}

export async function getPersistedMockUserId(): Promise<string | null> {
  return AsyncStorage.getItem(UID_KEY);
}

export async function clearMockUserId() {
  await AsyncStorage.removeItem(UID_KEY);
}
