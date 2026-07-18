# Bug Report — voice-news-reader

> [!NOTE]
> Auth bugs excluded per your request.

---

## 🔴 P0 — Critical (Will break in production)

### BUG-01: Feed cache TTL is 10 hours instead of 60 minutes
**File:** [feedController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/feedController.ts#L7)
**Line:** `const CACHE_TTL_SECONDS = 600 * 60; // 60 minutes`
**Problem:** `600 * 60 = 36,000 seconds = 10 hours`, not 60 minutes. The comment says 60 minutes, but the math is wrong. The intent was clearly `60 * 60 = 3600`.
**Impact:** Feed articles will be stale for 10 hours. Users will see very old news. The entire feed caching strategy is broken.
**Fix:** Change to `const CACHE_TTL_SECONDS = 60 * 60; // 60 minutes`

---

### BUG-02: `deleteCollection` deletes the collection BEFORE re-assigning orphaned articles
**File:** [collectionController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/collectionController.ts#L82-L91)
**Problem:** The code does `await Collection.deleteOne({ _id: id })` on line 82, and *then* tries to re-assign `SavedArticle` records that point to that collection to the default collection. But the collection is already gone. This creates a **race condition**: if the re-assignment fails (network blip, crash), the articles are orphaned forever with a `collectionId` pointing to a deleted document.
**Impact:** Articles can silently disappear from the user's view.
**Fix:** Move the `SavedArticle.updateMany()` call **before** `Collection.deleteOne()`, or wrap both in a MongoDB transaction.

---

### BUG-03: Hardcoded `localhost:5000` in SSE hook — will break in deployment
**File:** [useSSESearch.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useSSESearch.ts#L95)
**Line:** `const url = \`http://localhost:5000/api/stream/search?query=...\``
**Problem:** The Axios client at [client.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/services/api/client.ts#L4) also uses `http://localhost:5000/api`, but the SSE hook bypasses Axios entirely and uses `fetch`. Both are hardcoded. In production, neither will work.
**Impact:** The entire SSE streaming pipeline and all API calls will fail in any non-localhost deployment.
**Fix:** Use an environment variable (e.g., `import.meta.env.VITE_API_URL`) for the base URL in both files.

---

### BUG-04: `searchGNews` silently swallows errors and returns empty results
**File:** [tools.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/tools.ts#L18-L24)
**Problem:** If the GNews API returns a 429 (rate limited), 403 (invalid key), or any HTTP error, `axios.get` throws. The `catch` block catches it and returns `{ rawArticles: [], llmObservation: "The search failed..." }`. The **caller never knows an error occurred**. In `feedController.ts`, this means:
- The feed loop silently skips the topic.
- The user sees no articles and gets no error message.
- The backend **does not cache** the empty array (good), but the user has no idea why their feed is empty.

In `streamController.ts`, the SSE pipeline will send `sendEvent('complete', {})` after getting 0 articles — again, the user just sees "no results" with no indication the API failed.
**Impact:** Silent data loss. Users think no news exists when in reality the API is failing.
**Fix:** Throw the error and let callers handle it, or return a `{ success: false, error: ... }` discriminated union.

---

## 🟠 P1 — High (Data integrity / UX problems)

### BUG-05: `updateTopics` accepts any string array — no validation
**File:** [topicPreferencesController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/topicPreferencesController.ts#L29-L31)
**Problem:** `const { topics } = req.body` destructures the topics array, then deduplicates with `[...new Set(topics)]`. But there's no check that `topics` is even an array. If `req.body.topics` is `undefined`, `null`, or a string, `new Set(topics)` will either throw or produce garbage. The route has validation middleware but the controller also needs a guard.
**Impact:** Could crash the server with an unhandled error, or corrupt user preferences with invalid data.
**Fix:** Add a guard: `if (!Array.isArray(topics)) return res.status(400)...`

---

### BUG-06: `cors()` is wide open — accepts all origins
**File:** [index.ts](file:///c:/Users/risha/voice-news-reader/backend/src/index.ts#L11)
**Line:** `app.use(cors());`
**Problem:** No origin whitelist. Any website can make authenticated API requests to your backend if a user is logged in (the JWT is in `localStorage`, so it's not automatic, but it's still a misconfiguration).
**Impact:** Security risk in production. Any site can call your API endpoints.
**Fix:** Configure `cors({ origin: ['https://yourdomain.com'], credentials: true })`.

---

### BUG-07: `readerController` has no authentication — `parseArticle` is an open SSRF proxy
**File:** [readerController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/readerController.ts#L10)
**Problem:** The `parseArticle` handler takes a `url` query param from the client and does `axios.get(url)`. Even though `verifyToken` is applied at the route level, there is **no validation on the URL itself**. A malicious authenticated user can:
1. Pass `url=http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint — classic SSRF).
2. Pass `url=http://localhost:27017` (probe internal services).
3. Pass any internal network URL.

**Impact:** Server-Side Request Forgery (SSRF). An attacker can use your server as a proxy to scan internal infrastructure.
**Fix:** Validate that the URL has an `https://` scheme, and block private/internal IP ranges.

---

### BUG-08: No `express.json()` body size limit
**File:** [index.ts](file:///c:/Users/risha/voice-news-reader/backend/src/index.ts#L12)
**Line:** `app.use(express.json());`
**Problem:** No `limit` option is set. The default Express limit is `100kb`, which is fine for most cases, but you're also accepting `sessionStorage`-sized article arrays in some payloads. More importantly, `multer` in transcribe has no file size limit either.
**Impact:** A malicious user could upload very large audio files via the transcribe endpoint, consuming server memory and disk.
**Fix:** Add `app.use(express.json({ limit: '1mb' }))` and add `limits: { fileSize: 5 * 1024 * 1024 }` to multer config.

---

### BUG-09: SSE stream sends JSON error after headers are already flushed
**File:** [streamController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/streamController.ts#L10-L18)
**Problem:** The validation checks for `!req.user` and `!query` on lines 10-18 call `res.status(401).json(...)` and `res.status(400).json(...)`. But since this is an SSE endpoint, the client is using `fetch` with `response.body.getReader()`. The client's SSE parser expects `text/event-stream` format. When these guards fire, they send back `application/json` — the frontend's SSE parser in [useSSESearch.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useSSESearch.ts#L106-L113) does handle `!response.ok`, so it won't crash, but the error message parsing path (`await response.json()`) has a `.catch(() => ({ error: 'Network error' }))` fallback that may mask the real error.
**Impact:** Minor — the error handling works, but the user sees "Network error" instead of "Missing query parameter". Confusing UX.
**Fix:** Return a more descriptive error, or standardize error responses.

---

## 🟡 P2 — Medium (Edge cases / code quality)

### BUG-10: `globalQuota` is in-memory only — resets on every server restart
**File:** [globalQuota.ts](file:///c:/Users/risha/voice-news-reader/backend/src/middleware/globalQuota.ts#L16)
**Problem:** The global token buckets are stored in a `Map` in memory. Every time your server restarts (deploy, crash, scale-out), the quota resets to full capacity. In production with multiple server instances, each instance has its own independent quota — so your "80 GNews calls/hour" limit becomes "80 × N instances".
**Impact:** Quota protection is unreliable. You could still blow through your GNews free tier.
**Fix:** Move global quota tracking to Redis (you already have the infrastructure for it in `redis.ts`).

---

### BUG-11: `ReaderView` read time calculation is wrong
**File:** [ReaderView.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/ReaderView.tsx#L87)
**Line:** `{Math.ceil(article.length / 1000)} min read`
**Problem:** `article.length` is the character count from Readability. Dividing by 1000 is not a meaningful "minutes" calculation. The standard estimate is **~250 words per minute**, and average word length is ~5 characters. So `article.length / 5 / 250` ≈ `article.length / 1250` would be more accurate. With `/ 1000`, you're overestimating read time by ~25%.
**Impact:** Minor UX issue — read times are inflated.
**Fix:** `Math.ceil(article.length / 1250)` or count actual words from `textContent`.

---

### BUG-12: `dangerouslySetInnerHTML` in ReaderView with no sanitization
**File:** [ReaderView.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/ReaderView.tsx#L120)
**Line:** `dangerouslySetInnerHTML={{ __html: article.content }}`
**Problem:** The `article.content` comes from Readability parsing of an arbitrary external URL. While Readability does some cleanup, it does **not** guarantee XSS-safe output. A malicious article page could embed `<script>`, `<img onerror="...">`, or other XSS vectors that survive Readability's parser.
**Impact:** Cross-Site Scripting (XSS) vulnerability. An attacker could craft a page that steals user tokens.
**Fix:** Use `DOMPurify.sanitize(article.content)` before rendering.

---

### BUG-13: `useSSESearch` dispatches `EVENT_COMPLETE` twice on normal completion
**File:** [useSSESearch.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/hooks/useSSESearch.ts#L175-L201)
**Problem:** When the stream completes normally:
1. The `case 'complete':` handler dispatches `EVENT_COMPLETE` (line 176) and calls `callbacks?.onComplete?.(...)` (line 177).
2. Then the `while(true)` loop exits (because `done` is `true`).
3. The `finally` block dispatches `EVENT_COMPLETE` **again** (line 200).

This means `onComplete` fires once but `dispatch({ type: 'EVENT_COMPLETE' })` fires twice. Since the reducer is idempotent (sets `isStreaming: false`), this doesn't cause a visible bug, but it triggers an unnecessary React re-render.
**Impact:** Minor — extra re-render on every search completion.
**Fix:** Guard the `finally` block: only dispatch if `state.isStreaming` is still true, or track completion with a local flag.

---

### BUG-14: `transcribe.ts` creates `uploads/` directory relative to CWD, not project root
**File:** [transcribe.ts](file:///c:/Users/risha/voice-news-reader/backend/src/routes/transcribe.ts#L11)
**Line:** `fs.mkdirSync('uploads', { recursive: true });`
**Problem:** This uses a relative path. If the server is started from a different working directory (common in Docker, PM2, or systemd), the `uploads/` folder is created in the wrong location, and file uploads will fail with ENOENT.
**Impact:** Transcription breaks depending on how the server is launched.
**Fix:** Use `path.resolve(__dirname, '../../uploads')` or an absolute path from an env variable.

---

### BUG-15: `req.on('close')` abort flag doesn't actually cancel in-flight LLM calls
**File:** [streamController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/streamController.ts#L31-L34)
**Problem:** When the client disconnects, `aborted = true` is set. But the `await classifyIntent(query)`, `await searchGNews(topic)`, etc. calls are already in-flight. The `aborted` flag is only checked *after* each `await` returns. So if the user disconnects during a 15-second LLM call, the server **still completes** that expensive call and simply discards the result.
**Impact:** Wasted Groq API tokens and server resources when users disconnect mid-pipeline.
**Fix:** Pass an `AbortSignal` to the Groq SDK and axios calls so they can be actually cancelled.

---

## 🟢 P3 — Low (Cleanup / best practices)

### BUG-16: Unused `requestIntent` import in Dashboard
**File:** [Dashboard.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/Dashboard.tsx#L5)
**Line:** `import { deleteSavedArticle, fetchSavedArticles, requestIntent, saveArticle } from '../services/api';`
**Problem:** `requestIntent` is imported but never used. The dashboard now uses SSE via `useSSESearch` instead.
**Impact:** Dead code. No runtime impact but increases bundle size slightly.

---

### BUG-17: Unused `latestSearchRequestId` ref in Dashboard
**File:** [Dashboard.tsx](file:///c:/Users/risha/voice-news-reader/frontend/src/pages/Dashboard.tsx#L67)
**Line:** `const latestSearchRequestId = useRef(0);`
**Problem:** This ref is declared but never read or incremented anywhere in the component. It's leftover from the pre-SSE intent-based search.
**Impact:** Dead code.

---

### BUG-18: `api:ratelimit` custom event is dispatched but never listened to
**File:** [client.ts](file:///c:/Users/risha/voice-news-reader/frontend/src/services/api/client.ts#L26-L28)
**Problem:** The Axios response interceptor dispatches `window.dispatchEvent(new CustomEvent('api:ratelimit', ...))` on 429 responses, but no component in the app listens for this event. The toast system is used elsewhere but not connected here.
**Impact:** Rate-limit feedback is silently lost. Users see no toast or notification when they hit rate limits on Axios-based endpoints.
**Fix:** Add an event listener in a top-level component (or the `ToastContext`) that calls `showToast()` on `api:ratelimit`.

---

## Summary Table

| Priority | ID | Bug | File |
|---|---|---|---|
| 🔴 P0 | BUG-01 | Feed cache TTL 10h instead of 1h | `feedController.ts` |
| 🔴 P0 | BUG-02 | Collection deleted before articles re-assigned | `collectionController.ts` |
| 🔴 P0 | BUG-03 | Hardcoded `localhost:5000` breaks deployment | `useSSESearch.ts`, `client.ts` |
| 🔴 P0 | BUG-04 | GNews errors silently swallowed | `tools.ts` |
| 🟠 P1 | BUG-05 | No type guard on `topics` in update handler | `topicPreferencesController.ts` |
| 🟠 P1 | BUG-06 | CORS wide open — accepts all origins | `index.ts` |
| 🟠 P1 | BUG-07 | Reader endpoint is an open SSRF proxy | `readerController.ts` |
| 🟠 P1 | BUG-08 | No body size / upload size limits | `index.ts`, `transcribe.ts` |
| 🟠 P1 | BUG-09 | SSE error responses sent as JSON not SSE | `streamController.ts` |
| 🟡 P2 | BUG-10 | Global quota resets on server restart | `globalQuota.ts` |
| 🟡 P2 | BUG-11 | Read time calculation off by ~25% | `ReaderView.tsx` |
| 🟡 P2 | BUG-12 | XSS via unsanitized `dangerouslySetInnerHTML` | `ReaderView.tsx` |
| 🟡 P2 | BUG-13 | `EVENT_COMPLETE` dispatched twice | `useSSESearch.ts` |
| 🟡 P2 | BUG-14 | `uploads/` dir path is relative to CWD | `transcribe.ts` |
| 🟡 P2 | BUG-15 | Abort flag doesn't cancel in-flight LLM calls | `streamController.ts` |
| 🟢 P3 | BUG-16 | Unused `requestIntent` import | `Dashboard.tsx` |
| 🟢 P3 | BUG-17 | Unused `latestSearchRequestId` ref | `Dashboard.tsx` |
| 🟢 P3 | BUG-18 | Rate-limit event dispatched but never listened to | `client.ts` |
