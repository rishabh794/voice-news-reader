# Multi-Turn Conversational Voice Sessions

## What This Document Covers

A complete breakdown of what "multi-turn voice" means in the context of this app — the current problem, the proposed solution, full user flow with conversation examples, and every edge case I could identify from the actual codebase.

---

## The Current Flow (Stateless)

Right now, every voice command is an isolated, atomic transaction. There is zero memory between commands.

```
User speaks → Whisper transcribes → gibberish filter → navigate or SSE search → done
                                                        (no memory of what just happened)
```

### What happens step by step today

1. **User presses and holds the mic button** ([VoiceAssistant.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx))
2. **Browser records audio** via `MediaRecorder` → sends as `audio/webm` to Whisper transcription endpoint
3. **Gibberish filter** ([isGibberish.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/services/isGibberish.ts)) checks the transcript for STT noise — repeated characters, consonant-heavy nonsense, etc.
4. **Client-side keyword routing** (hardcoded string matching, not LLM):
   - `"history"` → navigate to `/history`
   - `"saved articles"` / `"bookmarks"` → navigate to `/saved`
   - `"dashboard"` → navigate to `/dashboard`
   - Anything else → navigate to `/dashboard?q={transcribedText}`
5. **Dashboard picks up the `?q=` param** ([Dashboard.tsx L302–321](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/Dashboard.tsx#L302-L321)), runs it through `executeIntelligentSearch`
6. **SSE pipeline fires** ([streamController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/streamController.ts)): intent classification → GNews fetch → LLM summary → category classification → save to history
7. **TTS reads the summary aloud** via `SpeechSynthesisUtterance` ([useAudioPlayer.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useAudioPlayer.ts))
8. **Done.** Everything resets. Next voice command starts from scratch.

### What's wrong with this

The app presents itself as a voice-first news reader, but the voice interaction has no continuity. Every command is a cold start. The user can't:

- Say *"next"* to see the next article
- Say *"read that one"* to open an article that was just shown
- Say *"save it"* to save the article they're looking at
- Say *"more about this"* to refine the topic they just searched
- Say *"go back"* to return to previous results

Instead, they have to start a completely new search, fully re-articulate what they want, and wait for the entire pipeline (intent → fetch → summarize → categorize) to run again — even for trivial actions that require zero API calls.

---

## What Multi-Turn Means

Multi-turn means **the voice interface remembers what just happened** and can resolve commands relative to the current context. It turns isolated commands into a conversation.

### Single-turn (current)

```
User: "News about AI regulation"     → full pipeline runs, shows 9 articles, reads summary
User: "Tell me more about that"      → ??? LLM sees "that" with no context, classifies as "unknown"
```

### Multi-turn (proposed)

```
User: "News about AI regulation"     → full pipeline runs, shows 9 articles, reads summary
User: "Tell me more about that"      → resolves "that" = "AI regulation", refines or deepens the search
User: "Read the second one"          → opens article #2 in reader view, no API call needed
User: "Save it"                      → saves article #2 to default collection, no API call needed
User: "Next"                         → shows article #3, no API call needed
```

The key insight: **most follow-up commands don't need the pipeline at all.** They're just pointer operations on data the app already has.

---

## Full User Flow with Conversation Examples

### Session 1: Basic search → browse → save

```
┌─────────────────────────────────────────────────────────────────────┐
│ Turn 1: "What's happening with OpenAI?"                            │
│                                                                     │
│ → Full SSE pipeline (intent → GNews → summary → category)          │
│ → Context saved: topic="OpenAI", articles=[9 results], index=0     │
│ → TTS reads summary aloud                                          │
│ → UI shows article grid                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 2: "Read the first one"                                       │
│                                                                     │
│ → Resolves "first one" against context.articles[0]                  │
│ → Navigates to /reader/{articleUrl}                                 │
│ → No API call to GNews or Groq                                     │
│ → Context updated: currentArticleIndex=0                            │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 3: "Save this"                                                │
│                                                                     │
│ → Resolves "this" = context.articles[context.currentArticleIndex]   │
│ → Calls saveArticle() API (existing endpoint)                       │
│ → No LLM call                                                      │
│ → TTS confirms: "Saved."                                           │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 4: "Next"                                                     │
│                                                                     │
│ → context.currentArticleIndex++ (0 → 1)                             │
│ → Navigates to /reader/{articles[1].url}                            │
│ → No API call                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 5: "Go back to results"                                       │
│                                                                     │
│ → Navigates back to /dashboard, restores article grid from context  │
│ → No API call (articles are still in session context)               │
└─────────────────────────────────────────────────────────────────────┘
```

### Session 2: Topic refinement (needs LLM)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Turn 1: "News about electric vehicles"                             │
│                                                                     │
│ → Full pipeline → topic="electric vehicles", 9 articles             │
│ → Context: { topic: "electric vehicles", articles: [...] }          │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 2: "What about Tesla specifically?"                           │
│                                                                     │
│ → Ambiguous follow-up — needs LLM to resolve                       │
│ → Send to classifyIntent WITH context:                              │
│   previous_topic="electric vehicles", user_said="What about Tesla"  │
│ → LLM returns: action="search", topic="Tesla"                      │
│ → Full pipeline runs with refined topic                             │
│ → Context updated: topic="Tesla", articles=[new results]            │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 3: "Compare that with Rivian"                                 │
│                                                                     │
│ → LLM resolves "that" = "Tesla" from context                       │
│ → Returns: action="search", topic="Tesla vs Rivian"                │
│ → Full pipeline for new topic                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Session 3: Barge-in (interrupt mid-stream)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Turn 1: "Latest news on climate change"                            │
│                                                                     │
│ → Pipeline starts streaming... intent ✓, articles loading...        │
│ → TTS starts reading summary...                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Turn 2 (INTERRUPTS): "Actually, search for wildfires instead"      │
│                                                                     │
│ → TTS immediately stops (speechSynthesis.cancel())                  │
│ → SSE stream aborts (AbortController.abort())                       │
│ → New pipeline starts for "wildfires"                               │
│ → Context fully replaced with new topic                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Session Context — What Gets Stored

The session context is **client-side only**, ephemeral (not persisted to DB), and scoped to the current browser tab/session.

```typescript
interface VoiceSessionContext {
    // What was searched
    topic: string | null;
    
    // The articles currently displayed
    articles: Article[];
    
    // Which article the user is currently viewing/referencing
    currentArticleIndex: number | null;
    
    // Last 1–2 turns for LLM context resolution
    conversationHistory: Array<{
        userSaid: string;
        resolvedAction: string;
        resolvedTopic: string | null;
    }>;
    
    // The summary that was generated
    summary: string;
    
    // Whether TTS is currently speaking (for barge-in detection)
    isSpeaking: boolean;
}
```

> [!NOTE]
> This is NOT a chat history that grows forever. It's a sliding window of at most 2 turns. The only purpose is resolving pronouns ("that", "this", "it") and contextual references ("the second one", "next") — not maintaining a full conversation transcript.

---

## Intent Classification Changes

### Current action enum

```
"search" | "history" | "unknown"
```

### Proposed action enum

```
"search"         → full pipeline (unchanged)
"history"        → navigate to history (unchanged)
"unknown"        → reject/clarify (unchanged)

"next"           → advance to next article in current list
"previous"       → go back to previous article
"read_more"      → open current/referenced article in reader view
"save_this"      → save current/referenced article
"skip"           → skip current article, show next
"go_back"        → return to article grid from reader view
"refine"         → new search using context from previous topic
```

### Which actions need what

| Action | Needs LLM? | Needs GNews? | Needs Context? |
|--------|:----------:|:------------:|:--------------:|
| `search` | ✅ classify + summarize | ✅ | ❌ (fresh search) |
| `next` | ❌ | ❌ | ✅ articles + index |
| `previous` | ❌ | ❌ | ✅ articles + index |
| `read_more` | ❌ | ❌ | ✅ current article |
| `save_this` | ❌ | ❌ | ✅ current article |
| `skip` | ❌ | ❌ | ✅ articles + index |
| `go_back` | ❌ | ❌ | ✅ (knows where to go) |
| `refine` | ✅ classify (with context) | ✅ | ✅ previous topic |
| `history` | ❌ | ❌ | ❌ |
| `unknown` | ❌ | ❌ | ❌ |

> [!IMPORTANT]
> 6 out of 10 actions require **zero API calls**. They're purely client-side state operations. This is why multi-turn is cheap to add — most of the "intelligence" is just pointer arithmetic on data the app already has in memory.

---

## Edge Cases

### 1. No context exists yet

**Scenario:** User opens the app and immediately says *"next"* or *"save this"* with no prior search.

**Expected behavior:** 
- Detect that `context.articles` is empty / `context.topic` is null
- TTS responds: *"I don't have any articles loaded. Try searching for a topic first."*
- Do NOT send to LLM — this is a pure client-side guard

---

### 2. Index out of bounds

**Scenario:** User has 9 articles, is on article #9 (last), and says *"next"*.

**Expected behavior:**
- Detect `currentArticleIndex >= articles.length - 1`
- TTS responds: *"That's the last article. Say 'go back' to see all results, or search for something new."*
- Same for *"previous"* when `currentArticleIndex === 0`

---

### 3. "The third one" when there are only 2 articles

**Scenario:** GNews returned only 2 articles. User says *"read the third one"*.

**Expected behavior:**
- Parse ordinal ("third" → index 2), check against `articles.length`
- TTS responds: *"I only found 2 articles. Say 'first' or 'second'."*

---

### 4. Ambiguous pronoun with no clear referent

**Scenario:** User searches for "technology news" (broad topic). Then says *"tell me more about that"*.

**Expected behavior:**
- "That" with a broad topic → send to LLM with context: `previous_topic="technology news"`, `user_said="tell me more about that"`
- LLM should either:
  - Ask for clarification (action: `"unknown"` with a clarification message)
  - Or make a reasonable refinement (action: `"search"`, topic: `"technology news"` — same topic, deeper search)
- Key: the LLM decides, not hardcoded logic. We just provide context.

---

### 5. Barge-in during SSE pipeline (not just TTS)

**Scenario:** Pipeline is mid-stream — intent classified, articles fetching, summary not yet generated. User starts a new recording.

**Expected behavior:**
1. `AbortController.abort()` on the in-flight SSE connection (pattern already exists in [useSSESearch.ts L86–88](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useSSESearch.ts#L86-L88) — currently only triggered by a new `startSearch` call)
2. `speechSynthesis.cancel()` if TTS is mid-utterance
3. Pipeline progress UI resets
4. New recording starts normally
5. Old context is NOT cleared until the new search returns results (in case the barge-in fails/is gibberish)

**Current gap:** [VoiceAssistant.tsx L39](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx#L39) has `if (isRecording || isProcessing) return;` — this **blocks** new recordings while processing. For barge-in, this guard needs to be removed or changed to abort-and-restart.

---

### 6. Gibberish during a multi-turn session

**Scenario:** User has a valid search context (topic + articles). Says something that triggers the gibberish filter (background noise, cough, etc.).

**Expected behavior:**
- Gibberish filter catches it (as it does today)
- Show toast: *"Couldn't understand that. Try again."*
- **Do NOT clear the existing context.** The articles and topic from the previous turn should remain visible and interactive.
- This is different from current behavior where gibberish → error state can wipe the display.

---

### 7. Context goes stale

**Scenario:** User searches "Ukraine war", leaves the tab open for 2 hours, comes back and says *"next article"*.

**Expected behavior:**
- Context is still valid (it's in-memory, articles haven't been cleared)
- *"next"* works normally — articles are still the same list
- This is fine. The articles might be stale news-wise, but the session context is just pointers. If the user wants fresh results, they'll search again.

**Optional improvement:** Show a subtle indicator after N minutes: *"Results from 2 hours ago. Search again for latest."*

---

### 8. Multiple rapid voice commands

**Scenario:** User quickly says *"next"*, then immediately *"next"* again before the first one resolves.

**Expected behavior:**
- Each command is processed sequentially (recording → transcribe → act)
- The `isProcessing` guard in [VoiceAssistant.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx) prevents overlapping recordings
- For context-only actions like *"next"* (no API call), processing is near-instant, so this is unlikely to be a real problem
- For barge-in scenarios, the second command should abort the first (see edge case #5)

---

### 9. User says "save this" but isn't logged in / token expired

**Scenario:** Auth token expired during a session. User says *"save this"*.

**Expected behavior:**
- `saveArticle()` API call returns 401
- Show toast: *"Session expired. Please log in again."*
- Do NOT clear the article context — user should be able to log in and retry
- `VoiceAssistant` already checks `authContext?.isAuthenticated` before rendering, but token can expire mid-session

---

### 10. Navigation commands conflict with search context

**Scenario:** User has an active search (articles displayed). Says *"history"*.

**Expected behavior:**
- Navigate to `/history` (current behavior)
- **Preserve the search context in memory** so the user can say *"go back"* and return to their search results
- Currently, navigating away clears everything via `sessionStorage`, but the session context should be kept in a React context/ref that survives navigation

---

### 11. "Read the one about X" — content-based reference

**Scenario:** User has 9 articles about "AI regulation". Says *"read the one about the EU AI Act"*.

**Expected behavior:**
- This is harder than ordinal references ("the third one")
- Option A (simple): Send to LLM with article titles as context, let it return an index
- Option B (cheaper): Fuzzy match "EU AI Act" against article titles client-side, pick the best match
- Option B is preferred — avoids an LLM call for something that's essentially string matching

---

### 12. TTS is speaking + user says "stop" or "quiet"

**Scenario:** TTS is reading a summary. User says *"stop"* or *"be quiet"*.

**Expected behavior:**
- This is a special case of barge-in
- `speechSynthesis.cancel()` immediately
- Do NOT start a new search (the user's intent is to silence, not to search for "stop")
- Requires recognizing *"stop"*, *"quiet"*, *"shut up"*, *"pause"* as control commands before they enter the normal pipeline
- These should be handled by the client-side keyword router in `VoiceAssistant.tsx` (same level as the current `"history"` / `"saved articles"` keyword checks), not sent to the LLM

---

## Two-Level Intent Resolution

Not every voice command needs to go through Whisper → LLM. The architecture splits into two levels:

```
Voice Input
  ↓
Whisper Transcription
  ↓
Gibberish Filter (existing)
  ↓
┌──────────────────────────────────────┐
│ Level 1: Client-side keyword match   │  ← FREE, instant
│                                      │
│ "next" / "previous" / "skip"         │  → context pointer operation
│ "save this" / "save it"              │  → call save API directly
│ "read this" / "open it" / "first"    │  → navigate to article
│ "go back" / "results"                │  → navigate to grid
│ "stop" / "pause" / "quiet"           │  → TTS control
│ "history" / "saved articles"         │  → page navigation (existing)
│                                      │
│ If matched → execute immediately     │
│ If not matched → fall through ↓      │
└──────────────────────────────────────┘
  ↓
┌──────────────────────────────────────┐
│ Level 2: LLM intent classification   │  ← 1 Groq call
│                                      │
│ Send: user_said + context (last      │
│ topic, last 1-2 turns)               │
│                                      │
│ LLM returns:                         │
│   action: "search" | "refine" | ...  │
│   topic: resolved topic string       │
│                                      │
│ → Full SSE pipeline if needed        │
└──────────────────────────────────────┘
```

> [!TIP]
> Level 1 is just an extension of the keyword routing already in [VoiceAssistant.tsx L72–91](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx#L72-L91). Today it checks for `"history"`, `"saved articles"`, `"dashboard"`. Multi-turn adds `"next"`, `"save this"`, etc. to that same block. No new architecture — just more keywords.

---

## What Changes Where

### Frontend

| File | Change |
|------|--------|
| [VoiceAssistant.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx) | Add Level 1 keyword matching for context actions (`next`, `save`, `stop`, etc.). Remove `isProcessing` block for barge-in. Need access to session context (via React Context or prop). |
| [useSSESearch.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useSSESearch.ts) | No change needed — `startSearch` already aborts previous in-flight requests (L86–88). |
| [useAudioPlayer.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useAudioPlayer.ts) | No change needed — `stop()` already cancels `speechSynthesis`. Just needs to be callable from `VoiceAssistant`. |
| [Dashboard.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/Dashboard.tsx) | Provide session context (articles, index, topic) up to a shared React Context. Currently stores this in component state + `sessionStorage`. |
| **[NEW]** `useVoiceSession.ts` | New hook/context that holds `VoiceSessionContext`. Wraps around the app (in `AppShell` or `App`). All voice-aware components read from this. |

### Backend

| File | Change |
|------|--------|
| [pipeline.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/pipeline.ts) | Update `SYSTEM_PROMPT` in `classifyIntent` to accept optional `previous_topic` and `conversation_history` in the user message. Add new action values to the prompt. |
| [streamController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/streamController.ts) | Accept optional `context` query param (JSON-encoded previous topic + last turns). Pass to `classifyIntent`. |
| Everything else | **No changes.** GNews, rate limiter, reader mode, briefing — all untouched. |

### What's NOT changing

- No new API keys or external services
- No new database models or collections
- No changes to the SSE pipeline stages
- No changes to the rate limiter or caching layer
- No changes to the briefing system
- No changes to auth

## Design Discussion

### 1. Voice Input UX — Auto-Stop Recording

#### The problem

Current implementation in [VoiceAssistant.tsx L130–135](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx#L130-L135) uses hold-and-release (`onMouseDown` / `onMouseUp`). Tap-to-toggle was tried before and introduced bugs — likely race conditions between start/stop state, double-tap edge cases, and the `isRecording || isProcessing` guard at [L39](file:///c:/Users/risha/voice-news-reader/frontend/src/components/VoiceAssistant.tsx#L39) blocking re-entry in unexpected ways.

The real ask: **user taps once, speaks, and recording stops by itself when they're done.** No second tap, no holding.

#### Solution: Voice Activity Detection (VAD)

Use `@ricky0123/vad-web` — a browser-based VAD that uses a small ONNX model (Silero VAD, ~1.5MB) to detect speech start/end in real time. It's specifically built for this use case.

```
Tap mic → VAD starts listening → user speaks → VAD detects silence → auto-stop → process
```

**How it works:**

```tsx
import { useMicVAD } from "@ricky0123/vad-react";

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);

    const vad = useMicVAD({
        startOnLoad: false, // don't listen until user taps
        onSpeechStart: () => {
            // Optional: show "hearing you..." visual feedback
        },
        onSpeechEnd: (audio: Float32Array) => {
            setIsListening(false);
            vad.pause();
            
            // Convert Float32Array to WAV blob and send to Whisper
            const audioBlob = float32ToWav(audio, 16000);
            processAudio(audioBlob);
        },
        // Tuning params
        positiveSpeechThreshold: 0.8,  // confidence to start speech
        negativeSpeechThreshold: 0.3,  // confidence to end speech
        minSpeechFrames: 3,            // min frames before speech is confirmed
        redemptionFrames: 8,           // ~480ms of silence before stopping
    });

    const handleMicTap = () => {
        if (isListening) {
            // Manual cancel
            vad.pause();
            setIsListening(false);
            return;
        }
        setIsListening(true);
        vad.start();
    };
};
```

**Why VAD, not a dumb timer:**

| Approach | Problem |
|----------|---------|
| Hold-and-release | Already in place, bad for multi-turn (proven) |
| Tap-to-toggle | Tried before, buggy. Also requires user to know when to tap again |
| Fixed silence timeout (3s) | Cuts off mid-thought pauses. Also fires during background noise. Can't distinguish "user paused to think" from "user is done" |
| **VAD (speech detection)** | Detects actual speech-to-silence transition. Handles pauses, background noise, variable-length commands. Industry standard (Google Assistant, Alexa, Siri all use VAD) |

**The user flow becomes:**

```
┌──────────────────────────────────────────┐
│ 1. User taps mic button                 │
│ 2. Button pulses, shows "Listening..."  │
│ 3. VAD activates microphone             │
│ 4. User speaks: "next article"          │
│ 5. VAD detects speech ended             │
│ 6. Recording auto-stops                 │
│ 7. Audio sent to Whisper                │
│ 8. Button shows processing spinner     │
│ 9. Command executes                     │
└──────────────────────────────────────────┘
```

**Visual states for the mic button:**

| State | Visual |
|-------|--------|
| **Idle** | Mic icon, neutral border |
| **Listening (no speech yet)** | Pulsing border, "Listening..." label — VAD is on but user hasn't spoken yet |
| **Hearing speech** | Animated sound wave / waveform bars, border turns primary color — VAD confirms speech is happening |
| **Processing** | Spinner (existing behavior) |

**Edge case — VAD never hears speech (user tapped accidentally):**
- Add a 10s max-listen timeout. If VAD doesn't detect any speech in 10s, auto-cancel and return to idle.
- Show subtle toast: *"Didn't hear anything. Tap to try again."*

**Edge case — noisy environment where VAD keeps triggering:**
- `positiveSpeechThreshold: 0.8` (high confidence required to start) + `minSpeechFrames: 3` (sustained speech, not a cough) handles most of this.
- If it's still too sensitive, the `redemptionFrames` param controls how long silence must last before stopping — increase it for noisy environments.

**Dependency cost:** `@ricky0123/vad-web` is ~1.5MB for the ONNX model file (loaded once, cached by browser). No backend changes. No API calls. Works fully client-side.

> [!TIP]
> Keep the hold-and-release as a **fallback** behind a setting toggle ("Classic mode"), in case VAD doesn't load or the user's browser doesn't support WebAssembly + AudioWorklet. But default to VAD for all new users.

---

### 2. Reader View Scope — Updated

#### Design change

Reader view is now available for **all articles**, not just saved ones. When a user clicks "Read" or says *"read the first one"* on any article — saved or unsaved — it navigates to the in-app `/reader` route. The only difference is persistence:

| Article type | Navigation | Reader view? | `isRead` tracking? | `readerData` cached in DB? |
|-------------|------------|:------------:|:------------------:|:--------------------------:|
| Unsaved (search / feed) | `/reader?url={url}` (no `id` param) | ✅ | ❌ | ❌ |
| Saved (collection) | `/reader?url={url}&id={savedId}` | ✅ | ✅ | ✅ |

The backend route [readerController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/readerController.ts) already supports this. When `savedArticleId` is absent, it still fetches the page via axios, runs Readability, and returns the parsed content — it just skips the `savedDoc.readerData = ...` cache write. No backend changes needed.

#### Two outcomes when reader view opens

The backend fetches the article's HTML server-side (no CORS issue there — it's a Node.js `axios.get`). But some sites block automated fetching via other means:

| Outcome | What happened | What the user sees |
|---------|---------------|-------------------|
| **✅ Success** | `axios.get` returns HTML, Readability extracts content | Clean article text, TTS button, full reader view |
| **❌ Failure** | Site returns 403, paywall redirect, Cloudflare challenge, or Readability returns `null` (e.g. heavy JS-rendered SPA) | Error state: *"Could not parse this article. Some websites block automated parsing."* + "Open Original URL" button + "Go Back" button ([ReaderView.tsx L60–68](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/ReaderView.tsx#L60-L68)) |

> [!NOTE]
> This is not a CORS error in the traditional browser sense. The backend is making the request, so same-origin policy doesn't apply. The failures are: HTTP 403/429 from the target site, Cloudflare bot protection, JavaScript-only rendering (no server-side HTML), or paywalls. The user-facing term "CORS error" is shorthand for "the site blocked us."

#### What this means for multi-turn `read_more`

The voice command flow is now the same for all articles:

```
"Read the first one"
  ↓
navigate to /reader?url={articles[0].url}[&id={savedId} if saved]
  ↓
Backend fetches + Readability parses
  ├── SUCCESS → reader view renders, TTS available
  └── FAILURE → error state renders with fallback buttons
```

**TTS confirmation:**
- Always: *"Opening in reader view."* (same for saved and unsaved — the experience is identical now)

#### Voice session context: tracking reader state

The `VoiceSessionContext` needs to track whether the current article's reader view succeeded or failed, because this affects what *"read next"* does:

```typescript
interface VoiceSessionContext {
    // ... existing fields ...
    
    // Per-article reader state (populated after navigating to /reader)
    readerState: 'idle' | 'success' | 'failed';
}
```

#### "Read next" — the two cases

When the user is in reader view and says *"read next"* (or *"next"*, *"next article"*), the behavior depends on whether the **current** article's reader view succeeded or failed:

**Case 1: Current reader view succeeded (content was extracted)**

```
User is reading article[2] in reader view (success)
  ↓
"Read next"
  ↓
context.currentArticleIndex++ (2 → 3)
  ↓
Bounds check: is index 3 < articles.length?
  ├── YES → navigate to /reader?url={articles[3].url}[&id=... if saved]
  │         → backend fetches new article
  │         → if success: reader view renders, TTS: "Here's the next article. [title]."
  │         → if failure: error state renders, TTS: "Couldn't load this article. Say 'next' to skip, or 'open it' to view the original."
  │         → update context.readerState accordingly
  └── NO  → TTS: "That was the last article. Say 'go back' to see all results."
```

**Case 2: Current reader view failed (site blocked parsing)**

The user is on the error screen for article[2]. They can't read it here, so *"next"* means "skip this broken one and try the next."

```
User is on reader error state for article[2]
  ↓
"Read next" / "Next" / "Skip"
  ↓
context.currentArticleIndex++ (2 → 3)
  ↓
Bounds check: is index 3 < articles.length?
  ├── YES → navigate to /reader?url={articles[3].url}[&id=... if saved]
  │         → backend fetches new article
  │         → success or failure (same as Case 1)
  │         → TTS on success: "Here's the next article. [title]."
  │         → TTS on failure: "This one couldn't be loaded either. Say 'next' to keep going."
  └── NO  → TTS: "That was the last article. Say 'go back' to see all results."
```

> [!IMPORTANT]
> The behavior of *"read next"* is **identical in both cases** — increment the index and navigate to the next article's reader view. The difference is only in the TTS confirmation wording. The user never gets stuck; *"next"* always moves forward regardless of whether the current article loaded.

#### Additional voice commands on the reader error screen

When reader view fails, the user should have voice equivalents for the two visible buttons:

| Voice command | Maps to | Action |
|--------------|---------|--------|
| *"open it"* / *"open original"* / *"view source"* | "Open Original URL" button | `window.open(currentArticle.url, '_blank')` |
| *"go back"* / *"back to results"* | "Go Back" button | `navigate(-1)` back to article grid |
| *"next"* / *"skip"* | (no visible button) | Increment index, try next article in reader view |

These should be added to the Level 1 keyword router in `VoiceAssistant.tsx`.

#### Impact on RAG

Unchanged: **embed only saved articles.** Unsaved articles that pass through reader view are not persisted — their `textContent` is fetched, rendered, and discarded when the user navigates away. The embedding pipeline only processes documents in the `SavedArticle` collection that have `readerData` populated.

---

### 3. Command Discoverability — Better Than Hints

The contextual text hints near the mic button (from the previous version) are too passive — muted text in a corner that users learn to ignore. Let me think about this differently.

The real question: **how does a voice-first app teach voice commands without a manual?**

#### Solution: Voice Command Drawer

A small, expandable panel that **lives just above the mic button** and opens on tap. Think of it like a mini command palette, but designed for voice — not keyboard shortcuts.

**Collapsed state (always visible):**
```
┌─────────────────────────┐
│  ⌃ Voice Commands       │    ← small pill/tab, tappable
└─────────────────────────┘
           🎤                  ← mic button below
```

**Expanded state (on tap):**
```
┌─────────────────────────────────────────┐
│  Voice Commands                    ✕    │
│                                         │
│  📰 SEARCH                              │
│  "news about climate change"            │
│  "what's happening with OpenAI"         │
│                                         │
│  🔀 BROWSE  (when articles are shown)   │
│  "next" · "previous" · "skip"           │
│  "read the first one" · "read third"    │
│                                         │
│  💾 ACTIONS                              │
│  "save this" · "save it"               │
│  "go back" · "go to history"           │
│                                         │
│  ⏸ PLAYBACK  (when TTS is active)      │
│  "stop" · "pause"                       │
└─────────────────────────────────────────┘
           🎤
```

**Why this works better than floating hints:**

1. **User-initiated.** They open it when they need it, not when we guess they need it. No visual noise otherwise.
2. **Shows real example phrases**, not just keywords. "news about climate change" teaches the natural phrasing, not just the abstract action.
3. **Grouped by action type** — the user scans for what they want to do (search / browse / save / control), not a flat list of keywords.
4. **Contextual sections auto-highlight.** When articles are on screen, the "BROWSE" section gets a subtle highlight or a "• available now" badge. When TTS is playing, "PLAYBACK" lights up. Sections for unavailable actions are dimmed with "(search for something first)".
5. **Dismissible.** Once users learn the commands, they stop opening it. The collapsed pill takes up minimal space.

**Implementation:**

```tsx
const VoiceCommandDrawer = ({ isOpen, onClose, context }: DrawerProps) => {
    if (!isOpen) {
        return (
            <button 
                onClick={onOpen}
                className="text-xs text-muted bg-surface/90 backdrop-blur 
                           border border-border/50 rounded-full px-3 py-1.5
                           hover:border-primary/40 transition-all"
            >
                <span className="opacity-60">⌃</span> Voice Commands
            </button>
        );
    }

    return (
        <div className="bg-elevated border border-border rounded-xl p-4 
                        shadow-xl backdrop-blur-md w-72 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-text">Voice Commands</span>
                <button onClick={onClose} className="text-muted">✕</button>
            </div>

            <CommandSection 
                icon="📰" 
                title="Search" 
                available={true}
                examples={[
                    '"news about climate change"',
                    '"what\'s happening with OpenAI"'
                ]} 
            />
            <CommandSection 
                icon="🔀" 
                title="Browse" 
                available={context.articles.length > 0}
                examples={[
                    '"next" · "previous" · "skip"',
                    '"read the first one"'
                ]} 
            />
            <CommandSection 
                icon="💾" 
                title="Actions" 
                available={context.articles.length > 0}
                examples={[
                    '"save this" · "save it"',
                    '"go back" · "go to history"'
                ]} 
            />
            <CommandSection 
                icon="⏸" 
                title="Playback" 
                available={context.isSpeaking}
                examples={['"stop" · "pause"']} 
            />
        </div>
    );
};
```

#### First-time onboarding: auto-open once

On the very first voice search (not first app visit — first time the mic button actually produces results), **auto-open the drawer for 5 seconds** with a subtle pulse:

```
You searched with your voice! Here's what you can say next...
```

Then auto-collapse. Tracked via `localStorage` flag (`voice_onboarded: true`). Never auto-opens again.

This gives the user one guaranteed exposure to the command set at the exact moment they'd benefit from it — right after their first successful voice search, when they're staring at article results and wondering what to do next.

#### TTS suffix hints (keep, but lighter)

Still append brief hints to TTS output, but only for the **first session** (not 3 — that's too many):

```
After first summary:  "...Say 'next' to browse articles, or 'save this' to bookmark."
After second summary: (no suffix — user has heard it once, that's enough)
```

---

## Summary

Multi-turn voice sessions means: **the mic button remembers what you just did.** Most follow-up commands (`next`, `save`, `read`, `skip`, `stop`) are resolved instantly on the client with zero API calls. Only genuinely new searches or ambiguous follow-ups hit the LLM. The entire feature is mostly a frontend state management change + a small prompt update on the backend.

Key design decisions from discussion:

1. **Voice input uses VAD auto-stop** (`@ricky0123/vad-web`). Tap once to start, VAD detects when you stop speaking and auto-stops recording. Hold-and-release kept only as a fallback setting. Tap-to-toggle was tried before and was buggy — VAD skips that problem entirely.
2. **Reader view opens for all articles (saved and unsaved).** Both navigate to `/reader?url={url}` for in-app Readability extraction and TTS. The only difference: saved articles also pass `id` for `isRead` tracking and `readerData` DB caching; unsaved articles get the same reader experience but nothing is persisted. When the backend can't parse an article (403, paywall, JS-rendered SPA), the error screen offers voice commands: *"open it"* (source URL in new tab), *"next"* (skip to next article), or *"go back"* (return to results). *"Read next"* always moves forward regardless of whether the current article loaded — the user never gets stuck.
3. **Command discoverability via a Voice Command Drawer** — a collapsible panel above the mic button showing grouped example phrases, with contextual highlighting based on app state. Auto-opens once after the user's first voice search. TTS hint suffix plays once in the first session only.

