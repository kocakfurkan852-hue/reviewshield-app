---
name: creating-skills
description: Generates high-quality, predictable, and efficient .agent/skills/ directories based on user requirements. Use when the user asks to create a new skill or automate a specific workflow.
---

# Skill Creator

## When to use this skill
- When the user asks to create a new skill.
- When the user wants to automate a specific workflow using a skill.
- When formalizing a set of instructions into a repeatable agent capability.

## Workflow
1.  **Analyze Requirements**: Understand the task and the logic needed for the skill.
2.  **Plan Structure**: Determine if helper scripts or examples are needed.
3.  **Draft SKILL.md**: Use YAML frontmatter and the principles below.
4.  **Validation**: Ensure paths use `/` and logic is concise.
5.  **Implementation**: Create the folder and files.

## Instructions
### 1. Core Structural Requirements
Every skill must follow this folder hierarchy:
- `<skill-name>/`
    - `SKILL.md` (Required: Main logic and instructions)
    - `scripts/` (Optional: Helper scripts)
    - `examples/` (Optional: Reference implementations)
    - `resources/` (Optional: Templates or assets)

### 2. YAML Frontmatter Standards
- **name**: Gerund form (e.g., `testing-code`, `managing-databases`). Max 64 chars. Lowercase, numbers, and hyphens only.
- **description**: Written in **third person**. Must include specific triggers/keywords. Max 1024 chars.

### 3. Writing Principles
* **Conciseness**: Assume the agent is smart. Focus only on the unique logic.
* **Progressive Disclosure**: Keep `SKILL.md` under 500 lines. Link to secondary files if needed.
* **Forward Slashes**: Always use `/` for paths.
* **Degrees of Freedom**: 
    - Use **Bullet Points** for high-freedom tasks.
    - Use **Code Blocks** for medium-freedom.
    - Use **Specific Bash Commands** for low-freedom.

### 4. Workflow & Feedback Loops
- Include **Checklists** for state tracking.
- Include **Validation Loops** (Plan-Validate-Execute).
- Include **Error Handling** instructions.

---

## Instructions for use
1. Trigger a skill creation by saying: *"Based on my skill creator instructions, build me a skill for [Task]."*
