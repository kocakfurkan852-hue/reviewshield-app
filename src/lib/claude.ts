import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "", 
});

export async function parseGoogleResponse(emailBody: string, subjectLine: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("Anthropic API key not configured. Mocking AI response.");
    return {
      parsedAction: "UNKNOWN",
      confidence: 0,
      summary: "AI not configured. Manual review required.",
      googleResponseType: "UNPARSED"
    };
  }

  const prompt = `Classify this Google review removal response email.
Subject: ${subjectLine.substring(0, 100)}
Body: ${emailBody.substring(0, 1000)}
Categories: APPROVED, REJECTED, NEEDS_INFO, UNKNOWN.
Return strict JSON: {"parsedAction":"<category>","confidence":<0-100>,"summary":"<1 sentence>","googleResponseType":"<keyword>"}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0,
      system: "You are an automated email parser. Always respond with valid JSON and nothing else.",
      messages: [{ role: "user", content: prompt }]
    });

    const contentBlock = msg.content[0];
    const responseText = "text" in contentBlock ? contentBlock.text : "";
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const parsedJSON = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    
    return parsedJSON;
  } catch (error) {
    console.error("Claude API Error:", error);
    return {
      parsedAction: "UNKNOWN",
      confidence: 0,
      summary: "Error communicating with AI parser.",
      googleResponseType: "ERROR"
    };
  }
}

export async function generateEmailResponse(emailBody: string, scenarioKey: string, companyName: string, ticketId: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      subject: `Re: [Ticket ID: ${ticketId}] Removal Request`,
      body: "AI API Key missing. Please draft response manually."
    };
  }

  const prompt = `You are a legal assistant for ReviewShield, a reputation management agency representing "${companyName}".
You received this email from Google:
"""
${emailBody}
"""

The scenario is: ${scenarioKey} (either REJECTION_RESPONSE or NEEDS_INFO_RESPONSE).
Write a professional, persuasive response email in German (DE).
The subject should be exactly: Re: [Ticket ID: ${ticketId}] Removal Request
The body should respectfully argue why the review violates guidelines or provide the missing context, depending on the email. Keep it concise, formal, and authoritative.
Return strict JSON ONLY: {"subject":"<subject string>","body":"<body string>"}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.7,
      system: "You are an automated email responder. Always respond with valid JSON and nothing else.",
      messages: [{ role: "user", content: prompt }]
    });

    const contentBlock = msg.content[0];
    const responseText = "text" in contentBlock ? contentBlock.text : "";
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const parsedJSON = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    
    return parsedJSON;
  } catch (error) {
    console.error("Claude Generation Error:", error);
    return {
      subject: `Re: [Ticket ID: ${ticketId}] Removal Request`,
      body: "Error generating response via AI. Please draft manually."
    };
  }
}
