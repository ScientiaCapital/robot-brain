# My Robot Brain

**Build your own AI assistant that talks and thinks like you want it to!**

## What is this?

This is a super cool AI robot that you can talk to! It's like having your own personal assistant that:
- Talks back to you with a real voice
- Remembers your conversations
- Can have different personalities (funny, helpful, smart, etc.)
- Uses different voices

## Cool Features

### Voice Chat
- Talk to your robot and it talks back!
- Choose from different voices and personalities
- Works in your web browser - no downloads needed

### Different Personalities
You can make your robot:
- **Professional** - Like a business helper
- **Friendly** - Like your best friend
- **Educational** - Like a smart teacher
- **Cheerful** - Always happy and positive

### Easy to Customize
- Change your robot's name
- Pick its personality
- Choose its voice
- All done with simple settings files!

## How to Get Started

### What You Need
- A computer with internet
- Node.js 18+

### Step 1: Get the Code
```bash
git clone [your-repo-url]
cd robot-brain/ui
```

### Step 2: Install It
```bash
npm install
```

### Step 3: Set It Up
```bash
cp .env.example .env.local
# Fill in your API keys
```

### Step 4: Add Your API Keys
You need to get accounts for:

1. **Anthropic** (for the brain): Go to anthropic.com and get an API key
2. **Cartesia** (for the voice): Go to cartesia.ai and get an API key
3. **Supabase** (for memory): Go to supabase.com and create a project

Put these keys in your `.env.local` file:

```bash
ANTHROPIC_API_KEY=sk-ant-...
CARTESIA_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
```

### Step 5: Start Your Robot!
```bash
npm run dev
```

Go to `http://localhost:3000` in your browser and start talking to your robot!

## Customize Your Robot

### Change the Personality
Edit the file `config/agent.json`:
```json
{
  "agentName": "My Cool Robot",
  "personality": "friendly",
  "emoji": "",
  "welcomeMessage": "Hey there! I'm your new robot friend!"
}
```

### Pick a Different Voice
Configure voices in `config/voices.json` - Cartesia provides high-quality voice options.

## How It Works

```
You type/speak  Robot thinks  Robot responds with voice
     |              |                    |
  Your input  AI processes  Voice speaks back
```

Your robot uses:
- **Next.js 15.4.5** - The website framework
- **Anthropic** - The AI brain that thinks
- **Cartesia** - The voice that talks (sonic-2 model)
- **Supabase** - The database that remembers

## Common Problems & Solutions

### Robot Won't Talk
- Check your Cartesia API key
- Make sure your browser allows audio playback

### Robot Won't Think
- Check your Anthropic API key
- Make sure you have internet connection

### Can't Save Conversations
- Check your Supabase URL and keys
- Make sure the database tables exist

## Make It Your Own

### Easy Changes (No Coding!)
- Robot name and personality (edit `config/agent.json`)
- Voice selection (edit `config/agent.json`)
- Welcome message (edit `config/agent.json`)

### Advanced Changes (Some Coding)
- Add new personalities
- Change how the robot talks (edit the system prompts)
- Add new features (edit the React components)

## Deploy Your Robot Online

Want others to use your robot? Put it online!

```bash
# Deploy to Vercel (free hosting)
vercel --prod
```

Your robot will get its own website address that anyone can visit!

## What Makes This Special?

This isn't just another chatbot - it's designed to be:
- **Super Easy** - Even beginners can set it up
- **Totally Yours** - Customize everything without coding
- **Production Ready** - Works reliably and fast
- **Voice First** - Designed for talking, not just typing
- **Memory Powered** - Remembers your conversations

## Technical Stack

- Built with Next.js 15.4.5 and React 19.1.0
- TypeScript for reliable code
- Cartesia TTS for high-quality voice
- Supabase for serverless PostgreSQL
- Comprehensive testing and error handling

## Fun Ideas

Make different robots for different things:
- **Study Buddy** - Helps with homework
- **Workout Coach** - Motivates you to exercise
- **Story Teller** - Tells you bedtime stories
- **Language Teacher** - Helps you learn new languages
- **Game Master** - Plays text adventure games with you

---

**Ready to build your robot brain? Let's get started!**
