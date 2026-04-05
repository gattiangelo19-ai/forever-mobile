import { Platform } from 'react-native';

// expo-secure-store non funziona sul web — usa localStorage come fallback
const getItem = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
};

const setItem = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.setItemAsync(key, value);
};

const deleteItem = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.deleteItemAsync(key);
};

export default { getItem, setItem, deleteItem };
