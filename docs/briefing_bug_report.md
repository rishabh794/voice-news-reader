# Briefing Email Branch Bug Report

Reviewing the latest commit (`afac5321778b0b4d9dec90f77cc6653a326d8e01`) in the `briefing-email` branch revealed several critical issues spanning rate-limit bypasses, runtime crashes, failed webhook signature validation, and ORM query issues.

## 1. GNews API Rate Limit Bypass (Concurrency Bug)
**File:** `backend/src/services/briefingService.ts`
**Severity:** High (Service Outage)

The `generateUserBriefing` function fetches news for all user topics in parallel:
```typescript
const sectionPromises = topics.map(topic => buildSection(topic));
const sectionResults = await Promise.allSettled(sectionPromises);
```
While the cron trigger (`generateAllBriefings`) protects against rate limits by first calling `prefetchAllTopics` (which safely waits 1 second between requests), the manual generation endpoint (`POST /api/briefing/generate`) calls `generateUserBriefing` directly without prefetching. If the topics are not cached, this bombards the GNews API concurrently, instantly blowing past the 1 request/second free tier limit (HTTP 429).

**Fix:** Add concurrency control inside `generateUserBriefing` (e.g. process sequentially using a `for...of` loop) or enforce a delay between requests when hitting the API.

## 2. Invalid `.ts` Imports Crashing the Server
**Files:** `backend/src/services/briefingService.ts`, `backend/src/services/emailService.ts`
**Severity:** Critical (Server fails to start)

There are multiple incorrect ES module imports:
```typescript
import { sendBriefingEmail } from './emailService.ts';
import { renderBriefingEmail } from './emailTemplates.ts';
```
In Node.js with ESM, TypeScript files must import local modules using `.js` extensions, not `.ts`. The TS compiler does not rewrite extensions, meaning Node will throw an `ERR_MODULE_NOT_FOUND` at runtime when it tries to literally resolve `emailService.ts` in the compiled dist folder.

**Fix:** Change the import extensions from `.ts` to `.js`.

## 3. QStash Webhook Signature Verification Will Fail
**File:** `backend/src/middleware/qstashMiddleware.ts`
**Severity:** High (Security / Cron failures)

The signature verification attempts to reconstruct the raw body from Express's parsed JSON:
```typescript
const body = JSON.stringify(req.body) || '';
```
QStash computes its cryptographic signature over the *exact raw byte payload* it sends. Express's `bodyParser.json()` reorders keys and strips whitespace, meaning `JSON.stringify` will output a different string than the original request. The verification will constantly fail.

**Fix:** Use `express.raw({ type: 'application/json' })` for the QStash webhook endpoint, or configure Express to preserve `req.rawBody` so the exact original string can be passed to `receiver.verify()`.

## 4. Mongoose \`findOneAndUpdate\` Returning Null on Upsert
**Files:** `backend/src/services/briefingService.ts`, `backend/src/controllers/briefingController.ts`
**Severity:** Medium (Silent failures)

Multiple queries use the native MongoDB option `{ returnDocument: 'after' }`:
```typescript
const briefing = await Briefing.findOneAndUpdate(
    { userId, date },
    { /* ... */ },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
);
```
Mongoose does not recognize `returnDocument: 'after'` in its standard `findOneAndUpdate` wrapper (it expects `new: true`). As a result, Mongoose falls back to returning the *original* document before the update. Since it's an upsert, the original document is `null`. `generateUserBriefing` will thus return `null` on the first run, skipping email delivery entirely for new briefings!

**Fix:** Replace `{ returnDocument: 'after' }` with `{ new: true }`.
