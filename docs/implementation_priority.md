# Implementation Priority — Voice News Reader

## Project Assessment

**Rating: 8/10 as a portfolio piece, genuinely close to production-grade in places.**

### What's already strong

- **Hand-written atomic token-bucket rate limiter** (Redis + Lua script) gating GNews/Groq calls globally — distributed-systems-level work, not API stitching.
- **SSRF-protected article reader mode**: full-text extraction via Readability/JSDOM, with private-IP and metadata-endpoint (`169.254.169.254`) blocking.
- **A real SSE pipeline** (intent → articles → summary → category, streamed stage-by-stage) with heartbeats and abort-on-disconnect.
- **Daily email briefing system** that dedupes topic fetches *across all users* before generating individual briefings (one GNews call per unique topic, not per user), respects both GNews and Resend rate limits, and upserts idempotently per day via QStash cron with signature verification.
- **Gibberish filter** on raw Whisper transcripts before they hit the LLM — catches STT noise/silence artifacts, saves wasted intent-classification calls.

### Known weaknesses to address

| Issue | Severity | Notes |
|-------|----------|-------|
| No tests, no CI | High | Acknowledge explicitly in README rather than hoping no one notices |
| `feedController.ts` and `briefingService.ts` duplicate fetch→cache→rate-limit logic | Medium | Should be one shared function |
| Loose `any` typing scattered through controllers | Medium | Undermines the point of using TypeScript |
| Stale `docs/` recommendation files | Low | Most proposed features are **already built** — delete or archive so they don't mislead reviewers |

---

## Build Order (My Priority)

The product is a **voice-first news reader**. The core loop is: *speak → get news → consume*. Every feature is ranked by how much it strengthens that loop or extends it into something meaningfully bigger.

---

### 🔥 Phase 1 — Multi-Turn Conversational Voice Sessions

**Priority: #1 — Build this first.**

> [!IMPORTANT]
> The voice experience IS the product. Right now every command is cold and stateless — that's the single biggest UX gap. This is also the cheapest feature to build (mostly client-side state + a few intent enum additions, zero new APIs or services).

**Why first:** Every other feature on this list (archive search, briefing delta, perspective spread) delivers its value *through the voice interface*. If that interface feels like "search bar you shout at," none of those features land properly. Fix the foundation of the interaction model before building on top of it.

**Flow:**
1. Maintain lightweight session context client-side (last topic, last article list, last article index), keyed to the active SSE session.
2. Extend the intent schema with reference-resolving actions: `"next"`, `"read_more"`, `"save_this"`, `"skip"` — these don't need GNews or Groq at all, just the frontend acting on the existing article list.
3. For ambiguous follow-ups (*"tell me more about that"*), pass the last 1–2 turns as context into `classifyIntent` so the LLM can resolve "that" against the prior topic.
4. Add barge-in: if a new recording starts while TTS is still speaking or an SSE stream is still running, abort the in-flight `AbortController` (pattern already exists in [streamController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/streamController.ts) — just trigger it from a new voice command instead of only `req.on('close')`).

**Build cost:** ~2–3 days. No new APIs, no new models, no new backend services.

---

### 🧹 Phase 2 — Code Quality Sprint

**Priority: #2 — Do this before any big feature build.**

Every upcoming feature touches the same code paths ([feedController.ts](file:///c:/Users/risha/voice-news-reader/backend/src/controllers/feedController.ts), [briefingService.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/briefingService.ts), [pipeline.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/pipeline.ts), [tools.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/tools.ts)). Fix the foundation now so you're not fighting it later.

| Task | Detail |
|------|--------|
| **Extract shared fetch function** | `feedController.ts` L31–56 and `briefingService.ts` L33–55 are near-identical (cache check → GNews fetch → cache set → rate-limit delay). Extract into a single `fetchTopicWithCache(topic)` in a shared service. |
| **Fix `any` typing** | Replace `any` in controllers with proper interfaces — `Article`, `BriefingArticle`, etc. already exist in the codebase. |
| **Archive stale docs** | Delete or move `feature_recommendations.md`, `user_feature_recommendations.md`, `rate_limiting.md`, `sse_implementation_report.md` — their proposals are already implemented. Keep only this priority doc and `implementation_plan.md`. |
| **Add README honesty** | Explicitly note "no automated tests" in README as a known gap, with a brief note on what you'd test first (SSE pipeline stages, rate limiter, gibberish filter). |

**Build cost:** ~1 day. No functional changes, pure cleanup.

---

### ⚡ Phase 3 — Briefing Delta ("What's New Since Yesterday")

**Priority: #3 — Quick win, high perceived quality.**

> [!TIP]
> This is the smallest feature on the list but has outsized impact. `generateUserBriefing` currently refetches the same topics daily with no memory of what was already shown. If GNews hasn't published much new, users get near-duplicate briefings — the fastest way to make a daily digest feel useless.

**Why before RAG:** It's a 1-day build that immediately improves a core feature. RAG is a multi-day project. Ship the quick win first.

**Flow:**
1. When building each `BriefingSection`, cross-reference article URLs against the previous day's `Briefing` doc for that user (already storing `sections` per day — just diff by URL).
2. If overlap is high (>70%), either skip that section or note it in the script: *"Not much new on Technology since yesterday — here's what's still developing."*
3. Optionally track `firstSeenAt` per article URL so the script can say "new since yesterday" vs. "still developing."

**Build cost:** ~1 day. Touches only [briefingService.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/briefingService.ts).

---

### 🧠 Phase 4 — "Ask Your Archive" (Semantic Search / RAG)

**Priority: #4 — The portfolio differentiator.**

> [!IMPORTANT]
> This is the single feature that turns "voice news search" into "an assistant with memory of what I've read." Also lays the **embedding infrastructure** that multi-provider dedup will need later (Phase 6).

Full article text (`readerData.textContent` from reader mode) plus complete search history is sitting unused beyond CRUD.

**Flow:**
1. When an article is saved (or reader mode parses it), chunk `textContent` and embed — store vectors alongside the saved article doc (MongoDB Atlas Vector Search, no new service).
2. Extend `classifyIntent` action enum with `"archive_query"` (e.g., *"what have I saved about inflation"*).
3. On that intent, embed the query → vector similarity search against user's embeddings → top-k chunks.
4. Feed chunks to Groq (reuse `generateSummary` pattern) to synthesize a direct answer.
5. Stream through existing SSE pipeline as new event type (`archive_result`).

**Build cost:** ~4–5 days. New infra: embedding model calls, Atlas Vector Search index, chunking logic.

---

### 🔍 Phase 5 — Perspective Spread on Search Results

**Priority: #5 — Differentiator, not urgent.**

Already running every result set through an LLM for summary + category. One more pass gets editorial differentiation.

**Flow:**
1. After `searchGNews` returns articles for a topic, group by `source.name`.
2. Send per-source headlines/descriptions to Groq with a prompt for one-line framing/tone tags (not fact-checking — just *"how is this outlet framing it"*).
3. Surface as a small "perspective" strip above the article grid: 2–4 tags like *Reuters: neutral/factual, Fox: critical framing, CNN: sympathetic framing*.
4. Stream as another SSE stage (`perspective`) after `category`.

**Build cost:** ~2 days. One additional Groq call per search, new SSE event type, small frontend component.

**Why after RAG:** This adds polish but doesn't change what the product fundamentally does. RAG does.

---

### 🌐 Phase 6 — Multi-Provider Architecture

**Priority: #6 — Build last.**

```
Voice
  ↓
Query Expansion
  ↓
News Provider Interface
  ├── GNews
  ├── Currents
  ├── NewsData
  └── RSS Aggregator
  ↓
Merge
  ↓
Deduplicate (similarity-based)
  ↓
Rank (composite score)
  ↓
SSE (progressive)
```

> [!WARNING]
> **This is the largest build on the list.** Two new API integrations, an RSS polling job, similarity-based dedup, composite ranking, progressive SSE rendering. Don't start this until Phases 1–5 are solid.

**Why last:**
- GNews alone is sufficient for most queries right now. Build this when you actually hit its coverage/rate limits, not before.
- The similarity-based dedup this requires (title embedding cosine similarity + publish-time proximity) benefits from having embedding infra already in place from Phase 4 (RAG). Building them in reverse order means building the dedup infra twice.
- It's the highest operational surface area — two more API keys/quotas to manage, an RSS parser dependency, a cron-based feed refresh job.

### Critical design constraints for when you build this

| Constraint | Detail |
|-----------|--------|
| **Similarity-based dedup** | Once pulling the same AP/Reuters wire story from 3+ providers under different URLs, exact-URL dedup won't catch it. Dedupe on title embedding similarity + publish-time proximity. |
| **Lazy query expansion** | Hit each provider once with the original query first. Only trigger expansion when merged result count < 5 unique articles. Keeps common case fast and cheap. |
| **RSS is a background job** | RSS feeds aren't queryable — they're chronological dumps. Use QStash cron (already have it) to poll feeds into a local cache. At query time, filter that cache by embedding match, don't fetch live. |
| **Parallel + fault-tolerant** | `Promise.allSettled` across all providers (same pattern as `briefingService.ts`). One slow/failing provider must not block the others. |
| **Composite ranking** | Recency + source-diversity penalty + keyword/embedding relevance. `publishedAt`-only sorting will just surface whichever provider republished fastest. |
| **Progressive SSE** | Emit `provider_result` as each source returns instead of waiting for all four. GNews likely responds first — render those cards immediately, merge others as they arrive. The existing `useSSESearch` reducer pattern supports this directly. |
| **Quota management** | Extend `GLOBAL_QUOTAS` in `globalQuota.ts` with entries per provider. |

**Practical advice:** Build and validate query expansion alone (hitting GNews with expanded queries, no new providers) as a sub-step before committing to all four providers. Validates the approach at ~10% of the integration cost.

---

## Previously Completed (Archive)

These features from earlier priority docs are **already built** and should no longer appear on any roadmap:

- ✅ SSE Streaming Pipeline
- ✅ Rate Limiting + API Gateway (Redis + Lua token bucket)
- ✅ Daily Voice Briefing + Email (QStash cron, Resend, cross-user topic dedup)
- ✅ Redis Caching Layer
- ✅ Personalized Feed (`feedController.ts` + `TopicSelector`)
- ✅ Collections (`collectionController.ts` + modal)
- ✅ Reader View (`ReaderView.tsx`, `readerController.ts`)
- ✅ Saved Articles CRUD
- ✅ SSRF Protection on reader mode
- ✅ Gibberish filter on Whisper transcripts
