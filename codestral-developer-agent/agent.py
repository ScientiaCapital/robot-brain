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
    
    print(">à Thinking... Asking Codestral for a plan...")
    
    response = requests.post(OLLAMA_API_URL, json={
        "model": AGENT_BRAIN_MODEL,
        "prompt": full_prompt,
        "stream": False,
        "format": "json" # We specifically ask for JSON output
    })
    
    if response.status_code != 200:
        print(f"L Error from Ollama: {response.text}")
        return

    # 2. Parse the Brain's response
    try:
        response_json = json.loads(response.json()['response'])
        tool_name = response_json.get("tool_to_use")
        parameters = response_json.get("parameters")
    except (json.JSONDecodeError, KeyError) as e:
        print(f"L Could not understand the Brain's plan: {e}")
        print(f"Raw response: {response.json()['response']}")
        return

    # 3. Execute the tool from the Toolbelt
    print(f"=à Using tool: '{tool_name}' with parameters: {parameters}")
    
    if tool_name == "write_code_to_file":
        result = write_code_to_file(parameters['filename'], parameters['code'])
        print(f" Result: {result}")
    else:
        print(f"L Unknown tool: {tool_name}")

# --- Let's run our agent! ---
if __name__ == "__main__":
    user_goal = "Create a simple Flask web server in a file called 'app.py' that returns 'Hello, Robot Brain!' at the root URL."
    run_agent(user_goal)