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
- app/dashboard/page.tsx (changed): added direct "Members" action button on every fund card linking to the fund's Members & Pledges roster tab.
- components/member-roster.tsx (changed): ensured "Add Member" button and "Pledges: ON/OFF" toggle are always visible in the roster header; supported ?tab=members query param in fund page.
## 2026-10-14: Enterprise navigation and button hierarchy refinement
- components/admin/admin-sidebar.tsx (changed): converted sidebar from dark `#0A4F43` to a light-themed enterprise layout (`bg-white border-r border-slate-200`) adhering to DESIGN.md; unified workspace navigation (Overview, Activity, Funds, Members, Approvals, Central Ledger, Payout Accounts, and Add Fund); upgraded all sub-11px text to 11px; added `whitespace-nowrap tabular-nums` to IDs and badges.
- components/admin/admin-mobile-header.tsx (changed): redesigned mobile slide-out drawer from dark theme to light enterprise styling with minimum 11px font sizes and verified account status.
- components/desktop-header.tsx (changed): added breadcrumb context for all organizer workspace routes (`/dashboard`, `/activity`, `/bomas`, `/bomas/create`, `/admin/*`), raised type size from 10px to 11px, and enhanced the "+ Add fund" primary button.
- components/mobile-nav.tsx (changed): raised label typography from 9px to 11px and ensured emerald accent active states.
- components/app-shell.tsx (changed): enabled persistent enterprise sidebar and desktop header across all authenticated organizer workspace routes (`/dashboard`, `/activity`, `/bomas`, `/bomas/create`, `/admin/*`) while keeping public campaign pages (`/`, `/bomas/[id]`) full-width and focused; fixed footer sub-11px text.
- components/navbar.tsx (changed): replaced raw hex colors with design tokens (`border-slate-200`, `text-slate-900`, `text-emerald-700`, `bg-emerald-700`) and styled enterprise buttons.
- components/boma-card.tsx (changed): removed background gradients, upgraded category and status typography to 11px, removed truncation from monetary amounts, and standardized action button states.
- app/bomas/page.tsx (changed): updated button hierarchy and goal cards with semantic tokens and emerald action buttons.
## 2026-10-14: Phone-first user onboarding (email made optional)
- app/admin/users/page.tsx (changed): made the Email Address field optional in the "Add New User" modal (updated label to "Email Address (Optional)", removed HTML5 required constraint, and updated validation to allow adding phone-first members without an email); added fallback display ("No email attached") in table and mobile card views; reduced user card sizes by over 50% by expanding to a responsive 3-to-4 column grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`), compressing vertical padding, inlining roles and primary mobile lines, and streamlining action controls.
## 2026-10-14: Premium uncrowded member cards and details management modal
- app/admin/users/page.tsx (changed): stripped out cluttered in-card controls (role dropdowns, extra SIM lists, in-card add phone inputs, raw delete and suspend buttons) to create clean, premium cards showing essential details only (initial avatar, role pill, status dot, full name, primary M-Pesa line); introduced a dedicated Member Profile & Management Modal (`isDetailsModalOpen`) containing role assignment, multi-SIM line binding/removal, account activation/suspension, and deletion.
## 2026-10-14: WhatsApp sharing accessibility across dashboard and campaign pages
- app/dashboard/page.tsx (changed): added a direct "Share" action button with WhatsAppIcon on every group fund card, enabling one-click opening of the ShareModal directly from the organizer dashboard.
- app/bomas/[id]/page.tsx (changed): added a prominent "Share on WhatsApp" button in the desktop campaign sidebar; fixed mobile floating action bar so the Share button is always available to both organizers and members.
- components/share-modal.tsx (changed): raised all sub-11px text to 11px compliant with DESIGN.md.
## 2026-10-14: Fund loading acceleration and skeleton screen optimization
- app/bomas/[id]/page.tsx (changed): resolved slow fund page loads by decoupling the waterfall; primary fund details paint immediately upon receiving the fund record (~200ms) while ledger entries, disbursements, and transactions are hydrated asynchronously in the background; eliminated the blank-white screen spinner (`Loading fund...`) and replaced it with a high-fidelity skeleton screen matching the campaign layout in accordance with DESIGN.md Section 11 & 14.
- app/dashboard/page.tsx (changed): eliminated the sequential transaction query waterfall (`for ... await`) and parallelized user, group, and fund queries with `Promise.all`, instantly displaying funds and balances without waiting on historical ledger logs.
## 2026-10-14: WhatsApp phone-first member check-in and unauthenticated organizer bug fix
- app/bomas/[id]/page.tsx (changed): fixed critical issue where unauthenticated guests viewing funds saw organizer management controls ("Group visibility: Public" and "Make group private") due to fallback mock IDs; verified genuine Supabase authentication before conferring `isFundOrganizer` permissions; implemented Soft Phone Check-in Banner for visitors arriving from WhatsApp links, allowing members to enter their M-Pesa line to access their personal member account, track pledges, and review contribution history; added persistent member session in localStorage (`openhand_member_phone`) so returning users and PWA installs remain recognized.
- components/contribution-modal.tsx (changed): integrated phone-first member session prefilling; automatically loads the recognized member's phone number and roster name when opening the Contribute modal; removed phone number placeholder.
- components/member-roster.tsx (changed): removed phone number placeholder from the member check-in input.
- app/bomas/[id]/page.tsx (changed): purged the verbose WhatsApp phone check-in banner and status bar to improve UI clarity; the fund page now transitions cleanly from breadcrumbs directly into the hero cover media and details.
