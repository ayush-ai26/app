import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Message {
  message_id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  conversation_id?: string;
  message: string;
  user_id?: string;
  is_anonymous: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  message: Message;
  severity_detected?: string;
  emergency_alert: boolean;
}

export interface Doctor {
  doctor_id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  rating: number;
  consultation_fee: number;
  available_slots: string[];
  profile_picture?: string;
  is_available: boolean;
}

export interface Appointment {
  appointment_id: string;
  user_id: string;
  doctor_id: string;
  type: string;
  status: string;
  scheduled_time: string;
  channel_name?: string;
  created_at: string;
}

export interface EmergencyRequest {
  user_id?: string;
  symptoms: string[];
  location?: string;
  type: string;
}

// Chat API
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', request);
  return response.data;
};

export const getConversations = async (userId: string) => {
  const response = await api.get(`/conversations/${userId}`);
  return response.data;
};

export const getConversation = async (conversationId: string) => {
  const response = await api.get(`/conversation/${conversationId}`);
  return response.data;
};

// Doctor API
export const getDoctors = async (specialization?: string) => {
  const response = await api.get<Doctor[]>('/doctors', {
    params: { specialization },
  });
  return response.data;
};

export const getDoctor = async (doctorId: string) => {
  const response = await api.get<Doctor>(`/doctor/${doctorId}`);
  return response.data;
};

// Appointment API
export const createAppointment = async (appointment: Partial<Appointment>) => {
  const response = await api.post<Appointment>('/appointment', appointment);
  return response.data;
};

export const getUserAppointments = async (userId: string) => {
  const response = await api.get<Appointment[]>(`/appointments/${userId}`);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const response = await api.put(`/appointment/${appointmentId}/status`, null, {
    params: { status },
  });
  return response.data;
};

// Emergency API
export const createEmergencyAlert = async (request: EmergencyRequest) => {
  const response = await api.post('/emergency/alert', request);
  return response.data;
};

// Health Report API
export const generateHealthReport = async (conversationId: string) => {
  const response = await api.post('/health-report', null, {
    params: { conversation_id: conversationId },
  });
  return response.data;
};

export const getUserHealthReports = async (userId: string) => {
  const response = await api.get(`/health-reports/${userId}`);
  return response.data;
};

export default api;
