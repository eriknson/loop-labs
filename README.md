# Loop - AI-Powered Calendar Intelligence Platform

<img width="1675" height="1042" alt="Screenshot 2025-09-28 at 14 31 00" src="https://github.com/user-attachments/assets/dec1e951-cb97-4c22-aff4-47540ca52419" />

Transform your calendar from a scheduling tool into a personalized life assistant powered by AI.

## 🚀 Features

- **Google OAuth Integration**: Secure authentication with Google Calendar access
- **AI-Powered Persona Generation**: GPT-4 analyzes your calendar patterns to create a unique persona profile
- **Personalized Morning Brief**: Daily briefs with weather, news, opportunities, and reminders
- **Audio Digest**: Text-to-speech digest generation with Marcel's French accent via ElevenLabs
- **Real-time Progress Logs**: Live streaming updates showing each step of GPT-5 digest generation
- **Smart Loading Comments**: Witty AI commentary during calendar analysis
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: Google OAuth 2.0
- **AI**: OpenAI GPT-4 & GPT-4o-mini
- **Text-to-Speech**: ElevenLabs v3 Alpha API with French accent voice (ID: sa2z6gEuOalzawBHvrCV)
- **Calendar**: Google Calendar API
- **Styling**: Tailwind CSS with custom gradients and animations

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Console project with Calendar API enabled
- OpenAI API key
- ElevenLabs API key
- Google OAuth 2.0 credentials

## ⚙️ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/eriknson/loop-labs.git
   cd loop-labs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Google Cloud Console Setup**
   - Create a new project or use existing one
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized origins: `http://localhost:3000`, `http://localhost:3001`
   - Add authorized redirect URIs: `http://localhost:3000/api/auth/callback`, `http://localhost:3001/api/auth/callback`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🎯 User Flow

1. **Landing Page**: Clean, minimal design with Google sign-in
2. **Authentication**: Secure Google OAuth flow
3. **Loading Screen**: AI-generated witty comments while analyzing calendar
4. **Dashboard**: Personalized persona profile and morning brief

## 📁 Project Structure

```
loop-labs/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/google/   # Google OAuth handler
│   │   ├── calendar/     # Calendar data fetching
│   │   ├── persona/      # Persona generation
│   │   └── brief/        # Morning brief generation
│   ├── dashboard/        # Main dashboard page
│   └── page.tsx         # Landing page
├── components/           # React components
│   ├── LandingHero.tsx  # Landing page hero section
│   ├── LoadingScreen.tsx # Loading animation with AI comments
│   ├── PersonaDisplay.tsx # Persona profile display
├── lib/                 # Utility libraries
│   ├── google-auth.ts   # Google OAuth utilities
│   ├── calendar-service.ts # Calendar data processing
│   └── (removed - using Persona API instead)
├── types/               # TypeScript type definitions
│   ├── calendar.ts     # Calendar-related types
│   └── persona.ts      # Persona-related types
└── loop-project-spec.md # Detailed project specification
```

## 🔧 API Endpoints

- `POST /api/auth/google` - Handle Google OAuth callback
- `GET /api/calendar` - Fetch user's calendar events
- `POST /api/persona` - Generate AI persona from calendar data
- `POST /api/digest` - Generate Sunday digest with unique audio link
- `POST /api/digest/stream` - Generate digest with real-time progress streaming
- `GET /api/digest/audio/[id]` - Fetch digest by ID
- `POST /api/digest/audio/generate` - Generate audio version of digest

## 🎨 Key Features

### Smart Loading Comments
- Generates witty comments based on actual calendar patterns
- No API dependency - works locally for reliability
- Cycles through comments every 2 seconds during loading

### AI Persona Generation
- Analyzes calendar patterns using GPT-4
- Creates detailed personality profiles
- Identifies work-life balance, social patterns, and lifestyle insights

### Personalized Morning Brief
- Weather information
- Industry and hobby news
- Today's opportunities
- Discover section
- Personalized reminders

### Audio Digest Feature
- Unique subpage for each digest (`/digest/audio/[id]`)
- Text-to-speech generation using ElevenLabs v3 Alpha API
- French accent voice with enhanced audio tags (Voice ID: sa2z6gEuOalzawBHvrCV)
- Big play button for easy audio playback
- Audio stored as base64 data URLs for immediate playback

### Real-time Progress Logs
- Live streaming updates during GPT-5 digest generation
- Step-by-step progress indicators (parsing, validation, prompt loading, etc.)
- Visual progress bar with percentage completion
- Real-time status updates with timestamps
- Error handling with detailed feedback
- Server-Sent Events (SSE) for efficient streaming

## 🚧 Development Notes

- Uses Next.js App Router for modern routing
- Implements proper error handling and loading states
- Safe property access with optional chaining
- Responsive design with mobile-first approach
- TypeScript for type safety

## 📝 Environment Variables

See `env.example` for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Project Specification](./loop-project-spec.md)
- [Setup Guide](./SETUP.md)

---

Built with ❤️ using Next.js, OpenAI, and Google Calendar API
