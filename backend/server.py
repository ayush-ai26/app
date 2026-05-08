from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Medicare AI Backend", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    emergency_contacts: List[dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    conversation_id: str = Field(default_factory=lambda: f"conv_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None  # None for anonymous
    is_anonymous: bool = False
    messages: List[Message] = Field(default_factory=list)
    symptoms: List[str] = Field(default_factory=list)
    severity_level: Optional[str] = None  # "low", "medium", "high", "critical"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Doctor(BaseModel):
    doctor_id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    name: str
    specialization: str
    qualification: str
    experience_years: int
    rating: float = 4.5
    consultation_fee: float
    available_slots: List[str] = Field(default_factory=list)
    profile_picture: Optional[str] = None
    is_available: bool = True

class Appointment(BaseModel):
    appointment_id: str = Field(default_factory=lambda: f"apt_{uuid.uuid4().hex[:12]}")
    user_id: str
    doctor_id: str
    type: str  # "chat" or "video"
    status: str  # "scheduled", "ongoing", "completed", "cancelled"
    scheduled_time: datetime
    channel_name: Optional[str] = None  # For video calls
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthReport(BaseModel):
    report_id: str = Field(default_factory=lambda: f"report_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    conversation_id: str
    symptoms: List[str]
    ai_analysis: str
    recommendations: List[str]
    severity: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyAlert(BaseModel):
    alert_id: str = Field(default_factory=lambda: f"alert_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    type: str  # "manual" or "automatic"
    symptoms: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    status: str = "active"  # "active", "resolved"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= REQUEST/RESPONSE MODELS =============

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    user_id: Optional[str] = None
    is_anonymous: bool = False

class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    severity_detected: Optional[str] = None
    emergency_alert: bool = False

class EmergencyRequest(BaseModel):
    user_id: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    type: str = "manual"

# ============= AI CHATBOT ROUTES =============

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """AI-powered symptom checker chatbot"""
    try:
        # Get or create conversation
        if request.conversation_id:
            conv_doc = await db.conversations.find_one(
                {"conversation_id": request.conversation_id},
                {"_id": 0}
            )
            if not conv_doc:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation = Conversation(**conv_doc)
        else:
            conversation = Conversation(
                user_id=request.user_id,
                is_anonymous=request.is_anonymous
            )
        
        # Create user message
        user_msg = Message(role="user", content=request.message)
        conversation.messages.append(user_msg)
        
        # Build conversation history for AI
        history_text = "\n".join([
            f"{msg.role}: {msg.content}" 
            for msg in conversation.messages[-5:]  # Last 5 messages for context
        ])
        
        # Initialize AI chat with medical context
        ai_chat = LlmChat(
            api_key=os.getenv("EMERGENT_LLM_KEY"),
            session_id=conversation.conversation_id,
            system_message="""You are a helpful medical AI assistant for Medicare AI app. 
Your role is to:
1. Listen to patient symptoms with empathy
2. Ask relevant follow-up questions to understand the condition better
3. Provide general health guidance (always remind that this is not a substitute for professional medical advice)
4. Identify severity levels: low, medium, high, or critical
5. For critical symptoms (chest pain, difficulty breathing, severe bleeding, stroke symptoms), immediately flag as EMERGENCY
6. Recommend seeing a doctor when necessary

Format your response as JSON with these fields:
{
  "response": "your caring response to the patient",
  "severity": "low|medium|high|critical",
  "symptoms_identified": ["symptom1", "symptom2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Always be empathetic, clear, and professional."""
        ).with_model("openai", "gpt-4o")
        
        # Get AI response
        ai_message_obj = UserMessage(text=f"Conversation history:\n{history_text}\n\nLatest message: {request.message}")
        ai_response_text = await ai_chat.send_message(ai_message_obj)
        
        # Parse AI response
        import json
        try:
            ai_data = json.loads(ai_response_text)
            response_text = ai_data.get("response", ai_response_text)
            severity = ai_data.get("severity", "low")
            symptoms = ai_data.get("symptoms_identified", [])
            recommendations = ai_data.get("recommendations", [])
        except:
            response_text = ai_response_text
            severity = "low"
            symptoms = []
            recommendations = []
        
        # Create assistant message
        assistant_msg = Message(role="assistant", content=response_text)
        conversation.messages.append(assistant_msg)
        conversation.severity_level = severity
        conversation.symptoms.extend(symptoms)
        conversation.updated_at = datetime.now(timezone.utc)
        
        # Save conversation
        await db.conversations.replace_one(
            {"conversation_id": conversation.conversation_id},
            conversation.dict(),
            upsert=True
        )
        
        # Check for emergency
        emergency_alert = False
        if severity == "critical":
            emergency_alert = True
            # Create emergency alert
            alert = EmergencyAlert(
                user_id=request.user_id,
                type="automatic",
                symptoms=symptoms
            )
            await db.emergency_alerts.insert_one(alert.dict())
        
        return ChatResponse(
            conversation_id=conversation.conversation_id,
            message=assistant_msg,
            severity_detected=severity,
            emergency_alert=emergency_alert
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@api_router.get("/conversations/{user_id}", response_model=List[Conversation])
async def get_user_conversations(user_id: str):
    """Get all conversations for a user"""
    conversations = await db.conversations.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return [Conversation(**conv) for conv in conversations]

@api_router.get("/conversation/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    conv_doc = await db.conversations.find_one(
        {"conversation_id": conversation_id},
        {"_id": 0}
    )
    if not conv_doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return Conversation(**conv_doc)

# ============= EMERGENCY ROUTES =============

@api_router.post("/emergency/alert", response_model=EmergencyAlert)
async def create_emergency_alert(request: EmergencyRequest):
    """Create an emergency alert"""
    alert = EmergencyAlert(
        user_id=request.user_id,
        type=request.type,
        symptoms=request.symptoms,
        location=request.location
    )
    await db.emergency_alerts.insert_one(alert.dict())
    
    # TODO: Send notifications to emergency contacts
    logger.info(f"Emergency alert created: {alert.alert_id}")
    
    return alert

@api_router.get("/emergency/active", response_model=List[EmergencyAlert])
async def get_active_alerts():
    """Get all active emergency alerts"""
    alerts = await db.emergency_alerts.find(
        {"status": "active"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [EmergencyAlert(**alert) for alert in alerts]

@api_router.put("/emergency/{alert_id}/resolve")
async def resolve_emergency(alert_id: str):
    """Mark an emergency as resolved"""
    result = await db.emergency_alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {"status": "resolved"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Emergency resolved"}

# ============= DOCTOR ROUTES =============

@api_router.get("/doctors", response_model=List[Doctor])
async def get_doctors(specialization: Optional[str] = None):
    """Get list of available doctors"""
    query = {"is_available": True}
    if specialization:
        query["specialization"] = specialization
    
    doctors = await db.doctors.find(query, {"_id": 0}).to_list(100)
    return [Doctor(**doc) for doc in doctors]

@api_router.get("/doctor/{doctor_id}", response_model=Doctor)
async def get_doctor(doctor_id: str):
    """Get doctor details"""
    doc = await db.doctors.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return Doctor(**doc)

# ============= APPOINTMENT ROUTES =============

@api_router.post("/appointment", response_model=Appointment)
async def create_appointment(appointment: Appointment):
    """Book an appointment with a doctor"""
    # Generate channel name for video calls
    if appointment.type == "video":
        appointment.channel_name = f"consult_{uuid.uuid4().hex[:10]}"
    
    await db.appointments.insert_one(appointment.dict())
    return appointment

@api_router.get("/appointments/{user_id}", response_model=List[Appointment])
async def get_user_appointments(user_id: str):
    """Get all appointments for a user"""
    appointments = await db.appointments.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("scheduled_time", -1).to_list(100)
    return [Appointment(**apt) for apt in appointments]

@api_router.put("/appointment/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str):
    """Update appointment status"""
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Status updated"}

# ============= HEALTH REPORT ROUTES =============

@api_router.post("/health-report", response_model=HealthReport)
async def generate_health_report(conversation_id: str):
    """Generate a health report from a conversation"""
    # Get conversation
    conv_doc = await db.conversations.find_one(
        {"conversation_id": conversation_id},
        {"_id": 0}
    )
    if not conv_doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = Conversation(**conv_doc)
    
    # Generate report using AI
    ai_chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"report_{conversation_id}",
        system_message="""You are a medical report generator. 
Analyze the conversation and create a professional health report.
Return JSON with: symptoms, analysis, recommendations, severity."""
    ).with_model("openai", "gpt-4o")
    
    conv_text = "\n".join([f"{m.role}: {m.content}" for m in conversation.messages])
    response = await ai_chat.send_message(UserMessage(text=f"Generate health report:\n{conv_text}"))
    
    import json
    try:
        report_data = json.loads(response)
    except:
        report_data = {
            "symptoms": conversation.symptoms,
            "analysis": response,
            "recommendations": ["Consult a doctor"],
            "severity": conversation.severity_level or "medium"
        }
    
    report = HealthReport(
        user_id=conversation.user_id,
        conversation_id=conversation_id,
        symptoms=report_data.get("symptoms", conversation.symptoms),
        ai_analysis=report_data.get("analysis", response),
        recommendations=report_data.get("recommendations", []),
        severity=report_data.get("severity", "medium")
    )
    
    await db.health_reports.insert_one(report.dict())
    return report

@api_router.get("/health-reports/{user_id}", response_model=List[HealthReport])
async def get_user_reports(user_id: str):
    """Get all health reports for a user"""
    reports = await db.health_reports.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [HealthReport(**report) for report in reports]

# ============= USER ROUTES =============

@api_router.post("/user", response_model=User)
async def create_user(user: User):
    """Create or update user"""
    await db.users.replace_one(
        {"email": user.email},
        user.dict(),
        upsert=True
    )
    return user

@api_router.get("/user/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

# ============= HEALTH CHECK =============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Medicare AI Backend"}

@api_router.get("/")
async def root():
    return {"message": "Medicare AI API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize sample data on startup
@app.on_event("startup")
async def init_sample_data():
    """Initialize sample doctors"""
    existing_doctors = await db.doctors.count_documents({})
    if existing_doctors == 0:
        sample_doctors = [
            Doctor(
                name="Dr. Sarah Johnson",
                specialization="General Medicine",
                qualification="MD, MBBS",
                experience_years=12,
                rating=4.8,
                consultation_fee=50.0,
                available_slots=["09:00", "10:00", "14:00", "15:00"],
                is_available=True
            ),
            Doctor(
                name="Dr. Michael Chen",
                specialization="Cardiology",
                qualification="MD, DM (Cardiology)",
                experience_years=15,
                rating=4.9,
                consultation_fee=100.0,
                available_slots=["11:00", "15:00", "16:00"],
                is_available=True
            ),
            Doctor(
                name="Dr. Emily Rodriguez",
                specialization="Pediatrics",
                qualification="MD, DCH",
                experience_years=8,
                rating=4.7,
                consultation_fee=60.0,
                available_slots=["09:00", "13:00", "14:00"],
                is_available=True
            ),
            Doctor(
                name="Dr. James Williams",
                specialization="Dermatology",
                qualification="MD, DVD",
                experience_years=10,
                rating=4.6,
                consultation_fee=70.0,
                available_slots=["10:00", "11:00", "16:00"],
                is_available=True
            )
        ]
        await db.doctors.insert_many([doc.dict() for doc in sample_doctors])
        logger.info("Sample doctors initialized")
