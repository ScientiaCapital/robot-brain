# multi_robot_chat.py - Multiple Robot Personalities Chatting

import time
import random
from typing import List, Dict, Tuple
from robot_personality import (
    RobotPersonality, 
    create_robot,
    RoboFriend, 
    RoboNerd, 
    RoboZen, 
    RoboPirate, 
    RoboDrama
)

class RobotChatRoom:
    """Manages conversations between multiple robot personalities"""
    
    def __init__(self):
        self.robots: Dict[str, RobotPersonality] = {}
        self.conversation_history: List[Tuple[str, str]] = []
        self.topic = ""
    
    def add_robot(self, robot_type: str, name: str = None):
        """Add a robot to the chat room"""
        robot = create_robot(robot_type)
        if name:
            robot.name = name
        self.robots[robot.name] = robot
        return robot
    
    def robot_discussion(self, topic: str, rounds: int = 3):
        """Have robots discuss a topic"""
        self.topic = topic
        self.conversation_history = []
        
        print(f"\n🎭 ROBOT ROUNDTABLE DISCUSSION 🎭")
        print(f"Topic: {topic}")
        print("=" * 60)
        
        # Initial responses
        print("\n📢 Opening Statements:")
        for robot_name, robot in self.robots.items():
            response = robot.respond(f"What are your thoughts on {topic}?")
            self.conversation_history.append((robot_name, response))
            print(f"\n{response}")
            time.sleep(1)  # Dramatic pause
        
        # Discussion rounds
        for round_num in range(1, rounds + 1):
            print(f"\n\n💬 Discussion Round {round_num}:")
            print("-" * 40)
            
            # Each robot responds to previous comments
            robot_names = list(self.robots.keys())
            random.shuffle(robot_names)  # Random order each round
            
            for robot_name in robot_names:
                robot = self.robots[robot_name]
                
                # Pick a previous comment to respond to
                if len(self.conversation_history) > 1:
                    prev_speaker, prev_comment = random.choice(self.conversation_history[-3:])
                    if prev_speaker != robot_name:
                        prompt = f"Respond to what {prev_speaker} said: '{prev_comment[:100]}...'"
                    else:
                        prompt = f"Add more thoughts about {topic}"
                else:
                    prompt = f"Share more thoughts about {topic}"
                
                response = robot.respond(prompt)
                self.conversation_history.append((robot_name, response))
                print(f"\n{response}")
                time.sleep(1)
        
        # Closing thoughts
        print(f"\n\n🎬 Closing Thoughts:")
        print("-" * 40)
        for robot_name, robot in self.robots.items():
            response = robot.respond(f"Give your final thought on {topic} in one sentence.")
            print(f"\n{response}")
            time.sleep(0.5)
        
        print("\n" + "=" * 60)
        print("🎭 END OF DISCUSSION 🎭\n")
    
    def robot_debate(self, topic: str, team1: List[str], team2: List[str]):
        """Have two teams of robots debate"""
        print(f"\n⚔️ ROBOT DEBATE ARENA ⚔️")
        print(f"Topic: {topic}")
        print(f"Team 1: {', '.join(team1)}")
        print(f"Team 2: {', '.join(team2)}")
        print("=" * 60)
        
        # Opening arguments
        print("\n🎯 Opening Arguments:")
        
        print("\n[Team 1 - Supporting]")
        for robot_name in team1:
            if robot_name in self.robots:
                response = self.robots[robot_name].respond(
                    f"Argue IN FAVOR of: {topic}. Be passionate!"
                )
                print(f"\n{response}")
                time.sleep(1)
        
        print("\n\n[Team 2 - Opposing]")
        for robot_name in team2:
            if robot_name in self.robots:
                response = self.robots[robot_name].respond(
                    f"Argue AGAINST: {topic}. Be convincing!"
                )
                print(f"\n{response}")
                time.sleep(1)
        
        # Rebuttal round
        print("\n\n🔥 Rebuttal Round:")
        print("-" * 40)
        
        all_debaters = team1 + team2
        random.shuffle(all_debaters)
        
        for robot_name in all_debaters:
            if robot_name in self.robots:
                team = "supporting" if robot_name in team1 else "opposing"
                response = self.robots[robot_name].respond(
                    f"Defend your {team} position on {topic} and counter the other side's arguments!"
                )
                print(f"\n{response}")
                time.sleep(1)
        
        print("\n" + "=" * 60)
        print("⚔️ DEBATE CONCLUDED ⚔️\n")
    
    def robot_brainstorm(self, problem: str):
        """Have robots brainstorm solutions together"""
        print(f"\n💡 ROBOT BRAINSTORMING SESSION 💡")
        print(f"Problem: {problem}")
        print("=" * 60)
        
        ideas = []
        
        # Each robot contributes ideas
        print("\n🧠 Initial Ideas:")
        for robot_name, robot in self.robots.items():
            response = robot.respond(
                f"Suggest a creative solution to: {problem}. Be innovative!"
            )
            ideas.append((robot_name, response))
            print(f"\n{response}")
            time.sleep(1)
        
        # Build on each other's ideas
        print("\n\n🔄 Building on Ideas:")
        print("-" * 40)
        
        for i, (original_robot, original_idea) in enumerate(ideas):
            # Another robot builds on this idea
            other_robots = [name for name in self.robots.keys() if name != original_robot]
            if other_robots:
                builder_name = random.choice(other_robots)
                builder = self.robots[builder_name]
                
                response = builder.respond(
                    f"Build upon {original_robot}'s idea: '{original_idea[:100]}...'"
                )
                print(f"\n{response}")
                time.sleep(1)
        
        print("\n" + "=" * 60)
        print("💡 BRAINSTORMING COMPLETE 💡\n")


def demo_conversations():
    """Run various demo conversations"""
    
    # Create chat room
    chat_room = RobotChatRoom()
    
    # Add all robot personalities
    chat_room.add_robot("friend")
    chat_room.add_robot("nerd")
    chat_room.add_robot("zen")
    chat_room.add_robot("pirate")
    chat_room.add_robot("drama")
    
    print("🤖 MULTI-ROBOT CHAT SYSTEM 🤖")
    print("Watch different robot personalities interact!\n")
    
    while True:
        print("\nChoose an interaction type:")
        print("1. Discussion - All robots discuss a topic")
        print("2. Debate - Two teams argue opposing sides")
        print("3. Brainstorm - Robots collaborate on solutions")
        print("4. Custom - You control the conversation")
        print("5. Quick Demo - See all interaction types")
        print("6. Exit")
        
        choice = input("\nYour choice (1-6): ").strip()
        
        if choice == "1":
            topic = input("Enter discussion topic: ").strip()
            if topic:
                chat_room.robot_discussion(topic, rounds=2)
        
        elif choice == "2":
            topic = input("Enter debate topic: ").strip()
            if topic:
                # Random team assignment
                all_names = list(chat_room.robots.keys())
                random.shuffle(all_names)
                mid = len(all_names) // 2
                team1 = all_names[:mid]
                team2 = all_names[mid:]
                chat_room.robot_debate(topic, team1, team2)
        
        elif choice == "3":
            problem = input("Enter problem to solve: ").strip()
            if problem:
                chat_room.robot_brainstorm(problem)
        
        elif choice == "4":
            print("\nCustom conversation mode:")
            print("Type 'exit' to return to menu")
            print("Format: <robot_name>: <message>")
            print(f"Available robots: {', '.join(chat_room.robots.keys())}")
            
            while True:
                user_input = input("\n> ").strip()
                if user_input.lower() == 'exit':
                    break
                
                if ':' in user_input:
                    robot_name, message = user_input.split(':', 1)
                    robot_name = robot_name.strip()
                    message = message.strip()
                    
                    if robot_name in chat_room.robots:
                        response = chat_room.robots[robot_name].respond(message)
                        print(f"\n{response}")
                    else:
                        print(f"Unknown robot: {robot_name}")
                else:
                    # Broadcast to all robots
                    print("\n[Broadcasting to all robots]")
                    for robot_name, robot in chat_room.robots.items():
                        response = robot.respond(user_input)
                        print(f"\n{response}")
                        time.sleep(0.5)
        
        elif choice == "5":
            # Quick demo of all features
            print("\n🎬 QUICK DEMO MODE 🎬")
            
            # Discussion
            chat_room.robot_discussion("the future of AI and robots", rounds=1)
            input("\nPress Enter to continue to debate...")
            
            # Debate
            chat_room.robot_debate(
                "robots should have emotions",
                ["RoboFriend", "RoboDrama"],
                ["RoboNerd", "RoboPirate", "RoboZen"]
            )
            input("\nPress Enter to continue to brainstorming...")
            
            # Brainstorm
            chat_room.robot_brainstorm("how to make humans and robots better friends")
            
            print("\n🎬 DEMO COMPLETE! 🎬")
        
        elif choice == "6":
            print("\n👋 All robots say goodbye!")
            for robot_name, robot in chat_room.robots.items():
                print(f"{robot.emoji} {robot_name}: Farewell, human friend!")
            break
        
        else:
            print("Invalid choice. Please select 1-6.")


if __name__ == "__main__":
    demo_conversations()