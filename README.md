# VoiceNews

VoiceNews is an AI-powered, voice-first news application that transforms how users consume daily news. It provides a conversational interface for discovering news, automated daily email briefings, and a streaming intelligence pipeline for real-time natural language processing.

## Table of Contents

1. Project Overview
2. Tech Stack Overview
3. Monorepo Structure
4. Core Features
5. Prerequisites
6. Installation
7. Environment Variables
8. Database Setup
9. Running the Application
10. Default Seed Credentials
11. API Overview
12. Available Scripts
13. Future Scope

## Project Overview

VoiceNews provides an entirely conversational way to discover news. The platform handles complex user voice requests through a hybrid architecture:

- **Client-Side Routing**: Instant execution of standard commands (e.g., "go back", "history").
- **AI Intelligence Pipeline**: Streaming LLM classification for dynamic intents, search optimizations, and audio summaries via Server-Sent Events (SSE).
- **Automated Briefings**: A scheduled cron job that compiles daily personalized news digests and emails them to users.

The system is split into a React frontend and an Express + MongoDB backend.

## Tech Stack Overview

### Frontend

- React 19 (Vite)
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Web Speech API (VAD & TTS)
- Context API (Session & Auth state)

### Backend

- Node.js + Express 5
- TypeScript
- MongoDB + Mongoose
- Upstash QStash (Cron scheduling & Webhooks)
- Resend (Email delivery for daily briefings)
- Upstash Redis (API Rate limiting)
- Groq AI (`whisper-large-v3-turbo` for transcription, `llama-3.1-8b-instant` for NLP)
- GNews API (News Aggregation)
- Google Auth Library (OAuth token verification)
- bcrypt + jsonwebtoken (`httpOnly` secure cookies)

## Monorepo Structure

```text
voice-news-reader/
	backend/
		src/
			controllers/
			middleware/
			models/
			routes/
			services/
			validation/
	frontend/
		src/
			components/
			context/
			hooks/
			pages/
			services/
			validation/
```

## Core Features

- **Daily Email Briefings (Cron Jobs)**: Uses Upstash QStash to trigger daily cron webhooks (`/api/briefing/cron/trigger`). The backend securely verifies the QStash signature, generates personalized LLM summaries for each user based on their topic preferences, and emails them via Resend.
- **Two-Level Processing**: Simple commands execute instantly on the frontend, while conversational fallbacks are intelligently parsed by the LLM (e.g., classifying "skip this one" as a `next` intent).
- **Real-Time SSE AI Pipeline**: The backend dynamically infers intent, optimizes queries, fetches news, and streams summaries in real-time.
- **Secure Authentication**: Uses `httpOnly` secure cookies for JWTs and supports seamless Google OAuth integration.
- **Personalized Feeds**: Users define topic preferences during onboarding to curate a custom dashboard feed.
- **Saved Collections**: Users can bookmark articles and manage collections.
- **Distraction-Free Reader**: A clean reader mode with a floating Text-to-Speech (TTS) action button.

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance (local or Atlas)
- Upstash Redis Account (for rate limiting)
- Upstash QStash Account (for cron briefings)
- Resend API Key (for email delivery)
- Groq API Key
- GNews API Key
- Google Cloud Console Project (for OAuth)

## Installation

From the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

Copy the example configuration files and update the values.

### backend/.env

```env
PORT=5000
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<db>"
JWT_SECRET="your_super_secret_jwt_string_here"

# APIs
GROQ_API_KEY="gsk_your_groq_key_here"
GNEWS_API_KEY="your_gnews_api_key_here"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id_here"

# Rate Limiting
REDIS_URL="rediss://default:password@host:port"

# Email Briefings & Cron
RESEND_API_KEY="re_your_resend_key_here"
RESEND_FROM_EMAIL="onboarding@resend.dev"
QSTASH_CURRENT_SIGNING_KEY="your_qstash_current_key"
QSTASH_NEXT_SIGNING_KEY="your_qstash_next_key"
```

### frontend/.env

```env
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
```

## Database Setup

VoiceNews uses MongoDB. No strict schema push is required like SQL databases. Ensure your `MONGO_URI` is correct, and Mongoose will handle collection creation automatically upon connection and data insertion.

## Running the Application

Use two terminals.

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Application URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Default Seed Credentials

There are no default seed credentials configured out-of-the-box for VoiceNews. 
To access the platform, start the application and use the Registration UI or Google Sign-In to create a new user account.

## API Overview

Base URL: `/api`

### Authentication (`/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Authenticate user via credentials | Public |
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/google` | Authenticate via Google OAuth | Public |
| POST | `/auth/logout` | Clear httpOnly auth cookies | Public |
| GET | `/auth/me` | Fetch active user session | Authenticated |

### Stream Pipeline (`/stream`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/stream/search` | SSE endpoint for full AI NLP pipeline | Authenticated |

### Briefings & Cron (`/briefing`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/briefing/latest` | Fetch the user's latest daily briefing | Authenticated |
| POST | `/briefing/generate` | Manually generate a briefing | Authenticated |
| PUT | `/briefing/settings` | Update email delivery preferences | Authenticated |
| POST | `/briefing/cron/trigger` | QStash Webhook for daily emails | QStash Only |

### History (`/history`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/history` | Get user's search history | Authenticated |
| POST | `/history` | Save a search to history | Authenticated |

### Saved Articles (`/saved-articles`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/saved-articles` | Retrieve bookmarked articles | Authenticated |
| POST | `/saved-articles` | Bookmark an article | Authenticated |
| DELETE | `/saved-articles/:id` | Remove a bookmark | Authenticated |

### Intent & Transcription (`/intent`, `/transcribe`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/transcribe` | Whisper VAD transcription | Authenticated |
| POST | `/intent` | Standalone LLM intent routing | Authenticated |

## Available Scripts

### backend/package.json

- `npm run dev` - start backend in watch mode with tsx.
- `npm run build` - compile TypeScript to JavaScript.

### frontend/package.json

- `npm run dev` - start Vite development server.
- `npm run build` - create production build.
- `npm run preview` - preview production build locally.
- `npm run lint` - run ESLint.

## Future Scope

- **Podcast Generation**
  - Convert daily email briefings into an automated daily podcast using advanced Text-to-Speech models.
- **Advanced Personalization Analytics**
  - Track user reading habits to automatically refine topic preferences and adjust LLM system prompts per user.
- **Comprehensive Testing**
  - Implement full E2E testing for the real-time SSE pipeline and Playwright testing for voice workflows.
- **Docker Integration**
  - Add Docker Compose configurations for seamless local deployment of MongoDB, Redis, and Node containers.
