import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { auth } from './src/config/firebase';

// Import screens
import InventoryIcon from './assets/images/inventory-icon.png';
import HomeScreen from './src/screens/HomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import SalesReport from './src/screens/SalesReport';
import SettingsScreen from './src/screens/SettingsScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'Dashboard',
                headerRight: () => (
                  <TouchableOpacity onPress={() => auth.signOut()} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
                  </TouchableOpacity>
                ),
              }}
            />
            <Stack.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{
                title: 'Inventory Management',
                headerLeft: () => (
                  <Image source={InventoryIcon} style={{ width: 24, height: 24, marginLeft: 15, tintColor: '#fff' }} />
                ),
              }}
            />

            <Stack.Screen
              name="SalesReport"
              component={SalesReport}
              options={{
                title: 'Sales Report',
              }}
            />

            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
              }}
            />
          </>
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
