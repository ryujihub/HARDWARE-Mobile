import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { auth } from './src/config/firebase';
import { lightTheme } from './src/theme/theme';

// Import screens
import HomeScreenMaterial from './src/screens/HomeScreenMaterial';
import InventoryScreenMaterial from './src/screens/InventoryScreenMaterial';
import LoginScreenMaterial from './src/screens/LoginScreenMaterial';
import SalesReportMaterial from './src/screens/SalesReportMaterial';
import SettingsScreenMaterial from './src/screens/SettingsScreenMaterial';


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
    <PaperProvider theme={lightTheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: lightTheme.colors.primary,
            },
            headerTintColor: lightTheme.colors.onPrimary,
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
                component={HomeScreenMaterial}
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
                component={InventoryScreenMaterial}
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
                component={SalesReportMaterial}
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
                component={SettingsScreenMaterial}
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
              <Stack.Screen name="Login" component={LoginScreenMaterial} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
