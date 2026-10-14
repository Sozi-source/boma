# CHANGES

## 2026-10-10: DESIGN.md and AI agent pointers
- DESIGN.md (added): Boma-specific UI refinement guide with audit findings, workflow, text rules, tokens and delivery format.
- AGENTS.md, CLAUDE.md, GEMINI.md (added): short pointers so Codex-style agents, Claude Code and Gemini CLI read DESIGN.md first.
- .cursor/rules/design.mdc (added): always-on rule for Cursor.
- .github/copilot-instructions.md (added): instructions for GitHub Copilot.
## 2026-10-14: Dashboard loading state and typography refinement
- app/dashboard/page.tsx (changed): added animated skeleton placeholders for treasury balance, metric pills, group funds, and recent receipts to eliminate initial KES 0 flash while fetching data; bumped sub-11px typography to 11px and applied whitespace-nowrap/tabular-nums according to DESIGN.md text rules.
- app/auth/signup/page.tsx (changed): configured emailRedirectTo to point to `${origin}/auth/callback` so confirmation email links route through the PKCE exchange handler.
- app/bomas/[id]/page.tsx (changed): implemented Phase 1 live activity stream card with pulsing indicator, 25%/50%/75%/100% milestone progress notches, standardized action labels to "Contribute", and integrated the Members & Pledges roster tab.
- components/member-roster.tsx (added): added member roster component with organizer member management, optional target/pledge on-off toggle, phone-based member gatekeeper check-in, and multi-SIM alias binding.
- README.md (changed): added Pan-African Scale Architecture blueprint to future roadmap covering multi-currency FX engine, multi-rail gateway orchestration, E.164 phone identity, and WhatsApp bot integration.
