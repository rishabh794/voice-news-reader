# Search Accuracy Problem — Diagnosis & Solutions

## The Problem

The voice search pipeline has a **query translation gap** between what the LLM extracts and what GNews can actually find.

```
User speaks: "what's happening with the Russia-Ukraine peace talks"
                    ↓
classifyIntent → topic: "Russia-Ukraine peace talks"   ← ✅ Good extraction
                    ↓
searchGNews("Russia-Ukraine peace talks")              ← ❌ 0 results or garbage
```

`classifyIntent` is doing its job well — it extracts a semantically correct topic. The problem is that **GNews is a keyword search engine, not a semantic search engine.** It does implicit AND across all words, so `Russia-Ukraine peace talks` becomes `Russia AND Ukraine AND peace AND talks` — and if no single article title/description contains all four terms, you get nothing.

### Root Cause: Semantic Mismatch

| What the user means | What classifyIntent outputs | What GNews needs |
|---|---|---|
| Peace negotiations between Russia and Ukraine | `"Russia-Ukraine peace talks"` | `"Russia Ukraine" AND (peace OR talks OR negotiations OR ceasefire)` |
| Impact of AI on healthcare jobs | `"AI impact on healthcare"` | `"artificial intelligence" AND healthcare` |
| Should I worry about inflation | `"inflation concerns"` | `inflation` (simple keyword is enough) |
| Latest on the Boeing whistleblower situation | `"Boeing whistleblower"` | `Boeing AND whistleblower` (this one actually works!) |

The pattern: **simple noun-phrase topics work; complex/conversational/multi-concept topics fail.**

---

## Constraints

| Constraint | Detail |
|---|---|
| **GNews free tier** | 100 requests/day — can't spend 2-3 calls per search on fallbacks |
| **Zero additional cost** | No new paid APIs or services |
| **Existing stack only** | Groq (free), GNews (free), Redis (existing) |
| **SSE pipeline only** | Fix needed only in voice search flow, not feed/briefings |
| **Latency budget** | ~200ms extra is acceptable (Groq is fast) |

---

## Approaches Analyzed

### Approach 1: LLM Query Rewriting (⭐ Recommended)

> [!IMPORTANT]
> **This is the highest-impact, lowest-cost solution.** It solves the root cause directly with zero new infrastructure.

**Concept:** Add a dedicated Groq call *before* `searchGNews` that translates the LLM-extracted topic into an optimized GNews query string using the API's boolean operators.

**How it works:**

```
classifyIntent → topic: "Russia-Ukraine peace talks"
                    ↓
rewriteForGNews(topic) → query: '"Russia Ukraine" AND (peace OR negotiations OR ceasefire OR talks)'
                    ↓
searchGNews(optimized_query) → ✅ relevant articles
```

The rewrite prompt would instruct the LLM to:
1. Identify the **core entity/noun** (the non-negotiable part) — wrap in quotes for phrase matching
2. Identify **contextual modifiers** — connect with OR to cast a wider net
3. Drop filler words (impact, latest, happening, concerns)
4. Use GNews operators: `AND`, `OR`, `NOT`, `"phrase"`
5. Stay under 200 chars (GNews limit)

**Example prompt:**
```
You convert a news search topic into an optimized query for the GNews search API.

GNews supports: AND (default between words), OR, NOT, "exact phrase"
Max query length: 200 characters.

Rules:
1. Extract the CORE ENTITY (person, org, event name) and wrap in "quotes" for phrase match
2. Add related synonyms/terms with OR for broader recall
3. Remove filler words (latest, happening, concerns, update, news about)
4. Keep it SHORT — 2-5 key terms, not full sentences
5. Any OR group combined with AND must be wrapped in parentheses — GNews's OR operator binds tighter than AND, so writing `X AND A OR B` will actually be parsed as `(X AND A) OR B`, not what you want.
6. Return ONLY the query string, nothing else

Examples:
- Topic: "Russia-Ukraine peace talks" → "Russia Ukraine" AND (peace OR ceasefire OR negotiations)
- Topic: "AI impact on healthcare" → "artificial intelligence" AND healthcare  
- Topic: "inflation concerns" → inflation
- Topic: "Tesla quarterly earnings report" → Tesla AND (earnings OR revenue OR quarterly)
- Topic: "Boeing whistleblower" → Boeing AND whistleblower
```

**Cost analysis:**

| Metric | Value |
|---|---|
| Extra Groq calls | 1 per search (~15-30 tokens, trivially small) |
| Extra GNews calls | 0 (still 1 call, just a better query) |
| Latency added | ~150-250ms (Groq llama-3.1-8b-instant is very fast) |
| New infrastructure | None |
| Complexity | ~30 lines of code in [pipeline.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/pipeline.ts) |

**Why this works:** The problem was never "not enough data sources." It was "translating human intent into keyword syntax." This is exactly what LLMs excel at — paraphrasing with constraints.

---

### Approach 2: Merge classifyIntent + Query Rewrite into One Call

**Concept:** Instead of two sequential LLM calls (classifyIntent → rewriteQuery), modify the `classifyIntent` system prompt to output **both** the action/topic AND an optimized GNews query in a single JSON response.

```json
{
  "action": "search",
  "topic": "Russia-Ukraine peace talks",
  "gnews_query": "\"Russia Ukraine\" AND (peace OR ceasefire OR negotiations)"
}
```

**Pros:**
- Zero extra latency (same single Groq call)
- Zero extra Groq quota usage
- Simplest possible change — modify one prompt, add one field

**Cons:**
- Increases the cognitive load on one prompt (intent classification + query optimization are different skills)
- The 8B model may not reliably do both tasks well in one shot — intent classification is already a structured JSON task, adding query syntax generation could degrade both
- Harder to iterate/debug independently — if queries are bad, you can't tell if it's the intent part or the query part

**Verdict:** Tempting for the zero-cost angle, but **risky with an 8B model.** If you try this and the query quality is inconsistent, fall back to Approach 1 (dedicated call).

---

### Approach 3: Rule-Based Query Simplification (No LLM)

**Concept:** Instead of an LLM rewrite, apply deterministic heuristics to clean up the topic string before sending to GNews.

```typescript
function optimizeQuery(topic: string): string {
  // 1. Remove common filler words
  const fillers = /\b(latest|happening|concerns|impact|update|news about|tell me about|what's)\b/gi;
  let q = topic.replace(fillers, '').trim();
  
  // 2. If still too many words (>4), take first 3 content words
  const words = q.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 4) {
    q = words.slice(0, 3).join(' ');
  }
  
  // 3. Wrap multi-word proper nouns in quotes (basic NER heuristic)
  // e.g., "Elon Musk" stays together
  
  return q;
}
```

**Pros:**
- Zero latency added
- Zero API calls
- Fully deterministic, easy to debug

**Cons:**
- Brittle — every new edge case needs a new rule
- Can't handle synonyms (won't add `ceasefire` as an alternative to `peace talks`)
- Can't understand context — doesn't know that "Boeing whistleblower" should stay as-is but "impact of AI on healthcare" should drop "impact of"
- Basically reimplementing NLP badly instead of using the LLM you already have

**Verdict:** Good as a **fallback layer** if the LLM rewrite fails, but not sufficient as the primary solution.

---

### Approach 4: Use GNews Top Headlines + Category Instead of Search

**Concept:** For broad/vague queries, skip the search endpoint entirely and use GNews's `/top-headlines` endpoint with a category filter.

```
User: "what's happening in tech"
  → Don't search for "technology news"
  → Hit /api/v4/top-headlines?category=technology
```

**Pros:**
- Top Headlines is designed for exactly this use case — broad topic browsing
- Doesn't suffer from keyword matching issues
- Already available on the free tier

**Cons:**
- Only works for 9 predefined categories (general, world, nation, business, technology, entertainment, sports, science, health)
- Useless for specific queries like "Boeing whistleblower" or "Russia-Ukraine peace talks"
- Would need the LLM to decide *when* to use search vs. top-headlines — adds routing complexity

**Verdict:** Useful as a **complementary strategy** for category-level queries. Could be added to `classifyIntent` as a new action type (`"browse_category"`) alongside `"search"`. But doesn't solve the core problem for specific queries.

---

### Approach 5: GNews `sortby=relevance` Tuning

**Concept:** GNews supports `sortby=relevance` as an alternative to the default `publishedAt`. 

Currently, [tools.ts](file:///c:/Users/risha/voice-news-reader/backend/src/services/tools.ts) doesn't specify the `sortby` parameter, which defaults to `publishedAt`. This can cause matches that happen to be technically valid to feel irrelevant simply because they were published most recently.

**Suggested change:**
```typescript
// Current (sorts by recency)
const url = `...?q=${query}&lang=en&apikey=${apiKey}&max=9`;

// Better (sorts by relevance for search quality)  
const url = `...?q=${query}&lang=en&apikey=${apiKey}&max=9&sortby=relevance`;
```

**Pros:**
- One-line change
- Improves match ranking independently of whether the query rewrite gets the syntax perfectly right every time
- Free

**Cons:**
- Alone, doesn't fix the fundamental query mismatch

**Verdict:** **Do this regardless** — it's a free ranking improvement. Combine with Approach 1.

---

## Recommended Strategy

> [!TIP]
> **Layer three approaches together** for maximum impact with zero additional cost.

### Implementation priority:

```
┌─────────────────────────────────────────────────┐
│  1. Modify classifyIntent prompt (Approach 2)   │  ← Try this first (zero cost)
│     Add gnews_query field to JSON output        │
└───────────────────────┬─────────────────────────┘
                        │ If 8B model quality is poor
                        ▼
┌─────────────────────────────────────────────────┐
│  1b. Dedicated rewriteForGNews call (Approach 1)│  ← Fallback if merged prompt fails
│     Separate Groq call, ~200ms extra            │
└───────────────────────┬─────────────────────────┘
                        │ Always do these too
                        ▼
┌─────────────────────────────────────────────────┐
│  2. Add sortby=relevance (Approach 5)           │  ← One-line change, free ranking win
└───────────────────────┬─────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│  3. Top Headlines routing (Approach 4)          │  ← For "what's happening in tech"
│     New action type: "browse_category"          │     style queries
└─────────────────────────────────────────────────┘
```

### Expected outcome:

| Query type | Before | After |
|---|---|---|
| `"Russia-Ukraine peace talks"` | 0 results | ✅ Results via `"Russia Ukraine" AND (peace OR ceasefire)` |
| `"AI impact on healthcare"` | Irrelevant matches on "impact" in random articles | ✅ Results via `"artificial intelligence" AND healthcare` + `sortby=relevance` |
| `"what's happening in tech"` | Weak keyword matches | ✅ Top Headlines technology category |
| `"Boeing whistleblower"` | Already works | ✅ Still works (rewrite is a no-op for simple queries) |
| `"inflation concerns"` | Random articles mentioning "concerns" | ✅ Clean `inflation` query after filler removal |

### Build cost: ~1-2 days total

| Step | Time |
|---|---|
| Modify classifyIntent prompt + test quality | 3-4 hours |
| If needed, extract to dedicated `rewriteForGNews` | 2 hours |
| Add `browse_category` action + top-headlines endpoint | 3-4 hours |
| Testing & edge case tuning | 2-3 hours |

---

## What NOT to Do

| Tempting but bad idea | Why |
|---|---|
| **Add a second news API** (NewsAPI, Currents, etc.) | Doesn't fix the query quality problem — you'll get the same bad results from two sources. Also adds cost/complexity. Save this for Phase 6. |
| **Build full semantic search / RAG** | Massive overkill for this problem. RAG is for searching *your own stored data*, not for fixing how you query an external API. Save for Phase 4. |
| **Multiple GNews calls with different queries** | You're on the free tier (100/day). Burning 2-3 calls per search halves your daily capacity. Fix the query, don't brute-force it. |
| **Switch from Groq to a bigger model** | The 8B model is fine for query rewriting — it's a simple paraphrasing task, not reasoning. Don't add cost for no reason. |
