# 5 Features to Make Voice News Reader a Product People Actually Use

After analyzing your current app — voice search, GNews fetching, auth, history, TTS playback — here are 5 features ranked by **priority** based on user value, retention potential, and how well they turn a tech demo into something people open daily.

The existing [feature_recommendations.md](file:///c:/Users/risha/voice-news-reader/feature_recommendations.md) covers the engineering backbone. This document covers the **product layer** — the features users see, feel, and come back for.

---

## Priority 1: Personalized News Feed with Topic Preferences (🔥 Highest Retention Impact)

### What It Is
Right now every session starts from zero — the user has to voice-search every time. There's no memory of what they care about. Add a **personalized home feed** that learns from the user's search history and explicit topic preferences to show a curated feed the moment they log in.

### Why Users Want This
- **Zero-effort value** — open the app and news is already waiting, no voice command needed
- **Habit formation** — a personalized feed gives users a reason to check the app every morning
- **Competitive baseline** — Google News, Apple News, Flipboard all have this; without it, users bounce

### What the User Sees

```
First Login:
  → "Pick topics you care about" → chips: Technology, Sports, Finance, Health, Science, Politics, Entertainment
  → User selects: Technology, Finance, Science
  → Home feed immediately populates with top headlines from those topics

Every Return Visit:
  → Home feed auto-refreshes with latest articles from saved topics
  → "Based on your recent searches" section shows articles related to past voice queries
  → Quick-filter bar at top to toggle topic categories on/off

Smart Learning:
  → User voice-searches "electric vehicles" 3 times this week
  → App auto-suggests: "Add Electric Vehicles to your feed?" → one tap → done
```

### What This Needs
| Component | Detail |
|---|---|
| **Topic preferences model** | MongoDB document per user: `{ topics: ["tech", "finance"], autoSuggested: ["EVs"] }` |
| **Onboarding flow** | First-login modal with topic chip selection (skip-able but encouraged) |
| **Feed aggregator** | On login, fetch GNews for each saved topic → merge → sort by recency → deduplicate |
| **History-based suggestions** | Analyze last 7 days of search queries → extract recurring themes → suggest new topics |
| **Feed refresh** | Pull-to-refresh + auto-refresh every 15 min when tab is active |

### User Value
- ⏱ **Time to value**: Instant — news is ready before the user speaks
- 🔁 **Retention driver**: Personalization creates daily habit loops
- 📊 **Measurable**: Track DAU, feed scroll depth, topic add/remove rates

---

## Priority 2: Save, Organize & Read-Later with Collections

### What It Is
Users find interesting articles through voice search but have no way to keep them. The current "saved articles" feature is a flat, unsorted list. Upgrade it into a **full read-later system with named collections** — think Pocket or Instagram's saved collections.

### Why Users Want This
- **Content hoarding is universal** — every major content app has a save/bookmark system because users *always* want to come back to things
- **Organization reduces overwhelm** — named collections ("Work Research", "Weekend Reads", "AI Updates") let users manage information overload
- **Sharing potential** — saved collections become sharable, which drives organic growth

### What the User Sees

```
While Browsing Articles:
  → Tap bookmark icon on any article card
  → Quick-save to "All Saved" or choose a collection
  → "Create new collection" option: name it, pick an emoji icon

Saved Page:
  → Grid of collection cards with cover images from first saved article
  → "All Saved" default collection with everything
  → Each collection shows article count + last updated date
  → Swipe to delete or move articles between collections

Reading Experience:
  → Tap a saved article → opens in a clean reader view (stripped of ads/clutter)
  → 🔊 "Read aloud" button uses existing TTS to narrate the article
  → Mark as read/unread to track what you've consumed
```

### What This Needs
| Component | Detail |
|---|---|
| **Collections model** | `{ userId, name, emoji, articles: [articleId], createdAt, updatedAt }` |
| **Article model update** | Add `isRead`, `savedAt`, `collectionIds[]` fields |
| **Quick-save UI** | Bottom-sheet on bookmark tap with collection picker + create-new |
| **Reader view** | Fetch article URL → parse with `@mozilla/readability` → render clean HTML |
| **TTS integration** | Reuse existing Web Speech API to read parsed article content |

### User Value
- 📌 **Stickiness**: Users with saved content return to consume it — natural retention
- 🧠 **Mental model**: Familiar pattern from Pocket, Pinterest, Instagram — zero learning curve
- 📤 **Growth hook**: "Share collection" feature can drive organic invites

---

## Priority 3: Daily Voice Briefing — "Your 2-Minute News Update"

### What It Is
A single-tap feature that generates a **personalized audio news briefing** — the app reads a concise summary of today's top stories from the user's preferred topics, concatenated into a smooth 2-minute audio segment. Think Alexa's Flash Briefing or Google's news podcasts, but built into your app.

### Why Users Want This
- **Passive consumption** — users can listen while commuting, cooking, or getting ready
- **Voice-native apps should have voice-native output** — your app takes voice *input* but only gives *text output*; this closes the loop
- **Morning routine integration** — "play my briefing" becomes a daily habit anchor
- **Differentiation** — most news apps are read-first; making yours listen-first is a genuine product wedge

### What the User Sees

```
Dashboard:
  → Prominent "▶ Play Daily Briefing" card at the top of home feed
  → Shows: "5 stories · ~2 min · Updated 8:12 AM"

Briefing Playback:
  → "Good morning! Here's your news update for Tuesday, July 8th."
  → Story 1: "In Technology: OpenAI announced..." (15-20 sec summary)
  → [subtle transition chime]
  → Story 2: "In Finance: Markets opened higher..." (15-20 sec)
  → ... 3 more stories
  → "That's your briefing. Have a great day!"

Player Controls:
  → Play/pause, skip to next story, playback speed (1x/1.5x/2x)
  → Mini-player persists at bottom while navigating other pages
  → Progress bar showing which story is currently playing
```

### What This Needs
| Component | Detail |
|---|---|
| **Briefing generator** | Fetch top 5 articles from user's topics → LLM-summarize each into 2-3 spoken sentences |
| **Script compiler** | Stitch summaries into a single TTS script with transitions and intro/outro |
| **Audio player UI** | Persistent mini-player component with play/pause, skip, speed controls |
| **Scheduling** | Generate briefing on first morning open or cache from a daily cron job |
| **Story segmentation** | Track which story is playing for skip-forward/backward controls |

### User Value
- 🎧 **Unlocks new usage context**: Hands-free, eyes-free consumption (commute, gym, cooking)
- ☀️ **Morning routine**: Creates the strongest possible daily habit hook
- 🗣️ **Product identity**: Makes Voice News Reader *actually* about voice — not just voice input

---

## Priority 4: Trending & Social Proof — "What Everyone's Searching"

### What It Is
Add a **Trending section** that shows the most popular search topics across all users in real-time. Show what topics are surging, what the community is searching for, and let users jump into trending stories with one tap.

### Why Users Want This
- **Discovery without effort** — users don't always know what to search for; trending topics solve the "blank prompt" problem
- **Social proof** — "10,000 people searched this today" creates urgency and FOMO
- **Breaking news detection** — when a major event happens, trending spikes are the fastest signal

### What the User Sees

```
Home Feed → Trending Section:
  → 🔥 Trending Now
  → 1. "AI Regulation"          ↑ 340% · 2.1k searches today
  → 2. "Olympics 2028"          ↑ 180% · 1.8k searches today
  → 3. "Electric Vehicles"      ↑ 95%  · 900 searches today
  → 4. "Climate Summit"         ↑ 60%  · 650 searches today
  → 5. "Mars Mission Update"    NEW    · 420 searches today

  → Tap any topic → instant voice-free search → articles load immediately

Trending Badge on Articles:
  → Articles from trending topics get a "🔥 Trending" badge
  → Helps users spot what's hot even in their regular feed
```

### What This Needs
| Component | Detail |
|---|---|
| **Search analytics** | Aggregate anonymized search queries across all users (no PII) |
| **Trending algorithm** | Track query frequency per topic per time window → calculate velocity (rate of increase) |
| **Topic normalization** | Group variations ("AI", "artificial intelligence", "AI news") into canonical topics |
| **Trending API** | `GET /api/trending` → returns top 10 topics with search count + velocity |
| **Frontend component** | Horizontal scroll card or vertical list with trend arrows and search counts |
| **Privacy** | All aggregation is anonymous — never expose individual user queries |

### User Value
- 🧭 **Solves cold-start problem**: New users and undecided users always have something to tap
- 🏃 **Speed to content**: One tap on a trending topic = instant articles, no voice needed
- 📈 **Network effects**: The more users search, the better trending gets — virtuous cycle

---

## Priority 5: Smart Notifications — "News Alerts That Actually Matter"

### What It Is
Let users set **custom news alerts** for topics they care deeply about. When a major story breaks on a tracked topic, the app sends a push notification with a one-line summary and a "Listen now" button that plays the story via TTS immediately.

### Why Users Want This
- **Re-engagement** — notifications bring users back to the app without them having to remember
- **Real-time relevance** — users don't want to check manually; they want the news to come to them
- **Signal vs noise** — unlike generic news app notifications, these are *only* for topics the user explicitly chose

### What the User Sees

```
Setting Up Alerts:
  → Profile → News Alerts
  → "Get notified when big stories break on topics you follow"
  → Toggle alerts per topic: Technology ✅, Finance ✅, Science ❌, Sports ❌
  → Frequency: "Instant" | "Daily Digest" | "Weekly Roundup"

Push Notification:
  → 📰 Voice News: AI Regulation
  → "EU passes landmark AI Act requiring disclosure of training data for all models."
  → [Listen Now]  [Read More]  [Dismiss]

  → Tap "Listen Now" → app opens → TTS immediately reads the story aloud
  → Tap "Read More" → app opens → article detail view

Daily Digest Notification (if chosen):
  → 📰 Your Daily News Digest
  → "5 stories on your tracked topics today"
  → Opens briefing player with just those stories
```

### What This Needs
| Component | Detail |
|---|---|
| **Alert preferences** | Per-user topic alert settings with frequency (instant/daily/weekly) |
| **Background checker** | Cron job or polling service that checks GNews for new articles on tracked topics |
| **Notification service** | Web Push API (via `web-push` library) for browser push notifications |
| **Deduplication** | Don't notify for the same story twice — track notified article IDs per user |
| **Digest compiler** | For daily/weekly mode, batch unread alerts into a single summary notification |
| **Quick-listen action** | Notification action button that opens app + auto-plays TTS for that article |

### User Value
- 🔔 **Re-engagement**: Push notifications are the #1 driver of app revisits
- 🎯 **Precision**: User-chosen topics mean low unsubscribe/mute rates
- 💡 **Completes the loop**: Search → Save → Alert → Listen → the full user journey is covered

---

## Master Priority Table

| Priority | Feature | User Problem Solved | Retention Impact | Complexity |
|---|---|---|---|---|
| 🥇 P1 | **Personalized News Feed** | "I have to search every time" | ⭐⭐⭐⭐⭐ | Medium |
| 🥈 P2 | **Collections & Read-Later** | "I lose articles I liked" | ⭐⭐⭐⭐ | Medium |
| 🥉 P3 | **Daily Voice Briefing** | "I want news while multitasking" | ⭐⭐⭐⭐⭐ | Medium |
| 4️⃣ P4 | **Trending Topics** | "I don't know what to search for" | ⭐⭐⭐⭐ | Medium-Low |
| 5️⃣ P5 | **Smart Notifications** | "I forget to check for updates" | ⭐⭐⭐⭐ | Medium-High |

---

## Why This Priority Order

| Priority | Reasoning |
|---|---|
| **P1 — Personalized Feed** | The single biggest gap right now. Every session starting from a blank slate is the fastest way to lose users. A personalized feed provides **instant value on login** and creates daily habit loops. This is table-stakes for any content app. |
| **P2 — Collections** | Users who save content come back to consume it. Organized collections create a sense of *investment* in the app — the more you save, the harder it is to leave. This is a proven retention mechanic across Pocket, Pinterest, and Instagram. |
| **P3 — Daily Briefing** | This is the feature that makes Voice News Reader *actually live up to its name*. Right now voice is an input method; the briefing makes voice the **primary output** too. Morning briefings create the strongest daily habit anchor of any feature here. |
| **P4 — Trending** | Low complexity, high discovery value. Solves the cold-start problem for new users and the "I'm bored, show me something" problem for returning users. Also creates **network effects** — the app gets better as more people use it. |
| **P5 — Notifications** | The most powerful re-engagement tool, but ranked last because it needs a solid content experience first. Notifying users back into a bare app doesn't work — but notifying them into a personalized feed with collections and briefings? That's a retention flywheel. |

### Strategic Groupings

```
Foundation (Build These First):
  P1 (Personalized Feed) + P2 (Collections) → Daily value + content stickiness

Differentiation (Build These Second):
  P3 (Daily Briefing) → Voice-native output = unique product identity

Growth (Build These Last):
  P4 (Trending) + P5 (Notifications) → Discovery + re-engagement flywheel
```

> [!IMPORTANT]
> These features build on top of your existing architecture. P1 extends your history/search system, P2 extends saved articles, P3 leverages your existing TTS pipeline, P4 aggregates your existing search queries, and P5 adds a notification layer on top of GNews fetching. No rewrites needed.

> [!TIP]
> These user-facing features pair perfectly with the [technical features](file:///c:/Users/risha/voice-news-reader/feature_recommendations.md). For example: SSE Streaming (tech P2) makes the Personalized Feed load progressively. Redis Caching (tech P4) makes the Trending section fast. The ReAct Agent (tech P1) makes the Daily Briefing smarter. Build them in parallel for maximum impact.

---

## Open Questions

1. **Do you have analytics on current user behavior?** Understanding how often users return and what they search for would help prioritize P1 vs P3.
2. **Is the app primarily mobile-web or desktop-web?** This affects how the briefing player and notifications are designed.
3. **What's your GNews API quota?** The personalized feed and trending features will increase API calls — might need caching (tech P4) first.
4. **Want me to start implementing any of these?** I'd recommend P1 (Personalized Feed) since it's the highest-impact change for user retention.
