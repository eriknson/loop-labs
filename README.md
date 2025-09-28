# Loop - AI-Powered Calendar Intelligence

<img width="1978" height="1113" alt="loop-github-hero-final" src="https://github.com/user-attachments/assets/b4508e72-4ac3-4549-8e0d-ddb123865ccc" />

## Executive Summary
_Loop is a calendar intelligence app that transforms raw events into clarity. By connecting your Google Calendar, it uncovers trends, insights, and working style to make calendar management personal._

_Each week, Loop weaves your schedule into a digestible storyline and suggests upcoming events tailored to your interests, so your calendar becomes more than a log — it becomes guidance._

## Key Features

### 🧠 **Persona Generation**
- GPT-4o analyzes your calendar patterns to create a unique personality profile
- Identifies work-life balance, social patterns, and lifestyle insights
- Powers personalized recommendations and insights

### 📅 **Smart Event Recommendations**
- GPT-5 with web search finds exceptional events in your area
- Conflict detection marks events that don't fit your schedule as placeholders
- Automatically adds compatible events to your calendar
- Weekly organization with rich event details and source links

### 🤖 **AI Agent Integration feat. Beyond Presence**
- Creates a personalized AI agent
- Interactive conversational interface for digest exploration
- PDF knowledge base generation for agent context
- Video generation capabilities for enhanced digest delivery
- 30-minute session limits with intelligent conversation flow

### 🎯 **Weekly Digest Generation**
- AI-powered Sunday digest with personalized insights
- Audio version with a French accent (ElevenLabs)
- Real-time progress streaming during generation
- Unique shareable links for each digest
- Agent-powered interactive exploration

### 🔄 **Automated Workflows**
- Step-by-step pipeline: Calendar → Persona → Recommendations → Digest → Audio → Agent
- Automatic calendar integration for recommended events
- Smart conflict resolution and placeholder management
- AI agent creation and deployment

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4o, GPT-5 (with web search)
- **AI Agents**: Beyond Presence API for conversational agents
- **Authentication**: Google OAuth 2.0
- **Calendar**: Google Calendar API
- **Audio**: ElevenLabs v3 Alpha API
- **Styling**: Tailwind CSS with responsive design
- **Prototyping**: Initial mockups and prototype built with [Loveable](https://loveable.dev)

## Get Started

1. **Clone and install**
   ```bash
   git clone https://github.com/eriknson/loop-labs.git
   cd loop-labs
   npm install
   ```

2. **Set up environment**
   ```bash
   cp env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   BEYOND_PRESENCE_API_KEY=your_beyond_presence_api_key
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```
   
   Open `http://localhost:3000` (or the port shown in terminal)

## API Endpoints

- `GET /api/calendar` - Fetch calendar events
- `POST /api/persona` - Generate AI persona
- `POST /api/recommendations` - Find exceptional events with GPT-5
- `POST /api/calendar/events` - Add multiple events to calendar
- `POST /api/digest` - Generate weekly digest
- `POST /api/digest/audio/generate` - Create audio version
- `POST /api/digest/agent/create` - Create AI agent with Beyond Presence
- `GET /api/digest/agent/data` - Fetch agent data and conversation
- `POST /api/digest/agent/pdf` - Generate PDF knowledge base

## User Flow

1. **Connect Calendar** - Secure Google OAuth authentication
2. **AI Analysis** - GPT-4o creates your personality profile
3. **Smart Recommendations** - GPT-5 finds exceptional events in your area
4. **Auto-Integration** - Compatible events added to calendar automatically
5. **Weekly Digest** - Personalized insights with audio playback
6. **AI Agent Creation** - Beyond Presence creates "Marcel" agent for interactive exploration

## Project Structure

```
loop-labs/
├── app/
│   ├── api/                    # API routes
│   │   ├── recommendations/   # GPT-5 event recommendations
│   │   ├── calendar/          # Calendar integration
│   │   ├── persona/           # AI persona generation
│   │   └── digest/            # Weekly digest, audio & agent
│   │       ├── agent/         # Beyond Presence AI agents
│   │       └── audio/         # ElevenLabs audio generation
│   ├── dashboard/             # Main dashboard
│   └── page.tsx              # Landing page
├── components/               # React components
├── lib/                     # Utilities & services
└── types/                   # TypeScript definitions
```

## Privacy & Security

- Secure Google OAuth 2.0 authentication
- Calendar data processed locally and securely
- No data stored permanently
- Transparent privacy policy

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ using Next.js, OpenAI, and Google Calendar API**
