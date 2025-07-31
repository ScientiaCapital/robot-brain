// worker-simple.js - Simple AI Learning Platform

// Configuration - just like the Python agents
const OLLAMA_API = "http://localhost:11434/api/generate";

// Learning modules - each with a specific purpose
const LEARNING_MODULES = {
  coding: {
    name: "Code Helper",
    model: "@cf/mistral/mistral-7b-instruct-v0.1",
    localModel: "codestral:latest",
    emoji: "💻",
    modelInfo: {
      name: "Mistral 7B (Code Mode)",
      strengths: "Good at code generation, debugging, and technical explanations",
      bestFor: "Writing functions, debugging code, explaining algorithms",
      tips: "Be specific! Say the language and what the code should do",
      examples: ["Write a Python function to sort a list", "Fix this JavaScript error: [paste code]", "Explain how recursion works with examples"]
    },
    prompts: [
      "Write a Python function to ",
      "Explain this code: ",
      "Fix this bug: "
    ]
  },
  agent_coder: {
    name: "Codestral Agent",
    model: "@cf/mistral/mistral-7b-instruct-v0.1",
    localModel: "codestral:latest",
    emoji: "🤖💻",
    modelInfo: {
      name: "Codestral Developer Agent",
      strengths: "Writes complete code files, follows structured approach, saves to disk",
      bestFor: "Creating full programs, automating code tasks, building projects",
      tips: "Tell it what program you want to build!",
      examples: ["Create a calculator app", "Build a simple game", "Make a todo list program"]
    },
    prompts: [
      "Build a program that ",
      "Create an app to ",
      "Write code for "
    ],
    isAgent: true,
    agentType: "codestral-developer"
  },
  agent_crypto: {
    name: "Crypto Research",
    model: "@cf/mistral/mistral-7b-instruct-v0.1",
    localModel: "qwen2.5:14b",
    emoji: "📈🔍",
    modelInfo: {
      name: "Crypto Research Agent",
      strengths: "Fetches REAL live prices from CoinGecko API, analyzes trends with AI, shows market cap and 24h changes",
      bestFor: "Learning about cryptocurrency with real data, checking accurate prices, understanding market movements",
      tips: "Ask about any crypto! I show REAL prices + AI analysis. Data is live from CoinGecko!",
      examples: ["What's the price of bitcoin?", "How much is XRP worth?", "Show me ethereum price and analysis", "What's happening with solana today?"]
    },
    prompts: [
      "Research ",
      "What's the price of ",
      "Analyze "
    ],
    isAgent: true,
    agentType: "crypto-research"
  },
  math: {
    name: "Math Buddy",
    model: "@cf/deepseek-ai/deepseek-math-7b-instruct",
    localModel: "qwen2.5:7b",
    emoji: "🔢",
    modelInfo: {
      name: "DeepSeek Math / Qwen 2.5",
      strengths: "Specialized in mathematical reasoning, shows work step-by-step",
      bestFor: "Solving equations, explaining math concepts, word problems",
      tips: "Ask for steps! Say 'show your work' or 'explain each step'",
      examples: ["Solve step by step: 2x + 5 = 15", "Explain fractions using pizza examples", "A train travels 60mph for 2 hours, how far did it go?"]
    },
    prompts: [
      "Solve step by step: ",
      "Explain this math concept: ",
      "Help me with: "
    ]
  },
  story: {
    name: "Story Maker",
    model: "@cf/meta/llama-2-7b-chat-int8",
    localModel: "mistral:latest",
    emoji: "📚",
    modelInfo: {
      name: "Llama 2 / Mistral",
      strengths: "Creative writing, natural conversations, imagination",
      bestFor: "Stories, poems, creative ideas, general chat",
      tips: "Give details! Include characters, settings, or themes you want",
      examples: ["Write a story about a robot who loves pizza", "Create a haiku about coding", "Continue this story: The dragon found a smartphone..."]
    },
    prompts: [
      "Write a story about ",
      "Continue this story: ",
      "Create a character who "
    ]
  },
  learn: {
    name: "Learning Assistant",
    model: "@cf/mistral/mistral-7b-instruct-v0.1",
    localModel: "gemma2:latest",
    emoji: "🎓",
    modelInfo: {
      name: "Mistral / Gemma 2",
      strengths: "General knowledge, explains complex topics simply, good at teaching",
      bestFor: "Learning new topics, homework help, curious questions",
      tips: "Ask follow-up questions! Say 'tell me more' or 'why does that happen?'",
      examples: ["Explain photosynthesis like I'm 10", "Why is the sky blue?", "How do airplanes fly?"]
    },
    prompts: [
      "Teach me about ",
      "Explain like I'm 10: ",
      "What is "
    ]
  }
};

// Pre-defined responses for quick fallback (like in simple_api.py)
const FALLBACK_RESPONSES = {
  coding: [
    "Let me help you with that code! Can you be more specific?",
    "Coding is fun! What language are you learning?",
    "Here's a tip: Always test your code step by step!"
  ],
  math: [
    "Math is like a puzzle! What problem are you solving?",
    "Let's break this down step by step!",
    "Remember: Practice makes perfect in math!"
  ],
  story: [
    "Once upon a time... What happens next?",
    "Every great story needs a hero! Who's yours?",
    "Stories are magical! What genre do you like?"
  ],
  learn: [
    "Learning is an adventure! What interests you?",
    "Great question! Let me explain...",
    "The best way to learn is by asking questions!"
  ]
};

// Main worker - similar structure to the Python agents
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // Home endpoint - better browser detection
    if (path === '/') {
      const acceptHeader = request.headers.get('Accept') || '';
      const userAgent = request.headers.get('User-Agent') || '';
      
      // Check if this is a browser request
      const isBrowser = acceptHeader.includes('html') || 
                       userAgent.includes('Mozilla') || 
                       userAgent.includes('Chrome') || 
                       userAgent.includes('Safari') ||
                       userAgent.includes('Firefox') ||
                       userAgent.includes('Edge');
      
      if (isBrowser) {
        return new Response(SIMPLE_UI, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // API response for curl/programmatic access
      return new Response(JSON.stringify({
        message: "🚀 AI Learning Platform",
        modules: Object.keys(LEARNING_MODULES),
        endpoints: {
          "/": "GET - Web interface (browser) or API info (curl)",
          "/chat": "POST - Chat with AI",
          "/modules": "GET - List all modules",
          "/ui": "GET - Web interface"
        }
      }), { headers });
    }
    
    // List modules
    if (path === '/modules') {
      const modules = {};
      for (const [key, module] of Object.entries(LEARNING_MODULES)) {
        modules[key] = {
          name: module.name,
          emoji: module.emoji,
          prompts: module.prompts,
          modelInfo: module.modelInfo,
          isAgent: module.isAgent,
          agentType: module.agentType
        };
      }
      return new Response(JSON.stringify(modules), { headers });
    }
    
    // Debug endpoint
    if (path === '/debug' && request.method === 'POST') {
      const { module = 'learn', message } = await request.json();
      const selectedModule = LEARNING_MODULES[module];
      return new Response(JSON.stringify({
        module,
        selectedModule: {
          name: selectedModule?.name,
          isAgent: selectedModule?.isAgent,
          agentType: selectedModule?.agentType
        },
        checkResult: selectedModule?.isAgent && selectedModule?.agentType
      }), { headers });
    }
    
    // Crypto price endpoint - real data from CoinGecko
    if (path === '/api/crypto-price' && request.method === 'POST') {
      try {
        const { symbol } = await request.json();
        
        // Map common names to CoinGecko IDs
        const symbolMap = {
          'btc': 'bitcoin',
          'eth': 'ethereum', 
          'xrp': 'ripple',
          'ada': 'cardano',
          'doge': 'dogecoin',
          'sol': 'solana',
          'bnb': 'binancecoin',
          'matic': 'matic-network',
          'avax': 'avalanche-2',
          'dot': 'polkadot',
          'link': 'chainlink',
          'ltc': 'litecoin'
        };
        
        const geckoId = symbolMap[symbol.toLowerCase()] || symbol.toLowerCase();
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
        );
        
        const data = await response.json();
        
        if (data[geckoId]) {
          return new Response(JSON.stringify({
            success: true,
            symbol: geckoId,
            price: data[geckoId].usd,
            change24h: data[geckoId].usd_24h_change,
            marketCap: data[geckoId].usd_market_cap
          }), { headers });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: `Cryptocurrency ${symbol} not found`
          }), { headers });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch price data'
        }), { headers });
      }
    }
    
    // Chat endpoint
    if (path === '/chat' && request.method === 'POST') {
      try {
        const { module = 'learn', message } = await request.json();
        const selectedModule = LEARNING_MODULES[module] || LEARNING_MODULES.learn;
        
        // Check if this is an agent module
        if (selectedModule.isAgent && selectedModule.agentType) {
          // For crypto module on Cloudflare, always use real data
          if (selectedModule.agentType === 'crypto-research') {
            // Extract crypto symbol from message
            const cryptoMatch = message.toLowerCase().match(/bitcoin|btc|ethereum|eth|xrp|ripple|cardano|ada|dogecoin|doge|solana|sol|binance|bnb|polygon|matic|avalanche|avax|polkadot|dot|chainlink|link|litecoin|ltc/);
            
            if (cryptoMatch) {
              const symbolMap = {
                'bitcoin': 'btc', 'btc': 'btc',
                'ethereum': 'eth', 'eth': 'eth',
                'ripple': 'xrp', 'xrp': 'xrp',
                'cardano': 'ada', 'ada': 'ada',
                'dogecoin': 'doge', 'doge': 'doge',
                'solana': 'sol', 'sol': 'sol',
                'binance': 'bnb', 'bnb': 'bnb',
                'polygon': 'matic', 'matic': 'matic',
                'avalanche': 'avax', 'avax': 'avax',
                'polkadot': 'dot', 'dot': 'dot',
                'chainlink': 'link', 'link': 'link',
                'litecoin': 'ltc', 'ltc': 'ltc'
              };
              
              const symbol = symbolMap[cryptoMatch[0]] || cryptoMatch[0];
              
              // Fetch real price data
              const priceResponse = await fetch(url.origin + '/api/crypto-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
              });
              
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                
                if (priceData.success) {
                  // Create a comprehensive response with real data
                  let response = `${selectedModule.emoji} **Real-Time Crypto Data**\n\n`;
                  response += `💰 **${priceData.symbol.toUpperCase()}** Current Price: $${priceData.price.toLocaleString()}\n`;
                  response += `📊 24h Change: ${priceData.change24h > 0 ? '📈' : '📉'} ${priceData.change24h.toFixed(2)}%\n`;
                  response += `💎 Market Cap: $${(priceData.marketCap / 1000000000).toFixed(2)}B\n\n`;
                  
                  // Add AI analysis
                  const aiAnalysis = await env.AI.run(selectedModule.model, {
                    prompt: `Provide a brief market analysis for ${priceData.symbol} cryptocurrency. Current price: $${priceData.price}, 24h change: ${priceData.change24h}%. Keep it educational and suitable for beginners. Maximum 3 sentences.`,
                    max_tokens: 150
                  });
                  
                  response += `**AI Analysis**: ${aiAnalysis.response}\n\n`;
                  response += `📚 *Data source: Live market data from CoinGecko API*`;
                  
                  return new Response(JSON.stringify({
                    response,
                    module: selectedModule.name,
                    backend: "cloudflare-with-real-data",
                    priceData
                  }), { headers });
                }
              }
            } else {
              // No specific crypto detected, provide educational response
              const educationalResponse = await env.AI.run(selectedModule.model, {
                prompt: `The user asked about crypto: "${message}". Provide an educational response about cryptocurrency in general or suggest they ask about specific coins like Bitcoin, Ethereum, XRP, etc. Keep it beginner-friendly and mention that you can provide real prices when they name specific cryptocurrencies.`,
                max_tokens: 200
              });
              
              return new Response(JSON.stringify({
                response: `${selectedModule.emoji} ${educationalResponse.response}\n\n💡 *Tip: Ask me about specific cryptocurrencies like Bitcoin, Ethereum, XRP, Solana, etc. to get real-time prices and market data!*`,
                module: selectedModule.name,
                backend: "cloudflare-educational"
              }), { headers });
            }
          }
          
          // Try local agents for other types
          try {
            // Route to local Python agent
            const agentUrl = selectedModule.agentType === 'codestral-developer' 
              ? 'http://localhost:8001/agent/codestral'
              : 'http://localhost:8002/agent/crypto';
            
            const agentResponse = await fetch(agentUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ goal: message })
            });
            
            if (agentResponse.ok) {
              const data = await agentResponse.json();
              return new Response(JSON.stringify({
                response: `${selectedModule.emoji} ${data.result || data.analysis || 'Agent completed task!'}`,
                module: selectedModule.name,
                backend: "agent",
                agentOutput: data
              }), { headers });
            }
          } catch (e) {
            // Regular fallback for other agents
            return new Response(JSON.stringify({
              response: `${selectedModule.emoji} Agent simulation: I would ${message}. (Run Docker locally to use real agent!)`,
              module: selectedModule.name,
              backend: "simulation"
            }), { headers });
          }
        }
        
        // Regular module flow (non-agent)
        try {
          const ollamaResponse = await fetch(OLLAMA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: selectedModule.localModel,
              prompt: message,
              stream: false
            })
          });
          
          if (ollamaResponse.ok) {
            const data = await ollamaResponse.json();
            return new Response(JSON.stringify({
              response: `${selectedModule.emoji} ${data.response}`,
              module: selectedModule.name,
              backend: "local"
            }), { headers });
          }
        } catch (e) {
          // Continue to Cloudflare
        }
        
        // Use Cloudflare AI
        let finalPrompt = message;
        if (module === 'coding') {
          finalPrompt = `You are a helpful coding assistant. Please help with this programming request: ${message}`;
        }
        
        const aiResponse = await env.AI.run(selectedModule.model, {
          prompt: finalPrompt,
          max_tokens: 200
        });
        
        return new Response(JSON.stringify({
          response: `${selectedModule.emoji} ${aiResponse.response}`,
          module: selectedModule.name,
          backend: "cloudflare"
        }), { headers });
        
      } catch (error) {
        // Fallback to pre-defined responses
        const selectedModule = LEARNING_MODULES[module] || LEARNING_MODULES.learn;
        const responses = FALLBACK_RESPONSES[module] || FALLBACK_RESPONSES.learn;
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return new Response(JSON.stringify({
          response: `${selectedModule.emoji} ${randomResponse}`,
          module: selectedModule.name,
          backend: "fallback"
        }), { headers });
      }
    }
    
    // Simple HTML interface - serve at both root and /ui
    if (path === '/' || path === '/ui') {
      return new Response(SIMPLE_UI, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
};

// Super simple UI - just the essentials
const SIMPLE_UI = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Learning</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f8f9fa;
      color: #2c3e50;
    }
    h1 {
      text-align: center;
      color: #34495e;
      margin-bottom: 30px;
    }
    #modules {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .module-btn {
      background: #ffffff;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .module-btn:hover {
      border-color: #3498db;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .module-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }
    .module-emoji {
      font-size: 36px;
      display: block;
      margin-bottom: 8px;
    }
    .module-name {
      font-size: 14px;
      font-weight: 600;
      display: block;
    }
    .module-desc {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    #chat {
      background: #ffffff;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    #messages {
      height: 350px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      background: #fafbfc;
    }
    .message {
      margin: 10px 0;
      padding: 12px 16px;
      border-radius: 8px;
      max-width: 80%;
      word-wrap: break-word;
    }
    .user {
      background: #3498db;
      color: white;
      margin-left: auto;
      text-align: right;
    }
    .ai {
      background: #ecf0f1;
      color: #2c3e50;
    }
    .input-area {
      display: flex;
      gap: 10px;
    }
    input {
      flex: 1;
      padding: 12px 16px;
      font-size: 16px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.3s;
    }
    input:focus {
      border-color: #3498db;
    }
    button {
      padding: 12px 24px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      transition: background 0.3s;
    }
    button:hover {
      background: #2980b9;
    }
    .backend-info {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    }
    #model-info {
      background: #e8f4fd;
      border: 1px solid #bee5eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      display: none;
    }
    #model-info.active {
      display: block;
    }
    .model-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 12px;
    }
    .model-detail {
      margin: 8px 0;
      font-size: 14px;
      line-height: 1.6;
    }
    .model-label {
      font-weight: 600;
      color: #34495e;
    }
    .example-list {
      background: white;
      border-radius: 6px;
      padding: 12px;
      margin-top: 8px;
    }
    .example-item {
      margin: 4px 0;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 13px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>🚀 AI Learning Assistant</h1>
  <div id="modules"></div>
  <div id="chat">
    <div id="messages">
      <div class="message ai">
        Hi! I'm your AI Learning Assistant. Choose a topic above and ask me anything! 
        <div class="backend-info">Ready to help you learn!</div>
      </div>
    </div>
    <div class="input-area">
      <input id="input" placeholder="Ask me anything..." autofocus>
      <button onclick="send()">Send</button>
    </div>
  </div>
  
  <script>
    let currentModule = 'learn';
    
    // Module descriptions for clarity
    const moduleDescriptions = {
      coding: "Learn to code",
      agent_coder: "Build full programs",
      agent_crypto: "Real crypto prices",
      math: "Solve math problems", 
      story: "Create stories",
      learn: "Ask anything"
    };
    
    // Hardcode modules directly to avoid fetch issues
    const modules = {
      coding: { name: "Code Helper", emoji: "💻", prompts: ["Write a Python function to ", "Explain this code: ", "Fix this bug: "] },
      agent_coder: { name: "Codestral Agent", emoji: "🤖💻", prompts: ["Build a program that ", "Create an app to ", "Write code for "] },
      agent_crypto: { name: "Crypto Research", emoji: "📈🔍", prompts: ["Research ", "What's the price of ", "Analyze "] },
      math: { name: "Math Buddy", emoji: "🔢", prompts: ["Solve step by step: ", "Explain this math concept: ", "Help me with: "] },
      story: { name: "Story Maker", emoji: "📚", prompts: ["Write a story about ", "Continue this story: ", "Create a character who "] },
      learn: { name: "Learning Assistant", emoji: "🎓", prompts: ["Teach me about ", "Explain like I'm 10: ", "What is "] }
    };
    
    // Load modules immediately
    const div = document.getElementById('modules');
    for (const [key, module] of Object.entries(modules)) {
      const btn = document.createElement('div');
      btn.className = 'module-btn';
      if (key === 'learn') btn.classList.add('active');
      btn.innerHTML = '<span class="module-emoji">' + module.emoji + '</span>' +
                      '<span class="module-name">' + module.name + '</span>' +
                      '<div class="module-desc">' + (moduleDescriptions[key] || '') + '</div>';
      btn.onclick = () => {
        currentModule = key;
        document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show what this module is for
        addMessage('Switched to ' + module.name + '! ' + module.prompts[0] + '...', 'ai');
      };
      div.appendChild(btn);
    }
    
    function send() {
      const input = document.getElementById('input');
      const message = input.value.trim();
      if (!message) return;
      
      addMessage(message, 'user');
      input.value = '';
      
      fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: currentModule, message })
      })
      .then(r => r.json())
      .then(data => {
        const messageDiv = addMessage(data.response, 'ai');
        // Add backend info
        const backendDiv = document.createElement('div');
        backendDiv.className = 'backend-info';
        backendDiv.textContent = 'Powered by: ' + data.backend;
        messageDiv.appendChild(backendDiv);
        
        // If agent output includes code or analysis
        if (data.agentOutput && (data.agentOutput.code || data.agentOutput.analysis)) {
          const outputDiv = document.createElement('div');
          outputDiv.style.cssText = 'margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-family: monospace; font-size: 12px;';
          
          if (data.agentOutput.code) {
            outputDiv.innerHTML = '<strong>Generated Code:</strong><br><pre>' + escapeHtml(data.agentOutput.code) + '</pre>';
          } else if (data.agentOutput.analysis) {
            outputDiv.innerHTML = '<strong>Analysis:</strong><br>' + escapeHtml(data.agentOutput.analysis);
          }
          
          messageDiv.appendChild(outputDiv);
        }
        
        // If we have real price data, format it nicely
        if (data.priceData && data.priceData.success) {
          // Message already contains formatted data, but let's enhance display
          messageDiv.innerHTML = messageDiv.innerHTML.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          messageDiv.innerHTML = messageDiv.innerHTML.replace(/\n/g, '<br>');
          messageDiv.innerHTML = messageDiv.innerHTML.replace(/\*(.+?)\*/g, '<em>$1</em>');
        }
      })
      .catch(err => {
        addMessage('Oops! Something went wrong. Try again!', 'ai');
      });
    }
    
    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = 'message ' + type;
      div.textContent = text;
      document.getElementById('messages').appendChild(div);
      div.scrollIntoView({ behavior: 'smooth' });
      return div;
    }
    
    document.getElementById('input').onkeypress = (e) => {
      if (e.key === 'Enter') send();
    };
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function showModelInfo(module) {
      // Model info removed for simplicity
    }
  </script>
</body>
</html>`;