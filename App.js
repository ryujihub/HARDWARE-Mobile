import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { auth, onAuthStateChanged } from './src/config/firebase';

// Import screens
import HomeScreen from './src/screens/HomeScreenMaterial';
import InventoryScreen from './src/screens/InventoryScreenMaterial';
import LoginScreen from './src/screens/LoginScreenMaterial';
import SalesReport from './src/screens/SalesReportMaterial';
import SettingsScreen from './src/screens/SettingsScreenMaterial';


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(user => {
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
    <PaperProvider>
    <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
              headerStyle: {
              backgroundColor: '#2196F3',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
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
                options={({ navigation }) => ({
                  title: 'Stock Monitoring',
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={{ marginLeft: 15 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text>
                    </TouchableOpacity>
                  ),
                })}
              />

              <Stack.Screen
                name="SalesReport"
                component={SalesReport}
                options={({ navigation }) => ({
                  title: 'Sales Analytics',
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={{ marginLeft: 15 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text>
                    </TouchableOpacity>
                  ),
                })}
              />

              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={({ navigation }) => ({
                  title: 'Settings',
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={{ marginLeft: 15 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text>
                    </TouchableOpacity>
                  ),
                })}
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
    </PaperProvider>
  );
}
