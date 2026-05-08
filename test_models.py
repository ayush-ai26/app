#!/usr/bin/env python3
"""
Test different model names with Emergent LLM
"""

import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def test_models():
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        models_to_test = ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "gpt-5.2"]
        
        for model in models_to_test:
            try:
                print(f"🔄 Testing model: {model}")
                ai_chat = LlmChat(
                    api_key=api_key,
                    session_id=f"test_{model}",
                    system_message="You are a helpful assistant. Respond with just 'OK' to test."
                ).with_model("openai", model)
                
                test_message = UserMessage(text="Test")
                response = await ai_chat.send_message(test_message)
                print(f"✅ {model}: {response}")
                break  # Use the first working model
                
            except Exception as e:
                print(f"❌ {model}: {str(e)}")
                
    except Exception as e:
        print(f"❌ Import error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_models())