# Voice Session Tracking & Local Storage Flow

This document outlines how the application tracks the user's progress through articles during a voice session, and details exactly what data is persisted to the browser's `localStorage`.

## 1. Tracking the Article Index

The index of the currently active article (e.g., when a user says "read the second one" or "next") is **not** stored in `localStorage` or the database. It is tracked purely in-memory using React Context during an active voice session.

### The Flow
1. **State Initialization:** When the app loads, `VoiceSessionProvider` (`src/features/voice-session/VoiceSessionContext.tsx`) initializes a state object containing `articles` (an array of search results) and `currentArticleIndex` (a number, initially `null`).
2. **Search:** When a user asks a question ("news about Apple"), the AI pipeline returns a list of articles, which are saved to the `articles` array in the session state.
3. **Navigation (Voice Commands):** 
   - If the user says "next", the `VoiceAssistant.tsx` component reads `currentArticleIndex`, increments it by 1, and calls `session.setSessionState({ currentArticleIndex: newIndex })`.
   - If the user says "read the third one", the ordinal parser matches "third" to index `2`, and calls `session.setSessionState({ currentArticleIndex: 2 })`.
4. **Routing:** After updating the index, the app navigates to `/reader?url=...` using the URL from `session.articles[currentIndex]`.
5. **Session End:** Because this is stored in a React Context Provider, the index and the articles are wiped out when the user hard-refreshes the page or explicitly clears the session.

## 2. What Does Local Storage Save?

`localStorage` is strictly used for persistent, client-side preferences and authentication. It does **not** save session data like the current article index, the search results, or the chat history.

Here is a JSON representation of what the application's `localStorage` looks like during a typical session:

```json
{
  // Authentication & Identity
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",  // JWT Auth token used for API requests
  "email": "user@example.com",              // Logged-in user's email address

  // Application Preferences
  "theme": "dark",                          // UI theme ('dark' or 'light')

  // Voice Interaction Preferences
  "voice_use_vad": "false",                 // Whether to use Voice Activity Detection (hands-free) or Hold-to-Talk
  "voice_onboarded": "true"                 // Whether the user has been shown the voice command helper drawer
}
```

### Why avoid `localStorage` for the Index?
If we stored the `currentArticleIndex` in `localStorage`, returning to the app days later might attempt to load an index for a search session that no longer exists, causing broken states. Keeping it in-memory ensures the voice session is always fresh and tied to the active interaction loop.
