import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createEmergencyAlert } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Emergency() {
  const { user } = useAuthStore();
  const [symptoms, setSymptoms] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const emergencyNumbers = [
    { name: 'Emergency Services', number: '911', icon: 'call' },
    { name: 'Poison Control', number: '1-800-222-1222', icon: 'flask' },
    { name: 'Mental Health Crisis', number: '988', icon: 'heart' },
  ];

  const criticalSymptoms = [
    { text: 'Chest Pain', icon: 'heart-outline' },
    { text: 'Difficulty Breathing', icon: 'body-outline' },
    { text: 'Severe Bleeding', icon: 'water-outline' },
    { text: 'Severe Head Injury', icon: 'body-outline' },
    { text: 'Stroke Symptoms', icon: 'pulse-outline' },
    { text: 'Severe Allergic Reaction', icon: 'warning-outline' },
  ];

  const handleEmergencyCall = (number: string) => {
    Alert.alert(
      'Call Emergency Services',
      `Do you want to call ${number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${number}`),
        },
      ]
    );
  };

  const handleSendAlert = async () => {
    if (!symptoms.trim()) {
      Alert.alert('Error', 'Please describe your emergency');
      return;
    }

    try {
      await createEmergencyAlert({
        user_id: user?.user_id,
        symptoms: [symptoms],
        type: 'manual',
      });

      setAlertSent(true);
      Alert.alert(
        'Alert Sent',
        'Emergency alert has been sent to your emergency contacts and our medical team.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please call emergency services directly.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={40} color="#fff" />
        <Text style={styles.warningTitle}>Emergency Services</Text>
        <Text style={styles.warningText}>
          If you are experiencing a life-threatening emergency, call 911 immediately.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Emergency Contacts</Text>
        {emergencyNumbers.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emergencyCard}
            onPress={() => handleEmergencyCall(contact.number)}
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name={contact.icon as any} size={28} color="#cc0000" />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyName}>{contact.name}</Text>
              <Text style={styles.emergencyNumber}>{contact.number}</Text>
            </View>
            <Ionicons name="call" size={24} color="#cc0000" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Critical Symptoms</Text>
        <Text style={styles.sectionSubtitle}>
          Call 911 immediately if experiencing:
        </Text>
        <View style={styles.symptomsGrid}>
          {criticalSymptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomCard}>
              <Ionicons name={symptom.icon as any} size={24} color="#cc0000" />
              <Text style={styles.symptomText}>{symptom.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Emergency Alert</Text>
        <Text style={styles.sectionSubtitle}>
          Alert your emergency contacts and our medical team
        </Text>
        <View style={styles.alertForm}>
          <TextInput
            style={styles.input}
            placeholder="Describe your emergency..."
            placeholderTextColor="#999"
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.alertButton, alertSent && styles.alertButtonSent]}
            onPress={handleSendAlert}
            disabled={alertSent}
          >
            <Ionicons
              name={alertSent ? 'checkmark-circle' : 'send'}
              size={24}
              color="#fff"
            />
            <Text style={styles.alertButtonText}>
              {alertSent ? 'Alert Sent' : 'Send Emergency Alert'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={24} color="#0066cc" />
        <Text style={styles.infoText}>
          Our AI chatbot can also detect critical symptoms during conversations and automatically alert emergency services if needed.
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
  warningBanner: {
    backgroundColor: '#cc0000',
    padding: 24,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emergencyNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#cc0000',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffebee',
  },
  symptomText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  alertForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    marginBottom: 16,
    minHeight: 100,
  },
  alertButton: {
    backgroundColor: '#cc0000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  alertButtonSent: {
    backgroundColor: '#00cc66',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#e6f2ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0066cc',
    lineHeight: 18,
  },
});
