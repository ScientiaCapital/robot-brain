# My Robot Brain 🤖🧠

**Build your own AI assistant that talks and thinks like you want it to!**

## What is this?

This is a super cool AI robot that you can talk to! It's like having your own personal assistant that:
- 💬 Talks back to you with a real voice
- 🎯 Remembers your conversations  
- 🎨 Can have different personalities (funny, helpful, smart, etc.)
- 🎵 Uses different voices (male, female, different accents)

## Cool Features ✨

### 🗣️ Voice Chat
- Talk to your robot and it talks back!
- Choose from different voices and personalities
- Works in your web browser - no downloads needed

### 🎭 Different Personalities  
You can make your robot:
- **Professional** - Like a business helper
- **Friendly** - Like your best friend
- **Educational** - Like a smart teacher
- **Cheerful** - Always happy and positive

### 🔧 Easy to Customize
- Change your robot's name
- Pick its personality
- Choose its voice
- All done with simple settings files!

## How to Get Started 🚀

### What You Need
- A computer with internet
- Basic computer skills (like copying and pasting)

### Step 1: Get the Code
```bash
# Download this project to your computer
git clone [your-repo-url]
cd my-robot-brain
```

### Step 2: Install It
```bash
# Install all the pieces it needs
npm install
```

### Step 3: Set It Up
```bash
# Copy the example settings
cp .env.example .env.local

# Set up the database (stores conversations)
npm run setup:database
```

### Step 4: Add Your API Keys
You need to get some free accounts:

1. **Anthropic** (for the brain): Go to anthropic.com and get a free API key
2. **ElevenLabs** (for the voice): Go to elevenlabs.io and get a free API key  
3. **Neon** (for memory): Go to neon.tech and get a free database

Put these keys in your `.env.local` file.

### Step 5: Start Your Robot!
```bash
# Turn on your robot
npm run dev
```

Go to `http://localhost:3000` in your browser and start talking to your robot! 🎉

## Customize Your Robot 🎨

### Change the Personality
Edit the file `config/agent.json`:
```json
{
  "agentName": "My Cool Robot",
  "personality": "friendly",
  "emoji": "😊",
  "welcomeMessage": "Hey there! I'm your new robot friend!"
}
```

### Pick a Different Voice
Look in `config/voices.json` to see all the voice options:
- Rachel (friendly female voice)
- Adam (professional male voice)  
- Bella (educational female voice)
- And more!

## How It Works 🛠️

```
You type/speak → Robot thinks → Robot responds with voice
     ↓              ↓                    ↓
  Your input → AI processes → Voice speaks back
```

Your robot uses:
- **Next.js** - The website framework
- **Anthropic** - The AI brain that thinks
- **ElevenLabs** - The voice that talks
- **Neon Database** - The memory that remembers

## Common Problems & Solutions 🔧

### Robot Won't Talk
- Check your ElevenLabs API key
- Make sure your browser allows microphone access

### Robot Won't Think  
- Check your Anthropic API key
- Make sure you have internet connection

### Can't Save Conversations
- Check your Neon database connection
- Run `npm run db:health` to test it

## Make It Your Own 🎯

### Easy Changes (No Coding!)
- Robot name and personality (edit `config/agent.json`)
- Voice selection (edit `config/agent.json`) 
- Welcome message (edit `config/agent.json`)

### Advanced Changes (Some Coding)
- Add new personalities (edit `config/personalities.json`)
- Change how the robot talks (edit the system prompts)
- Add new features (edit the React components)

## Deploy Your Robot Online 🌐

Want others to use your robot? Put it online!

```bash
# Deploy to Vercel (free hosting)
npm run deploy
```

Your robot will get its own website address that anyone can visit!

## What Makes This Special? ⭐

This isn't just another chatbot - it's designed to be:
- **Super Easy** - Even beginners can set it up
- **Totally Yours** - Customize everything without coding
- **Production Ready** - Works reliably and fast
- **Voice First** - Designed for talking, not just typing
- **Memory Powered** - Remembers your conversations

## Need Help? 🤝

- Check the `scripts/` folder for helpful tools
- Run `npm run db:health` to test your database
- Look at the example files for guidance
- All settings are in the `config/` folder

## Fun Ideas 💡

Make different robots for different things:
- **Study Buddy** - Helps with homework
- **Workout Coach** - Motivates you to exercise  
- **Story Teller** - Tells you bedtime stories
- **Language Teacher** - Helps you learn new languages
- **Game Master** - Plays text adventure games with you

## Technical Stuff (For Developers) 🔧

- Built with Next.js 15.4.5 and React 19.1.0
- TypeScript for reliable code
- Comprehensive testing and error handling
- Production-ready deployment automation
- Scalable database architecture with Neon PostgreSQL

---

**Ready to build your robot brain? Let's get started! 🚀🤖**