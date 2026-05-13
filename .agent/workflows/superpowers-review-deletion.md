---
name: "review-deletion"
description: "Workflow to submit Google Review removal requests automatically"
---

# Review Deletion Automation Workflow

This workflow guides the AI through preparing and automating the removal request via the Google Legal support form.

## 1. Gather Required Data from Database
- Get the list of `review_url`s that are marked as `PENDING`.
- Extract up to 10 reviews per submission batch.
- Prepare the legal explanation text:
  "Sehr geehrte Damen und Herren,\n\ndie vorliegende Bewertung ist aus folgenden Gründen zu löschen:\n\nDer Rezensent 'Jenny S.' war niemals Kunde des Unternehmens 'Hermannstraße 158A, 12051 Berlin'. Eine Geschäftsbeziehung bestand zu keinem Zeitpunkt.\n\nNach ständiger Rechtsprechung sind Bewertungen ohne tatsächliche Geschäftsbeziehung unzulässig und verletzen das Persönlichkeitsrecht des Unternehmens (BGH, Urt. 01.03.2016, VI ZR 34/15). Die Bewertung verursacht erheblichen wirtschaftlichen Schaden.\n\nSie werden hiermit aufgefordert, Ihren vom BGH auferlegten Pflichten nachzukommen:\n1) Diese Beanstandung an den Verfasser weiterzuleiten\n2) Den Verfasser zur Stellungnahme aufzufordern mit Nachweis der Geschäftsbeziehung\n3) Die Rezension bei Nichtreaktion oder fehlendem Nachweis zu entfernen\n\nWir erwarten Ihre Rückmeldung bis zum 26. Mai 2026."

## 2. Browser Automation Strategy (Because of Recaptcha)
Because the form ([Google Legal Contact](https://support.google.com/legal/contact/lr_legalother?product=geo&uraw=)) contains a reCAPTCHA ("ich bin kein Roboter"), the submission cannot be made entirely blindly via cURL or fetch.

### Two recommended approaches to present to the user:
1. **Semi-Automated (Bookmarklet/Extension) - Recommended:** The AI agent prepares the exact URLs and Begründung, then provides a "Magic Link" or Bookmarklet for the user. When the user opens the Google Form in their browser, the script auto-fills: 
   - Wohnsitz: Deutschland
   - Name: Süleyman Furkan Kocak
   - In Namen: "mich selbst"
   - URLs + Text
   - Unterschrift: Süleyman Furkan Kocak
   The user simply clicks the Recaptcha and clicks Submit.
2. **Fully-Automated (Browserless + 2Captcha):** Requires deploying a Puppeteer/Playwright script using `puppeteer-extra-plugin-stealth` in an external environment (like Supabase Edge Functions or Render) configured with an API key for a captcha solver like 2Captcha. 

## 3. Post-Submission Tracking
- Prompt the user to confirm the submission.
- Once confirmed, update the Review status in the database to `SUBMITTED`.
- Log the submission batch to the AuditLog.
