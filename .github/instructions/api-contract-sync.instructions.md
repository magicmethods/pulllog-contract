---
description: "Use when working on contract/api-schema.yaml, paths/*.yaml, or schemas/*.yaml to review frontend and stable backend drift before changing the OpenAPI contract."
name: "API Contract Sync Workflow"
applyTo: "api-schema.yaml,paths/**/*.yaml,schemas/**/*.yaml"
---
# PullLog API Contract Sync Workflow

- `contract/api-schema.yaml` is the canonical source of truth.
- When a request involves frontend/backend implementation drift, start with the `contract-orch-audit` agent.
- Use `contract-review-gap` for integrated review, `contract-audit-frontend` for Nuxt-side evidence, and `contract-audit-backend` for stable Laravel-side evidence.
- Ignore `../backend/beta/**` completely.
- `contract-impl-spec` should only apply human-approved changes.
- After contract changes, run `npm run validate` and report the result with evidence.
