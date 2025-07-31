import requests
import json

# The address of your local Ollama "vending machine"
OLLAMA_API_URL = "http://localhost:11434/api/chat"

def ask_robot_brain(model_name, question):
    """
    Sends a question to a specific LLM model running in Ollama.
    
    Args:
        model_name (str): The name of the model to use (e.g., 'codestral', 'minicpm').
        question (str): The question you want to ask the model.
        
    Returns:
        str: The model's answer.
    """
    print(f"-> Asking '{model_name}' a question...")
    
    try:
        # This is the "payload" or the data we send to the API
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": question
                }
            ],
            "stream": False  # We want the full answer at once
        }

        # Send the request to the Ollama server
        response = requests.post(OLLAMA_API_URL, json=payload)
        
        # Check if the request was successful
        response.raise_for_status() 

        # Parse the JSON response and get the actual message content
        response_data = response.json()
        answer = response_data['choices'][0]['message']['content']
        
        return answer

    except requests.exceptions.RequestException as e:
        return f"Error connecting to Ollama: {e}"
    except KeyError:
        return "Error: Received an unexpected response format from Ollama."


# --- This is where we run our code ---
if __name__ == "__main__":
    # 1. Let's ask our coding model to write some code
    code_question = "Write a simple Python function that adds two numbers together."
    code_answer = ask_robot_brain("codestral", code_question)
    print("\n[Codestral's Answer]:\n" + "="*20)
    print(code_answer)
    print("="*20 + "\n")

    # 2. Now let's ask our general-purpose model a question
    general_question = "What are the three most interesting facts about the Great Wall of China?"
    general_answer = ask_robot_brain("internlm2:7b", general_question)
    print("\n[InternLM's Answer]:\n" + "="*20)
    print(general_answer)
    print("="*20 + "\n")

    # 3. Finally, let's ask the super-efficient model a simple question
    simple_question = "Explain what a computer CPU does, in one sentence."
    simple_answer = ask_robot_brain("minicpm:3b-v2.5", simple_question)
    print("\n[MiniCPM's Answer]:\n" + "="*20)
    print(simple_answer)
    print("="*20 + "\n")