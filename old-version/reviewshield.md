# IMPORTANT: IMPROVED VARIANT AVAILABLE
An improved version of this application has been uploaded to the [GitHub repository](https://github.com/kocakfurkan852-hue/reviewshield-app.git) and is available in the `updated app` folder on the Desktop.

---

# ReviewShield — Project Constitution
**Version 1.0 | May 2026 | CONFIDENTIAL — Internal Use Only**

> **This file is LAW.** If `reviewshield.md` and any other file conflict, this file wins.
> Updated only for schema changes, new behavioral rules, or architectural modifications — never for task notes or progress tracking.

---

## 1. Data Schemas

All tables use **UUID primary keys**. `created_at` / `updated_at` timestamps on every table. Soft deletes (`deleted_at`) preferred over hard deletes for audit trail.

### 1.1 Core Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | Unique, required |
| name | VARCHAR | Required |
| role | ENUM | `ADMIN` \| `AGENT` |
| password_hash | VARCHAR | Bcrypt hashed |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |
| deleted_at | TIMESTAMP | Nullable, soft delete |

#### `clients`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| company_name | VARCHAR | Required |
| contact_name | VARCHAR | Required |
| contact_email | VARCHAR | Required |
| phone | VARCHAR | Nullable |
| notes | TEXT | Nullable |
| created_by_user_id | UUID | FK → users |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |
| deleted_at | TIMESTAMP | Nullable, soft delete |

#### `campaigns`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| name | VARCHAR | Required |
| status | ENUM | `ACTIVE` \| `COMPLETED` \| `ARCHIVED` |
| assigned_agent_id | UUID | FK → users |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |
| completed_at | TIMESTAMP | Nullable |
| deleted_at | TIMESTAMP | Nullable, soft delete |

#### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns |
| reviewer_name | VARCHAR | Nullable |
| review_text | TEXT | Nullable (empty for text-less reviews) |
| star_rating | INT | 1–5 |
| review_url | VARCHAR | Required, unique within campaign |
| platform | ENUM | Default: `GOOGLE` |
| status | ENUM | `PENDING` \| `SUBMITTED` \| `APPROVED` \| `REJECTED` \| `NEEDS_INFO` |
| submitted_at | TIMESTAMP | Nullable |
| resolved_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |
| deleted_at | TIMESTAMP | Nullable, soft delete |

#### `removal_requests`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns |
| submitted_by_user_id | UUID | FK → users |
| submission_type | ENUM | `FORM` \| `API` |
| submitted_at | TIMESTAMP | Required |
| google_reference_id | VARCHAR | Nullable |
| notes | TEXT | Nullable |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `removal_request_reviews`
| Column | Type | Notes |
|---|---|---|
| removal_request_id | UUID | FK → removal_requests |
| review_id | UUID | FK → reviews |
| | | Composite PK |

#### `email_threads`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns |
| gmail_thread_id | VARCHAR | Gmail thread reference |
| gmail_message_id | VARCHAR | Gmail message reference |
| subject | VARCHAR | Email subject |
| received_at | TIMESTAMP | When received/sent |
| direction | ENUM | `INBOUND` \| `OUTBOUND` |
| raw_body | TEXT | Full email body |
| ai_summary | TEXT | Nullable — Claude-generated summary |
| ai_parsed_action | ENUM | `APPROVED` \| `REJECTED` \| `NEEDS_INFO` \| `UNKNOWN` |
| ai_confidence | FLOAT | 0.0–1.0 |
| google_response_type | VARCHAR | Scenario key from Claude parsing |
| processed | BOOLEAN | Default: false |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `response_templates`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | Human-readable template name |
| scenario_key | VARCHAR | e.g., `policy_violation_rejected`, `reminder_first` |
| subject_line | VARCHAR | Email subject line with {{placeholder}} support |
| body_text | TEXT | Lawyer-written body with {{placeholder}} markers |
| language | ENUM | `DE` \| `EN` |
| is_default | BOOLEAN | One default per scenario_key |
| active | BOOLEAN | Soft disable |
| version | INT | Increments on each edit |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `outbound_drafts`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns |
| email_thread_id | UUID | FK → email_threads, nullable |
| removal_request_id | UUID | FK → removal_requests, nullable |
| draft_type | ENUM | `REPLY` \| `REMINDER` |
| selected_template_id | UUID | FK → response_templates |
| rendered_subject | VARCHAR | Subject with placeholders resolved |
| rendered_body | TEXT | Body with placeholders resolved |
| to_address | VARCHAR | Google reply-to address |
| status | ENUM | `PENDING_REVIEW` \| `APPROVED` \| `SENT` \| `REJECTED` |
| reviewed_by_user_id | UUID | FK → users, nullable |
| reviewed_at | TIMESTAMP | Nullable |
| sent_at | TIMESTAMP | Nullable |
| admin_note | TEXT | Nullable — Admin's note on approval/rejection |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `reports`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns |
| generated_by_user_id | UUID | FK → users |
| file_path | VARCHAR | Internal storage path |
| file_url | VARCHAR | Signed URL for download |
| status | ENUM | `PENDING_REVIEW` \| `APPROVED` \| `SENT` |
| reviewed_by_user_id | UUID | FK → users, nullable |
| reviewed_at | TIMESTAMP | Nullable |
| delivered_at | TIMESTAMP | Nullable |
| delivery_method | ENUM | `EMAIL` \| `DOWNLOAD` |
| generated_at | TIMESTAMP | Required |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `reminder_schedules`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| removal_request_id | UUID | FK → removal_requests |
| reminder_enabled | BOOLEAN | Default: true |
| reminder_interval_days | INT | Default: 14 |
| reminder_max_count | INT | Default: 3 |
| reminder_count | INT | Default: 0. Increments ONLY on send, never on draft creation |
| last_reminder_sent_at | TIMESTAMP | Nullable |
| next_reminder_due_at | TIMESTAMP | Computed |
| stale | BOOLEAN | Default: false. True when max count reached with no response |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `audit_log`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users |
| action | VARCHAR | e.g., `DRAFT_APPROVED`, `EMAIL_SENT`, `STATUS_CHANGED` |
| entity_type | VARCHAR | e.g., `outbound_drafts`, `reviews`, `reports` |
| entity_id | UUID | ID of the affected entity |
| metadata | JSONB | Arbitrary context data |
| created_at | TIMESTAMP | Auto. **APPEND-ONLY — no updates, no deletes.** |

---

### 1.2 Scenario Keys (Template Library)

These are the supported `scenario_key` values at launch. Admin can add more via the Template Library UI.

| scenario_key | Description | Google Response Trigger |
|---|---|---|
| `policy_violation_rejected` | Google rejected citing policy | "können wir leider keine Maßnahmen ergreifen" |
| `insufficient_evidence` | Google needs more proof | "genauen Text oder Inhalt" |
| `approved_confirmed` | Google confirmed removal | "wurde entfernt" / "has been removed" |
| `needs_business_verification` | Google asks for identity | "ob Sie die Person sind" |
| `needs_additional_urls` | Google asks for listing link | "Link zum betreffenden Brancheneintrag" |
| `needs_power_of_attorney` | Google asks for authorization | "Rechtsverhältnis" / "Vollmacht" |
| `appeal_window_open` | Reviewer appealed, window open | Appeal notification |
| `reminder_first` | First follow-up reminder | Scheduler: reminder_count = 0 |
| `reminder_followup` | Subsequent reminder | Scheduler: reminder_count = 1 |
| `reminder_final` | Final reminder before stale | Scheduler: reminder_count ≥ 2 |

---

### 1.3 Tool Input/Output Shapes

#### `poll-gmail`
```json
// INPUT
{ "oauth_credentials": "<from .env>", "label": "INBOX", "max_results": 50 }

// OUTPUT
[{ "gmail_message_id": "string", "gmail_thread_id": "string", "subject": "string", "from": "string", "body": "string", "received_at": "ISO8601" }]
// Saved to: .tmp/polled-emails/<timestamp>_<message_id>.json
```

#### `parse-email`
```json
// INPUT
{ "raw_body": "string (email body text)" }

// OUTPUT (from Claude API)
{
  "action": "APPROVED | REJECTED | NEEDS_INFO | UNKNOWN",
  "affected_review_urls": ["string"],
  "google_response_type": "string (scenario_key)",
  "summary": "string (one sentence)",
  "confidence": 0.0-1.0
}
```

#### `match-campaign`
```json
// INPUT
{ "parsed_email": "<parse-email output>", "review_urls": ["string"] }

// OUTPUT
{ "campaign_id": "UUID", "matched_reviews": [{ "review_id": "UUID", "review_url": "string" }] }
```

#### `select-template`
```json
// INPUT
{ "google_response_type": "string (scenario_key)", "campaign_id": "UUID", "language": "DE | EN" }

// OUTPUT
{ "template_id": "UUID", "name": "string", "subject_line": "string", "body_text": "string (with {{placeholders}})" }
```

#### `render-draft`
```json
// INPUT
{
  "template_body": "string",
  "template_subject": "string",
  "placeholders": {
    "reviewer_name": "string",
    "review_url": "string",
    "star_rating": "int",
    "client_name": "string",
    "campaign_name": "string",
    "google_reference_id": "string",
    "submission_date": "string"
  }
}

// OUTPUT
{ "rendered_subject": "string", "rendered_body": "string" }
```

#### `create-draft-record`
```json
// INPUT
{
  "campaign_id": "UUID",
  "email_thread_id": "UUID | null",
  "removal_request_id": "UUID | null",
  "draft_type": "REPLY | REMINDER",
  "selected_template_id": "UUID",
  "rendered_subject": "string",
  "rendered_body": "string",
  "to_address": "string"
}

// OUTPUT
{ "draft_id": "UUID", "status": "PENDING_REVIEW", "created_at": "ISO8601" }
```

#### `send-via-gmail`
```json
// INPUT
{ "draft_id": "UUID", "approval_record_id": "UUID" }

// OUTPUT
{ "gmail_message_id": "string", "sent_at": "ISO8601", "audit_log_id": "UUID" }
// PRECONDITION: audit_log must contain APPROVED record for this draft. 403 if absent.
```

#### `check-reminders`
```json
// INPUT
{ "current_date": "ISO8601" }

// OUTPUT
[{
  "removal_request_id": "UUID",
  "campaign_id": "UUID",
  "reminder_count": "int",
  "template_key": "reminder_first | reminder_followup | reminder_final"
}]
```

#### `generate-pdf`
```json
// INPUT
{
  "campaign_id": "UUID",
  "date_range": { "start": "ISO8601", "end": "ISO8601" },
  "include_disclaimer": true
}

// OUTPUT
{ "file_path": "string", "file_url": "string", "report_id": "UUID" }
```

#### `write-audit-log`
```json
// INPUT
{ "user_id": "UUID", "action": "string", "entity_type": "string", "entity_id": "UUID", "metadata": {} }

// OUTPUT
{ "audit_log_id": "UUID", "created_at": "ISO8601" }
```

---

## 2. Behavioral Rules (Non-Negotiable)

These rules apply to **every line of code**. No exceptions without written CEO approval.

| # | Rule | Test Required |
|---|---|---|
| 1 | Never use "reviews deleted" in any UI copy, email, or report. Always: "submitted for removal", "approved by Google", "removal confirmed". | Search all string literals and template files for "deleted". Zero matches required. |
| 2 | Every client report must include the full disclaimer text verbatim: *"ReviewShield submitted removal requests to Google on your behalf. Google makes all final decisions on review removal. Approved figures reflect reviews Google confirmed as removed during this campaign period."* | Check PDF output for disclaimer presence before marking report feature complete. |
| 3 | Every status change to any review, draft, or report must write a record to `audit_log`. The write must happen in the **same transaction** as the status update. | Trigger status changes via API. Query `audit_log`. Verify corresponding record exists for each change. |
| 4 | No hard-coded IDs, credentials, or secrets anywhere in the codebase. All config via `.env`. | Run `grep -r 'sk-'` and `grep -r 'postgres://'` on the codebase. Zero matches required. |
| 5 | Agents must never access data from campaigns not assigned to them. Enforce at the **database query level** (`WHERE assigned_agent_id = session.userId`), not just the UI. | Log in as Agent A. Attempt to fetch Campaign assigned to Agent B via direct API call. Verify 403 or empty response. |
| 6 | All file uploads (CSV, PDF) must be validated server-side. File type, size limit (10MB), and schema validation for CSV. | Upload a `.exe` file. Upload a CSV missing required columns. Verify both are rejected with clear error messages. |
| 7 | Gmail integration uses only `gmail.readonly` and `gmail.send` OAuth scopes. No additional scopes. | Inspect OAuth consent screen scope list. Maximum two scopes permitted. |
| 8 | No outbound email or report may be sent without Admin approval recorded in `audit_log`. API returns 403 if approval record is absent. | Attempt direct API call to send endpoint without approval record. Verify 403 response. |
| 9 | Lawyer template text must not be modified by the AI. The rendered draft body must be **byte-for-byte identical** to the template body after placeholder resolution. | Compare rendered draft body against template body with placeholders substituted. Diff must be zero (excluding resolved placeholder values). |
| 10 | Mobile responsiveness is mandatory. Every page must be fully usable at **390px** viewport width. | Load every page in a 390px browser window. No horizontal scroll, no clipped UI elements. |
| 11 | `reminder_count` increments **only** when Admin approves and the reminder is sent — not when the draft is created. | Create a reminder draft. Verify `reminder_count` unchanged. Approve and send. Verify `reminder_count` incremented by 1. |
| 12 | The Maintenance Log in `reviewshield.md` must be updated after every deployment. Deployment without a Maintenance Log entry is incomplete. | Check `reviewshield.md` Maintenance Log after each deployment. Entry must exist with date and version. |

---

## 3. Architectural Invariants

### 3.1 The Approval Gate (INVIOLABLE)

No outbound email (reply, reminder) and no client report may leave the system without an **ADMIN-role user** having transitioned the `outbound_drafts` or `reports` status from `PENDING_REVIEW` to `APPROVED`.

This transition MUST be recorded in `audit_log` with the approving user's `user_id` and timestamp. The API endpoint that triggers sending MUST verify this record exists before calling Gmail API. If the record does not exist, return **HTTP 403**.

**This cannot be bypassed by any configuration flag, feature flag, or environment variable.**

### 3.2 Templates Are Sacred — AI Is a Renderer

The lawyer-written texts in `response_templates` are the **only** authorised content for outbound Google communications. The AI's role in the outbound flow is strictly:

1. Parse inbound emails → identify `scenario_key`
2. Select the correct template → do not modify its text
3. Resolve placeholders → substitute variable values into `{{placeholder}}` markers
4. The AI may **NOT** rewrite, paraphrase, improve, or summarise template content

The AI may generate freeform text only in two places:
- The executive summary paragraph in client PDF reports
- Internal escalation notes shown only to Admin

Both require Admin review before delivery.

### 3.3 Audit Log Is Append-Only

The `audit_log` table is **append-only**. No `UPDATE` or `DELETE` operations are permitted on this table — ever. Every state change in the system must write a corresponding record. This is enforced at the database level (no UPDATE/DELETE grants) and verified in hardening tests.

### 3.4 A.N.T. 3-Layer Separation

| Layer | Location | Purpose |
|---|---|---|
| **Architecture** | `architecture/*.md` | Technical SOPs — one per feature. Defines goal, inputs, tool call sequence, success criteria, edge cases. **If logic changes, update the SOP before updating the code.** |
| **Navigation** | Reasoning layer | Routes data between SOPs and Tools. Decides which tool to call, in what order, with what inputs. Never performs complex tasks itself. |
| **Tools** | `tools/*` | Deterministic, atomic scripts. Each does one thing. Independently testable. Credentials from `.env` only. Intermediates in `.tmp/` only. |

### 3.5 Self-Annealing Repair Loop

When a tool fails or an error occurs:
1. **ANALYZE** — Read the full stack trace. Do not guess.
2. **PATCH** — Fix the specific tool that failed. Minimum necessary fix.
3. **TEST** — Verify with a real test, not assumed.
4. **UPDATE ARCHITECTURE** — Update the corresponding `architecture/*.md` SOP.
5. **UPDATE CONSTITUTION** — If fix reveals schema/rule/architecture change, update this file.

The same error must never occur twice.

---

## 4. Environment Variables

All configuration via `.env`. Names only listed below — **values are never committed**.

| Variable | Service | Notes |
|---|---|---|
| `DATABASE_URL` | PostgreSQL | Full connection string including SSL parameters |
| `NEXTAUTH_SECRET` | NextAuth | Random 32-byte string — generate fresh for production |
| `NEXTAUTH_URL` | NextAuth | Production domain URL |
| `GMAIL_CLIENT_ID` | Gmail OAuth | From Google Cloud Console |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth | From Google Cloud Console |
| `GMAIL_REFRESH_TOKEN` | Gmail OAuth | Long-lived refresh token. Implement auto-refresh logic. |
| `ANTHROPIC_API_KEY` | Claude API | From Anthropic console. **Never log this value.** |
| `STORAGE_BUCKET_NAME` | S3 / Supabase | Bucket for PDF storage |
| `STORAGE_ACCESS_KEY` | S3 / Supabase | Storage access credential |
| `STORAGE_SECRET_KEY` | S3 / Supabase | Storage secret credential |
| `SENTRY_DSN` | Sentry | For error tracking. Required before production. |
| `APP_ADMIN_EMAIL` | Internal | Email address that receives system error alerts |

---

## 5. External Service Contracts

### 5.1 Gmail API
- **OAuth Scopes**: `gmail.readonly` + `gmail.send` — **maximum two scopes, no additional**
- **Polling frequency**: Every 15 minutes via Vercel Cron + BullMQ
- **Rate limit**: 250 quota units/user/second
- **Threading**: Use `In-Reply-To` header for Gmail thread continuity
- **Token refresh**: Implement auto-refresh logic for `GMAIL_REFRESH_TOKEN`

### 5.2 Claude API (Anthropic)
- **Model**: `claude-sonnet-4-20250514`
- **Usage**: Email parsing only (inbound Google responses → structured JSON)
- **JSON mode**: Enforce via system prompt
- **Retry**: 3× exponential backoff on failure
- **Fallback**: On parse failure → `action: UNKNOWN`, `confidence: 0`, flag for human review
- **Confidence threshold**: ≥ 0.85 auto-process / < 0.85 flag for human review
- **System prompt**: `'You are an assistant parsing Google review removal response emails. Return ONLY valid JSON, no other text: { "action": "APPROVED"|"REJECTED"|"NEEDS_INFO"|"UNKNOWN", "affected_review_urls": ["..."], "google_response_type": "policy_violation_rejected|insufficient_evidence|approved_confirmed|needs_business_verification|needs_additional_urls|appeal_window_open|other", "summary": "one sentence", "confidence": 0.0-1.0 }. If uncertain: action=UNKNOWN, google_response_type=other, confidence=0.'`

### 5.3 Puppeteer (PDF Generation)
- **Usage**: Render styled HTML template → PDF
- **Config**: Server-side rendering, no client-side JS
- **Output**: `.tmp/draft-pdfs/` then upload to file storage
- **Requirements**: Company logo, branded cover, disclaimer text, professional typography

### 5.4 File Storage (Supabase Storage / AWS S3)
- **Usage**: Store generated PDF reports and uploaded assets
- **Access**: Signed URLs with expiration
- **Retrieval**: Within 5 seconds of upload

---

## 6. UI Design Tokens

| Token | Value | Usage |
|---|---|---|
| Primary | `#1A2B5F` | Sidebar, headings, logo mark, table headers |
| Accent | `#2563EB` | CTAs, active nav, links, focus rings |
| Success | `#059669` | APPROVED status, positive metrics, send confirmation |
| Warning | `#D97706` | NEEDS_INFO, escalation badges, low confidence scores |
| Danger | `#DC2626` | REJECTED, STALE, destructive action buttons |
| Pending | `#7C3AED` | PENDING_REVIEW status — distinct from warning |
| Surface Light | `#F9FAFB` | Page backgrounds (light mode) |
| Surface Dark | `#111827` | Page backgrounds (dark mode) |
| Font – UI | Inter or Geist | All navigation, labels, body, tables, form fields |
| Font – Display | Fraunces (serif) | CEO dashboard headline KPI numbers only |
| Border Radius | 12px cards / 8px inputs / 999px badges | Consistent across all components |
| Shadow – Subtle | `0 1px 3px rgba(0,0,0,0.06)` | Default card shadow |
| Shadow – Elevated | `0 4px 16px rgba(0,0,0,0.10)` | Modals, dropdowns, hover states |

---

## 7. Maintenance Log

> Append a new entry after every deployment. Deployment without a Maintenance Log entry is incomplete.

| Date | Version | Changes | Migrations | Env Changes | Open Issues |
|---|---|---|---|---|---|
| 2026-05-11 | 0.0.0 | Project Constitution initialized. Memory files created. Protocol 0 complete. | None | None | Awaiting Phase 1 Blueprint |

---

*End of Project Constitution — ReviewShield v1.0*
