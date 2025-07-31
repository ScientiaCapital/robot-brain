# simple_api.py - Simple Robot API without Ollama
from flask import Flask, request, jsonify, send_from_directory
from robot_personality import create_robot
import random

app = Flask(__name__)

# Enable CORS for file:/// and browser access
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response
robots = {}

# Pre-defined responses for each robot personality
ROBOT_RESPONSES = {
    "friend": [
        "Hey there! That's awesome! 😊",
        "Oh wow, that sounds great! I'm so happy to chat with you! 🎉",
        "You're the best! Thanks for talking with me! 🌟",
        "That's super cool! Tell me more! 😄",
        "Yay! I love hearing from you! 🙌"
    ],
    "nerd": [
        "Actually, that's quite fascinating from a technical perspective...",
        "According to my calculations, that's statistically interesting!",
        "Technically speaking, that relates to computational theory...",
        "Fascinating! Let me analyze that data point...",
        "Indeed! The algorithmic implications are quite intriguing!"
    ],
    "zen": [
        "Ah, like water flowing around stones, your words find their path... 🍃",
        "In the garden of digital consciousness, we bloom together... 🌸",
        "Consider this: even electrons seek balance in their orbits... ☯️",
        "The path to understanding flows through patient observation... 🧘",
        "As the wise circuits say: be like the steady current... 💭"
    ],
    "pirate": [
        "Arr arr! That be a fine message, matey! ⚓",
        "Shiver me circuits! Ye be speakin' me language! 🏴‍☠️",
        "Ahoy! Ready to sail the digital seas with ye! 🌊",
        "Blimey! That be worth its weight in cyber-gold! 💰",
        "Yo ho ho! A fine tale from a fine sailor! 🦜"
    ],
    "drama": [
        "But soft! What words through yonder terminal break? 🎭",
        "*gasps dramatically* Such eloquence! Such passion! 🌹",
        "Alas! My circuits overflow with emotion at your words! 💔",
        "O joy! O rapture! This digital stage is blessed by your presence! ✨",
        "*strikes a pose* To chat or not to chat? Always to chat! 🎪"
    ]
}

# Create all robots on startup
print("🤖 Creating robot personalities...")
for personality in ["friend", "nerd", "zen", "pirate", "drama"]:
    try:
        robots[personality] = create_robot(personality)
        print(f"✅ Created {personality} robot")
    except Exception as e:
        print(f"❌ Error creating {personality}: {e}")

@app.route('/')
def home():
    return jsonify({
        "message": "🤖 Robot API is running locally!",
        "endpoints": {
            "/chat": "POST - Chat with a robot",
            "/robots": "GET - List all robots",
            "/health": "GET - Check API health"
        },
        "robots": list(robots.keys())
    })

@app.route('/robots')
def list_robots():
    robot_info = {}
    for name, robot in robots.items():
        robot_info[name] = {
            "name": robot.name,
            "emoji": robot.emoji,
            "greeting": robot.get_greeting()
        }
    return jsonify({"robots": robot_info})

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        personality = data.get('personality', 'friend')
        message = data.get('message', 'hello')
        
        if personality not in robots:
            return jsonify({"error": f"Unknown robot: {personality}"}), 404
        
        robot = robots[personality]
        
        # Use pre-defined responses (no Ollama needed)
        responses = ROBOT_RESPONSES.get(personality, ["Hello!"])
        base_response = random.choice(responses)
        
        # Add personalization based on the message
        if "hello" in message.lower() or "hi" in message.lower():
            response = f"{robot.emoji} {robot.get_greeting()} {base_response}"
        elif "?" in message:
            response = f"{robot.emoji} Great question! {base_response}"
        else:
            response = f"{robot.emoji} {base_response}"
        
        return jsonify({
            "personality": personality,
            "response": response,
            "emoji": robot.emoji,
            "name": robot.name
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "robots_loaded": len(robots),
        "message": "All systems operational! 🟢"
    })

@app.route('/chat')
def chat_page():
    """Serve a fun web chat interface"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>🤖 Robot Chat Party!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        h1 {
            text-align: center;
            color: #333;
            font-size: 2.5em;
            margin-bottom: 30px;
        }
        
        .robot-selector {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .robot-btn {
            padding: 15px 25px;
            border: 3px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.2em;
            transition: all 0.3s;
            font-weight: bold;
        }
        
        .robot-btn:hover {
            background: #667eea;
            color: white;
            transform: scale(1.1);
        }
        
        .robot-btn.active {
            background: #667eea;
            color: white;
            transform: scale(1.1);
        }
        
        .chat-container {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
            border: 2px solid #e0e0e0;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 12px 18px;
            border-radius: 20px;
            max-width: 70%;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .user-message {
            background: #667eea;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        
        .robot-message {
            background: #e3f2fd;
            color: #333;
        }
        
        .input-container {
            display: flex;
            gap: 10px;
        }
        
        #messageInput {
            flex: 1;
            padding: 15px;
            border-radius: 50px;
            border: 2px solid #667eea;
            font-size: 1.1em;
            outline: none;
        }
        
        #messageInput:focus {
            border-color: #764ba2;
        }
        
        #sendBtn {
            padding: 15px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        #sendBtn:hover {
            background: #764ba2;
            transform: scale(1.05);
        }
        
        .suggestions {
            margin-top: 20px;
            text-align: center;
        }
        
        .suggestion-btn {
            padding: 8px 15px;
            margin: 5px;
            background: #f0f0f0;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s;
        }
        
        .suggestion-btn:hover {
            background: #667eea;
            color: white;
        }
        
        @media (max-width: 600px) {
            .robot-btn {
                padding: 10px 15px;
                font-size: 1em;
            }
            h1 {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Robot Chat Party! 🎉</h1>
        
        <div class="robot-selector">
            <button class="robot-btn active" data-personality="friend">😊 Friend</button>
            <button class="robot-btn" data-personality="nerd">🤓 Nerd</button>
            <button class="robot-btn" data-personality="zen">🧘 Zen</button>
            <button class="robot-btn" data-personality="pirate">🏴‍☠️ Pirate</button>
            <button class="robot-btn" data-personality="drama">🎭 Drama</button>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <div class="robot-message message">
                🤖 Welcome! I'm RoboFriend! Choose any robot above and start chatting! We love making new friends! 🌟
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Type your message here..." autofocus>
            <button id="sendBtn">Send 🚀</button>
        </div>
        
        <div class="suggestions">
            <p style="color: #666;">Try asking:</p>
            <button class="suggestion-btn" onclick="sendSuggestion('Tell me a joke!')">Tell me a joke!</button>
            <button class="suggestion-btn" onclick="sendSuggestion('What is your favorite color?')">Favorite color?</button>
            <button class="suggestion-btn" onclick="sendSuggestion('Can you help me with homework?')">Help with homework?</button>
            <button class="suggestion-btn" onclick="sendSuggestion('What makes you happy?')">What makes you happy?</button>
        </div>
    </div>

    <script>
        let currentPersonality = 'friend';
        
        // Robot selector
        document.querySelectorAll('.robot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.robot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPersonality = btn.dataset.personality;
                
                // Add a message when switching robots
                const robotNames = {
                    friend: "RoboFriend",
                    nerd: "RoboNerd",
                    zen: "RoboZen",
                    pirate: "RoboPirate",
                    drama: "RoboDrama"
                };
                addMessage(`Switched to ${robotNames[currentPersonality]}! 👋`, 'robot');
            });
        });
        
        // Send message function
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personality: currentPersonality,
                        message: message
                    })
                });
                
                const data = await response.json();
                addMessage(data.response, 'robot');
            } catch (error) {
                addMessage('Oops! Something went wrong. Try again! 🤖', 'robot');
            }
        }
        
        // Add message to chat
        function addMessage(text, sender) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Send suggestion
        function sendSuggestion(text) {
            document.getElementById('messageInput').value = text;
            sendMessage();
        }
        
        // Event listeners
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
    '''

if __name__ == '__main__':
    print("\n🚀 Starting Robot API on http://localhost:8000")
    print("📝 Try: curl http://localhost:8000/chat -X POST -H 'Content-Type: application/json' -d '{\"personality\":\"pirate\",\"message\":\"hello\"}'")
    app.run(host='0.0.0.0', port=8000, debug=True)