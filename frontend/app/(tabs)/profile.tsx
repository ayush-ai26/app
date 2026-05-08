import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getUserHealthReports, getUserAppointments } from '../../services/api';

export default function Profile() {
  const { user, isAnonymous, logout, setAnonymous } = useAuthStore();
  const [anonymousMode, setAnonymousMode] = useState(isAnonymous);
  const [healthReports, setHealthReports] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (user && !isAnonymous) {
      loadUserData();
    }
  }, [user, isAnonymous]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const [reports, apts] = await Promise.all([
        getUserHealthReports(user.user_id),
        getUserAppointments(user.user_id),
      ]);
      setHealthReports(reports);
      setAppointments(apts);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleToggleAnonymous = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to use anonymous mode');
      return;
    }

    const newValue = !anonymousMode;
    setAnonymousMode(newValue);
    setAnonymous(newValue);
    
    Alert.alert(
      'Anonymous Mode',
      newValue 
        ? 'You are now in anonymous mode. Your consultations will not be linked to your profile.'
        : 'Anonymous mode disabled. Your consultations will be saved to your profile.',
      [{ text: 'OK' }]
    );
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
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (isAnonymous && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.anonymousView}>
          <Ionicons name="eye-off" size={80} color="#ccc" />
          <Text style={styles.anonymousTitle}>Anonymous Mode</Text>
          <Text style={styles.anonymousText}>
            You are currently using the app anonymously. Login to access your profile and health records.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {user && (
        <>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#0066cc" />
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="eye-off" size={24} color="#333" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Anonymous Mode</Text>
                  <Text style={styles.settingSubtitle}>
                    Hide your identity during consultations
                  </Text>
                </View>
              </View>
              <Switch
                value={anonymousMode}
                onValueChange={handleToggleAnonymous}
                trackColor={{ false: '#ccc', true: '#0066cc' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Reports ({healthReports.length})</Text>
            {healthReports.length > 0 ? (
              healthReports.slice(0, 3).map((report: any) => (
                <TouchableOpacity key={report.report_id} style={styles.reportCard}>
                  <View style={styles.reportIcon}>
                    <Ionicons name="document-text" size={24} color="#0066cc" />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>Health Report</Text>
                    <Text style={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: 
                        report.severity === 'high' ? '#ffebee' :
                        report.severity === 'medium' ? '#fff3e0' : '#e8f5e9'
                      }
                    ]}>
                      <Text style={[
                        styles.severityText,
                        { color:
                          report.severity === 'high' ? '#cc0000' :
                          report.severity === 'medium' ? '#ff9800' : '#00cc66'
                        }
                      ]}>
                        {report.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No health reports yet</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointments ({appointments.length})</Text>
            {appointments.length > 0 ? (
              appointments.slice(0, 3).map((apt: any) => (
                <View key={apt.appointment_id} style={styles.appointmentCard}>
                  <View style={styles.appointmentIcon}>
                    <Ionicons
                      name={apt.type === 'video' ? 'videocam' : 'chatbubbles'}
                      size={24}
                      color="#00cc66"
                    />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>
                      {apt.type === 'video' ? 'Video Consultation' : 'Chat Consultation'}
                    </Text>
                    <Text style={styles.appointmentDate}>
                      {new Date(apt.scheduled_time).toLocaleString()}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor:
                        apt.status === 'completed' ? '#e8f5e9' :
                        apt.status === 'ongoing' ? '#e3f2fd' :
                        apt.status === 'cancelled' ? '#ffebee' : '#fff3e0'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color:
                          apt.status === 'completed' ? '#00cc66' :
                          apt.status === 'ongoing' ? '#0066cc' :
                          apt.status === 'cancelled' ? '#cc0000' : '#ff9800'
                        }
                      ]}>
                        {apt.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No appointments yet</Text>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings" size={24} color="#666" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="help-circle" size={24} color="#666" />
          <Text style={styles.actionText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={24} color="#666" />
          <Text style={styles.actionText}>Privacy Policy</Text>
        </TouchableOpacity>
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#cc0000" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Medicare AI v1.0.0</Text>
        <Text style={styles.footerSubtext}>Your trusted health companion</Text>
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
    backgroundColor: '#0066cc',
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  actions: {
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  logoutText: {
    fontSize: 16,
    color: '#cc0000',
    fontWeight: '600',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  anonymousView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  anonymousTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  anonymousText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
