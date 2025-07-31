// worker-shadcn-fixed.js - Robot Brain with shadcn-inspired UI and Tool Management

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
  },
  encouragement: {
    name: "Encouragement",
    icon: "💪",
    description: "Motivational support"
  },
  games: {
    name: "Games",
    icon: "🎮",
    description: "Fun games to play"
  },
  research: {
    name: "Research",
    icon: "🔬",
    description: "Research topics"
  },
  code: {
    name: "Code Helper",
    icon: "💻",
    description: "Help with coding"
  },
  wisdom: {
    name: "Wisdom",
    icon: "🦉",
    description: "Share wisdom"
  },
  breathing: {
    name: "Breathing",
    icon: "🌬️",
    description: "Breathing exercises"
  },
  sea_tales: {
    name: "Sea Tales",
    icon: "⚓",
    description: "Pirate stories"
  },
  pirate_jokes: {
    name: "Pirate Jokes",
    icon: "🦜",
    description: "Pirate humor"
  },
  shakespeare: {
    name: "Shakespeare",
    icon: "📜",
    description: "Shakespearean quotes"
  },
  poetry: {
    name: "Poetry",
    icon: "✍️",
    description: "Create poetry"
  },
  chat: {
    name: "Chat",
    icon: "💬",
    description: "General conversation"
  }
};

// Helper function to generate robot card HTML
function generateRobotCard(key, robot, isSelected) {
  const borderClass = isSelected 
    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
  
  let toolsHtml = '';
  const visibleTools = robot.tools.slice(0, 3);
  
  for (const tool of visibleTools) {
    const toolInfo = ROBOT_TOOLS[tool];
    toolsHtml += `<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
      ${toolInfo?.icon || '🔧'} ${toolInfo?.name || tool}
    </span>`;
  }
  
  if (robot.tools.length > 3) {
    toolsHtml += `<span class="text-xs text-slate-500">+${robot.tools.length - 3} more</span>`;
  }
  
  return `
    <div class="robot-card cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md ${borderClass}"
         onclick="selectRobot('${key}')">
      <div class="flex items-center space-x-3">
        <div class="text-4xl">${robot.emoji}</div>
        <div>
          <h3 class="font-bold text-lg">${robot.name}</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            ${robot.traits.join(', ')}
          </p>
        </div>
      </div>
      <div class="mt-2 flex flex-wrap gap-1">
        ${toolsHtml}
      </div>
    </div>
  `;
}

// Helper function to generate tool badges
function generateToolBadges(tools) {
  const visibleTools = tools.slice(0, 3);
  let badges = '';
  
  for (const tool of visibleTools) {
    const toolInfo = ROBOT_TOOLS[tool];
    badges += `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      ${toolInfo?.icon || '🔧'} ${toolInfo?.name || tool}
    </span> `;
  }
  
  return badges.trim();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint to list all robots
    if (path === '/api/robots') {
      return new Response(JSON.stringify(ROBOT_PERSONALITIES), {
        headers: corsHeaders
      });
    }

    // API endpoint to list available models
    if (path === '/api/models') {
      return new Response(JSON.stringify(AI_MODELS), {
        headers: corsHeaders
      });
    }

    // API endpoint to list available tools
    if (path === '/api/tools') {
      return new Response(JSON.stringify(ROBOT_TOOLS), {
        headers: corsHeaders
      });
    }

    // Chat endpoint
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const { personality = 'friend', message, model } = await request.json();
        const robot = ROBOT_PERSONALITIES[personality];
        
        if (!robot) {
          return new Response(JSON.stringify({ error: 'Unknown robot personality' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const aiModel = model || robot.model;
        
        const prompt = robot.systemPrompt + '\\n\\nUser: ' + message + '\\n\\n' + robot.name + ':';

        const response = await env.AI.run(aiModel, {
          prompt: prompt,
          max_tokens: 256,
        });

        return new Response(JSON.stringify({
          personality: personality,
          response: robot.emoji + ' ' + response.response,
          emoji: robot.emoji,
          name: robot.name,
          model: aiModel,
          tools: robot.tools
        }), { headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Serve the shadcn-inspired chat interface
    if (path === '/' || path === '/chat') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Robot Brain - Chat with AI Robots</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out;
        }
        /* Ensure full height on mobile */
        html, body {
            height: 100%;
            overflow: hidden;
        }
        #app {
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        /* Smooth scrolling for chat */
        #chatMessages {
            scroll-behavior: smooth;
        }
        /* Touch-friendly tap targets */
        button, .robot-card {
            min-height: 44px;
            min-width: 44px;
        }
        /* Prevent text selection on double tap */
        * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        input, textarea {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 transition-colors">
    <div id="app" class="flex flex-col h-screen">
        <!-- Header -->
        <header class="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">🤖 Robot Brain</h1>
                        <p class="text-sm text-slate-600 dark:text-slate-400">Chat with AI Robot Friends!</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="toggleDarkMode()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <span id="darkModeIcon">🌙</span>
                        </button>
                        <button onclick="toggleDevMode()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-hidden flex flex-col">
            <!-- Robot Selection -->
            <div id="robotSelection" class="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h2 class="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Choose Your Robot Friend</h2>
                <div id="robotCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <!-- Robot cards will be generated here -->
                </div>
            </div>

            <!-- Chat Interface -->
            <div id="chatInterface" class="hidden flex-1 flex flex-col overflow-hidden">
                <!-- Chat Header -->
                <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <button onclick="backToSelection()" class="sm:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                ←
                            </button>
                            <h2 id="chatTitle" class="text-xl font-bold text-slate-900 dark:text-slate-100">Chat</h2>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span id="modelBadge" class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"></span>
                            <button onclick="backToSelection()" class="hidden sm:block px-3 py-1 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                                Change Robot
                            </button>
                        </div>
                    </div>
                    <div id="toolBadges" class="mt-2 flex flex-wrap gap-1">
                        <!-- Tool badges will be inserted here -->
                    </div>
                </div>

                <!-- Messages Area -->
                <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4">
                    <!-- Messages will be added here -->
                </div>

                <!-- Input Area -->
                <div class="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
                    <div class="flex space-x-2">
                        <input
                            type="text"
                            id="messageInput"
                            placeholder="Type your message..."
                            class="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            onkeypress="if(event.key === 'Enter') sendMessage()"
                        />
                        <button
                            onclick="sendMessage()"
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                        >
                            Send
                        </button>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2" id="quickActions">
                        <!-- Quick action buttons will be added based on robot tools -->
                    </div>
                </div>
            </div>
        </main>

        <!-- Developer Mode Panel -->
        <div id="devPanel" class="hidden fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 max-h-96 overflow-y-auto">
            <h3 class="font-bold mb-2 text-slate-900 dark:text-slate-100">Developer Mode</h3>
            <div class="space-y-3 text-sm">
                <div>
                    <h4 class="font-semibold text-slate-700 dark:text-slate-300">Current Models:</h4>
                    <div id="modelList" class="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                        <!-- Model list will be populated here -->
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-slate-700 dark:text-slate-300">Available Tools:</h4>
                    <div id="toolList" class="mt-1 grid grid-cols-2 gap-1 text-slate-600 dark:text-slate-400">
                        <!-- Tool list will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global state
        let currentRobot = 'friend';
        let devMode = false;
        const robots = ${JSON.stringify(ROBOT_PERSONALITIES)};
        const tools = {
            available: ${JSON.stringify(ROBOT_TOOLS)}
        };
        const models = {
            current: {}
        };

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            // Check for dark mode preference
            if (localStorage.getItem('darkMode') === 'true' || 
                (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.getElementById('darkModeIcon').textContent = '☀️';
            }
            
            renderRobotCards();
            updateDevPanel();
        });

        function renderRobotCards() {
            const container = document.getElementById('robotCards');
            container.innerHTML = '';
            
            for (const [key, robot] of Object.entries(robots)) {
                container.innerHTML += generateRobotCard(key, robot, currentRobot === key);
            }
        }

        function generateRobotCard(key, robot, isSelected) {
            const borderClass = isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
            
            let toolsHtml = '';
            const visibleTools = robot.tools.slice(0, 3);
            
            for (const tool of visibleTools) {
                const toolInfo = tools.available[tool];
                toolsHtml += '<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">' +
                    (toolInfo?.icon || '🔧') + ' ' + (toolInfo?.name || tool) +
                '</span>';
            }
            
            if (robot.tools.length > 3) {
                toolsHtml += '<span class="text-xs text-slate-500">+' + (robot.tools.length - 3) + ' more</span>';
            }
            
            return '<div class="robot-card cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md ' + borderClass + '"' +
                   ' onclick="selectRobot(\\'' + key + '\\')">' +
                   '<div class="flex items-center space-x-3">' +
                   '<div class="text-4xl">' + robot.emoji + '</div>' +
                   '<div>' +
                   '<h3 class="font-bold text-lg">' + robot.name + '</h3>' +
                   '<p class="text-sm text-slate-600 dark:text-slate-400">' +
                   robot.traits.join(', ') +
                   '</p>' +
                   '</div>' +
                   '</div>' +
                   '<div class="mt-2 flex flex-wrap gap-1">' +
                   toolsHtml +
                   '</div>' +
                   '</div>';
        }

        function generateToolBadges(toolsList) {
            const visibleTools = toolsList.slice(0, 3);
            let badges = '';
            
            for (const tool of visibleTools) {
                const toolInfo = tools.available[tool];
                badges += '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">' +
                    (toolInfo?.icon || '🔧') + ' ' + (toolInfo?.name || tool) +
                '</span> ';
            }
            
            return badges.trim();
        }

        function selectRobot(robotKey) {
            currentRobot = robotKey;
            const robot = robots[robotKey];
            models.current[robotKey] = robot.model;
            
            // Update UI
            document.getElementById('chatTitle').textContent = 'Chat with ' + robot.name;
            document.getElementById('modelBadge').textContent = 'Model: ' + robot.model.split('/').pop();
            
            // Update tool badges
            document.getElementById('toolBadges').innerHTML = generateToolBadges(robot.tools);
            
            // Show chat interface
            document.getElementById('robotSelection').classList.add('hidden');
            document.getElementById('chatInterface').classList.remove('hidden');
            
            // Clear previous messages
            document.getElementById('chatMessages').innerHTML = '';
            
            // Add welcome message
            addMessage(robot.emoji + ' Hi! I\\'m ' + robot.name + '! ' + getWelcomeMessage(robotKey), 'robot');
        }

        function getWelcomeMessage(robotKey) {
            const welcomeMessages = {
                friend: "I'm here to chat, tell jokes, and make you smile! What would you like to talk about? 😄",
                nerd: "Ready to explore fascinating topics and solve complex problems together! What shall we analyze? 🔬",
                zen: "Welcome, dear friend. Let us explore the depths of wisdom and find peace together. 🌸",
                pirate: "Ahoy there, matey! Ready for adventure on the high seas? What treasure shall we seek? 🏴‍☠️",
                drama: "Welcome to my grand stage! Every conversation is a performance! What dramatic tale shall we weave? 🎭"
            };
            return welcomeMessages[robotKey] || "Hello! How can I help you today?";
        }

        function backToSelection() {
            document.getElementById('robotSelection').classList.remove('hidden');
            document.getElementById('chatInterface').classList.add('hidden');
            renderRobotCards();
        }

        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDark);
            document.getElementById('darkModeIcon').textContent = isDark ? '☀️' : '🌙';
        }

        function toggleDevMode() {
            devMode = !devMode;
            document.getElementById('devPanel').classList.toggle('hidden');
            updateDevPanel();
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            const typingId = Date.now();
            addMessage('...', 'robot', typingId);
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        personality: currentRobot,
                        message: message,
                        model: devMode ? models.current[currentRobot] : undefined
                    })
                });
                
                const data = await response.json();
                
                // Remove typing indicator
                document.getElementById('msg-' + typingId)?.remove();
                
                // Add robot response
                addMessage(data.response, 'robot');
                
                // Update model badge if in dev mode
                if (devMode) {
                    document.getElementById('modelBadge').textContent = 'Model: ' + data.model.split('/').pop();
                }
            } catch (error) {
                document.getElementById('msg-' + typingId)?.remove();
                addMessage('❌ Sorry, I encountered an error. Please try again!', 'robot');
            }
        }

        function addMessage(text, sender, id) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex ' + (sender === 'user' ? 'justify-end' : 'justify-start') + ' animate-slide-up';
            if (id) messageDiv.id = 'msg-' + id;
            
            const bubble = document.createElement('div');
            bubble.className = 'max-w-[80%] px-4 py-2 rounded-2xl ' +
                (sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100');
            bubble.textContent = text;
            
            messageDiv.appendChild(bubble);
            const messagesContainer = document.getElementById('chatMessages');
            messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function updateDevPanel() {
            if (!devMode) return;
            
            // Model list
            let modelListHtml = '';
            for (const [robot, model] of Object.entries(models.current)) {
                modelListHtml += '<div class="flex justify-between">' +
                    '<span>' + robots[robot].emoji + ' ' + robot + '</span>' +
                    '<span class="text-xs text-slate-500">' + model.split('/').pop() + '</span>' +
                    '</div>';
            }
            document.getElementById('modelList').innerHTML = modelListHtml || '<div class="text-slate-500">No models loaded yet</div>';

            // Tool list
            let toolListHtml = '';
            for (const [key, tool] of Object.entries(tools.available)) {
                toolListHtml += '<div>' + tool.icon + ' ' + tool.name + '</div>';
            }
            document.getElementById('toolList').innerHTML = toolListHtml;
        }

        // Quick actions based on robot tools
        function generateQuickActions(robotKey) {
            const robot = robots[robotKey];
            const quickActionMap = {
                jokes: { text: "Tell me a joke!", icon: "😂" },
                calculate: { text: "Help me with math", icon: "🧮" },
                meditate: { text: "Guide meditation", icon: "🧘" },
                treasure_hunt: { text: "Start treasure hunt!", icon: "🗺️" },
                perform: { text: "Perform something!", icon: "🎭" }
            };
            
            let actionsHtml = '';
            for (const tool of robot.tools) {
                if (quickActionMap[tool]) {
                    const action = quickActionMap[tool];
                    actionsHtml += '<button onclick="sendQuickAction(\\'' + action.text + '\\')" ' +
                        'class="px-3 py-1 text-sm rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">' +
                        action.icon + ' ' + action.text +
                        '</button>';
                }
            }
            
            document.getElementById('quickActions').innerHTML = actionsHtml;
        }

        function sendQuickAction(text) {
            document.getElementById('messageInput').value = text;
            sendMessage();
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('chatInterface').classList.contains('hidden')) {
                backToSelection();
            }
        });
    </script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'healthy', robots: Object.keys(ROBOT_PERSONALITIES) }), {
        headers: corsHeaders
      });
    }

    // Default 404
    return new Response('Not Found', { status: 404 });
  }
};