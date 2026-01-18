"""
LiveKit Token Generation Server
This backend service generates secure access tokens for LiveKit rooms.

Install dependencies:
pip install livekit-api flask flask-cors python-dotenv

Run:
python livekit_token_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from livekit import api
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native app

# Load from environment variables or config
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "your-api-key-here")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "your-api-secret-here")


@app.route("/api/livekit/token", methods=["POST"])
def generate_token():
    """
    Generate a LiveKit access token for a participant
    
    Request body:
    {
        "roomName": "artwork-session-123",
        "participantName": "User",
        "metadata": "{...artwork data...}"
    }
    """
    try:
        data = request.json
        
        room_name = data.get("roomName")
        participant_name = data.get("participantName", "Guest")
        metadata = data.get("metadata", "")
        
        if not room_name:
            return jsonify({"error": "roomName is required"}), 400
        
        # Create access token with the correct API
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token = token.with_identity(participant_name).with_name(participant_name).with_metadata(metadata)
        
        # Add video grants for room access
        token = token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        ))
        
        # Generate JWT token
        jwt_token = token.to_jwt()
        
        return jsonify({
            "token": jwt_token,
            "roomName": room_name,
            "participantName": participant_name
        }), 200
        
    except Exception as e:
        print(f"Error generating token: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/livekit/agent-token", methods=["POST"])
def generate_agent_token():
    """
    Generate a LiveKit access token for an AI agent
    
    Request body:
    {
        "roomName": "artwork-session-123",
        "agentName": "ArtGuideAgent"
    }
    """
    try:
        data = request.json
        
        room_name = data.get("roomName")
        agent_name = data.get("agentName", "AIAgent")
        
        if not room_name:
            return jsonify({"error": "roomName is required"}), 400
        
        # Create access token for agent with the correct API
        import json
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        token = token.with_identity(agent_name).with_name(agent_name).with_metadata(json.dumps({"type": "agent"}))
        
        # Grant agent permissions
        token = token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            can_update_own_metadata=True,
        ))
        
        jwt_token = token.to_jwt()
        
        return jsonify({
            "token": jwt_token,
            "roomName": room_name,
            "agentName": agent_name
        }), 200
        
    except Exception as e:
        print(f"Error generating agent token: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


if __name__ == "__main__":
    print("🚀 LiveKit Token Server starting...")
    print(f"📡 Generating tokens for API Key: {LIVEKIT_API_KEY[:8]}...")
    print("🌐 Server running on http://localhost:5001")
    print("\nEndpoints:")
    print("  POST /api/livekit/token - Generate user token")
    print("  POST /api/livekit/agent-token - Generate agent token")
    print("  GET  /health - Health check")
    
    app.run(debug=True, host="0.0.0.0", port=5001)
