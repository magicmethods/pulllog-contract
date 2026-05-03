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

## Repository-wide instructions for Playwright E2E operations

### Purpose
This repository uses GitHub Copilot custom agents to design, implement, run, debug, and review Playwright E2E tests.
Always follow the repository E2E architecture and case manifest definitions before making changes.

### Required references
Before working on any E2E task, read these files when they exist in the **frontend** workspace:

- `${workspaceFolder:frontend}/docs/architecture/e2e-test.md`
- `${workspaceFolder:frontend}/e2e/cases/case.schema.json`
- related case manifest files under `${workspaceFolder:frontend}/e2e/cases/`
- `${workspaceFolder:frontend}/e2e/templates/report-template.md`
- `${workspaceFolder:frontend}/e2e/templates/index-template.md`
- `${workspaceFolder:frontend}/e2e/templates/evidence-template.html` when PDF archival or evidence layout is involved
- `${workspaceFolder:frontend}/e2e/templates/pulllog/report-template.md`, `index-template.md`, and `evidence-template.html` when using the Pulllog-specific default set
- `${workspaceFolder:frontend}/.env.e2e` when template overrides, account resolution, or environment-specific execution behavior are relevant
- existing Playwright config, fixtures, helpers, reporters, and test utilities in the frontend workspace

### General rules
- Use the existing project structure and naming conventions.
- Prefer minimal diffs.
- Do not rewrite unrelated tests.
- Do not hardcode secrets, passwords, or tokens in source files or manifests.
- Keep environment-specific values outside of test code whenever possible.
- Use stable locators first: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByTestId`.
- Do not rely on brittle CSS selectors unless there is no practical alternative.
- Do not use `waitForTimeout` unless there is no reliable state-based wait and the reason is documented.
- Prefer explicit state-based waits and assertions.
- Keep one test focused on one behavior whenever possible.
- Prefer the frontend repository E2E scripts (`pnpm run test:e2e`, `test:e2e:case`, `test:e2e:tag`) over ad-hoc raw commands.
- When narrowing project scope explicitly, prefer a comma-separated selector such as `--project=chromium,ipad-pro-11,iphone-14`.
- Use reusable fixtures, helpers, and page objects when it reduces duplication without hiding test intent.

### E2E execution policy
- E2E tests are manifest-driven.
- The standard default project matrix is PC `chromium`, tablet `ipad-pro-11`, and smartphone `iphone-14`.
- Use the frontend repository runner scripts and this standard matrix unless the task or manifest intentionally overrides it.
- BaseURL, account key, target page, excluded navigation coverage, and report behavior must come from the case manifest when possible.
- When a new case is needed, create or update a manifest file instead of burying case-specific assumptions inside the spec.
- If the requested behavior should not be covered by E2E, say so clearly and explain whether it belongs in unit or integration tests.
- Multi-project runs for the same case should aggregate into one case report that shows all executed project results, not only the first project.

### Reporting and evidence policy
- Every E2E execution must produce a Markdown report.
- Markdown case reports and the daily index should be rendered from the shared templates under `${workspaceFolder:frontend}/e2e/templates/` whenever available.
- The current repository default template set may be activated globally via `${workspaceFolder:frontend}/.env.e2e` using `PLAYWRIGHT_E2E_TEMPLATE_DIR=pulllog`.
- Global template overrides may use `PLAYWRIGHT_E2E_TEMPLATE_DIR`, `PLAYWRIGHT_E2E_REPORT_TEMPLATE`, `PLAYWRIGHT_E2E_INDEX_TEMPLATE`, and `PLAYWRIGHT_E2E_EVIDENCE_TEMPLATE`.
- Case-specific overrides may use `report.templates.markdown` and `report.templates.evidence`.
- The Markdown report must include execution metadata, key assertions, snapshot references, failure summary when applicable, and a per-project result summary when more than one project is executed.
- When a case succeeds and the manifest allows it, convert the Markdown report to PDF and store it as evidence.
- PDF evidence should use the active evidence template and, when multiple standard-matrix projects run for the same case, include the fixed PC / Tablet / SP comparison table while preserving the per-project detail sections.
- When a case fails, keep Markdown, screenshots, traces, and logs, but do not generate final PDF evidence unless explicitly requested.
- Evidence files must use deterministic naming and folder structure.

### Manifest policy
- Treat `${workspaceFolder:frontend}/e2e/cases/case.schema.json` as the source of truth for case structure.
- Prefer JSON for case manifests.
- Store only account keys or references in manifests, not raw credentials.
- Manifest filenames should normally match the case id (for example, `auth-apps-smoke.json`).
- Use `execution.project` only for case-specific overrides; otherwise the standard default matrix applies.
- Support per-case controls such as:
  - environment selection
  - target page
  - navigation start point
  - excluded flows
  - prerequisite state
  - report behavior
  - template overrides
  - execution overrides
  - tags

### Expected workflow
1. Read the frontend architecture, manifest, `.env.e2e`, and relevant template references.
2. Confirm whether a case already exists.
3. Design or update the scenario.
4. Implement or update Playwright code with minimal changes.
5. Run the relevant tests from the frontend workspace.
6. Generate a Markdown report from the shared template layout, ensuring all executed project results are represented.
7. If successful and allowed, archive the evidence as PDF using the active HTML evidence template.
8. Review for stability, maintainability, coverage, and template consistency.

### Output expectations
- Be explicit about assumptions.
- Distinguish facts from guesses.
- When blocked, report the exact blocker.
- When contract changes may affect E2E, explain which frontend case manifests or reports should be re-verified and how the result was verified

## Terminal & Process Management
- After completing any task in a terminal, always run the `exit` command to close the session.
- Do not leave background processes running after your work is done.
- On Windows, when using Git Bash (bash.exe), be aware that orphaned child processes may remain; always include a cleanup step for lingering processes at the end of a work sequence.

## Cleanup Rules
- After running multiple Git operations or build tasks in succession, consider cleaning up idle Git processes by running:
  `powershell.exe -Command "Get-Process | Where-Object { $_.Name -match 'git-remote-https|ssh-agent' } | Stop-Process -Force"`

## Workspace Root Policy Summary

- This workspace follows the shared root policy in `pulllog/AGENTS.md`.
- On Windows, prefer PowerShell-first workflows.
- Do not assume Python is installed. Avoid Python-based helpers unless availability is confirmed.
- For command selection, prioritize existing `package.json` scripts and committed repo scripts.
- Keep edits scoped and validate with the smallest relevant command first.
