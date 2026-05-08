import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDoctors, createAppointment, type Doctor } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Doctors() {
  const { user, isAnonymous } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | undefined>();

  const specializations = [
    { name: 'All', value: undefined },
    { name: 'General', value: 'General Medicine' },
    { name: 'Cardiology', value: 'Cardiology' },
    { name: 'Pediatrics', value: 'Pediatrics' },
    { name: 'Dermatology', value: 'Dermatology' },
  ];

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialization]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const data = await getDoctors(selectedSpecialization);
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async (doctor: Doctor, type: 'chat' | 'video') => {
    if (isAnonymous) {
      Alert.alert(
        'Login Required',
        'Please login to book an appointment with a doctor.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    try {
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduledTime.getHours() + 1);

      await createAppointment({
        user_id: user.user_id,
        doctor_id: doctor.doctor_id,
        type,
        status: 'scheduled',
        scheduled_time: scheduledTime.toISOString(),
      } as any);

      Alert.alert(
        'Success',
        `Your ${type} consultation with ${doctor.name} has been scheduled!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {specializations.map((spec) => (
          <TouchableOpacity
            key={spec.name}
            style={[
              styles.filterChip,
              selectedSpecialization === spec.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecialization(spec.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSpecialization === spec.value && styles.filterTextActive,
              ]}
            >
              {spec.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <ScrollView style={styles.doctorsList}>
          {doctors.map((doctor) => (
            <View key={doctor.doctor_id} style={styles.doctorCard}>
              <View style={styles.doctorHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color="#0066cc" />
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.specialization}>{doctor.specialization}</Text>
                  <Text style={styles.qualification}>{doctor.qualification}</Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.statText}>{doctor.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="briefcase" size={16} color="#666" />
                  <Text style={styles.statText}>{doctor.experience_years} years</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="cash" size={16} color="#666" />
                  <Text style={styles.statText}>${doctor.consultation_fee}</Text>
                </View>
              </View>

              <View style={styles.slotsContainer}>
                <Text style={styles.slotsTitle}>Available Slots:</Text>
                <View style={styles.slots}>
                  {doctor.available_slots.slice(0, 3).map((slot, idx) => (
                    <View key={idx} style={styles.slotChip}>
                      <Text style={styles.slotText}>{slot}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.chatButton]}
                  onPress={() => handleBookAppointment(doctor, 'chat')}
                >
                  <Ionicons name="chatbubbles" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.videoButton]}
                  onPress={() => handleBookAppointment(doctor, 'video')}
                >
                  <Ionicons name="videocam" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Video Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    padding: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#0066cc',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  doctorsList: {
    flex: 1,
    padding: 16,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 2,
  },
  qualification: {
    fontSize: 13,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  slotsContainer: {
    marginBottom: 16,
  },
  slotsTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  slots: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  slotText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#00cc66',
  },
  videoButton: {
    backgroundColor: '#0066cc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
