# Voice News Reader

AI-powered voice news application that lets users speak commands, fetch live news, and listen to top headlines. The platform combines speech transcription, LLM-based intent routing, authenticated history tracking, and text-to-speech playback.

## Table of Contents

1. Overview
2. Key Features
3. Tech Stack
4. Architecture
5. Project Structure
6. Prerequisites
7. Environment Variables
8. Local Development Setup
9. Available Scripts
10. API Reference
11. Voice Command Examples
12. Troubleshooting
13. Security Notes
14. Future Improvements

## Overview

Voice News Reader provides a hands-free way to discover news:

- Users register and log in with JWT-based authentication.
- Users hold the microphone button to record voice input.
- Audio is sent to the backend and transcribed using Groq Whisper.
- The transcribed text is analyzed using Groq Llama for intent classification.
- If intent is search, the app fetches live headlines from GNews.
- Searches are saved to personal history in MongoDB.
- Top headlines can be read aloud using the browser Web Speech API.

## Key Features

- Voice-first interaction model with push-to-talk recording.
- AI intent routing with structured JSON output.
- Secure user authentication with bcrypt + JWT.
- Google sign-in/sign-up with server-side ID token verification.
- Protected routes for dashboard and history.
- Search history persistence per user.
- Live news fetching using GNews API.
- Text-to-speech playback for top story summaries.
- Responsive React frontend with modern UI styling.

## Tech Stack

| Layer           | Technologies                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite, React Router, Axios, Tailwind utility classes    |
| Backend         | Node.js, Express 5, TypeScript, MongoDB, Mongoose                            |
| AI Services     | Groq Whisper (`whisper-large-v3-turbo`), Groq Llama (`llama-3.1-8b-instant`) |
| External Data   | GNews API                                                                    |
| Auth & Security | bcrypt, jsonwebtoken, Google Identity Services                               |
| File Upload     | multer                                                                       |

## Architecture

1. User records audio from the frontend.
2. Frontend sends `multipart/form-data` to `/api/transcribe`.
3. Backend transcribes audio via Groq Whisper.
4. Frontend checks quick navigation intents (`history`, `dashboard`) and otherwise sends text to `/api/intent`.
5. Backend returns structured intent JSON: `action` + `topic`.
6. If `action=search`, frontend fetches articles from GNews.
7. Backend stores search query in `/api/history`.
8. Frontend reads top headline aloud using Web Speech API.

## Project Structure

```text
voice-news-reader/
|-- backend/
|   |-- src/
|   |   |-- controllers/      # Auth and history controller logic
|   |   |-- middleware/       # JWT auth middleware
|   |   |-- models/           # Mongoose schemas
|   |   |-- routes/           # API route definitions
|   |   |-- db.ts             # MongoDB connection
|   |   |-- index.ts          # Express app bootstrap
|   |-- package.json
|
|-- frontend/
|   |-- src/
|   |   |-- components/       # Reusable UI components
|   |   |-- context/          # Auth context and provider
|   |   |-- pages/            # Route-level pages
|   |   |-- services/         # Axios backend client + GNews client
|   |   |-- App.tsx           # Router + app shell
|   |-- package.json
|
|-- uploads/                  # Temporary audio uploads (backend)
|-- README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance (local or Atlas)
- Groq API key
- GNews API key
- Modern browser with microphone permission enabled

## Environment Variables

Create a `.env` file in each app folder.

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-strong-random-secret
GOOGLE_CLIENT_ID=your_google_web_client_id
GROQ_API_KEY=gsk_your_groq_key
```

### Frontend (`frontend/.env`)

```env
VITE_NEWS_API_KEY=your_gnews_api_key
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
```

Important:

- Frontend backend base URL is currently hardcoded as `http://localhost:5000/api`.
- Update `frontend/src/services/api.ts` for staging or production deployments.
- Use the same Google web client ID for `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
- In Google Cloud Console, add your frontend origin (for example `http://localhost:5173`) to Authorized JavaScript origins.

## Local Development Setup

### 1. Clone repository

```bash
git clone <your-repository-url>
cd voice-news-reader
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Start backend

```bash
cd ../backend
npm run dev
```

Backend runs on `http://localhost:5000`.

### 5. Start frontend

```bash
cd ../frontend
npm run dev
```

Frontend runs on Vite default port (usually `http://localhost:5173`).

### 6. Use the app

1. Register a new account.
2. Log in.
3. Open Dashboard.
4. Press and hold the mic button to speak.
5. Release to process intent and navigate/search.

## Available Scripts

### Backend scripts

- `npm run dev` - run backend in watch mode using `tsx`.
- `npm run build` - compile TypeScript backend with `tsc`.

### Frontend scripts

- `npm run dev` - start Vite development server.
- `npm run build` - compile TypeScript and build production assets.
- `npm run preview` - preview production build locally.
- `npm run lint` - run ESLint.

## API Reference

Base URL: `http://localhost:5000/api`

### Auth

#### POST `/auth/register`

Registers a new user.

Request body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "message": "User created successfully"
}
```

#### POST `/auth/login`

Logs in user and returns JWT.

Request body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "token": "<jwt>",
  "email": "user@example.com"
}
```

#### POST `/auth/google`

Authenticates a user using a Google ID token. Creates the account if it does not already exist.

Request body:

```json
{
  "credential": "<google-id-token>"
}
```

Response:

```json
{
  "token": "<jwt>",
  "email": "user@example.com",
  "authProvider": "google"
}
```

### History (Protected)

Auth header required:

```text
Authorization: Bearer <jwt>
```

#### POST `/history`

Saves a query to user history.

Request body:

```json
{
  "query": "artificial intelligence"
}
```

#### GET `/history`

Returns user query history sorted newest first.

### Intent (Protected)

#### POST `/intent`

Classifies user query into `search`, `history`, or `unknown`.

Request body:

```json
{
  "query": "show me the latest on electric vehicles"
}
```

Example response:

```json
{
  "action": "search",
  "topic": "electric vehicles"
}
```

### Transcription (Protected)

#### POST `/transcribe`

Transcribes audio using Groq Whisper.

Content type: `multipart/form-data`

Field:

- `audio` (file)

Example response:

```json
{
  "text": "show me latest space news"
}
```

## Voice Command Examples

- "Show me the latest tech news"
- "Find updates about electric cars"
- "Take me to my history"
- "Go to dashboard"
- "What is happening in artificial intelligence?"

## Troubleshooting

### Microphone does not record

- Ensure browser microphone permissions are allowed.
- Use HTTPS or localhost origin.
- Confirm device input is available and not blocked by OS settings.

### Backend returns unauthorized

- Confirm user is logged in and token exists in local storage.
- Confirm `JWT_SECRET` is set in backend `.env`.

### No news results returned

- Verify `VITE_NEWS_API_KEY` is valid.
- Check API usage quota in GNews dashboard.
- Try broader search terms.

### Mongo connection errors

- Verify `MONGO_URI` format and credentials.
- Ensure IP allowlist/network access is configured (Atlas).
- Confirm database service is running (local MongoDB).

### Groq API errors

- Verify `GROQ_API_KEY` in backend `.env`.
- Check Groq service status and model availability.

## Security Notes

- Use strong `JWT_SECRET` values in all environments.
- Never commit `.env` files to source control.
- Enforce HTTPS in production.
- Consider implementing rate limiting and request validation.
- Consider rotating API keys periodically.

## Future Improvements

- Add refresh tokens and secure cookie auth option.
- Add automated tests (backend API + frontend flows).
- Add role-based access controls.
- Add Docker and deployment templates.
- Add observability (structured logs, metrics, tracing).
