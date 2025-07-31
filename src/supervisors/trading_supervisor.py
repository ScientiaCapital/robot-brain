"""
TradingSupervisor - specialized supervisor for trading teams.
"""

from typing import Dict, Any
from src.langgraph_supervisor import VerticalSupervisor


class TradingSupervisor(VerticalSupervisor):
    """Supervisor specifically for trading teams."""
    
    def __init__(self, agents: Dict[str, Any], config: Dict[str, Any]):
        # Set vertical to trading
        config_with_vertical = config.copy()
        config_with_vertical["vertical"] = "trading"
        super().__init__("trading", agents, config_with_vertical)
    
    async def analyze_stock(self, symbol: str) -> Dict[str, Any]:
        """Analyze a stock symbol using the trading team."""
        query = f"Analyze {symbol} for trading opportunity"
        result = await self.execute(query)
        
        # Extract and format analysis
        analysis = result.get("analysis", {})
        
        return {
            "symbol": symbol,
            "market_sentiment": analysis.get("market_sentiment", "neutral"),
            "technical_analysis": analysis.get("technical_analysis", ""),
            "risk_assessment": analysis.get("risk_assessment", {"position_size": 0}),
            "recommendation": "BUY" if "bullish" in str(analysis) else "HOLD",
            "confidence": analysis.get("confidence", 0.5)
        }