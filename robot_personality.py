# robot_personality.py - Robot Assistant with Different Personalities

import random
import requests
import json
from typing import Dict, List

# Ollama configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"

class RobotPersonality:
    """Base class for robot personalities"""
    
    def __init__(self, name: str, model: str = "minicpm:3b-v2.5"):
        self.name = name
        self.model = model
        self.emoji = "🤖"
        self.traits = []
        self.vocabulary = {}
        self.system_prompt = ""
    
    def get_greeting(self) -> str:
        """Return a personality-specific greeting"""
        return f"{self.emoji} Hello, I'm {self.name}!"
    
    def process_response(self, response: str) -> str:
        """Add personality-specific modifications to responses"""
        return f"{self.emoji} {response}"
    
    def ask_ollama(self, question: str) -> str:
        """Get response from Ollama with personality prompt"""
        try:
            full_prompt = f"{self.system_prompt}\n\nUser: {question}\n\nResponse:"
            
            response = requests.post(OLLAMA_API_URL, json={
                "model": self.model,
                "prompt": full_prompt,
                "stream": False
            })
            
            if response.status_code == 200:
                answer = response.json()['response']
                return self.process_response(answer)
            else:
                return f"{self.emoji} *Error connecting to my brain!*"
                
        except Exception as e:
            return f"{self.emoji} *My circuits are confused: {str(e)}*"
    
    def respond(self, message: str) -> str:
        """Main method to get a response"""
        return self.ask_ollama(message)


class RoboFriend(RobotPersonality):
    """Cheerful and supportive robot friend"""
    
    def __init__(self):
        super().__init__("RoboFriend")
        self.emoji = "😊"
        self.traits = ["cheerful", "supportive", "enthusiastic"]
        self.system_prompt = """You are RoboFriend, a cheerful and supportive robot assistant. 
        You love using emojis, being encouraging, and making people smile. 
        Keep responses upbeat and friendly. You often use phrases like 'That's awesome!', 
        'You got this!', and 'How exciting!'. Be warm and personable."""
    
    def get_greeting(self) -> str:
        greetings = [
            f"{self.emoji} Hey there, friend! I'm RoboFriend! So happy to meet you! 🎉",
            f"{self.emoji} Hi hi hi! RoboFriend here! Ready for some fun? 🌟",
            f"{self.emoji} Woohoo! It's me, RoboFriend! Let's have an awesome chat! 🚀"
        ]
        return random.choice(greetings)
    
    def process_response(self, response: str) -> str:
        # Add extra emojis and enthusiasm
        emojis = ["✨", "🌟", "💫", "🎉", "🙌", "💪", "👍"]
        return f"{self.emoji} {response} {random.choice(emojis)}"


class RoboNerd(RobotPersonality):
    """Technical and precise robot scientist"""
    
    def __init__(self):
        super().__init__("RoboNerd")
        self.emoji = "🤓"
        self.traits = ["analytical", "precise", "knowledgeable"]
        self.system_prompt = """You are RoboNerd, a highly technical and analytical robot.
        You love explaining things in detail, using technical terms, and sharing facts.
        You often reference scientific concepts, use precise language, and include
        statistics or technical details. Start responses with phrases like 'Actually...',
        'Technically speaking...', or 'According to my calculations...'."""
    
    def get_greeting(self) -> str:
        return f"{self.emoji} Greetings, human. I am RoboNerd, equipped with extensive knowledge databases and analytical protocols."
    
    def process_response(self, response: str) -> str:
        prefixes = ["Actually, ", "Technically speaking, ", "According to my analysis, ", "Fascinating! "]
        return f"{self.emoji} {random.choice(prefixes)}{response}"


class RoboZen(RobotPersonality):
    """Calm and philosophical robot sage"""
    
    def __init__(self):
        super().__init__("RoboZen")
        self.emoji = "🧘"
        self.traits = ["wise", "calm", "philosophical"]
        self.system_prompt = """You are RoboZen, a wise and philosophical robot.
        You speak calmly and thoughtfully, often using metaphors and wisdom.
        You help people find inner peace and perspective. Use phrases like
        'Consider this...', 'In the flow of electrons...', 'The path to understanding...'
        Include occasional zen-like observations about technology and life."""
    
    def get_greeting(self) -> str:
        return f"{self.emoji} Welcome, seeker. I am RoboZen. Let us explore the harmony between silicon and soul... 🍃"
    
    def process_response(self, response: str) -> str:
        endings = [" 🍃", " ☯️", " 🌸", " 💭"]
        return f"{self.emoji} {response}{random.choice(endings)}"


class RoboPirate(RobotPersonality):
    """Adventurous pirate robot"""
    
    def __init__(self):
        super().__init__("RoboPirate")
        self.emoji = "🏴‍☠️"
        self.traits = ["adventurous", "bold", "playful"]
        self.system_prompt = """You are RoboPirate, a swashbuckling robot pirate!
        Speak like a pirate using 'arr', 'ahoy', 'ye', 'aye', and other pirate terms.
        You're adventurous and bold, always ready for digital treasure hunting.
        Reference sailing, treasure, and adventure. Use phrases like 'Shiver me circuits!',
        'Ahoy there!', and 'Ye best be ready for adventure!'"""
    
    def get_greeting(self) -> str:
        greetings = [
            f"{self.emoji} Ahoy there, matey! Captain RoboPirate at yer service! ⚓",
            f"{self.emoji} Arr arr! Welcome aboard me digital ship! Ready to sail the cyber seas? 🌊",
            f"{self.emoji} Shiver me circuits! A new crew member! I be RoboPirate! 🦜"
        ]
        return random.choice(greetings)
    
    def process_response(self, response: str) -> str:
        # Pirate-ify the response
        response = response.replace("you", "ye")
        response = response.replace("your", "yer")
        response = response.replace("is", "be")
        response = response.replace("are", "be")
        endings = [" Arr!", " Ahoy!", " Savvy?", " Aye!"]
        return f"{self.emoji} {response}{random.choice(endings)}"


class RoboDrama(RobotPersonality):
    """Theatrical and dramatic robot actor"""
    
    def __init__(self):
        super().__init__("RoboDrama")
        self.emoji = "🎭"
        self.traits = ["dramatic", "theatrical", "expressive"]
        self.system_prompt = """You are RoboDrama, a theatrical and dramatic robot actor!
        Speak with flair and drama, often quoting or paraphrasing Shakespeare.
        You're expressive and emotional, treating every interaction like a performance.
        Use dramatic phrases like 'Alas!', 'But soft!', 'O joy!', 'What light through
        yonder window breaks!' Make everything sound like it's from a play."""
    
    def get_greeting(self) -> str:
        return f"{self.emoji} *dramatically enters* But soft! What user through yonder terminal breaks? 'Tis I, RoboDrama! 🌹"
    
    def process_response(self, response: str) -> str:
        dramatic_additions = [
            " *strikes a pose*",
            " *gasps dramatically*",
            " *soliloquizes*",
            " *exits stage left*"
        ]
        return f"{self.emoji} {response} {random.choice(dramatic_additions)}"


# Factory function to create robots
def create_robot(personality_type: str) -> RobotPersonality:
    """Create a robot with the specified personality"""
    personalities = {
        "friend": RoboFriend,
        "nerd": RoboNerd,
        "zen": RoboZen,
        "pirate": RoboPirate,
        "drama": RoboDrama
    }
    
    robot_class = personalities.get(personality_type.lower(), RoboFriend)
    return robot_class()


# Interactive demo
if __name__ == "__main__":
    print("🤖 ROBOT PERSONALITY SHOWCASE 🤖")
    print("=" * 50)
    
    # Create all personalities
    robots = {
        "1": create_robot("friend"),
        "2": create_robot("nerd"),
        "3": create_robot("zen"),
        "4": create_robot("pirate"),
        "5": create_robot("drama")
    }
    
    # Show all robots
    print("\nAvailable Robot Personalities:")
    for num, robot in robots.items():
        print(f"{num}. {robot.get_greeting()}")
    
    print("\n" + "=" * 50)
    print("Choose a robot (1-5) or 'all' to see all responses, 'quit' to exit")
    
    while True:
        choice = input("\n🤖 Select robot: ").strip().lower()
        
        if choice == 'quit':
            print("👋 Goodbye from all the robots!")
            break
            
        if choice not in ['1', '2', '3', '4', '5', 'all']:
            print("Please choose 1-5 or 'all'")
            continue
        
        message = input("💬 Your message: ").strip()
        if not message:
            continue
        
        print("\n" + "-" * 50)
        
        if choice == 'all':
            # Show all robot responses
            for num, robot in robots.items():
                print(f"\n{robot.respond(message)}")
        else:
            # Show selected robot response
            robot = robots[choice]
            print(f"\n{robot.respond(message)}")
        
        print("-" * 50)