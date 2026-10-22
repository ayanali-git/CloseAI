# CloseAI - AI-Powered Assistant

A comprehensive AI-powered assistant web application built with Next.js, Supabase, and modern AI APIs.

## Features

- **AI Chat Interface** - Interactive chat with advanced AI models
- **File Upload & Analysis** - Upload and analyze documents, images, and more
- **Image Generation** - Generate images from text prompts
- **Authentication** - Google OAuth and email/password login
- **Subscription Management** - Tiered pricing with Stripe integration
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Beautiful UI with theme switching
- **Chat History** - Persistent chat storage with search

## Tech Stack

- **Frontend**: Next.js 13, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Gemini API (configurable)
- **Payments**: Stripe
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google OAuth app (optional)
- Gemini API key
- Stripe account (for payments)

### 1. Clone and Install

```bash
git clone <your-repo>
cd closeAI
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the migration file in your Supabase SQL editor:
   ```sql
   -- Copy and run the contents of supabase/migrations/20250703171737_dark_fire.sql
   ```
3. Enable Google OAuth in Supabase Auth settings (optional)
4. Configure storage bucket permissions

### 4. API Keys Setup

#### Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` as `OPENAI_API_KEY`

#### Stripe (Optional)
1. Create a Stripe account
2. Get your test keys from the Stripe dashboard
3. Add them to your `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                   # Next.js 13 app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── chat/             # Main chat interface
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── lib/                 # Utility libraries
│   ├── ai-service.ts    # AI integration
│   ├── chat-service.ts  # Chat management
│   ├── file-service.ts  # File handling
│   └── supabase.ts      # Supabase client
├── hooks/               # Custom React hooks
└── supabase/           # Database migrations
```

## Key Features Implementation

### Authentication
- Supabase Auth with Google OAuth and email/password
- Protected routes and session management
- User profile management

### AI Integration
- Gemini API integration for text generation
- File analysis and context understanding
- Image generation (placeholder implementation)

### Database Schema
- Users/profiles with subscription tiers
- Chat and message storage
- File upload tracking
- Subscription management

### File Handling
- Supabase Storage for file uploads
- Support for images, documents, and text files
- File validation and size limits

### Subscription System
- Three tiers: Free, Pro, Ultra Pro
- Usage limits and quota tracking
- Stripe integration ready

## Usage Limits

### Free Plan (₹0/month)
- 10 AI conversations/day
- 5 image generations/day
- 10MB file upload limit

### Pro Plan (₹99/month)
- Unlimited AI conversations
- 100 image generations/day
- 50MB file upload limit

### Ultra Pro Plan (₹199/month)
- Unlimited everything
- 100MB file upload limit
- Priority support

## Deployment

The application is configured for deployment on Vercel:

```bash
npm run build
```

Make sure to set all environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.