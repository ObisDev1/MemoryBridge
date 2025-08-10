# MemoryBridge PWA

A gamified prospective memory training platform that helps users strengthen their ability to maintain intentions through digital distractions.

## Features

- 🧠 **Memory Training Games** - Interactive games targeting prospective memory
- 📱 **Progressive Web App** - Works offline with native app-like experience
- 🎯 **Adaptive Difficulty** - AI-powered difficulty adjustment based on performance
- 👥 **Social Features** - Friend challenges and leaderboards
- 📊 **Analytics Dashboard** - Detailed progress tracking and insights
- 🔔 **Smart Notifications** - Contextual reminders and challenges

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for server state management
- **Zustand** for client state management

### Backend
- **Supabase** for backend-as-a-service
- **PostgreSQL** database with Row Level Security
- **Supabase Auth** for authentication
- **Supabase Realtime** for live features
- **Edge Functions** for serverless logic

### PWA Features
- **Workbox** for service worker management
- **IndexedDB** for offline storage
- **Push Notifications** for engagement
- **Background Sync** for offline data sync

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase CLI (optional for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MemoryBridge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Supabase project URL and anon key.

4. Start the development server:
```bash
npm run dev
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations:
```bash
# Using Supabase CLI
supabase db push

# Or copy the SQL from supabase/migrations/20240101000000_initial_schema.sql
# and run it in your Supabase SQL editor
```

3. Update your `.env` file with your project credentials

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── game/           # Game-related components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point

supabase/
├── migrations/         # Database migrations
├── functions/          # Edge functions
└── config.toml        # Supabase configuration
```

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your preferred hosting platform

### Supabase Deployment

1. Push database changes:
```bash
supabase db push
```

2. Deploy edge functions:
```bash
supabase functions deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.