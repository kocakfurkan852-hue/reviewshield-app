import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "", 
});

/**
 * Loads the classification rules from the KnowledgeBase table.
 * Falls back to hardcoded rules if DB is empty (first run).
 */
async function loadClassificationContext(): Promise<string> {
  try {
    const entries = await prisma.knowledgeBase.findMany({
      where: {
        active: true,
        tags: { hasSome: ["classification", "routing", "trigger-phrases"] }
      },
      orderBy: { priority: "desc" },
      take: 3
    });

    if (entries.length > 0) {
      return entries.map(e => e.content).join("\n\n---\n\n");
    }
  } catch (e) {
    console.warn("Could not load KB classification context:", e);
  }

  // Fallback: minimal hardcoded rules (used before seed runs)
  return `Classify Google emails using these types:
SUCCESS: "wurde entfernt", "has been removed", "Inhalte entfernt"
INITIAL_CONFIRM: "Danke für Ihre Anfrage", "Thank you for your report"
DECLINED: "können wir leider keine Maßnahmen ergreifen", "unable to take action"
RQ1: "ob Sie die Person sind", "deren Rechte angeblich verletzt"
RQ2: "Wohnsitzstaat", "Staatsbürgerschaft"
RQ3: "genauen Text oder Inhalt", "gesetzlichen Rechte verletzt"
RQ4: "Link zum betreffenden Brancheneintrag"
RQ6: "Rechtsverhältnis zwischen Ihnen", "Vollmacht"`;
}

/**
 * Parse a Google response email using the Knowledge Base classification rules.
 * Returns a structured classification with the specific response code.
 */
export async function parseGoogleResponse(emailBody: string, subjectLine: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("Anthropic API key not configured. Mocking AI response.");
    return {
      parsedAction: "UNKNOWN" as const,
      responseCode: "UNKNOWN",
      confidence: 0,
      summary: "AI not configured. Manual review required.",
      googleResponseType: "UNPARSED"
    };
  }

  const classificationRules = await loadClassificationContext();

  const prompt = `You are classifying an inbound email from Google (removals@google.com) regarding a review deletion request.

## CLASSIFICATION RULES (from Knowledge Base)
${classificationRules}

## EMAIL TO CLASSIFY
Subject: ${subjectLine.substring(0, 200)}
Body:
${emailBody.substring(0, 2000)}

## INSTRUCTIONS
1. Scan the subject and body for trigger phrases from the rules above
2. Match the FIRST rule that fits
3. If "wurde entfernt" or "has been removed" appears → always SUCCESS
4. If confidence < 70 → classify as UNKNOWN

Return STRICT JSON only:
{
  "parsedAction": "<APPROVED|REJECTED|NEEDS_INFO|UNKNOWN>",
  "responseCode": "<SUCCESS|INITIAL_CONFIRM|DECLINED|RQ1|RQ2|RQ3|RQ4|RQ6|UNKNOWN>",
  "confidence": <0-100>,
  "summary": "<1 sentence summary of what Google said>",
  "googleResponseType": "<keyword>",
  "matchedPhrase": "<the exact trigger phrase that matched, or null>"
}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      temperature: 0,
      system: "You are an automated email classifier for a German legal review deletion service. Always respond with valid JSON only. Never include explanations outside the JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const contentBlock = msg.content[0];
    const responseText = "text" in contentBlock ? contentBlock.text : "";
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const parsed = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    
    return {
      parsedAction: parsed.parsedAction || "UNKNOWN",
      responseCode: parsed.responseCode || "UNKNOWN",
      confidence: parsed.confidence || 0,
      summary: parsed.summary || "No summary available",
      googleResponseType: parsed.googleResponseType || parsed.responseCode || "UNKNOWN",
      matchedPhrase: parsed.matchedPhrase || null
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    return {
      parsedAction: "UNKNOWN" as const,
      responseCode: "UNKNOWN",
      confidence: 0,
      summary: "Error communicating with AI parser.",
      googleResponseType: "ERROR",
      matchedPhrase: null
    };
  }
}

/**
 * Load the correct response template from the DB based on the response code.
 * Returns the template with placeholders still intact.
 */
async function loadResponseTemplate(responseCode: string): Promise<{
  scenario_key: string;
  subject_line: string;
  body_text: string;
} | null> {
  // Map response codes to scenario keys
  const codeToScenario: Record<string, string> = {
    "RQ1": "RQ1_IDENTITY",
    "RQ2": "RQ2_RESIDENCE",
    "RQ3": "RQ3_CONTENT",
    "RQ4": "RQ4_LISTING_LINK",
    "RQ6": "RQ6_POWER_OF_ATTORNEY",
    "FOLLOW_UP": "FOLLOW_UP",
  };

  const scenarioKey = codeToScenario[responseCode];
  if (!scenarioKey) return null;

  const template = await prisma.responseTemplate.findFirst({
    where: {
      scenario_key: scenarioKey,
      language: "DE",
      is_default: true,
      active: true
    }
  });

  return template;
}

/**
 * Fill placeholders in a template with actual campaign/client data.
 */
function fillTemplatePlaceholders(
  template: string,
  data: {
    ticketId?: string;
    companyName?: string;
    authorizedName?: string;
    reviewUrls?: string[];
    googlePlaceUrl?: string;
  }
): string {
  let filled = template;
  filled = filled.replace(/\{\{TICKET_ID\}\}/g, data.ticketId || "N/A");
  filled = filled.replace(/\{\{COMPANY_NAME\}\}/g, data.companyName || "[Unternehmensname]");
  filled = filled.replace(/\{\{AUTHORIZED_NAME\}\}/g, data.authorizedName || "[Name]");
  filled = filled.replace(/\{\{REVIEW_URLS\}\}/g, data.reviewUrls?.join("\n") || "[Rezensions-URLs]");
  filled = filled.replace(/\{\{GOOGLE_PLACE_URL\}\}/g, data.googlePlaceUrl || "[Google-Place-URL]");
  return filled;
}

/**
 * Generate an email response using the TEMPLATE from the DB (not AI invention).
 * The AI only fills placeholders — it does NOT write the legal text.
 * 
 * This replaces the old "let AI wing it" approach.
 */
export async function generateEmailResponse(
  emailBody: string,
  responseCode: string,
  companyName: string,
  ticketId: string,
  additionalContext?: {
    authorizedName?: string;
    reviewUrls?: string[];
    googlePlaceUrl?: string;
  }
) {
  // Step 1: Load the proven template from DB
  const template = await loadResponseTemplate(responseCode);

  if (template) {
    // Use the EXACT proven template — no AI creativity needed
    const filledSubject = fillTemplatePlaceholders(template.subject_line, {
      ticketId,
      companyName,
      authorizedName: additionalContext?.authorizedName,
    });

    const filledBody = fillTemplatePlaceholders(template.body_text, {
      ticketId,
      companyName,
      authorizedName: additionalContext?.authorizedName,
      reviewUrls: additionalContext?.reviewUrls,
      googlePlaceUrl: additionalContext?.googlePlaceUrl,
    });

    return {
      subject: filledSubject,
      body: filledBody,
      source: "TEMPLATE",
      templateScenario: template.scenario_key
    };
  }

  // Step 2: If no template found, fall back to AI generation (with KB context)
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      subject: `Re: [Ticket ID: ${ticketId}] Removal Request`,
      body: "No matching template found and AI API Key missing. Please draft response manually.",
      source: "FALLBACK",
      templateScenario: null
    };
  }

  // Load knowledge context for AI to reference (Case Law, Process, and Legal Templates)
  const kbEntries = await prisma.knowledgeBase.findMany({
    where: { 
      active: true, 
      category: { in: ["CASE_LAW", "LEGAL_TEMPLATE", "DELETION_PROCESS"] } 
    },
    orderBy: { priority: "desc" },
    take: 5
  });
  const kbContext = kbEntries.map(e => `### ${e.title}\n${e.content}`).join("\n\n");

  const prompt = `You are a specialized legal assistant for ReviewShield representing "${companyName}".
You received an unusual or unrecognized email from Google:
"""
${emailBody.substring(0, 2000)}
"""

The classification code is: ${responseCode}.
There is no exact template for this situation. You must draft a custom, high-impact response in German (DE).

USE THESE LEGAL & PROCESS GUIDELINES TO CRAFT THE ARGUMENT:
${kbContext}

STRICT REQUIREMENTS:
1. Subject line must be: Re: [Ticket ID: ${ticketId}] Removal Request
2. Use a formal German tone ("Sehr geehrte Damen und Herren", "Mit freundlichen Grüßen")
3. If the email is about a rejection, emphasize that the burden of proof lies with Google/the reviewer (BGH VI ZR 34/15)
4. If the email asks for info, provide it if possible or explain why it's already provided
5. KEEP IT CONCISE BUT LEGALLY AUTHORITATIVE.

Return strict JSON: {"subject":"<subject>","body":"<body>"}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 600,
      temperature: 0.3,
      system: "You are a German legal email assistant. Reply with valid JSON only.",
      messages: [{ role: "user", content: prompt }]
    });

    const contentBlock = msg.content[0];
    const responseText = "text" in contentBlock ? contentBlock.text : "";
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const parsed = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    
    return {
      subject: parsed.subject,
      body: parsed.body,
      source: "AI_GENERATED",
      templateScenario: null
    };
  } catch (error) {
    console.error("Claude Generation Error:", error);
    return {
      subject: `Re: [Ticket ID: ${ticketId}] Removal Request`,
      body: "Error generating response. Please draft manually.",
      source: "ERROR",
      templateScenario: null
    };
  }
}
