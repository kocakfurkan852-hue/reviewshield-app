# ReviewShield Knowledge Playbook
## How the AI Email System Works

---

## Architecture Overview

```
[Gmail: removals@google.com]
        │
        ▼
[Zapier Trigger] ──► filters: from:removals@google.com OR label:Removals
        │
        ▼
[Webhook POST] ──► /api/webhooks/zapier (with Bearer token)
        │
        ▼
[email-processor.ts] ──► Step 1: Deduplicate
                         Step 2: Match to Campaign (Ref → Ticket → Name)
                         Step 3: AI Classify (claude.ts + KnowledgeBase)
                         Step 4: Update Review Status
                         Step 5: Generate Draft from Template
                         Step 6: Auto-Learn Unknown Patterns
                         Step 7: Audit Log
```

## Knowledge Sources (Supabase)

### 1. `ResponseTemplate` Table
Contains the **exact email templates** from the löschung blueprint. These are the proven replies that work.

| scenario_key | What it handles | Requires attachment? |
|---|---|---|
| `RQ1_IDENTITY` | "Sind Sie die Person?" | No |
| `RQ2_RESIDENCE` | "Wohnsitzstaat?" | No |
| `RQ3_CONTENT` | "Genauen Text einfügen" | No |
| `RQ4_LISTING_LINK` | "Link zum Brancheneintrag" | No |
| `RQ6_POWER_OF_ATTORNEY` | "Rechtsverhältnis / Vollmacht" | YES (PDF) |
| `FOLLOW_UP` | Standard reminder after 7 days | No |

The AI **never invents** these replies. It fills placeholders (`{{COMPANY_NAME}}`, `{{TICKET_ID}}`, etc.) with real data from the Client/Campaign.

### 2. `KnowledgeBase` Table
Contains the classification rules and process documentation the AI reads at runtime.

| Entry | Priority | What it teaches the AI |
|---|---|---|
| Email Classification Rules (Master) | 10 | Trigger phrases for each Google response type |
| Response Routing Logic | 9 | Decision tree: UPDATE_ONLY vs ACTION_REQUIRED |
| Follow-Up Timing Rules | 8 | When and how often to send reminders |
| Core Legal Citations | 10 | BGH rulings (immutable, never alter) |
| Vollmacht Process | 7 | PDF attachment workflow for RQ6 |
| Reactivation Handling | 6 | 90-day retry rules |

### 3. Auto-Learning System
When the AI encounters an email it can't classify (confidence < 70%), it automatically creates a new `KnowledgeBase` entry tagged `[AUTO]` with:
- The email subject and key phrases
- The AI's best guess and confidence score
- Instructions for the admin to classify it manually

**Admin workflow:**
1. Go to Knowledge Base in the admin panel
2. Find entries tagged `auto-learn` / `needs-review`
3. Determine the correct classification
4. Add the new trigger phrase to the "Email Classification Rules (Master)" entry
5. Optionally create a new `ResponseTemplate` if it's a genuinely new response type
6. Delete the auto-captured entry

Over time, this builds a comprehensive knowledge base that handles edge cases automatically.

## Placeholder Reference

| Placeholder | Source | Used In |
|---|---|---|
| `{{TICKET_ID}}` | `RemovalRequest.google_reference_id` or email subject | All templates |
| `{{AUTHORIZED_NAME}}` | `Client.deletion_name` → `Client.contact_name` | All templates |
| `{{COMPANY_NAME}}` | `Client.company_name` | RQ3, RQ6 |
| `{{REVIEW_URLS}}` | `Review.review_url` (all linked reviews) | RQ3 |
| `{{GOOGLE_PLACE_URL}}` | Google Maps "Share" link (overview, NOT review) | RQ4 |

## Status Flow

```
PENDING → SUBMITTED → APPROVED (deleted!)
                    → REJECTED (schedule 90-day retry)
                    → NEEDS_INFO (draft reply, wait for admin approval)
                    
APPROVED → REACTIVATED (reviewer appealed) → SUBMITTED (after 90 days)
```
