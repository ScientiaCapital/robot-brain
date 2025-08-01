# agent.py

import requests
import json
from tools import write_code_to_file # Import our tool

# --- The Agent's Configuration ---
OLLAMA_API_URL = "http://localhost:11434/api/generate"
AGENT_BRAIN_MODEL = "codestral:latest" # Let's use the best coding model you have!

# This is the "System Prompt" that teaches the LLM how to be an agent.
SYSTEM_PROMPT = """
You are an expert software developer agent. Your goal is to help the user write code.
You have access to a specific tool: `write_code_to_file`.

When the user asks you to write code, you MUST respond in the following JSON format ONLY.
Do not write any other text, explanations, or introductions.

{
  "tool_to_use": "write_code_to_file",
  "parameters": {
    "filename": "path/to/the/file.py",
    "code": "the python code you generated"
  }
}
"""

def run_agent(goal: str):
    """
    Runs the agent loop for a given goal.
    """
    print(f"> Agent Goal: {goal}")

    # 1. Ask the Brain (LLM) what to do.
    # We combine the system prompt with the user's goal.
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser's Goal: {goal}"
    
