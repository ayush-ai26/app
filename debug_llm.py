#!/usr/bin/env python3
"""
Debug script to test Emergent LLM integration
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

print("Environment variables:")
print(f"EMERGENT_LLM_KEY: {os.getenv('EMERGENT_LLM_KEY')}")

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    print("✅ Successfully imported LlmChat")
    
    # Test LLM initialization
    api_key = os.getenv("EMERGENT_LLM_KEY")
    print(f"API Key present: {api_key is not None}")
    print(f"API Key length: {len(api_key) if api_key else 0}")
    
    # Initialize AI chat
    ai_chat = LlmChat(
        api_key=api_key,
        session_id="debug_test",
        system_message="You are a helpful assistant. Respond with 'Hello, I am working!' to test the connection."
    )
    print("✅ LlmChat initialized")
    
    # Try to set model
    ai_chat_with_model = ai_chat.with_model("openai", "gpt-5.2")
    print("✅ Model set to gpt-5.2")
    
    # Test message
    test_message = UserMessage(text="Hello, are you working?")
    print("✅ UserMessage created")
    
    # This is where the error likely occurs
    print("🔄 Sending test message...")
    response = ai_chat_with_model.send_message(test_message)
    print(f"✅ Response received: {response}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()