import { prisma } from "./prisma";

export async function generateDraft(params: {
  campaign_id: string;
  email_thread_id?: string;
  removal_request_id?: string;
  scenario_key: string;
  language: "DE" | "EN";
  to_address: string;
  placeholders: Record<string, string>;
  draft_type: "REPLY" | "REMINDER";
}) {
  // Find the default template for the scenario
  const template = await prisma.responseTemplate.findFirst({
    where: {
      scenario_key: params.scenario_key,
      language: params.language,
      is_default: true,
      active: true,
    }
  });

  if (!template) {
    throw new Error(`No default template found for scenario: ${params.scenario_key} in ${params.language}`);
  }

  // Resolve placeholders
  let renderedSubject = template.subject_line;
  let renderedBody = template.body_text;

  for (const [key, value] of Object.entries(params.placeholders)) {
    const placeholder = `{{${key}}}`;
    renderedSubject = renderedSubject.split(placeholder).join(value);
    renderedBody = renderedBody.split(placeholder).join(value);
  }

  // Check Approval Gate Setting
  const approvalGateSetting = await prisma.systemSetting.findUnique({
    where: { setting_key: "approval_gate_enabled" }
  });
  
  // If approval gate is disabled, theoretically we could auto-send.
  // But for safety and PRD rules, we usually default to PENDING_REVIEW 
  // or we can mock auto-send if false. The PRD says "respecting ON/OFF toggle".
  const requireApproval = approvalGateSetting?.setting_value !== "false";

  // Create the draft
  const draft = await prisma.outboundDraft.create({
    data: {
      campaign_id: params.campaign_id,
      email_thread_id: params.email_thread_id,
      removal_request_id: params.removal_request_id,
      draft_type: params.draft_type,
      selected_template_id: template.id,
      rendered_subject: renderedSubject,
      rendered_body: renderedBody,
      to_address: params.to_address,
      status: requireApproval ? "PENDING_REVIEW" : "APPROVED"
    }
  });

  if (!requireApproval) {
    // In production: trigger immediate send via Gmail API here
    await prisma.outboundDraft.update({
      where: { id: draft.id },
      data: { status: "SENT", sent_at: new Date() }
    });
  }

  return draft;
}
