#!/usr/bin/env python3
"""
Medicare AI Backend API Testing Suite
Tests all backend endpoints for the Medicare AI application
"""

import requests
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

# API Configuration
BASE_URL = "https://doc-connect-care-2.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class MedicareAITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.conversation_id = None
        self.user_id = f"test_user_{int(time.time())}"
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "API is healthy", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected status: {data.get('status')}", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_ai_chatbot_simple(self):
        """Test AI chatbot with simple symptom"""
        try:
            payload = {
                "message": "I have a headache and feel tired",
                "is_anonymous": True
            }
            
            response = requests.post(f"{self.base_url}/chat", 
                                   json=payload, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["conversation_id", "message", "severity_detected", "emergency_alert"]
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("AI Chatbot - Simple", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Store conversation_id for later tests
                self.conversation_id = data["conversation_id"]
                
                # Verify response structure
                message = data["message"]
                if not isinstance(message, dict) or "content" not in message:
                    self.log_test("AI Chatbot - Simple", False, 
                                "Invalid message structure", data)
                    return False
                
                # Check that emergency_alert is False for simple symptoms
                if data["emergency_alert"] != False:
                    self.log_test("AI Chatbot - Simple", False, 
                                f"Expected emergency_alert=False, got {data['emergency_alert']}", data)
                    return False
                
                self.log_test("AI Chatbot - Simple", True, 
                            f"AI responded correctly. Severity: {data['severity_detected']}", 
                            {"conversation_id": data["conversation_id"], 
                             "severity": data["severity_detected"]})
                return True
            else:
                self.log_test("AI Chatbot - Simple", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("AI Chatbot - Simple", False, f"Request failed: {str(e)}")
            return False
    
    def test_ai_chatbot_critical(self):
        """Test AI chatbot with critical symptoms"""
        try:
            payload = {
                "message": "I'm having severe chest pain and difficulty breathing, I feel like I'm going to pass out",
                "is_anonymous": True
            }
            
            response = requests.post(f"{self.base_url}/chat", 
                                   json=payload, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for emergency alert
                if not data.get("emergency_alert"):
                    self.log_test("AI Chatbot - Critical", False, 
                                "Emergency alert not triggered for critical symptoms", data)
                    return False
                
                # Check severity
                severity = data.get("severity_detected")
                if severity != "critical":
                    self.log_test("AI Chatbot - Critical", False, 
                                f"Expected critical severity, got {severity}", data)
                    return False
                
                self.log_test("AI Chatbot - Critical", True, 
                            "Emergency alert correctly triggered for critical symptoms", 
                            {"emergency_alert": True, "severity": severity})
                return True
            else:
                self.log_test("AI Chatbot - Critical", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("AI Chatbot - Critical", False, f"Request failed: {str(e)}")
            return False
    
    def test_conversation_reuse(self):
        """Test reusing conversation_id"""
        if not self.conversation_id:
            self.log_test("Conversation Reuse", False, "No conversation_id available from previous test")
            return False
            
        try:
            payload = {
                "conversation_id": self.conversation_id,
                "message": "The headache is getting worse",
                "is_anonymous": True
            }
            
            response = requests.post(f"{self.base_url}/chat", 
                                   json=payload, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return same conversation_id
                if data["conversation_id"] != self.conversation_id:
                    self.log_test("Conversation Reuse", False, 
                                f"Conversation ID mismatch: expected {self.conversation_id}, got {data['conversation_id']}")
                    return False
                
                self.log_test("Conversation Reuse", True, 
                            "Successfully continued existing conversation")
                return True
            else:
                self.log_test("Conversation Reuse", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Conversation Reuse", False, f"Request failed: {str(e)}")
            return False
    
    def test_doctors_list(self):
        """Test GET /api/doctors endpoint"""
        try:
            response = requests.get(f"{self.base_url}/doctors", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Doctors List", False, "Response is not a list", data)
                    return False
                
                if len(data) != 4:
                    self.log_test("Doctors List", False, 
                                f"Expected 4 doctors, got {len(data)}", data)
                    return False
                
                # Check doctor data structure
                required_fields = ["name", "specialization", "rating", "consultation_fee", "available_slots"]
                for i, doctor in enumerate(data):
                    missing_fields = [field for field in required_fields if field not in doctor]
                    if missing_fields:
                        self.log_test("Doctors List", False, 
                                    f"Doctor {i} missing fields: {missing_fields}", doctor)
                        return False
                
                self.log_test("Doctors List", True, 
                            f"Retrieved {len(data)} doctors with correct structure", 
                            {"count": len(data), "specializations": [d["specialization"] for d in data]})
                return True
            else:
                self.log_test("Doctors List", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Doctors List", False, f"Request failed: {str(e)}")
            return False
    
    def test_doctors_filter(self):
        """Test doctors list with specialization filter"""
        try:
            response = requests.get(f"{self.base_url}/doctors?specialization=Cardiology", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Doctors Filter", False, "Response is not a list", data)
                    return False
                
                # Should have at least one cardiologist
                cardiologists = [d for d in data if d.get("specialization") == "Cardiology"]
                if len(cardiologists) == 0:
                    self.log_test("Doctors Filter", False, "No cardiologists found", data)
                    return False
                
                # All returned doctors should be cardiologists
                if len(cardiologists) != len(data):
                    self.log_test("Doctors Filter", False, 
                                "Filter returned non-cardiologists", data)
                    return False
                
                self.log_test("Doctors Filter", True, 
                            f"Filter returned {len(cardiologists)} cardiologist(s)", 
                            {"cardiologists": [d["name"] for d in cardiologists]})
                return True
            else:
                self.log_test("Doctors Filter", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Doctors Filter", False, f"Request failed: {str(e)}")
            return False
    
    def test_emergency_alert_manual(self):
        """Test creating manual emergency alert"""
        try:
            payload = {
                "symptoms": ["chest pain", "shortness of breath"],
                "type": "manual",
                "location": "Home"
            }
            
            response = requests.post(f"{self.base_url}/emergency/alert", 
                                   json=payload, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["alert_id", "type", "symptoms", "status"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Emergency Alert - Manual", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                if data["type"] != "manual":
                    self.log_test("Emergency Alert - Manual", False, 
                                f"Expected type=manual, got {data['type']}", data)
                    return False
                
                if data["status"] != "active":
                    self.log_test("Emergency Alert - Manual", False, 
                                f"Expected status=active, got {data['status']}", data)
                    return False
                
                self.log_test("Emergency Alert - Manual", True, 
                            f"Manual emergency alert created: {data['alert_id']}", 
                            {"alert_id": data["alert_id"], "symptoms": data["symptoms"]})
                return True
            else:
                self.log_test("Emergency Alert - Manual", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Emergency Alert - Manual", False, f"Request failed: {str(e)}")
            return False
    
    def test_emergency_active_alerts(self):
        """Test GET /api/emergency/active endpoint"""
        try:
            response = requests.get(f"{self.base_url}/emergency/active", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Emergency Active Alerts", False, "Response is not a list", data)
                    return False
                
                # Should have at least one alert from previous tests
                if len(data) == 0:
                    self.log_test("Emergency Active Alerts", False, "No active alerts found", data)
                    return False
                
                # Check alert structure
                for alert in data:
                    if alert.get("status") != "active":
                        self.log_test("Emergency Active Alerts", False, 
                                    f"Non-active alert in active list: {alert.get('status')}", alert)
                        return False
                
                self.log_test("Emergency Active Alerts", True, 
                            f"Retrieved {len(data)} active alert(s)", 
                            {"count": len(data)})
                return True
            else:
                self.log_test("Emergency Active Alerts", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Emergency Active Alerts", False, f"Request failed: {str(e)}")
            return False
    
    def test_appointment_creation(self):
        """Test creating an appointment"""
        try:
            # First get a doctor ID
            doctors_response = requests.get(f"{self.base_url}/doctors", headers=self.headers, timeout=10)
            if doctors_response.status_code != 200:
                self.log_test("Appointment Creation", False, "Could not fetch doctors for appointment test")
                return False
            
            doctors = doctors_response.json()
            if not doctors:
                self.log_test("Appointment Creation", False, "No doctors available for appointment")
                return False
            
            doctor_id = doctors[0]["doctor_id"]
            
            # Create appointment
            payload = {
                "appointment_id": f"apt_test_{int(time.time())}",
                "user_id": self.user_id,
                "doctor_id": doctor_id,
                "type": "video",
                "status": "scheduled",
                "scheduled_time": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            }
            
            response = requests.post(f"{self.base_url}/appointment", 
                                   json=payload, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for channel_name for video appointments
                if data.get("type") == "video" and not data.get("channel_name"):
                    self.log_test("Appointment Creation", False, 
                                "Video appointment missing channel_name", data)
                    return False
                
                required_fields = ["appointment_id", "user_id", "doctor_id", "type", "status"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Appointment Creation", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                self.log_test("Appointment Creation", True, 
                            f"Video appointment created with channel: {data.get('channel_name')}", 
                            {"appointment_id": data["appointment_id"], 
                             "channel_name": data.get("channel_name")})
                return True
            else:
                self.log_test("Appointment Creation", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Appointment Creation", False, f"Request failed: {str(e)}")
            return False
    
    def test_health_report_generation(self):
        """Test health report generation"""
        if not self.conversation_id:
            self.log_test("Health Report Generation", False, "No conversation_id available for report generation")
            return False
            
        try:
            response = requests.post(f"{self.base_url}/health-report?conversation_id={self.conversation_id}", 
                                   headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["report_id", "conversation_id", "symptoms", "ai_analysis", "recommendations", "severity"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Health Report Generation", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                if data["conversation_id"] != self.conversation_id:
                    self.log_test("Health Report Generation", False, 
                                f"Conversation ID mismatch in report", data)
                    return False
                
                self.log_test("Health Report Generation", True, 
                            f"Health report generated: {data['report_id']}", 
                            {"report_id": data["report_id"], 
                             "symptoms_count": len(data["symptoms"]),
                             "severity": data["severity"]})
                return True
            else:
                self.log_test("Health Report Generation", False, 
                            f"HTTP {response.status_code}: {response.text}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Health Report Generation", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🏥 Starting Medicare AI Backend API Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)
        
        tests = [
            self.test_health_check,
            self.test_ai_chatbot_simple,
            self.test_ai_chatbot_critical,
            self.test_conversation_reuse,
            self.test_doctors_list,
            self.test_doctors_filter,
            self.test_emergency_alert_manual,
            self.test_emergency_active_alerts,
            self.test_appointment_creation,
            self.test_health_report_generation
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {str(e)}")
                failed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n🔍 Failed Tests Details:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        return passed, failed, self.test_results

if __name__ == "__main__":
    tester = MedicareAITester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/test_results_detailed.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/test_results_detailed.json")
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)