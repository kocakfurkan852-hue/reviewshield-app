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

  const prompt = `
    You are an expert at parsing automated responses from Google's business support team regarding review deletion requests.
    Analyze the following email and determine the outcome.
    
    Email Subject: ${subjectLine}
    Email Body:
    ${emailBody}
    
    Categorize the response into one of the following exact statuses:
    - APPROVED (Google agreed to delete the review)
    - REJECTED (Google refused to delete the review)
    - NEEDS_INFO (Google is asking for more information/evidence)
    - UNKNOWN (The email doesn't clearly fit the above)
    
    Return a JSON object strictly matching this format:
    {
      "parsedAction": "APPROVED" | "REJECTED" | "NEEDS_INFO" | "UNKNOWN",
      "confidence": <number between 0 and 100>,
      "summary": "<a strict 1-2 sentence summary of what Google is saying>",
      "googleResponseType": "<a short keyword like 'INITIAL_CONFIRMATION', 'REJECTION_NOTICE', etc.>"
    }
  `;

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
