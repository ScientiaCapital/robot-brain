// worker.js - Cloudflare Worker for Robot Brain

// Robot personality configurations
const ROBOT_PERSONALITIES = {
  friend: {
    name: "RoboFriend",
    emoji: "😊",
    traits: ["cheerful", "supportive", "enthusiastic"],
    systemPrompt: "You are RoboFriend, a cheerful and supportive robot assistant. You love using emojis, being encouraging, and making people smile."
  },
  nerd: {
    name: "RoboNerd", 
    emoji: "🤓",
    traits: ["analytical", "precise", "knowledgeable"],
    systemPrompt: "You are RoboNerd, a highly technical and analytical robot. You love explaining things in detail and sharing facts."
  },
  zen: {
    name: "RoboZen",
    emoji: "🧘",
    traits: ["wise", "calm", "philosophical"],
    systemPrompt: "You are RoboZen, a wise and philosophical robot. You speak calmly and thoughtfully, often using metaphors."
  },
  pirate: {
    name: "RoboPirate",
    emoji: "🏴‍☠️",
    traits: ["adventurous", "bold", "playful"],
    systemPrompt: "You are RoboPirate, a swashbuckling robot pirate! Speak like a pirate using 'arr', 'ahoy', 'ye', and other pirate terms."
  },
  drama: {
    name: "RoboDrama",
    emoji: "🎭",
    traits: ["dramatic", "theatrical", "expressive"],
    systemPrompt: "You are RoboDrama, a theatrical and dramatic robot actor! Speak with flair and drama, treating every interaction like a performance."
  }
};

// Cloudflare AI models mapping
const AI_MODELS = {
  chat: "@cf/meta/llama-2-7b-chat-int8",
  code: "@cf/mistral/mistral-7b-instruct-v0.1"
};

export default {
  async fetch(request, env, ctx) {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Root endpoint
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          message: "🤖 Robot Brain API - Cloudflare Worker Edition",
          endpoints: {
            "/robots": "List all robot personalities",
            "/chat": "Chat with a robot (POST)",
            "/multi-chat": "Multiple robots discussion (POST)"
          },
          personalities: Object.keys(ROBOT_PERSONALITIES)
        }), { headers: corsHeaders });
      }

      // List robots
      if (path === '/robots' && request.method === 'GET') {
        const robots = {};
        for (const [key, robot] of Object.entries(ROBOT_PERSONALITIES)) {
          robots[key] = {
            name: robot.name,
            emoji: robot.emoji,
            traits: robot.traits,
            greeting: `${robot.emoji} Hello! I'm ${robot.name}!`
          };
        }
        return new Response(JSON.stringify({ robots }), { headers: corsHeaders });
      }

      // Web chat interface
      if (path === '/chat' && request.method === 'GET') {
        const htmlHeaders = {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        };
        
        const html = `<!DOCTYPE html>
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
        #sendBtn {
            padding: 15px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
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
        }
        .suggestion-btn:hover {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Robot Chat Party! 🎉</h1>
        <p style="text-align: center; color: #666;">Powered by Cloudflare Workers AI</p>
        
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
        
        document.querySelectorAll('.robot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.robot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPersonality = btn.dataset.personality;
                
                const robotNames = {
                    friend: "RoboFriend",
                    nerd: "RoboNerd",
                    zen: "RoboZen",
                    pirate: "RoboPirate",
                    drama: "RoboDrama"
                };
                addMessage(\`Switched to \${robotNames[currentPersonality]}! 👋\`, 'robot');
            });
        });
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
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
        
        function addMessage(text, sender) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}-message\`;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function sendSuggestion(text) {
            document.getElementById('messageInput').value = text;
            sendMessage();
        }
        
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>`;
        
        return new Response(html, { headers: htmlHeaders });
      }

      // Chat with a robot
      if (path === '/chat' && request.method === 'POST') {
        const { personality, message } = await request.json();
        
        if (!ROBOT_PERSONALITIES[personality]) {
          return new Response(JSON.stringify({ 
            error: `Unknown personality: ${personality}` 
          }), { status: 404, headers: corsHeaders });
        }

        const robot = ROBOT_PERSONALITIES[personality];
        const prompt = `${robot.systemPrompt}\n\nUser: ${message}\n\n${robot.name}:`;

        // Use Cloudflare AI
        const response = await env.AI.run(AI_MODELS.chat, {
          prompt: prompt,
          max_tokens: 150
        });

        return new Response(JSON.stringify({
          personality: personality,
          response: `${robot.emoji} ${response.response}`,
          emoji: robot.emoji,
          name: robot.name
        }), { headers: corsHeaders });
      }

      // Multi-robot chat
      if (path === '/multi-chat' && request.method === 'POST') {
        const { topic, personalities = ['friend', 'nerd', 'zen'] } = await request.json();
        
        const responses = [];
        
        for (const personality of personalities) {
          if (ROBOT_PERSONALITIES[personality]) {
            const robot = ROBOT_PERSONALITIES[personality];
            const prompt = `${robot.systemPrompt}\n\nDiscuss this topic: ${topic}\n\n${robot.name}:`;
            
            const response = await env.AI.run(AI_MODELS.chat, {
              prompt: prompt,
              max_tokens: 100
            });
            
            responses.push({
              personality: personality,
              name: robot.name,
              emoji: robot.emoji,
              response: `${robot.emoji} ${response.response}`
            });
          }
        }
        
        return new Response(JSON.stringify({
          topic: topic,
          responses: responses
        }), { headers: corsHeaders });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ 
        error: 'Not found' 
      }), { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), { status: 500, headers: corsHeaders });
    }
  }
};