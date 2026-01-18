"""
LiveKit AI Agent Example
This is a sample AI agent that can answer questions about artworks using LiveKit Agents framework.

Install dependencies:
pip install livekit livekit-agents livekit-plugins-openai livekit-plugins-silero openai python-dotenv

Run:
python livekit_agent_example.py
"""

import asyncio
import json
import logging
import os
from pathlib import Path

# Manually load environment variables from .env file
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.plugins import openai, silero

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Debug: Verify environment variables are loaded
logger.info(f"Loaded .env from: {env_path}")
logger.info(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}")
logger.info(f"LIVEKIT_URL present: {bool(os.getenv('LIVEKIT_URL'))}")


class ArtworkGuideAgent:
    """AI Agent that provides information about artworks"""
    
    def __init__(self):
        self.artwork_context = None
        
    async def entrypoint(self, ctx: JobContext):
        """Main entry point for the agent"""
        
        # Connect to the room
        await ctx.connect()
        logger.info(f"Agent connected to room: {ctx.room.name}")
        
        # Get artwork metadata from room metadata
        try:
            # Try to get metadata from the first participant who joins
            artwork_context = "You are a helpful art guide assistant."
            
            # Wait for participant to join
            async def wait_for_participant():
                if len(ctx.room.remote_participants) > 0:
                    return
                await asyncio.sleep(0.5)
            
            await asyncio.wait_for(wait_for_participant(), timeout=10.0)
            
            # Get participant and their metadata
            for participant in ctx.room.remote_participants.values():
                if participant.metadata:
                    metadata = json.loads(participant.metadata)
                    artwork_data = metadata.get("data", {})
                    artwork_context = f"""You are an expert art historian and museum guide. You are currently discussing the following artwork:

Title: {artwork_data.get('title', 'Unknown')}
Artist: {artwork_data.get('artist', 'Unknown')}
Type: {artwork_data.get('type', 'Unknown')}
Description: {artwork_data.get('description', 'No description available')}
Historical Context: {artwork_data.get('historicalContext', 'No historical context available')}

Provide engaging, informative answers to questions about this artwork. Be conversational and enthusiastic about art.
Keep your responses concise (2-3 sentences) unless asked for more detail."""
                    logger.info(f"Loaded artwork context: {artwork_data.get('title')}")
                    break
                    
        except Exception as e:
            logger.error(f"Failed to load artwork metadata: {e}")
            artwork_context = "You are a helpful art guide assistant."
        
        # Initialize the voice assistant with new API
        # OpenRouter configuration is handled via environment variables
        llm_config = {
            "model": "gpt-4",
            "temperature": 0.7,
        }
        
        # Add base_url if using OpenRouter
        base_url = os.getenv("OPENAI_BASE_URL")
        if base_url:
            llm_config["base_url"] = base_url
            logger.info(f"Using custom OpenAI base URL: {base_url}")
        
        assistant = agents.VoiceAssistant(
            vad=silero.VAD.load(),
            stt=openai.STT(),
            llm=openai.LLM(**llm_config),
            tts=openai.TTS(voice="alloy"),
            chat_ctx=agents.ChatContext().append(
                role="system",
                text=artwork_context,
            ),
        )
        
        # Start the assistant
        assistant.start(ctx.room)
        
        # Greet the user
        await assistant.say(
            "Hello! I'm your AI art guide. I'm here to answer any questions you have about this artwork. What would you like to know?",
            allow_interruptions=True
        )
        
        logger.info("Voice assistant started and greeting sent")


async def request_fnc(req: agents.JobRequest):
    """Handle incoming job requests"""
    logger.info(f"Received job request for room: {req.room.name}")
    await req.accept(
        name="ArtworkGuideAgent",
        identity="art-guide-agent",
    )


def main():
    """Start the LiveKit agent worker"""
    
    # Check for required environment variables
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY not found in environment variables")
        logger.error("You can use OpenRouter by setting:")
        logger.error("  OPENAI_API_KEY=your-openrouter-key")
        logger.error("  OPENAI_BASE_URL=https://openrouter.ai/api/v1")
        # return
    
    if not os.getenv("LIVEKIT_URL"):
        logger.error("LIVEKIT_URL not found in environment variables")
        return
    
    if not os.getenv("LIVEKIT_API_KEY"):
        logger.error("LIVEKIT_API_KEY not found in environment variables")
        return
    
    if not os.getenv("LIVEKIT_API_SECRET"):
        logger.error("LIVEKIT_API_SECRET not found in environment variables")
        return
    
    # Debug: Print contents of .env file
    try:
        with open(os.path.join(os.path.dirname(__file__), ".env"), "r") as f:
            logger.info(".env file contents:\n" + f.read())
    except Exception as e:
        logger.error(f"Could not read .env file: {e}")
    
    # Debug: Print environment variable keys and masked OPENAI_API_KEY
    logger.info(f"Loaded env keys: {list(os.environ.keys())}")
    logger.info(f"OPENAI_API_KEY loaded: {'YES' if os.getenv('OPENAI_API_KEY') else 'NO'}")
    if os.getenv('OPENAI_API_KEY'):
        logger.info(f"OPENAI_API_KEY (masked): {os.getenv('OPENAI_API_KEY')[:8]}...{os.getenv('OPENAI_API_KEY')[-4:]}")
    
    logger.info("🤖 Starting Artwork Guide AI Agent...")
    logger.info(f"🌐 LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    
    # Check if using OpenRouter
    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url and "openrouter" in base_url.lower():
        logger.info("🔄 Using OpenRouter API")
        logger.info(f"   Base URL: {base_url}")
    else:
        logger.info("🤖 Using OpenAI API")
    
    # Initialize and run the agent
    agent = ArtworkGuideAgent()
    
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=agent.entrypoint,
            request_fnc=request_fnc,
        )
    )


if __name__ == "__main__":
    main()
