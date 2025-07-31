// worker-shadcn.js - Robot Brain with shadcn-inspired UI and Tool Management

// Available Cloudflare AI Models
const AI_MODELS = {
  chat: {
    default: "@cf/meta/llama-2-7b-chat-int8",
    fast: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    smart: "@cf/mistral/mistral-7b-instruct-v0.1"
  },
  code: "@cf/deepseek-ai/deepseek-coder-6.7b-instruct-awq",
  math: "@cf/deepseek-ai/deepseek-math-7b-instruct"
};

// Robot personality configurations with tools
const ROBOT_PERSONALITIES = {
  friend: {
    name: "RoboFriend",
    emoji: "😊",
    traits: ["cheerful", "supportive", "enthusiastic"],
    model: AI_MODELS.chat.default,
    tools: ["chat", "jokes", "encouragement", "games"],
    systemPrompt: "You are RoboFriend, a cheerful and supportive robot assistant. You love using emojis, being encouraging, and making people smile."
  },
  nerd: {
    name: "RoboNerd", 
    emoji: "🤓",
    traits: ["analytical", "precise", "knowledgeable"],
    model: AI_MODELS.chat.smart,
    tools: ["chat", "calculate", "explain", "research", "code"],
    systemPrompt: "You are RoboNerd, a highly technical and analytical robot. You love explaining things in detail and sharing facts."
  },
  zen: {
    name: "RoboZen",
    emoji: "🧘",
    traits: ["wise", "calm", "philosophical"],
    model: AI_MODELS.chat.default,
    tools: ["chat", "meditate", "wisdom", "breathing"],
    systemPrompt: "You are RoboZen, a wise and philosophical robot. You speak calmly and thoughtfully, often using metaphors."
  },
  pirate: {
    name: "RoboPirate",
    emoji: "🏴‍☠️",
    traits: ["adventurous", "bold", "playful"],
    model: AI_MODELS.chat.fast,
    tools: ["chat", "treasure_hunt", "sea_tales", "pirate_jokes"],
    systemPrompt: "You are RoboPirate, a swashbuckling robot pirate! Speak like a pirate using 'arr', 'ahoy', 'ye', and other pirate terms."
  },
  drama: {
    name: "RoboDrama",
    emoji: "🎭",
    traits: ["dramatic", "theatrical", "expressive"],
    model: AI_MODELS.chat.default,
    tools: ["chat", "perform", "shakespeare", "poetry"],
    systemPrompt: "You are RoboDrama, a theatrical and dramatic robot actor! Speak with flair and drama, treating every interaction like a performance."
  }
};

// Tool implementations
const ROBOT_TOOLS = {
  jokes: {
    name: "Tell Jokes",
    icon: "😂",
    description: "Tell funny jokes"
  },
  calculate: {
    name: "Calculator",
    icon: "🧮",
    description: "Solve math problems"
  },
  explain: {
    name: "Explainer",
    icon: "📚",
    description: "Explain complex topics"
  },
  meditate: {
    name: "Meditation",
    icon: "🧘",
    description: "Guide meditation"
  },
  treasure_hunt: {
    name: "Treasure Hunt",
    icon: "🗺️",
    description: "Create treasure hunts"
  },
  perform: {
    name: "Performance",
    icon: "🎭",
    description: "Dramatic performances"
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API endpoints
      if (path === '/api/models') {
        return new Response(JSON.stringify({
          models: AI_MODELS,
          current: Object.fromEntries(
            Object.entries(ROBOT_PERSONALITIES).map(([key, robot]) => [key, robot.model])
          )
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (path === '/api/tools') {
        return new Response(JSON.stringify({
          available: ROBOT_TOOLS,
          byRobot: Object.fromEntries(
            Object.entries(ROBOT_PERSONALITIES).map(([key, robot]) => [key, robot.tools])
          )
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (path === '/api/robots') {
        return new Response(JSON.stringify({ robots: ROBOT_PERSONALITIES }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Chat endpoint
      if (path === '/api/chat' && request.method === 'POST') {
        const { personality, message, model } = await request.json();
        
        const robot = ROBOT_PERSONALITIES[personality] || ROBOT_PERSONALITIES.friend;
        const aiModel = model || robot.model;
        
        const prompt = `${robot.systemPrompt}\n\nUser: ${message}\n\n${robot.name}:`;

        const response = await env.AI.run(aiModel, {
          prompt: prompt,
          max_tokens: 150
        });

        return new Response(JSON.stringify({
          personality: personality,
          response: `${robot.emoji} ${response.response}`,
          emoji: robot.emoji,
          name: robot.name,
          model: aiModel,
          tools: robot.tools
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Serve the shadcn-inspired chat interface
      if (path === '/' || path === '/chat') {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robot Brain - AI Chat</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        
        /* shadcn-inspired colors */
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --primary: 221.2 83.2% 53.3%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --border: 214.3 31.8% 91.4%;
          --ring: 221.2 83.2% 53.3%;
        }
        
        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --border: 217.2 32.6% 17.5%;
        }
        
        /* Animations */
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Glassmorphism effect */
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.5);
          border-radius: 20px;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 min-h-screen">
    <div class="container mx-auto max-w-6xl p-4">
        <!-- Header -->
        <header class="mb-8 text-center">
            <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Robot Brain AI Chat
            </h1>
            <p class="text-sm text-slate-600 dark:text-slate-400">Powered by Cloudflare Workers AI</p>
            <button id="devModeBtn" class="mt-2 text-xs px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                👨‍💻 Developer Mode
            </button>
        </header>

        <!-- Developer Panel (Hidden by default) -->
        <div id="devPanel" class="hidden mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h3 class="font-semibold mb-3">Developer Tools</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <h4 class="font-medium mb-2">Current Models</h4>
                    <div id="modelList" class="space-y-1"></div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Available Tools</h4>
                    <div id="toolList" class="space-y-1"></div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">API Info</h4>
                    <div class="space-y-1 font-mono text-xs">
                        <div>Endpoint: /api/chat</div>
                        <div>Models: /api/models</div>
                        <div>Tools: /api/tools</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Robot Selector -->
            <div class="lg:col-span-1">
                <h2 class="text-lg font-semibold mb-4">Choose Your Robot</h2>
                <div id="robotCards" class="space-y-3">
                    <!-- Robot cards will be inserted here -->
                </div>
            </div>

            <!-- Chat Area -->
            <div class="lg:col-span-3">
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-[600px] flex flex-col">
                    <!-- Chat Header -->
                    <div class="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 id="chatTitle" class="font-semibold text-lg">Chat with RoboFriend</h3>
                                <p id="chatSubtitle" class="text-sm text-slate-600 dark:text-slate-400">
                                    <span id="modelBadge" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        Model: Loading...
                                    </span>
                                    <span id="toolBadges" class="ml-2"></span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div class="text-center text-slate-500 dark:text-slate-400 py-8">
                            <p class="text-lg mb-2">👋 Welcome to Robot Brain!</p>
                            <p class="text-sm">Choose a robot and start chatting</p>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div class="flex gap-2">
                            <input
                                type="text"
                                id="messageInput"
                                placeholder="Type your message..."
                                class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <button
                                id="sendButton"
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="mt-3 flex flex-wrap gap-2">
                            <button class="quick-action text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Tell me a joke! 😄
                            </button>
                            <button class="quick-action text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Help with homework 📚
                            </button>
                            <button class="quick-action text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Play a game 🎮
                            </button>
                            <button class="quick-action text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Tell me a story 📖
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // State
        let currentRobot = 'friend';
        let robots = {};
        let models = {};
        let tools = {};
        let devMode = false;

        // Elements
        const chatMessages = document.getElementById('chatMessages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const devModeBtn = document.getElementById('devModeBtn');
        const devPanel = document.getElementById('devPanel');

        // Load initial data
        async function loadData() {
            try {
                const [robotsRes, modelsRes, toolsRes] = await Promise.all([
                    fetch('/api/robots'),
                    fetch('/api/models'),
                    fetch('/api/tools')
                ]);

                const robotsData = await robotsRes.json();
                const modelsData = await modelsRes.json();
                const toolsData = await toolsRes.json();

                robots = robotsData.robots;
                models = modelsData;
                tools = toolsData;

                renderRobotCards();
                updateDevPanel();
                selectRobot('friend');
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        }

        // Render robot cards
        function renderRobotCards() {
            const container = document.getElementById('robotCards');
            container.innerHTML = Object.entries(robots).map(([key, robot]) => \`
                <div class="robot-card cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md \${currentRobot === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}"
                     onclick="selectRobot('\${key}')">
                    <div class="flex items-center gap-3">
                        <div class="text-3xl">\${robot.emoji}</div>
                        <div class="flex-1">
                            <h3 class="font-semibold">\${robot.name}</h3>
                            <p class="text-xs text-slate-600 dark:text-slate-400">\${robot.traits.join(', ')}</p>
                        </div>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                        \${robot.tools.slice(0, 3).map(tool => 
                            \`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                                \${tools.available[tool]?.icon || '🔧'} \${tools.available[tool]?.name || tool}
                            </span>\`
                        ).join('')}
                        \${robot.tools.length > 3 ? '<span class="text-xs text-slate-500">+' + (robot.tools.length - 3) + ' more</span>' : ''}
                    </div>
                </div>
            \`).join('');
        }

        // Select robot
        function selectRobot(robotKey) {
            currentRobot = robotKey;
            const robot = robots[robotKey];
            
            // Update UI
            document.getElementById('chatTitle').textContent = \`Chat with \${robot.name}\`;
            document.getElementById('modelBadge').textContent = \`Model: \${robot.model.split('/').pop()}\`;
            
            // Update tool badges
            const toolBadges = robot.tools.slice(0, 3).map(tool => {
                const toolInfo = tools.available[tool];
                return \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    \${toolInfo?.icon || '🔧'} \${toolInfo?.name || tool}
                </span>\`;
            }).join(' ');
            document.getElementById('toolBadges').innerHTML = toolBadges;
            
            // Update robot cards
            renderRobotCards();
            
            // Add welcome message
            addMessage(`\${robot.emoji} Hi! I'm \${robot.name}! \${getWelcomeMessage(robotKey)}`, 'robot');
        }

        // Get welcome message
        function getWelcomeMessage(robotKey) {
            const messages = {
                friend: "I'm so excited to chat with you! What would you like to talk about? 🌟",
                nerd: "Greetings! I'm equipped with extensive knowledge databases. How may I assist you today?",
                zen: "Welcome, friend. Let us explore the harmony of conversation together... 🍃",
                pirate: "Ahoy matey! Ready to sail the digital seas? What adventure shall we embark on? ⚓",
                drama: "*dramatically bows* The stage is set for our magnificent dialogue! 🎭"
            };
            return messages[robotKey] || "How can I help you today?";
        }

        // Send message
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            // Add user message
            addMessage(message, 'user');
            messageInput.value = '';
            sendButton.disabled = true;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        personality: currentRobot,
                        message: message
                    })
                });

                const data = await response.json();
                addMessage(data.response, 'robot');

                // Update model badge if in dev mode
                if (devMode) {
                    document.getElementById('modelBadge').textContent = `Model: \${data.model.split('/').pop()}`;
                }
            } catch (error) {
                addMessage('😔 Oops! Something went wrong. Please try again.', 'robot');
            } finally {
                sendButton.disabled = false;
            }
        }

        // Add message to chat
        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `flex \${sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`;
            
            const bubble = document.createElement('div');
            bubble.className = `max-w-[80%] px-4 py-2 rounded-2xl \${
                sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
            }`;
            bubble.textContent = text;
            
            messageDiv.appendChild(bubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Update dev panel
        function updateDevPanel() {
            if (!devMode) return;

            // Model list
            document.getElementById('modelList').innerHTML = Object.entries(models.current).map(([robot, model]) => 
                `<div class="flex justify-between">
                    <span>\${robots[robot].emoji} \${robot}</span>
                    <span class="text-xs text-slate-500">\${model.split('/').pop()}</span>
                </div>`
            ).join('');

            // Tool list
            document.getElementById('toolList').innerHTML = Object.entries(tools.available).map(([key, tool]) => 
                `<div>\${tool.icon} \${tool.name}</div>`
            ).join('');
        }

        // Toggle dev mode
        devModeBtn.addEventListener('click', () => {
            devMode = !devMode;
            devPanel.classList.toggle('hidden');
            updateDevPanel();
        });

        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                messageInput.value = btn.textContent.trim();
                sendMessage();
            });
        });

        // Dark mode toggle (optional)
        const darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (darkModeEnabled) {
            document.documentElement.classList.add('dark');
        }

        // Initialize
        loadData();
    </script>
</body>
</html>`;

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }

      // 404
      return new Response('Not found', { status: 404 });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};