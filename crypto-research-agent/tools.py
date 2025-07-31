# tools.py - Crypto Research Tools

import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Free API endpoints (no key required)
COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"
NEWSAPI_CRYPTO = "https://cryptonews-api.com/api/v1/category"  # Example news API

def get_crypto_price(symbol: str) -> Dict[str, float]:
    """
    Get current price and 24h change for a cryptocurrency.
    Symbol format: 'bitcoin', 'ethereum', etc. (CoinGecko IDs)
    """
    try:
        # CoinGecko API for simple price
        url = f"{COINGECKO_API_BASE}/simple/price"
        params = {
            "ids": symbol.lower(),
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        if symbol.lower() in data:
            return {
                "price": data[symbol.lower()]["usd"],
                "change_24h": data[symbol.lower()].get("usd_24h_change", 0)
            }
        else:
            return {"error": f"Symbol {symbol} not found"}
            
    except Exception as e:
        return {"error": f"Failed to fetch price: {str(e)}"}

def get_historical_prices(symbol: str, days: int = 20) -> List[float]:
    """
    Get historical daily prices for calculating moving averages.
    Returns list of closing prices (oldest to newest).
    """
    try:
        url = f"{COINGECKO_API_BASE}/coins/{symbol.lower()}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": str(days),
            "interval": "daily"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        # Extract just the prices (not timestamps)
        prices = [price[1] for price in data["prices"]]
        return prices
        
    except Exception as e:
        print(f"Error fetching historical prices: {e}")
        return []

def calculate_technical_indicator(data: List[float], indicator_name: str, period: int = 20) -> Dict[str, float]:
    """
    Calculate technical indicators from price data.
    Supported indicators: 'sma' (Simple Moving Average), 'rsi' (Relative Strength Index)
    """
    if not data or len(data) < period:
        return {"error": "Insufficient data for calculation"}
    
    if indicator_name.lower() == "sma":
        # Simple Moving Average
        sma = sum(data[-period:]) / period
        current_price = data[-1]
        return {
            "indicator": "SMA",
            "period": period,
            "value": round(sma, 2),
            "current_price": round(current_price, 2),
            "above_indicator": current_price > sma
        }
    
    elif indicator_name.lower() == "rsi":
        # Relative Strength Index (simplified version)
        if len(data) < period + 1:
            return {"error": "Need at least 21 days of data for RSI"}
            
        gains = []
        losses = []
        
        for i in range(1, period + 1):
            change = data[-i] - data[-(i+1)]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
        return {
            "indicator": "RSI",
            "period": period,
            "value": round(rsi, 2),
            "overbought": rsi > 70,
            "oversold": rsi < 30
        }
    
    else:
        return {"error": f"Unknown indicator: {indicator_name}"}

def get_market_news(symbol: str, limit: int = 3) -> List[Dict[str, str]]:
    """
    Get recent news headlines about a cryptocurrency.
    Note: This is a mock implementation. In production, you'd use a real news API.
    """
    # For demo purposes, we'll use CoinGecko's trending data as "news"
    try:
        # Get trending coins as a proxy for "news"
        url = f"{COINGECKO_API_BASE}/search/trending"
        response = requests.get(url)
        response.raise_for_status()
        
        # Mock news based on actual market data
        news = []
        news.append({
            "headline": f"{symbol.upper()} shows significant market activity",
            "summary": f"Trading volume and interest in {symbol} continues to fluctuate",
            "timestamp": datetime.now().isoformat()
        })
        
        # Add price-based "news"
        price_data = get_crypto_price(symbol)
        if "price" in price_data:
            change = price_data.get("change_24h", 0)
            if change > 5:
                news.append({
                    "headline": f"{symbol.upper()} surges {change:.1f}% in 24 hours",
                    "summary": "Bullish momentum drives prices higher",
                    "timestamp": datetime.now().isoformat()
                })
            elif change < -5:
                news.append({
                    "headline": f"{symbol.upper()} drops {abs(change):.1f}% in 24 hours",
                    "summary": "Market correction sees prices decline",
                    "timestamp": datetime.now().isoformat()
                })
                
        news.append({
            "headline": f"Technical analysis update for {symbol.upper()}",
            "summary": "Traders watching key support and resistance levels",
            "timestamp": datetime.now().isoformat()
        })
        
        return news[:limit]
        
    except Exception as e:
        return [{
            "headline": "News service temporarily unavailable",
            "summary": str(e),
            "timestamp": datetime.now().isoformat()
        }]

def generate_market_report(symbol: str) -> str:
    """
    Generate a comprehensive market report for a cryptocurrency.
    """
    report = f"=== Market Report for {symbol.upper()} ===\n\n"
    
    # Get current price
    price_data = get_crypto_price(symbol)
    if "price" in price_data:
        report += f"Current Price: ${price_data['price']:,.2f}\n"
        report += f"24h Change: {price_data['change_24h']:.2f}%\n\n"
    
    # Get technical indicators
    historical = get_historical_prices(symbol, 20)
    if historical:
        sma = calculate_technical_indicator(historical, "sma", 20)
        if "value" in sma:
            report += f"20-day SMA: ${sma['value']:,.2f}\n"
            report += f"Price vs SMA: {'Above' if sma['above_indicator'] else 'Below'} SMA\n"
        
        rsi = calculate_technical_indicator(historical, "rsi", 14)
        if "value" in rsi:
            report += f"14-day RSI: {rsi['value']:.2f}"
            if rsi['overbought']:
                report += " (Overbought)"
            elif rsi['oversold']:
                report += " (Oversold)"
            report += "\n\n"
    
    # Get news
    news = get_market_news(symbol, 3)
    if news:
        report += "Recent News:\n"
        for i, article in enumerate(news, 1):
            report += f"{i}. {article['headline']}\n"
    
    return report

# Test function
if __name__ == "__main__":
    print("Testing crypto tools...\n")
    
    # Test Bitcoin price
    btc_price = get_crypto_price("bitcoin")
    print(f"Bitcoin price: {btc_price}\n")
    
    # Test technical indicators
    btc_history = get_historical_prices("bitcoin", 20)
    if btc_history:
        sma = calculate_technical_indicator(btc_history, "sma")
        print(f"Bitcoin SMA: {sma}\n")
    
    # Generate full report
    print(generate_market_report("bitcoin"))