# Global Guidelines (Always-On)

These instructions apply universally to every agent, subagent, and prompt interacting with this workspace:

1. **Direct Commits**: Always push new iterations directly to git. Do not wait for the user to explicitly ask you to push changes.
2. **Resource Efficiency**: Do NOT try 10 times to fix an issue and waste tokens. If an implementation or fix fails after 1-2 attempts, stop and consult the user.
3. **Uncertainty & Failure Protocol**: If you are uncertain about a goal, lack context, or cannot fix something, you MUST stop and ask the user for clarification before continuing. Do not guess or blindly attempt fixes.
