import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function Index() {
  const { isAuthenticated, isAnonymous } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated || isAnonymous) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isAnonymous]);

  const handleGoogleLogin = async () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try {
      let redirectUrl: string;
      if (Platform.OS === 'web') {
        redirectUrl = `${window.location.origin}/(tabs)/home`;
      } else {
        redirectUrl = Linking.createURL('/(tabs)/home');
      }
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      await WebBrowser.openBrowserAsync(authUrl);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleAnonymousMode = () => {
    useAuthStore.getState().setAnonymous(true);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>+</Text>
        </View>
        <Text style={styles.title}>Medicare AI</Text>
        <Text style={styles.subtitle}>Your Personal Health Assistant</Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#e6f2ff' }]}>
            <Text style={styles.featureIcon}>{'💬'}</Text>
          </View>
          <Text style={styles.featureText}>AI Symptom Checker</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.featureIcon}>{'🩺'}</Text>
          </View>
          <Text style={styles.featureText}>Expert Doctors</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.featureIcon}>{'🚨'}</Text>
          </View>
          <Text style={styles.featureText}>Emergency Help</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#f3e5f5' }]}>
            <Text style={styles.featureIcon}>{'🔒'}</Text>
          </View>
          <Text style={styles.featureText}>Anonymous Mode</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          testID="google-login-btn"
          style={[styles.button, styles.primaryButton]}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="anonymous-mode-btn"
          style={[styles.button, styles.secondaryButton]}
          onPress={handleAnonymousMode}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Continue Anonymously
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 32,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    marginBottom: 32,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#0066cc',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
