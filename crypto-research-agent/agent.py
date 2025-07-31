# agent.py - Crypto Research Agent

import requests
import json
from tools import (
    get_crypto_price, 
    get_historical_prices, 
    calculate_technical_indicator, 
    get_market_news,
    generate_market_report
)

# --- Agent Configuration ---
OLLAMA_API_URL = "http://localhost:11434/api/generate"
AGENT_BRAIN_MODEL = "qwen2.5:14b"  # Good for analysis, you can also try "internlm2:7b"

# System prompt that teaches the LLM to be a crypto research agent
SYSTEM_PROMPT = """
You are an expert cryptocurrency research agent. You analyze market data and provide insights.
You have access to these tools:
- get_crypto_price(symbol): Get current price and 24h change
- get_historical_prices(symbol, days): Get historical price data
- calculate_technical_indicator(data, indicator_name, period): Calculate SMA or RSI
- get_market_news(symbol, limit): Get recent news headlines
- generate_market_report(symbol): Generate a comprehensive report

When asked to research a cryptocurrency, respond in this JSON format:
{
  "analysis_plan": [
    {"tool": "tool_name", "parameters": {...}},
    ...
  ],
  "final_summary": "Your analysis summary after gathering all data"
}

IMPORTANT: Use lowercase symbol names like 'bitcoin', 'ethereum', 'cardano' etc.
"""

def execute_tool(tool_name: str, parameters: dict):
    """Execute a tool with given parameters."""
    if tool_name == "get_crypto_price":
        return get_crypto_price(parameters.get("symbol", ""))
    elif tool_name == "get_historical_prices":
        return get_historical_prices(
            parameters.get("symbol", ""),
            parameters.get("days", 20)
        )
    elif tool_name == "calculate_technical_indicator":
        return calculate_technical_indicator(
            parameters.get("data", []),
            parameters.get("indicator_name", "sma"),
            parameters.get("period", 20)
        )
    elif tool_name == "get_market_news":
        return get_market_news(
            parameters.get("symbol", ""),
            parameters.get("limit", 3)
        )
    elif tool_name == "generate_market_report":
        return generate_market_report(parameters.get("symbol", ""))
    else:
        return {"error": f"Unknown tool: {tool_name}"}

def run_research_agent(research_goal: str):
    """Run the crypto research agent."""
    print(f"🔬 Research Goal: {research_goal}\n")
    
    # Step 1: Ask the brain to create an analysis plan
    full_prompt = f"{SYSTEM_PROMPT}\n\nResearch Goal: {research_goal}"
    
    print("🧠 Creating research plan...\n")
    
    response = requests.post(OLLAMA_API_URL, json={
        "model": AGENT_BRAIN_MODEL,
        "prompt": full_prompt,
        "stream": False,
        "format": "json"
    })
    
    if response.status_code != 200:
        print(f"❌ Error from Ollama: {response.text}")
        return
    
    # Parse the plan
    try:
        plan = json.loads(response.json()['response'])
        analysis_plan = plan.get("analysis_plan", [])
    except (json.JSONDecodeError, KeyError) as e:
        # If JSON parsing fails, try a simpler approach
        print("📊 Executing standard analysis...\n")
        
        # Extract symbol from the goal (simple parsing)
        symbol = "bitcoin"  # default
        goal_lower = research_goal.lower()
        for crypto in ["bitcoin", "ethereum", "cardano", "solana", "polkadot"]:
            if crypto in goal_lower:
                symbol = crypto
                break
        
        # Execute standard analysis
        print(generate_market_report(symbol))
        return
    
    # Step 2: Execute each tool in the plan
    results = []
    for step in analysis_plan:
        tool = step.get("tool")
        params = step.get("parameters", {})
        
        print(f"🛠️  Executing: {tool} with {params}")
        result = execute_tool(tool, params)
        results.append({"tool": tool, "result": result})
        print(f"✅ Result: {result}\n")
    
    # Step 3: Present final summary
    if "final_summary" in plan:
        print("\n📈 FINAL ANALYSIS:")
        print("=" * 50)
        print(plan["final_summary"])

def run_simple_research(symbol: str):
    """Run a simple research query with predefined steps."""
    print(f"\n🚀 Running Simple Research for {symbol.upper()}\n")
    
    # 1. Get current price
    print("💰 Current Market Data:")
    price_data = get_crypto_price(symbol)
    if "price" in price_data:
        print(f"   Price: ${price_data['price']:,.2f}")
        print(f"   24h Change: {price_data['change_24h']:.2f}%\n")
    
    # 2. Get technical indicators
    print("📊 Technical Analysis:")
    historical = get_historical_prices(symbol, 20)
    if historical:
        sma = calculate_technical_indicator(historical, "sma", 20)
        if "value" in sma:
            print(f"   20-day SMA: ${sma['value']:,.2f}")
            print(f"   Position: {'Above' if sma['above_indicator'] else 'Below'} SMA")
        
        rsi = calculate_technical_indicator(historical, "rsi", 14)
        if "value" in rsi:
            status = "Neutral"
            if rsi['overbought']:
                status = "Overbought ⚠️"
            elif rsi['oversold']:
                status = "Oversold 🔥"
            print(f"   14-day RSI: {rsi['value']:.2f} ({status})\n")
    
    # 3. Get news
    print("📰 Recent Headlines:")
    news = get_market_news(symbol, 3)
    for i, article in enumerate(news, 1):
        print(f"   {i}. {article['headline']}")
    
    print("\n" + "="*50)

# --- Main execution ---
if __name__ == "__main__":
    # Example 1: Complex research query
    complex_goal = """
    What is the current price of Bitcoin (BTC-USDT)? 
    Is it above its 20-day simple moving average? 
    And what are the top 3 recent news headlines about it?
    """
    
    print("=== CRYPTO RESEARCH AGENT ===\n")
    
    # Try the AI-powered research
    # run_research_agent(complex_goal)
    
    # Or use the simple direct approach
    run_simple_research("bitcoin")
    
    print("\n💡 Try other cryptocurrencies: ethereum, cardano, solana, polkadot")