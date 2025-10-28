import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    IconButton,
    Surface,
    Text,
    TextInput,
    Title,
    useTheme,
} from 'react-native-paper';
import { signIn } from '../config/firebase';

export default function LoginScreenMaterial({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const number1 = Math.floor(Math.random() * 10) + 1;
    const number2 = Math.floor(Math.random() * 10) + 1;
    setNum1(number1);
    setNum2(number2);
    setCaptchaInput('');
  };

  const handleLogin = async () => {
    if (!email || !password || !captchaInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const correctAnswer = num1 + num2;
    const userAnswer = parseInt(captchaInput);
    if (userAnswer !== correctAnswer) {
      Alert.alert('Error', 'Incorrect captcha answer. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      console.log('Starting login process...');
      const user = await signIn(email, password);
      console.log('Login successful!');
      console.log('User ID:', user.uid);
    } catch (error) {
      console.error('Login error:', error.message);
      let errorMessage = 'Failed to login';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection';
          break;
        default:
          errorMessage = `Login failed: ${error.message}`;
      }

      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Welcome Back</Title>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Sign in to your account
          </Text>
        </View>

        {/* Login Form */}
        <Card style={styles.loginCard} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            <Divider style={styles.divider} />

            {/* Captcha Section */}
            <View style={styles.captchaSection}>
              <Text variant="titleSmall" style={styles.captchaLabel}>
                Security Check
              </Text>
              
              <Card style={styles.captchaCard} mode="outlined">
                <Card.Content style={styles.captchaContent}>
                  <Text variant="headlineSmall" style={styles.captchaText}>
                    {num1} + {num2} = ?
                  </Text>
                  <IconButton
                    icon="refresh"
                    size={20}
                    onPress={generateCaptcha}
                    style={styles.refreshButton}
                  />
                </Card.Content>
              </Card>

              <TextInput
                label="Enter the answer"
                value={captchaInput}
                onChangeText={setCaptchaInput}
                mode="outlined"
                keyboardType="numeric"
                maxLength={2}
                left={<TextInput.Icon icon="calculator" />}
                style={styles.input}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              disabled={loading}
            >
              Sign In
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Metro Manila Hills Hardware{'\n'}Inventory Management System
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  loginCard: {
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  captchaSection: {
    marginBottom: 24,
  },
  captchaLabel: {
    marginBottom: 12,
    textAlign: 'center',
  },
  captchaCard: {
    marginBottom: 16,
  },
  captchaContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  captchaText: {
    marginRight: 12,
  },
  refreshButton: {
    margin: 0,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
  },
});