import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    List,
    Portal,
    Surface,
    Switch,
    Text,
    TextInput,
    Title,
    useTheme
} from 'react-native-paper';
import HelpModalMaterial from '../components/HelpModalMaterial';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import { auth, db } from '../config/firebase';

export default function SettingsScreenMaterial({ navigation }) {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    currency: '₱',
    refreshInterval: '1',
    notifications: true,
    darkMode: false,
    autoBackup: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      const settingsRef = db.collection('settings').doc(user.uid);
      const doc = await settingsRef.get();

      if (doc.exists) {
        setSettings({ ...settings, ...doc.data() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      const settingsRef = db.collection('settings').doc(user.uid);
      await settingsRef.set(settings, { merge: true });

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => auth.signOut()
        },
      ]
    );
  };

  if (loading) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>App Settings</Title>
            <Divider style={styles.divider} />
            
            <TextInput
              label="Currency Symbol"
              value={settings.currency}
              onChangeText={(text) => setSettings({ ...settings, currency: text })}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="currency-usd" />}
            />

            <TextInput
              label="Refresh Interval (minutes)"
              value={settings.refreshInterval}
              onChangeText={(text) => setSettings({ ...settings, refreshInterval: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Icon icon="refresh" />}
            />

            <List.Item
              title="Enable Notifications"
              description="Receive alerts for low stock and updates"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => setSettings({ ...settings, notifications: value })}
                />
              )}
            />

            <List.Item
              title="Auto Backup"
              description="Automatically backup data to cloud"
              left={props => <List.Icon {...props} icon="cloud-upload" />}
              right={() => (
                <Switch
                  value={settings.autoBackup}
                  onValueChange={(value) => setSettings({ ...settings, autoBackup: value })}
                />
              )}
            />
          </Card.Content>
        </Card>



        {/* About */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>About</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />

            <List.Item
              title="Help & Support"
              description="Get help with using the app"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowHelpModal(true)}
            />

            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowPrivacyModal(true)}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={saveSettings}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
          >
            Save Settings
          </Button>

          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.error}
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Help Modal */}
      <Portal>
        <HelpModalMaterial visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
      </Portal>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  logoutButton: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});