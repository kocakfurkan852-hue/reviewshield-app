# ReviewShield — Final Build Action Plan for Gemini (v1.1)

> **Purpose**: Definitive, condensed action plan for an AI developer (Gemini) to build ReviewShield from start to finish. Distills 4 source documents into an ordered execution checklist.
> 
> **v1.1 Changes**: Incorporates CEO feedback — approval gate toggle, API-first architecture, knowledge base, configurable intervals, reminder logic from real deletion workflow.

---

## Source Documents (already in project folder)

| Document | Role | Location |
|---|---|---|
| `ReviewShield_PRD.txt` | **WHAT** to build — features, user stories, acceptance tests | `ReviewShield/` |
| `ReviewShield_Build_SOP.txt` | **HOW** to build it — schemas, tech stack, UI spec, feature acceptance criteria | `ReviewShield/` |
| `ReviewShield_System_Pilot.txt` | **HOW TO THINK** while building — B.L.A.S.T. protocol, A.N.T. architecture, operating principles | `ReviewShield/` |
| `google_review_deletion_agent_blueprint.md` | **DOMAIN KNOWLEDGE** — Google removal workflow, email templates, response classifications | `ReviewShield/` |
| `wie werden google reviews wirklich gelöscht.txt` | **REAL-WORLD PROCESS** — actual Google deletion timelines and behavior | `ReviewShield/` |
| `reviewshield.md` | **PROJECT CONSTITUTION** — schemas, rules, invariants (already generated) | `reviewshield-app/` |

---

## Tech Stack (locked)

| Layer | Technology |
|---|---|
| Frontend + API | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Database | **PostgreSQL** (via Supabase or Railway) |
| ORM | **Prisma** |
| Auth | **NextAuth.js** (credentials provider, JWT, role-aware) |
| Email | **Gmail API** (OAuth 2.0 — `gmail.readonly` + `gmail.send` only) |
| AI | **Anthropic Claude API** (`claude-sonnet-4-20250514`) |
| PDF | **Puppeteer** (server-side HTML → PDF) |
| Storage | **Supabase Storage** or **AWS S3** |
| Background Jobs | **Vercel Cron** or **BullMQ** (Redis) |
| Monitoring | **Sentry** |

### Hosting Options (server-based, not local)

| Option | Cost | Pros | Cons |
|---|---|---|---|
| **Hetzner Cloud (Frankfurt)** 🏆 | ~€4-10/mo | German IP native, cheapest, full control, great for GDPR | Self-managed (use Coolify or Docker Compose) |
| **Railway** | ~$5-20/mo | One-click Next.js deploy, managed PostgreSQL, no Docker needed | US-based (can add EU region) |
| **Render** | ~$7-25/mo | Managed deploy, background workers, EU region available | Cold starts on free tier |
| **DigitalOcean App Platform** | ~$12-24/mo | Managed, Frankfurt region, good UI | More expensive than Hetzner |
| **Fly.io** | ~$5-15/mo | Edge deploy, Frankfurt PoP, good for background jobs | More complex config |
| **Coolify on Hetzner** 🏆 | ~€4/mo + free | Self-hosted Vercel alternative, auto-deploy from Git, SSL, German IP | Initial setup takes 30 min |

> [!TIP]
> **Recommended**: **Coolify on Hetzner CX22 (Frankfurt)** — €4.49/mo, German IP built-in, auto-deploy from GitHub, free SSL, runs Next.js + PostgreSQL + Puppeteer + cron all in one. It's essentially a self-hosted Vercel with zero monthly platform fees.

---

## Build Phases — Ordered Execution

### Phase 0: Project Setup ✅ DONE
- [x] Created project memory files (`reviewshield.md`, `task_plan.md`, `findings.md`, `progress.md`)
- [x] Created `.env.example` with all 12 variable names
- [x] Created `.gitignore`
- [x] Created directory structure (`architecture/`, `tools/`, `.tmp/`)

---

### Phase 1: Initialize Next.js + Database
**Goal**: Bootable app with database connected and schema applied.

```
Steps:
1. Initialize Next.js 14 app in reviewshield-app/ (App Router, TypeScript, Tailwind, src/ directory)
2. Install dependencies: prisma, @prisma/client, next-auth, shadcn/ui
3. Create Prisma schema from reviewshield.md Section 1 (all tables exactly as specified)
   ⚠️ ADDITION: Add "knowledge_base" table (see Phase 5B below)
   ⚠️ ADDITION: Add "system_settings" table for configurable options
4. Run prisma db push to apply schema to PostgreSQL
5. Seed admin user (ADMIN role) with hashed password
6. Configure NextAuth with credentials provider + JWT + role in session
7. Create middleware.ts for route protection (ADMIN vs AGENT)
8. Build Settings page with AI Agent configuration:
   - Gmail polling interval (dropdown: 5, 10, 15, 30 min — default 15)
   - Approval Gate toggle (ON/OFF — default ON)
   - Default reminder interval
   - Default reminder max count
9. Verify: login works, JWT carries role, /admin/* blocked for AGENT
```

> [!IMPORTANT]
> Do NOT proceed past this phase until `prisma db push` succeeds and login works for both roles.

---

### Phase 2: Core CRUD — Clients, Campaigns, Reviews
**Goal**: Admin AND Agent can create clients & campaigns. Both can import reviews. System exposes a REST API for external tool integration.

```
Steps:
1. Build Client CRUD (create, edit, archive) — Admin AND Agent
2. Build Campaign CRUD (create, assign agent, set status) — Admin creates, Agent views assigned
3. Build Review Import:
   a. CSV upload with server-side validation (file type, size ≤10MB, schema check)
   b. Manual single-review add form
   c. Reject missing fields, flag duplicate URLs
   d. ⚠️ BOTH Admin and Agent can import reviews
4. Build Review table: sortable, filterable by status, paginated
5. Build bulk status update for reviews
6. Enforce agent data isolation: WHERE assigned_agent_id = session.userId at query level
7. Test: Agent A cannot see Agent B's campaigns via direct API call (expect 403)
```

#### 2B: External API for Tool Integration ⚠️ NEW

**Goal**: Expose a REST API so external tools can push clients, campaigns, and reviews directly into ReviewShield.

```
CEO is building a separate client prospecting tool that:
- Finds potential clients
- Analyzes their bad Google reviews
- Calculates what rating is possible if 1-3 star reviews are removed
- Needs to push the client + their reviews directly into ReviewShield

Build these API endpoints:
1. POST /api/external/clients — Create a client from external tool
2. POST /api/external/campaigns — Create a campaign for a client
3. POST /api/external/reviews/bulk — Bulk import reviews into a campaign
4. GET  /api/external/campaigns/:id/status — Check campaign status

Authentication: API key (stored in .env as EXTERNAL_API_KEY)
All endpoints write to audit_log with source="EXTERNAL_API"
Response format: JSON with created IDs for linking

Add to .env.example:
EXTERNAL_API_KEY=  # API key for external tool integration
```

---

### Phase 3: Removal Request Tracking
**Goal**: Agent marks reviews as submitted. System tracks batches. Reminders only trigger if no response from Google within 3 business days.

```
Steps:
1. Build removal_request creation (select reviews → create batch)
2. Link reviews via removal_request_reviews join table
3. Auto-create reminder_schedule record with configurable defaults from system_settings
4. Open Google form URL in new tab on submission
5. Status transitions: selected reviews → SUBMITTED
6. Show submission history on campaign detail page
7. Every status change writes to audit_log (same transaction)
```

#### Reminder Trigger Logic (from real deletion workflow):

```
The actual Google deletion process works like this:
- Reviews with NO comment + 1 star: often deleted within 10-15 minutes (fast deletion)
- Reviews WITH comment: Google sends "Danke für Ihre Anfrage" confirmation, then takes
  2-3 business days for manual review
- After manual review: Google either deletes, asks a follow-up question (rq1-rq6), or declines

THEREFORE: Reminders should NOT start immediately. They only activate when:
1. 3+ business days have passed since submission AND
2. Google has NOT responded at all (no email received for this ticket) AND
3. The review was NOT fast-deleted

The first reminder is sent after 7 calendar days of silence (configurable in settings).
Subsequent reminders every 2 days after that.
This matches the real-world process described by the CEO.
```

---

### Phase 4: Gmail Integration + AI Email Parsing
**Goal**: System polls Gmail at a configurable interval. AI parses emails. Review statuses auto-update.

```
Steps:
1. Implement Gmail OAuth 2.0 connection (Admin settings page)
2. Build poll-gmail tool: fetch inbox, filter Google removal emails, deduplicate
3. Store raw emails in email_threads table (direction=INBOUND)
4. Build parse-email tool: send body to Claude API with exact system prompt from reviewshield.md
5. Validate JSON response: { action, affected_review_urls, google_response_type, summary, confidence }
6. Implement confidence logic:
   - ≥ 0.85: auto-update review statuses, pre-select template
   - < 0.85: flag for human review, no auto-update
7. Match email to campaign by review URLs
8. Retry logic: 3× exponential backoff on Claude API failure
9. Fallback: action=UNKNOWN, confidence=0, flag for human review
10. ⚠️ CONFIGURABLE: Polling interval set in AI Agent Settings page
    (dropdown: 5 / 10 / 15 / 30 minutes — stored in system_settings table)
11. Fast-deletion detection: reviews with no text + 1 star → check for confirmation
    within 15 minutes. If confirmed, auto-mark SUCCESS.
```

---

### Phase 5: Response Template Library
**Goal**: Admin manages lawyer-written templates. AI selects them, never rewrites — UNLESS no template matches, in which case AI generates from the Knowledge Base.

```
Steps:
1. Build Template Library page at /settings/templates
2. CRUD: create, edit, duplicate, archive templates
3. Fields: name, scenario_key, subject_line, body_text (with {{placeholders}}), language (DE|EN),
   is_default, version
4. Supported placeholders: {{reviewer_name}}, {{review_url}}, {{star_rating}}, {{client_name}},
   {{campaign_name}}, {{google_reference_id}}, {{submission_date}}
5. Visual placeholder highlighting in editor
6. Version history: every edit increments version, archives previous, viewable + restorable
7. Template preview with sample data
8. Seed the 9 default templates from google_review_deletion_agent_blueprint.md:
   - rq1 (identity), rq2 (residence), rq3 (content detail), rq4 (listing link), rq6 (authorization)
   - reminder_first, reminder_followup, reminder_final
   - follow-up (7-day no-response)
```

> [!IMPORTANT]
> All lawyer template texts must be imported VERBATIM from the blueprint. Do not modify, improve, or paraphrase them.

---

### Phase 5B: AI Knowledge Base ⚠️ NEW FEATURE

**Goal**: A structured knowledge database the Admin can populate and manage. When no template matches a Google response — or when the Admin rejects an AI draft — the AI uses this knowledge base to generate a custom response.

```
Database table: knowledge_base
| Column         | Type     | Notes |
|----------------|----------|-------|
| id             | UUID     | PK |
| category       | ENUM     | LEGAL_TEMPLATE | DELETION_PROCESS | GOOGLE_TOS | CASE_LAW | CUSTOM |
| title          | VARCHAR  | Human-readable title |
| content        | TEXT     | The actual knowledge content (long text) |
| source         | VARCHAR  | Where this info came from (e.g., "BGH ruling", "Google ToS v2026") |
| tags           | TEXT[]   | Searchable tags for retrieval |
| priority       | INT      | Higher = more important for AI context (1-10) |
| active         | BOOLEAN  | Admin can enable/disable entries |
| created_at     | TIMESTAMP| Auto |
| updated_at     | TIMESTAMP| Auto |

Steps:
1. Build Knowledge Base management page at /settings/knowledge-base
2. Admin can add/edit/delete knowledge entries in these categories:
   - LEGAL_TEMPLATE: The deletion blueprint, lawyer reasoning, legal arguments
   - DELETION_PROCESS: How Google actually processes deletions (from the training video)
   - GOOGLE_TOS: Google Terms of Service relevant sections
   - CASE_LAW: BGH rulings, legal precedents, § references
   - CUSTOM: Any other info the Admin wants the AI to know
3. Seed initial entries from:
   - google_review_deletion_agent_blueprint.md (deletion process, justification text)
   - Lawyer templates (as reference material)
   - BGH rulings cited in templates
   - Google review policy excerpts
4. AI Response Generation Flow (when no template matches OR Admin rejects a draft):
   a. Retrieve relevant knowledge_base entries (by category + tags + similarity)
   b. Build context prompt with retrieved knowledge
   c. AI generates a response using ONLY information from the knowledge base
   d. Generated response goes to PENDING_REVIEW (same Approval Gate)
   e. Admin reviews, edits if needed, then approves
5. The AI NEVER invents legal arguments — it only uses what's in the knowledge base
```

> [!WARNING]
> AI-generated responses from the knowledge base still go through the Approval Gate. They are NOT auto-sent. The Admin must always review and approve before sending.

---

### Phase 6: AI Draft Replies + Approval Gate (WITH TOGGLE)
**Goal**: AI drafts replies using templates. Admin Approval Gate can be toggled ON/OFF from settings.

```
Steps:
1. Build select-template tool: match scenario_key → default template
   - If no template matches: query knowledge_base → AI generates custom response
2. Build render-draft tool: resolve all {{placeholders}} in template body
3. Create outbound_drafts record (status=PENDING_REVIEW, draft_type=REPLY)
4. Build Approval Queue page (/approval-queue):
   a. Two-panel layout: left = original Google email, right = AI draft
   b. Template name badge above draft (or "AI Generated" if from knowledge base)
   c. Confidence score badge (green ≥0.85, amber 0.70-0.84, red <0.70)
   d. 4 Admin actions: Approve & Send | Edit & Approve | Change Template | Reject
   e. On Reject: option to "Regenerate from Knowledge Base" — AI creates new draft
      using knowledge_base context, goes back to PENDING_REVIEW
5. Build the Approval Gate API:
   a. POST /api/outbound-drafts/:id/approve
   b. Check system_settings.approval_gate_enabled:
      - If ON: verify session.role === ADMIN, verify draft.status === PENDING_REVIEW
      - If OFF: auto-approve drafts (still write to audit_log for traceability)
   c. Write approval to audit_log FIRST
   d. Send via Gmail API (with In-Reply-To header for threading)
   e. Update draft status → SENT
   f. Return 403 if approval gate is ON and checks fail
6. Build send-via-gmail tool: check for approval record before sending
7. Badge count on Approval Queue nav item
8. In-app notification when draft is ready
```

> [!CAUTION]
> **Approval Gate Toggle Behavior**:
> - **ON** (default, recommended for launch): Every draft requires manual Admin click to send. Full original behavior.
> - **OFF**: AI drafts are auto-approved and sent immediately. `audit_log` still records every action with `auto_approved=true` flag. Admin can turn this back ON at any time from Settings.
> - Toggle is in Settings → AI Agent → Approval Gate (ON/OFF switch)
> - Even with gate OFF, the system still creates the draft record, writes to audit_log, and records what was sent. Nothing is invisible.

---

### Phase 7: Reminder Scheduler
**Goal**: System creates reminder drafts for unanswered submissions. Reminders only start after 3 business days of silence from Google.

```
Steps:
1. Build check-reminders tool: query removal_requests due for reminder
   - WHERE: reminder_enabled=true AND status=SUBMITTED
     AND no email_threads exist for this request (Google hasn't responded at all)
     AND submission_at + 3 business days < now (grace period)
     AND (last_reminder_sent_at IS NULL OR now - last_reminder_sent_at >= interval)
     AND reminder_count < reminder_max_count
2. Template selection by count: 0→reminder_first, 1→reminder_followup, ≥2→reminder_final
3. Create outbound_drafts record (draft_type=REMINDER, status=PENDING_REVIEW)
4. reminder_count increments ONLY on send (not on draft creation)
5. Stale detection: when count reaches max with no response → stale=true, stop scheduling
6. Admin can: pause reminders, manually trigger immediate reminder, adjust interval/max
7. Show reminder timeline on campaign detail page
8. Configurable cron time (default: daily at 08:00 UTC)
9. Configurable defaults in Settings:
   - Default interval: 7/10/14/21/30 days (default 14)
   - Default max reminders: 1-10 (default 3)
   - Grace period before first reminder: 3-7 business days (default 3)
```

---

### Phase 8: Dashboards
**Goal**: CEO and Agent each get a role-appropriate dashboard.

```
Admin Dashboard (/dashboard/admin):
- Top metrics: active clients, active campaigns, submitted this month, resolved this month
- Client health table: client name, active campaigns, reviews pending/resolved, last activity, agent
- Escalation queue: email threads with AI confidence < 0.85
- Recent activity feed: last 20 status changes
- Approval Queue badge (always visible in nav)

Agent Dashboard (/dashboard/agent):
- My Campaigns: assigned campaigns, sorted by last activity
- Today's Queue: reviews in PENDING or NEEDS_INFO status
- Notification bell: unread events for their campaigns
- No cross-client or cross-agent data visible
```

---

### Phase 9: Client PDF Report Generator
**Goal**: One-click branded PDF report per campaign. Admin approves before sending to client.

```
Steps:
1. Build generate-pdf tool with Puppeteer:
   - Branded cover page (company logo, client name, date range)
   - AI-drafted executive summary (Admin reviews before send)
   - Stats table: submitted, approved, rejected, pending, success rate %
   - Review-by-review breakdown
   - MANDATORY disclaimer (verbatim): "ReviewShield submitted removal requests to Google
     on your behalf. Google makes all final decisions on review removal. Approved figures
     reflect reviews Google confirmed as removed during this campaign period."
   - Company footer
2. Store PDF in file storage, link to campaign
3. Report status: PENDING_REVIEW → APPROVED → SENT|DOWNLOAD
4. Admin previews PDF inline (PDF.js renderer) before any action
5. Admin: Approve & Send to Client OR Approve for Download Only
6. Report approval goes through same Approval Gate as emails (respects toggle)
7. All report versions stored (no overwrite)
```

---

### Phase 10: Notifications + Audit Log UI
**Goal**: Nothing slips through. Every action accountable.

```
Steps:
1. Notification bell with unread count
2. Types: draft ready, report ready, reminder ready, email parsed, reminder stale
3. Role-scoped: Agents get only their campaign notifications
4. Audit Log page (Admin only): paginated, filterable by user/campaign/action/date
5. audit_log table: append-only, no UPDATE/DELETE ever
```

---

### Phase 11: Hardening + Full Test Suite
**Goal**: Verify every Non-Negotiable Rule from reviewshield.md Section 2.

```
12 Required Tests:
 1. grep all code for "deleted" — zero matches in UI copy
 2. PDF report contains disclaimer text verbatim
 3. Every status change has corresponding audit_log entry (same transaction)
 4. grep for 'sk-' and 'postgres://' — zero hardcoded secrets
 5. Agent A cannot access Agent B's campaign (API returns 403)
 6. Upload .exe file → rejected. CSV with missing columns → rejected.
 7. OAuth consent screen shows exactly 2 scopes
 8. POST /send without approval record → 403 (when gate is ON)
 9. Rendered draft body = template body after placeholder substitution (byte-for-byte)
10. Every page usable at 390px viewport — no horizontal scroll
11. Create reminder draft → reminder_count unchanged. Approve+send → count+1
12. Deployment entry exists in reviewshield.md Maintenance Log

Additional Tests (new features):
13. Approval Gate toggle: OFF → drafts auto-sent, audit_log shows auto_approved=true
14. Approval Gate toggle: ON → drafts require manual approval (403 on bypass)
15. External API: POST /api/external/clients with valid API key → client created
16. External API: POST /api/external/clients without API key → 401
17. Knowledge base AI response: generated text only uses knowledge_base content
18. Reminders do NOT trigger within 3 business days of submission
```

---

### Phase 12: UI Polish + Design Tokens
**Goal**: Premium UI matching the Sternrecht brand.

```
Design tokens (apply exactly):
- Primary: #1A2B5F (sidebar, headings, table headers)
- Accent: #2563EB (CTAs, active nav, links)
- Success: #059669 (APPROVED)
- Warning: #D97706 (NEEDS_INFO, escalation)
- Danger: #DC2626 (REJECTED, STALE)
- Pending: #7C3AED (PENDING_REVIEW)
- Surface: #F9FAFB light / #111827 dark
- Font UI: Inter or Geist
- Font Display: Fraunces (serif) — CEO KPI numbers only
- Border radius: 12px cards / 8px inputs / 999px badges
- Shadow: subtle 0 1px 3px | elevated 0 4px 16px
```

---

## 5 Rules Gemini Must Follow At All Times

1. **Constitution is law** → `reviewshield.md` overrides all other files. Update it for schema/rule changes only.
2. **Data-first** → Define JSON shapes in `reviewshield.md` BEFORE writing any tool code.
3. **Templates are sacred** → AI renders `{{placeholders}}`, never rewrites lawyer text. Only the knowledge base fallback path generates new text.
4. **Approval Gate is configurable** → When ON: no outbound email or report without ADMIN approval. When OFF: auto-approve with full audit trail. Default: ON.
5. **Audit everything** → Every state change writes to `audit_log` in the same database transaction — regardless of whether approval gate is on or off.

---

## New Database Tables (add to Prisma schema)

### `system_settings`
```
id                        UUID     PK
setting_key               VARCHAR  Unique (e.g., "polling_interval_minutes", "approval_gate_enabled")
setting_value             VARCHAR  The value
updated_by_user_id        UUID     FK → users
updated_at                TIMESTAMP
```

**Default settings to seed:**
| Key | Default Value | Description |
|---|---|---|
| `polling_interval_minutes` | `15` | Gmail polling frequency |
| `approval_gate_enabled` | `true` | Master toggle for approval requirement |
| `default_reminder_interval_days` | `14` | Default days between reminders |
| `default_reminder_max_count` | `3` | Default max reminders before stale |
| `reminder_grace_period_days` | `3` | Business days before first reminder |

### `knowledge_base`
```
id          UUID      PK
category    ENUM      LEGAL_TEMPLATE | DELETION_PROCESS | GOOGLE_TOS | CASE_LAW | CUSTOM
title       VARCHAR   Human-readable title
content     TEXT      The actual knowledge content
source      VARCHAR   Origin reference
tags        TEXT[]    Searchable tags
priority    INT       1-10, higher = more important for AI context
active      BOOLEAN   Admin can toggle
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

## Open Questions for CEO (answer before Phase 4)

| # | Question | Impact |
|---|---|---|
| 1 | Which Gmail account for production? Is OAuth consent screen configured? | Blocks Gmail integration |
| 2 | Lawyer templates — provided in what format? (Word/PDF/plain text) | Blocks template seeding |
| 3 | Company logo file for PDF reports? (format, dimensions) | Blocks report generator |
| 4 | German-only templates at launch, or DE + EN? | Impacts template count |
| 5 | Confirm default reminder: 14 days interval, max 3 reminders? | Impacts scheduler defaults |
| 6 | Storage: Supabase or AWS S3? Who provisions? | Blocks PDF storage |
| 7 | Staging environment needed, or dev → prod direct? | Impacts deployment |
| 8 | Hosting: Coolify on Hetzner Frankfurt? Or another option from the table above? | Blocks deployment |

---

*ReviewShield Build Action Plan v1.1 | Updated with CEO feedback | May 2026*
