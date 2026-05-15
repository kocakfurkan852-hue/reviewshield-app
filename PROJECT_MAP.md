# ReviewShield Project Map (v1.0)

## 🎯 Quick Access for AI Agents
If you are developing ReviewShield, here is your map to stay token-efficient.

### 📜 Core Documentation
- **Constitution**: `.agent/docs/reviewshield.md` (Laws, Schemas, Rules)
- **Action Plan**: `.agent/docs/BUILD_ACTION_PLAN.md` (Checklists, Next Steps)
- **Domain Info**: `../ReviewShield_Documentation/Markdown/`
  - `google_review_deletion_agent_blueprint.md`: Technical workflow.
  - `google_deletion_process_insights.md`: Real-world tips & transcript.

### 🏗️ Architecture
- **API Endpoints**: `src/app/api/`
- **Email Processing**: `src/lib/email-processor.ts` (Claude logic & deduplication)
- **Database Schema**: `prisma/schema.prisma`
- **Webhook Gateway**: `src/app/api/webhooks/zapier/route.ts`

### 🔧 Tools & Skills
- **Skill Creator**: `../building-tools/antigravity-skill-creator.md`
- **Automation Skill**: `C:\Users\kocak\.gemini\antigravity\skills\automating-reviewshield-zapier\SKILL.md`

### 📦 Legacy & Cleanup
- Check `../_legacy/` before recreating old tools or documentation.

---
*Optimized for Antigravity AI Agents.*
