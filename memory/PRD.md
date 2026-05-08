# Medicare AI - Product Requirements Document (PRD)

## Overview
Medicare AI is a mobile healthcare application that helps users understand symptoms safely and connect with doctors. It uses AI-powered symptom checking, emergency detection, and doctor consultation features.

## Tech Stack
- **Frontend**: Expo (React Native) with Expo Router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Emergent LLM Key (GPT-4o model)
- **Auth**: Emergent Google OAuth + Anonymous mode
- **State Management**: Zustand with AsyncStorage

## Core Features

### 1. AI Chatbot for Symptom Checking
- Real-time AI-powered symptom analysis
- Conversational interface with history
- Severity detection (low/medium/high/critical)
- Recommendations and follow-up questions

### 2. Emergency Detection & Alert System
- **Manual SOS**: User presses emergency button and describes situation
- **Automatic Detection**: AI chatbot flags critical symptoms (chest pain, breathing difficulty, etc.)
- Emergency contacts with quick-dial (911, Poison Control, Mental Health)
- Alert tracking with active/resolved status

### 3. Doctor Consultation
- 4 specializations: General Medicine, Cardiology, Pediatrics, Dermatology
- Doctor profiles with ratings, experience, fees, and available slots
- Chat and video consultation booking
- Appointment management (scheduled/ongoing/completed/cancelled)

### 4. Health Report Generation
- AI-generated reports from chat conversations
- Includes symptoms, analysis, recommendations, severity
- Report history accessible from profile

### 5. Anonymous Privacy Mode
- **No-login anonymous access**: Use AI chatbot without creating account
- **Logged-in anonymous toggle**: Registered users can enable anonymous mode for sensitive consultations
- Conversations not linked to profile when anonymous

## Pages/Screens
1. **Welcome Screen** - Login with Google OAuth or Continue Anonymously
2. **Home Dashboard** - Quick actions, health tips, anonymous badge
3. **AI Chatbot** - Chat interface with emergency banner
4. **Doctors** - Doctor listing with specialization filter
5. **Emergency** - Emergency contacts, critical symptoms, alert form
6. **Profile** - User info, anonymous toggle, reports, appointments

## API Endpoints
- `POST /api/chat` - AI symptom checker
- `GET /api/conversations/{user_id}` - User conversations
- `GET /api/doctors` - Doctor listing with optional filter
- `POST /api/appointment` - Book consultation
- `POST /api/emergency/alert` - Create emergency alert
- `POST /api/health-report` - Generate health report
- `GET /api/health-reports/{user_id}` - User reports

## Future Enhancements
- Agora video calling integration for live consultations
- Push notifications for appointment reminders
- Health data tracking (vitals, medications)
- Prescription management
- Multi-language support
- Wearable device integration
