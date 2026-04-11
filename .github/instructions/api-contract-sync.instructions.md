---
description: "Use when working on contract/api-schema.yaml, paths/*.yaml, or schemas/*.yaml to review frontend and stable backend drift before changing the OpenAPI contract."
name: "API Contract Sync Workflow"
applyTo: "api-schema.yaml,paths/**/*.yaml,schemas/**/*.yaml"
---
# PullLog API Contract Sync Workflow

- `contract/api-schema.yaml` is the canonical source of truth.
- When a request involves frontend/backend implementation drift, first consult the `contract-gap-reviewer` agent.
- Use `frontend-contract-auditor` for Nuxt-side evidence and `backend-contract-auditor` for stable Laravel-side evidence.
- Ignore `../backend/beta/**` completely.
- `contract-spec-updater` should only apply human-approved changes.
- After contract changes, run `npm run validate` and report the result with evidence.
