# Copilot Instructions — Pulllog Contract

## Scope
These instructions apply to the `contract/` workspace, which manages the OpenAPI contract.

## Canonical API Schema

- Canonical file: `api-schema.yaml`
- Endpoints: `paths/*.yaml`
- Components: `schemas/*.yaml`
- Reference guide: `SCHEMA-INDEX.md`

Always keep references and response structures consistent with this contract.

## Environment Policy

- Primary local environment: Windows
- Preferred shell on Windows: PowerShell
- Package manager: npm (for this workspace)
- Do not assume Python is installed or available.
- Do not use Python helpers for routine editing or validation tasks.

## Command Selection Priority

1. Existing `package.json` scripts
2. Existing repository scripts in `scripts/`
3. PowerShell commands
4. Node.js one-off scripts
5. Bash only when explicitly required
6. Python only if availability is confirmed and justified

## Standard Commands

```powershell
npm install
npm run validate
npm run validate:verbose
npm run bundle
npm run bundle:json
npm run validate:then:bundle
```

## Editing Rules

- Keep OpenAPI edits scoped and minimal.
- Add or change endpoints in `paths/` first, then wire from `api-schema.yaml`.
- Add or change reusable types in `schemas/` and expose them under `components.schemas`.
- Follow existing `$ref` conventions documented in `SCHEMA-INDEX.md`.
- Avoid unrelated formatting changes.

## Validation Rules

- Run `npm run validate` after any schema change.
- Run bundling only when output artifacts are needed.
- Do not claim completion without checking command output.

## Workspace Root Policy Summary

- This workspace follows the shared root policy in `pulllog/AGENTS.md`.
- On Windows, prefer PowerShell-first workflows.
- Do not assume Python is installed. Avoid Python-based helpers unless availability is confirmed.
- For command selection, prioritize existing `package.json` scripts and committed repo scripts.
- Keep edits scoped and validate with the smallest relevant command first.
