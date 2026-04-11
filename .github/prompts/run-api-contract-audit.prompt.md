---
description: "Run the PullLog API contract audit workflow from one prompt. Starts drift detection, reviews frontend and stable backend evidence, and prepares a human-approval-ready change plan."
name: "Run API contract audit"
argument-hint: "Optional scope or focus, e.g. 'all', 'frontend only', 'review /gallery and /user'"
agent: "contract-audit-orchestrator"
---
Run the PullLog API contract audit workflow for the requested scope.

Default behavior:
1. Run the deterministic drift check in `contract/`.
2. Review frontend and/or `backend/stable` evidence.
3. Consolidate findings into:
   - `missing-in-contract`
   - `schema-mismatch`
   - `human-decision-required`
4. Stop before editing files unless the user explicitly asks for contract updates or clearly approves a change plan.

Requirements:
- Treat `contract/api-schema.yaml` as the source of truth.
- Ignore `../backend/beta/**` completely.
- Prefer evidence-backed conclusions with file references.
- Keep the output concise and reviewable.
