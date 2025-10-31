import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { IconSymbol } from '../../components/ui/IconSymbol';

import HomeScreen from '../screens/HomeScreenMaterial';
import InventoryScreen from '../screens/InventoryScreenMaterial';
import LoginScreen from '../screens/LoginScreenMaterial';
import ProfileScreen from '../screens/ProfileScreen';
import SalesDetails from '../screens/SalesDetails';
import SalesReport from '../screens/SalesReportMaterial';
import SettingsScreen from '../screens/SettingsScreenMaterial';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color }) => <IconSymbol name="chevron.right" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="SalesDetails"
          component={SalesDetails}
          options={{ title: 'Sales Details' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'User Profile' }}
        />
        <Stack.Screen
          name="SalesReport"
          component={SalesReport}
          options={{ title: 'Sales Report' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
