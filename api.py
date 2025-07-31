# api.py - FastAPI server for Robot Brain
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import asyncio
import os

# Import our robot personalities
from robot_personality import create_robot, RobotPersonality
from multi_robot_chat import RobotChatRoom

# Initialize FastAPI
app = FastAPI(title="Robot Brain API", version="1.0.0")

# Add CORS middleware for Cloudflare Worker access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Cloudflare domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global robot instances
robots: Dict[str, RobotPersonality] = {}
chat_room = RobotChatRoom()

# Request/Response models
class ChatRequest(BaseModel):
    personality: str
    message: str

class ChatResponse(BaseModel):
    personality: str
    response: str
    emoji: str

class MultiChatRequest(BaseModel):
    topic: str
    interaction_type: str  # "discussion", "debate", "brainstorm"
    participants: Optional[List[str]] = None

# Initialize robots on startup
@app.on_event("startup")
async def startup_event():
    """Initialize all robot personalities"""
    personality_types = ["friend", "nerd", "zen", "pirate", "drama"]
    
    for p_type in personality_types:
        robot = create_robot(p_type)
        robots[p_type] = robot
        chat_room.add_robot(p_type)
    
    print("🤖 All robot personalities initialized!")

# API Endpoints
@app.get("/")
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Robot Brain API!",
        "endpoints": {
            "/robots": "List all available robots",
            "/chat": "Chat with a specific robot",
            "/multi-chat": "Have robots chat with each other",
            "/ws": "WebSocket for real-time chat"
        }
    }

@app.get("/robots")
async def list_robots():
    """List all available robot personalities"""
    robot_info = {}
    for name, robot in robots.items():
        robot_info[name] = {
            "name": robot.name,
            "emoji": robot.emoji,
            "traits": robot.traits,
            "greeting": robot.get_greeting()
        }
    return {"robots": robot_info}

@app.post("/chat", response_model=ChatResponse)
async def chat_with_robot(request: ChatRequest):
    """Chat with a specific robot personality"""
    if request.personality not in robots:
        raise HTTPException(status_code=404, detail=f"Robot personality '{request.personality}' not found")
    
    robot = robots[request.personality]
    response = robot.respond(request.message)
    
    return ChatResponse(
        personality=request.personality,
        response=response,
        emoji=robot.emoji
    )

@app.post("/multi-chat")
async def multi_robot_chat(request: MultiChatRequest):
    """Have multiple robots interact"""
    if request.interaction_type == "discussion":
        # Simple discussion - return structured responses
        responses = []
        for robot_name, robot in chat_room.robots.items():
            if not request.participants or robot_name in request.participants:
                response = robot.respond(f"What are your thoughts on {request.topic}?")
                responses.append({
                    "robot": robot_name,
                    "response": response,
                    "emoji": robot.emoji
                })
        return {"topic": request.topic, "responses": responses}
    
    elif request.interaction_type == "debate":
        # Debate format
        all_names = list(chat_room.robots.keys())
        mid = len(all_names) // 2
        team1 = all_names[:mid]
        team2 = all_names[mid:]
        
        debate_responses = {
            "topic": request.topic,
            "team1": {"position": "supporting", "members": team1, "arguments": []},
            "team2": {"position": "opposing", "members": team2, "arguments": []}
        }
        
        # Get arguments from each team
        for robot_name in team1:
            robot = chat_room.robots[robot_name]
            response = robot.respond(f"Argue IN FAVOR of: {request.topic}")
            debate_responses["team1"]["arguments"].append({
                "robot": robot_name,
                "argument": response
            })
        
        for robot_name in team2:
            robot = chat_room.robots[robot_name]
            response = robot.respond(f"Argue AGAINST: {request.topic}")
            debate_responses["team2"]["arguments"].append({
                "robot": robot_name,
                "argument": response
            })
        
        return debate_responses
    
    else:
        raise HTTPException(status_code=400, detail="Invalid interaction type")

# WebSocket for real-time chat
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time robot conversations"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            personality = message_data.get("personality", "friend")
            message = message_data.get("message", "")
            
            if personality in robots:
                robot = robots[personality]
                response = robot.respond(message)
                
                # Send response back
                await websocket.send_json({
                    "personality": personality,
                    "response": response,
                    "emoji": robot.emoji,
                    "name": robot.name
                })
            else:
                await websocket.send_json({
                    "error": f"Unknown personality: {personality}"
                })
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check if Ollama is accessible
    ollama_host = os.getenv("OLLAMA_HOST", "localhost")
    ollama_port = os.getenv("OLLAMA_PORT", "11434")
    
    try:
        import requests
        response = requests.get(f"http://{ollama_host}:{ollama_port}/", timeout=5)
        ollama_status = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        ollama_status = "unreachable"
    
    return {
        "status": "healthy",
        "ollama": ollama_status,
        "robots_loaded": len(robots)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)