/**
 * Knowledge Base & Response Template Seeder
 * 
 * Seeds the Supabase DB with:
 * 1. ResponseTemplates — proven email replies for each Google response type
 * 2. KnowledgeBase entries — classification rules, trigger phrases, and process docs
 * 
 * Run: npx tsx prisma/seed-knowledge.ts
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================================================
// RESPONSE TEMPLATES — Each maps to a specific Google email type (scenario_key)
// ============================================================================
const RESPONSE_TEMPLATES = [
  // --- RQ1: Identity Confirmation ---
  {
    name: "RQ1 – Identitätsbestätigung",
    scenario_key: "RQ1_IDENTITY",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Nachricht. Hiermit bestätige ich, dass ich der Inhaber des Unternehmens bin und somit persönlich in meinen eigenen Rechten betroffen bin. Eine gesonderte Bevollmächtigung ist daher nicht erforderlich.

Ich bitte Sie daher, die von mir vorgetragene Beschwerde weiterzuverfolgen und die beanstandete Bewertung entsprechend Ihren Richtlinien und den genannten Urteilen zu überprüfen. Bei weiteren Rückfragen stehe ich Ihnen selbstverständlich jederzeit zur Verfügung.

Vielen Dank für Ihre Unterstützung und eine zeitnahe Bearbeitung.

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },

  // --- RQ2: Residence / Citizenship ---
  {
    name: "RQ2 – Wohnsitz/Staatsbürgerschaft",
    scenario_key: "RQ2_RESIDENCE",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Nachricht. Gerne teile ich Ihnen die angeforderten Informationen mit:
- Wohnsitzstaat: Deutschland
- Staatsbürgerschaft: Deutsch

Ich bitte Sie daher, die von mir vorgetragene Beschwerde weiterzuverfolgen und die beanstandete Bewertung entsprechend Ihren Richtlinien und den genannten Urteilen zu überprüfen. Bei weiteren Rückfragen stehe ich Ihnen selbstverständlich jederzeit zur Verfügung.

Vielen Dank für Ihre Unterstützung und eine zeitnahe Bearbeitung.

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },

  // --- RQ3: Exact Content / Violation Details ---
  {
    name: "RQ3 – Genaue Inhalte der Verletzung",
    scenario_key: "RQ3_CONTENT",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Rückmeldung. Gern konkretisieren wir unsere Meldung.

Unternehmensprofil: {{COMPANY_NAME}}
Wir beanstanden jeweils die gesamte Rezension (Text und Sternebewertung) an den folgenden Fundstellen:

{{REVIEW_URLS}}

Hinweis: Die verlinkten URLs führen direkt auf die jeweilige Rezension innerhalb des Google-Unternehmensprofils.

Keine Geschäftsbeziehung: Nach Prüfung unserer Unterlagen (Kassenbelege, Terminbücher, Kundendaten) bestand zu den Verfassern zu keinem Zeitpunkt eine Geschäftsbeziehung. Es liegt somit keine echte Nutzererfahrung vor.

Unzulässige Tatsachenbehauptung / Persönlichkeitsrechtsverletzung: Bewertungen, die ohne tatsächlichen Kundenkontakt den Eindruck einer realen Inanspruchnahme erwecken, sind unzulässig und verletzen unser Unternehmenspersönlichkeitsrecht.

Rechtliche Grundlage (Deutschland):

BGH, Urt. v. 01.03.2016 – VI ZR 34/15: Nach Beanstandung bestehen Prüf- und Hinweispflichten; der Rezensent ist zur Darlegung eines tatsächlichen Leistungskontakts aufzufordern.

BGH, Urt. v. 25.10.2011 – VI ZR 93/10: Bei substantiierter Rüge treffen den Hostprovider zumutbare Prüfpflichten; bleibt ein Nachweis aus, ist der Inhalt zu entfernen.

Anspruchsgrundlagen: § 823 Abs. 1 BGB i. V. m. dem allgemeinen Persönlichkeitsrecht; § 1004 BGB analog (Unterlassung/Beseitigung).

Wirtschaftlicher Schaden: Die strittigen Inhalte beeinträchtigen Reputation, Sichtbarkeit und Kundengewinnung unseres Unternehmens.

Bitte leiten Sie unsere Beanstandung an die jeweiligen Verfasser weiter, fordern Sie die Verfasser zu einer fristengebundenen, substantiierten Stellungnahme auf, einschließlich Nachweis einer tatsächlichen Geschäftsbeziehung (z. B. Rechnung, Terminbestätigung, Korrespondenz), entfernen Sie die Rezensionen (Text und Sternebewertung), sofern keine Reaktion erfolgt oder der Nachweis ausbleibt bzw. unzureichend ist.

Bitte bestätigen Sie die eingeleiteten Schritte.

Für Rückfragen stehen wir gerne zur Verfügung.

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },

  // --- RQ4: Business Listing Link ---
  {
    name: "RQ4 – Link zum Brancheneintrag",
    scenario_key: "RQ4_LISTING_LINK",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Nachricht. Hiermit teile ich mit Ihnen gerne den Link zum betreffenden Brancheneintrag:

{{GOOGLE_PLACE_URL}}

Vielen Dank für Ihre Unterstützung und eine zeitnahe Bearbeitung.

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },

  // --- RQ6: Legal Relationship / Power of Attorney ---
  {
    name: "RQ6 – Vollmacht / Rechtsverhältnis",
    scenario_key: "RQ6_POWER_OF_ATTORNEY",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

unter Bezugnahme auf Ihre Nachricht teile ich Folgendes mit:

Ich handele in der vorliegenden Angelegenheit als gesetzlicher Vertreter des Unternehmens und bin somit berechtigt, rechtliche Löschanträge im Namen des Unternehmens zu stellen.

1. Berechtigung / Rechtsverhältnis
Als gesetzlicher Vertreter des Unternehmens bin ich zur Geltendmachung und Durchsetzung entsprechender Rechte – insbesondere zur Stellung von Löschanträgen gegenüber Plattformbetreibern – befugt.

2. Nachweis der Berechtigung
Als Nachweis übersende ich Ihnen anbei eine Vollmacht des Inhabers.

3. Gegenstand des Löschantrags
Der Antrag betrifft die eingereichten Rezensionen im lokalen Unternehmenseintrag von {{COMPANY_NAME}}. Die Rezensenten waren zu keinem Zeitpunkt Kunde; eine Geschäftsbeziehung bestand nicht.

Damit handelt es sich um eine Bewertung ohne tatsächliche Anknüpfungstatsachen, die das Unternehmenspersönlichkeitsrecht verletzt und geeignet ist, den Geschäftsbetrieb erheblich zu beeinträchtigen. Entsprechend der gefestigten Rechtsprechung ist das von Plattformbetreibern einzuhaltende Prüfverfahren durchzuführen (vgl. u. a. BGH, Urteil vom 01.03.2016 – VI ZR 34/15 sowie BGH, Urteil vom 25.10.2011 – VI ZR 93/10).

Ich fordere Sie daher auf, Ihrer Prüfpflicht nachzukommen, insbesondere:

1. Weiterleitung der Beanstandung an die Verfasser,
2. Aufforderung zur Stellungnahme unter Vorlage geeigneter Nachweise für einen tatsächlichen Kundenkontakt,
3. Entfernung der Rezensionen bei Nichtreaktion oder fehlendem Nachweis.

Ich bitte um schriftliche Bestätigung des Eingangs sowie um Mitteilung über den weiteren Prüfstatus.

Ticket ID: {{TICKET_ID}}

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },

  // --- FOLLOW-UP: Standard follow-up after 7 days ---
  {
    name: "Follow-Up – Erinnerung",
    scenario_key: "FOLLOW_UP",
    subject_line: "Re: [Ticket ID: {{TICKET_ID}}]",
    body_text: `Sehr geehrte Damen und Herren,

es ist bereits einige Zeit vergangen und Sie haben den Fall noch nicht vollständig bearbeitet.

Deshalb verweise ich Sie auf die Rechtsprechung vom 25.10.2011 – VI ZR 93/10 (BGH).

Demnach müssen Sie dem Verstoß nachgehen und ggf. mit dem Rezensenten in Kontakt treten und ggf. die Rezension entfernen, wenn der Rezensent nicht gegenteiliges nachweisen kann.

Mit freundlichen Grüßen
{{AUTHORIZED_NAME}}`,
    language: "DE" as const,
    is_default: true,
  },
];


// ============================================================================
// KNOWLEDGE BASE — Classification rules, trigger phrases, process knowledge
// ============================================================================
const KNOWLEDGE_ENTRIES = [
  // --- MASTER CLASSIFICATION RULES ---
  {
    category: "DELETION_PROCESS" as const,
    title: "Email Classification Rules (Master)",
    content: `# Google Email Classification Rules

When a mail arrives from removals@google.com, classify it using these trigger phrases.
The AI must scan BOTH subject and body. Match the FIRST rule that fits.

## Classification Table

| Code | Type | Status Update | Action | Trigger Phrases (DE) | Trigger Phrases (EN) |
|------|------|---------------|--------|---------------------|---------------------|
| SUCCESS | Deletion Confirmed | APPROVED | Log + close | "wurde entfernt", "haben wir die folgenden Inhalte entfernt", "Gemäß der geltenden Praxis" | "has been removed", "content has been removed" |
| INITIAL_CONFIRM | Submission Acknowledged | SUBMITTED (no change) | Log, start 3-day timer | "Danke für Ihre Anfrage", "Vielen Dank für Ihre Anfrage" | "Thank you for your report", "Thank you for contacting" |
| DECLINED | Rejection | REJECTED | Log, notify admin, schedule 90-day retry | "können wir leider keine Maßnahmen ergreifen", "keine Verletzung", "können wir nicht entfernen" | "unable to take action", "does not violate" |
| RQ1 | Identity Question | NEEDS_INFO | Draft RQ1 template | "ob Sie die Person sind, deren Rechte angeblich verletzt wurden", "Wenn Sie nicht diese Person sind" | "whether you are the person whose rights" |
| RQ2 | Residence Question | NEEDS_INFO | Draft RQ2 template | "Wohnsitzstaat", "Staatsbürgerschaft", "Geben Sie bitte Ihren Wohnsitzstaat" | "country of residence", "citizenship" |
| RQ3 | Content Details | NEEDS_INFO | Draft RQ3 template | "genauen Text oder Inhalt", "gesetzlichen Rechte verletzt", "Bitte fügen Sie den genauen" | "exact text or content", "legal rights violated" |
| RQ4 | Listing Link | NEEDS_INFO | Draft RQ4 template | "Link zum betreffenden Brancheneintrag", "link to the business listing" | "link to the business listing" |
| RQ6 | Power of Attorney | NEEDS_INFO | Draft RQ6 template + PDF | "Rechtsverhältnis zwischen Ihnen und den einzelnen Inhabern", "Vollmacht", "Bitte erläutern Sie das Rechts" | "legal relationship", "power of attorney" |
| UNKNOWN | Unrecognized | No change | Flag for admin review | (none of the above match) | (none of the above match) |

## Priority Rules
1. If "wurde entfernt" or "has been removed" appears → always SUCCESS (even if other phrases present)
2. If multiple RQ patterns match → pick the FIRST match in body order
3. If confidence < 70% → classify as UNKNOWN and flag for human review
4. NEVER auto-reply to UNKNOWN emails — always escalate`,
    source: "löschung blueprint + agent blueprint",
    tags: ["classification", "email", "google", "trigger-phrases", "master-rules"],
    priority: 10,
  },

  // --- RESPONSE ROUTING LOGIC ---
  {
    category: "DELETION_PROCESS" as const,
    title: "Response Routing Logic",
    content: `# Response Routing Decision Tree

When a classified email arrives, the system must decide: UPDATE_ONLY or ACTION_REQUIRED?

## UPDATE_ONLY (just log, no reply needed)
- SUCCESS → Review status → APPROVED, disable reminders, log deletion_confirmed_at
- INITIAL_CONFIRM → No status change, start internal timer (3 days standard, 2 days if review has images)
- DECLINED → Review status → REJECTED, notify admin, schedule resubmission after 90 days

## ACTION_REQUIRED (generate draft reply from template)
- RQ1 → Use template RQ1_IDENTITY → Placeholders: {{AUTHORIZED_NAME}}
- RQ2 → Use template RQ2_RESIDENCE → Placeholders: {{AUTHORIZED_NAME}}
- RQ3 → Use template RQ3_CONTENT → Placeholders: {{COMPANY_NAME}}, {{REVIEW_URLS}}, {{AUTHORIZED_NAME}}
- RQ4 → Use template RQ4_LISTING_LINK → Placeholders: {{GOOGLE_PLACE_URL}}, {{AUTHORIZED_NAME}}
- RQ6 → Use template RQ6_POWER_OF_ATTORNEY → Placeholders: {{COMPANY_NAME}}, {{TICKET_ID}}, {{AUTHORIZED_NAME}} + ATTACH Vollmacht PDF

## Placeholder Resolution
- {{TICKET_ID}} → extracted from email subject [Ticket ID: X-XXXXX] or from RemovalRequest.google_reference_id
- {{AUTHORIZED_NAME}} → Client.deletion_name or Client.contact_name
- {{COMPANY_NAME}} → Client.company_name
- {{REVIEW_URLS}} → all Review.review_url linked to the RemovalRequest
- {{GOOGLE_PLACE_URL}} → must be stored on Client (the "Share" link from Google Maps overview, NOT the review link)

## UNKNOWN Emails
- Do NOT generate any draft
- Log the email with ai_parsed_action = "UNKNOWN"
- Create an AuditLog entry: "UNKNOWN_EMAIL_FLAGGED"
- Admin must manually review and either:
  a) Classify it (which teaches the system for next time)
  b) Dismiss it`,
    source: "löschung blueprint",
    tags: ["routing", "decision-tree", "action-required", "update-only"],
    priority: 9,
  },

  // --- FOLLOW-UP TIMING RULES ---
  {
    category: "DELETION_PROCESS" as const,
    title: "Follow-Up Timing Rules",
    content: `# Follow-Up Scheduling Rules

## Standard Reviews (text only, no images)
- First follow-up: 7 calendar days after INITIAL_CONFIRM with no further response
- Subsequent follow-ups: every 2 calendar days after first follow-up
- Max follow-ups: 5 (then escalate to admin)

## Reviews with Images
- First follow-up: 2 calendar days after INITIAL_CONFIRM
- Subsequent follow-ups: every 2 calendar days
- Max follow-ups: 5

## After RQ6 (Vollmacht) Response Sent
- If no Google reply after 7 days → resend RQ6 response with PDF
- Then every 2 days until response

## After DECLINED
- Do NOT follow up immediately
- Schedule resubmission for 90 days from decline date
- Resubmit from different account if available
- NEVER resubmit before 90 days (reduces success probability)

## Fast Deletion Detection
- Reviews with star_rating = 1 AND no review_text → expect confirmation within 15 minutes
- Even after confirmation, review may be cached/visible for up to 24 hours`,
    source: "löschung blueprint video transcript",
    tags: ["follow-up", "timing", "scheduling", "reminders"],
    priority: 8,
  },

  // --- LEGAL REFERENCES ---
  {
    category: "CASE_LAW" as const,
    title: "Core Legal Citations (Never Modify)",
    content: `# Immutable Legal Citations

These BGH rulings form the legal backbone of every deletion request. They must NEVER be altered by AI.

## BGH, Urt. v. 01.03.2016 – VI ZR 34/15
After a substantiated objection, the platform has verification and notification obligations. The reviewer must be asked to demonstrate a factual basis for their claim.

## BGH, Urt. v. 25.10.2011 – VI ZR 93/10
Upon substantiated objection, reasonable verification duties apply to the host provider. If no proof is provided by the reviewer, the content must be removed.

## § 823 Abs. 1 BGB
Protection of personal rights (Persönlichkeitsrecht) including business personality rights.

## § 1004 BGB (analog)
Right to demand cessation and removal of unlawful interference.

## Usage Rules
- Always cite both BGH rulings together in submissions
- Never paraphrase or abbreviate the case numbers
- The AI may provide explanations but must preserve the exact citation format`,
    source: "German Federal Court rulings",
    tags: ["legal", "BGH", "immutable", "citations", "law"],
    priority: 10,
  },

  // --- VOLLMACHT PROCESS ---
  {
    category: "DELETION_PROCESS" as const,
    title: "Vollmacht (Power of Attorney) Process",
    content: `# Power of Attorney (Vollmacht) Workflow

## When Triggered
Google sends RQ6: "Bitte erläutern Sie das Rechtsverhältnis zwischen Ihnen und den einzelnen Inhabern der lokalen Einträge"

## Required Actions
1. Download the Vollmacht PDF template from: https://drive.google.com/file/d/1vpVRovL91WVwP-9T3vx0O4kMPwPR1iQr/view
2. Fill in:
   - Business name + address + phone + email (from Client profile)
   - Representative name + firm (from Client.deletion_name or authorized rep)
   - Validity period: submission date + 12 months (format: 31.12.YYYY)
   - Place and date + printed name
3. The completed PDF MUST be attached to the reply email
4. A text-only response without PDF attachment is INSUFFICIENT

## Important Notes
- This is the most complex response type
- Currently requires manual PDF completion (future: auto-fill)
- After sending: if no reply from Google within 7 days, resend every 2 days`,
    source: "löschung blueprint",
    tags: ["vollmacht", "power-of-attorney", "PDF", "rq6", "attachment"],
    priority: 7,
  },

  // --- REACTIVATION HANDLING ---
  {
    category: "DELETION_PROCESS" as const,
    title: "Reactivation Handling (Reviews Coming Back)",
    content: `# Review Reactivation Protocol

## What is a Reactivation?
After a review has been successfully deleted, the reviewer may file an appeal with Google. If Google accepts the appeal, the review reappears. This is rare (~2% of deletions based on 10/500 observed).

## Detection
- Google may send a notification email
- Periodic monitoring of business listings can also detect it

## Response Protocol
1. Set review status → REACTIVATED
2. Log the reactivation date
3. Schedule re-submission for exactly 90 days from reactivation
4. NEVER re-submit before 90 days (this creates a "ping-pong" pattern that Google penalizes)
5. When resubmitting, use the standard submission workflow
6. If second attempt also fails → try submitting from a different authorized account
7. Best timing for resubmission: when Google support is likely less busy (avoid holidays)`,
    source: "löschung blueprint video transcript",
    tags: ["reactivation", "appeal", "retry", "90-days"],
    priority: 6,
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seed() {
  console.log("🌱 Seeding Response Templates...");

  for (const tpl of RESPONSE_TEMPLATES) {
    // Check if template already exists for this scenario_key
    const existing = await prisma.responseTemplate.findFirst({
      where: { scenario_key: tpl.scenario_key, language: tpl.language }
    });

    if (existing) {
      console.log(`  ⏭️  Template "${tpl.name}" already exists — skipping`);
      continue;
    }

    await prisma.responseTemplate.create({
      data: {
        ...tpl,
        version: 1,
        active: true,
      }
    });
    console.log(`  ✅ Created template: ${tpl.name}`);
  }

  console.log("\n🧠 Seeding Knowledge Base...");

  for (const entry of KNOWLEDGE_ENTRIES) {
    // Check if knowledge entry already exists by title
    const existing = await prisma.knowledgeBase.findFirst({
      where: { title: entry.title }
    });

    if (existing) {
      console.log(`  ⏭️  Knowledge "${entry.title}" already exists — skipping`);
      continue;
    }

    await prisma.knowledgeBase.create({
      data: {
        ...entry,
        active: true,
      }
    });
    console.log(`  ✅ Created knowledge entry: ${entry.title}`);
  }

  console.log("\n✨ Seed complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
