import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

export default function Home() {
  const { user, isAnonymous } = useAuthStore();

  const quickActions = [
    {
      icon: 'chatbubbles',
      title: 'AI Symptom Check',
      subtitle: 'Talk to our AI assistant',
      color: '#0066cc',
      route: '/(tabs)/chatbot',
    },
    {
      icon: 'medical',
      title: 'Find Doctors',
      subtitle: 'Book consultation',
      color: '#00cc66',
      route: '/(tabs)/doctors',
    },
    {
      icon: 'alert-circle',
      title: 'Emergency',
      subtitle: 'Get immediate help',
      color: '#cc0000',
      route: '/(tabs)/emergency',
    },
    {
      icon: 'document-text',
      title: 'Health Reports',
      subtitle: 'View your reports',
      color: '#6600cc',
      route: '/(tabs)/profile',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {isAnonymous ? 'Hello, Guest' : `Hello, ${user?.name || 'User'}`}
          </Text>
          <Text style={styles.subtitle}>How can we help you today?</Text>
        </View>
        {isAnonymous && (
          <View style={styles.anonymousBadge}>
            <Ionicons name="eye-off" size={16} color="#fff" />
            <Text style={styles.anonymousText}>Anonymous</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { borderLeftColor: action.color }]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={32} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Remember to stay hydrated and maintain a balanced diet for better health.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🏃</Text>
          <Text style={styles.tipText}>
            Regular exercise for at least 30 minutes a day can improve your overall well-being.
          </Text>
        </View>
      </View>

      <View style={styles.emergencyInfo}>
        <Ionicons name="information-circle" size={24} color="#cc0000" />
        <Text style={styles.emergencyText}>
          In case of a medical emergency, call your local emergency services or use our Emergency feature.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  header: {
    padding: 24,
    backgroundColor: '#0066cc',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  anonymousText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  infoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emergencyInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
    alignItems: 'center',
    gap: 12,
  },
  emergencyText: {
    flex: 1,
    fontSize: 13,
    color: '#cc0000',
    lineHeight: 18,
  },
});
