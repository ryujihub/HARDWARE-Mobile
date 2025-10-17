import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signIn } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  // Generate captcha numbers on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const number1 = Math.floor(Math.random() * 10) + 1;
    const number2 = Math.floor(Math.random() * 10) + 1;
    setNum1(number1);
    setNum2(number2);
    setCaptchaText(`${number1} + ${number2}`);
    setCaptchaInput('');
  };

  const handleLogin = async () => {
    if (!email || !password || !captchaInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate captcha
    const correctAnswer = num1 + num2;
    const userAnswer = parseInt(captchaInput);
    if (userAnswer !== correctAnswer) {
      Alert.alert('Error', 'Incorrect captcha answer. Please try again.');
      generateCaptcha(); // Generate new captcha on failure
      return;
    }

    setLoading(true);
    try {
      console.log('Starting login process...');
      const user = await signIn(email, password);
      console.log('Login successful!');
      console.log('User ID:', user.uid);

      // The navigation will happen automatically due to auth state change
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Logging in...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      {/* Captcha Section */}
      <View style={styles.captchaContainer}>
        <Text style={styles.captchaLabel}>Solve this math problem:</Text>
        <View style={styles.captchaDisplay}>
          <Text style={styles.captchaText}>{captchaText} = ?</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={generateCaptcha}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter the answer"
          placeholderTextColor="#666666"
          value={captchaInput}
          onChangeText={setCaptchaInput}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    color: '#333333',
    fontSize: 16,
    fontFamily: 'System',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  captchaContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  captchaLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  captchaDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
  },
  captchaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
