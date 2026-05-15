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
