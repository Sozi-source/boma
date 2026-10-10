# DESIGN.md

UI refinement guide for **Boma**, an app that is already built and working. AI agents and developers: read this file in full before touching any UI, and follow it on every task. The goal is to improve how the app looks and feels without changing how it works. If a request conflicts with a rule here, say so and ask before breaking the rule.

---

## 1. Project context

- **App:** Boma, a contribution-pooling web app (installable PWA). People start a fund for family, events or needs; every member sees every contribution and every shilling spent.
- **Who uses it:** public visitors (browse funds), signed-in members (contribute, track, share), and admins (approvals, ledger, funds, users, sub-accounts, sender settings).
- **Money flow:** contributions are paid through Paystack M-Pesa; payouts (disbursements) are protected by MFA; there are printable fund statements, QR codes and share links.
- **Main device:** phone first (many users on mid-range Android, slow connections). Desktop must be equally polished, especially the admin area.
- **Money format:** amounts are shown as `KES 1,250` through the existing `formatCurrency` helper. Do not introduce a second format.
- **Stack (do not change):** Next.js App Router, TypeScript, **Tailwind CSS v4** (`@import "tailwindcss"` and an `@theme inline` block in `app/globals.css`, no `tailwind.config` file), Geist font, Supabase, PWA.
- **Layout of the repo:** `app/` and `components/` sit at the project root (there is no `src/` folder). The `@/` import alias points at the project root. Shared code lives in `lib/`.
- **Routes:** `/`, `/bomas`, `/bomas/[id]`, `/bomas/create`, `/dashboard`, `/activity`, `/auth/login`, `/auth/signup`, and `/admin` with `funds`, `users`, `approvals`, `ledger`, `senders`, `subaccounts`.
- **Status:** built and in use. This is a visual and usability refinement, not a rebuild.

## 2. Style direction

- **Light, clean and calm.** A light interface everywhere, including the admin area. Remove large dark surfaces (see section 4 for where they are).
- **Green is a tactical accent,** not a fill. Use it for primary buttons, the active navigation item, key numbers, progress bars and small highlights. Never pour it across banners, hero areas or behind body text, so text stays clear on a white or very light background.
- **Gold/amber is used sparingly** (a single small highlight, for example a warning or a "pending" dot).
- **Trustworthy and transparent:** money, progress and status are the visual focus on every screen.
- **Reference apps:** [EDIT: e.g. M-Pesa app, Stripe dashboard, GoFundMe for the contribution flow]
- **Avoid:** dark panels, heavy gradients, neon colours, decorative illustrations, clutter, more than one accent colour.
- **Branding:** [EDIT: confirm the final brand colour and logo.] Do not use another company's logo, name or trademarks (for example Safaricom or M-Pesa marks) in a way that suggests an official partnership. Use official assets only with permission and following that company's brand guidelines. Mentioning "M-Pesa" as a payment method in plain text is fine.

## 3. Wording

- Plain, simple English for now. Kiswahili will be added later, so keep every string as plain text inside the JSX (no clever concatenation) and keep wording short.
- The action label for giving money is **Contribute**.
- Do not use "Cause" or "Mchango" in the interface. If a screen still uses them, replace them with simple wording and list the change in `CHANGES.md`.
- The label for creating a fund is undecided: [EDIT: preferred wording]. Until it is set, do not rename it; report where it appears.
- Avoid jargon (for example "disbursement", "subaccount") in member-facing screens when a plain word works ("Payout", "Account"). Admin screens may keep technical terms.

---

## 4. Known issues found in the first audit

These are the measured problems in the current code. Fix them as part of the batches in section 5.

- **Text that can be cut off:** 77 uses of `truncate`, `text-ellipsis`, `line-clamp` or `break-all` across 21 files, including `app/dashboard/page.tsx`, `app/bomas/[id]/page.tsx`, all admin pages and most modals.
- **Text that is too small:** about 220 uses of `text-[8px]`, `text-[9px]` or `text-[10px]` (177 at 10px, 36 at 9px, 5 at 8px), plus about 150 at 11px. The mobile bottom navigation labels are 9px. The minimum is 11px (section 6).
- **Raw colours inside components:** hex values such as `#176b4e`, `#0A4F43`, `#18352a` and `#052b28` appear directly in markup instead of tokens.
- **Dark surfaces:** 24 matches for dark backgrounds (slate, black, emerald/teal 900 or 950) in 13 files, including `components/admin/admin-sidebar.tsx`, the admin headers and subnav, and the contribution, disbursement, statement and share modals. Large dark surfaces are replaced by light ones. A small dark accent (for example a badge) may stay if it has good contrast.
- **Tables:** raw `<table>` in 7 files (`admin/funds`, `admin/users`, `admin/ledger`, `admin/subaccounts`, `activity`, `chama-statement-modal`, `transparent-ledger`). Only one of them has a horizontal scroll container, so the others can overflow on phones.
- **Gradients:** `bg-gradient` in `app/dashboard/page.tsx` and `components/boma-card.tsx`. Replace them with flat or very subtle surfaces.
- **Numbers and phones:** `tabular-nums` and `whitespace-nowrap` are barely used. Phone numbers are shown with `formatPhoneDisplay` in the admin users page only.
- **Wording:** "Cause" (4 places), "Chama" (13) and "New Boma" (1) still appear in the interface.
- **Not audited:** the `lib/` folder and `supabase/` folder were not in the audit. Do not edit them.

## 5. Refinement workflow

Follow these steps in order.

**Step 0: Audit (no edits).** Read `app/globals.css`, `components/ui/icons.tsx`, the page list and the items in section 4. Report: every shared component and its props, anything new you find, a proposed order of work, and the exact files each batch will change. Wait for approval if the change is large.

**Step 1: Tokens.** Add semantic tokens (surface, border, muted text, success, warning, danger, info) to the existing `@theme inline` block in `app/globals.css`. Keep the existing emerald/teal/amber ramps so current pages keep working while they are migrated.

**Step 2: Shared components.** There is no shared Button, Card, Badge, Input, Table or Modal yet. Create them in `components/ui/` and migrate pages to them gradually. Keep `components/ui/icons.tsx` as the only icon source.

**Step 3: Navigation and layout shell.** `components/app-shell.tsx`, `navbar.tsx`, `mobile-nav.tsx`, `desktop-header.tsx` and the admin sidebar, headers and subnav (light theme, text of at least 11px, no clipped labels).

**Step 4: Pages, one batch at a time.** Suggested order: [EDIT as needed] `/` and `/bomas`, `/bomas/[id]`, the contribution modal, `/dashboard`, `/activity`, `/bomas/create`, `/auth/*`, then `/admin/*` and the remaining modals.

**Step 5: Verify before delivering.** Run the type check and `npm run build` and fix errors. Review the diff: only className, JSX structure, copy and style files should differ. If you cannot run the build, say so and list what is unverified.

**Step 6: Report.** List each changed file with a one-line summary, and say what to check on a phone-sized screen and on desktop.

---

## 6. Text rules (strict)

- Phone numbers, emails, amounts, dates, reference IDs, fund codes and status labels **never wrap** and **are never truncated**. Use `whitespace-nowrap` and `tabular-nums`. Reduce the font size with `clamp()` before allowing overflow.
- Do not use `truncate`, `text-ellipsis`, `line-clamp` or `overflow-hidden` with a fixed width on those fields. Remove any that exist.
- Show phone numbers with the existing `formatPhoneDisplay` helper, on one line.
- If a table does not fit, either scroll sideways inside its own `overflow-x-auto` container with a sticky first column, or switch to stacked cards with a small label above each value.
- Fund titles, names and descriptions may wrap to at most two lines on phone, but are never cut off with an ellipsis. Never use `break-all`.
- The page itself never scrolls sideways at any width.
- Small, crisp type: body 13px on phone and 14px on desktop, secondary 12px, **never below 11px** (no `text-[8px]`, `text-[9px]` or `text-[10px]`).

## 7. Design tokens

Components use tokens or the existing remapped `emerald` utilities, never raw hex values.

| Token | Value | Use |
|---|---|---|
| `emerald-600` (brand) | `#0f8579` [EDIT if the brand colour changes] | primary buttons, active nav, links |
| `emerald-700` | `#0d6b62` | hover, pressed, key numbers |
| `emerald-50` | `#effaf8` | very light highlight behind icons |
| `background` | `#f7f7f7` | page background (already in `:root`) |
| `surface` | `#ffffff` | cards, tables, modals |
| `border` | `#e2e8f0` | dividers, input borders |
| `text` | `#14201a` | main text (already `--foreground`) |
| `text-muted` | `#475569` | secondary text (contrast at least 4.5:1) |
| `success` | `#15803d` | contributed, approved, paid out |
| `warning` | `#b45309` | pending, needs review |
| `danger` | `#b91c1c` | failed, rejected |
| `info` | `#1d4ed8` | informational |

**Type:** Geist Sans (already loaded). Sizes 11, 12, 13, 14, 16, 20, 28px. Weights 400, 500, 600.
**Spacing and shape:** multiples of 4px. Radius 8px for inputs and buttons, 12px for cards. One shadow for cards, one for modals.
**Icons:** use only `components/ui/icons.tsx` (inline SVG, 24px viewBox, stroke 1.75, `currentColor`). Add any new icon there in the same style. Do not add an icon library. Add a text label when the meaning is not obvious.
Keep the existing `:focus-visible` outline and the 16px input font size on phones.

## 8. Responsive layout

Phone first, then scale up with Tailwind breakpoints. Verify at 320, 360, 768, 1280 and 1920px.

**Phone:** bottom navigation (11px labels, tap targets of at least 44px, safe-area padding kept); one clear primary action ("Contribute"); tables become stacked cards showing the 3 to 4 key fields; full-width buttons; `inputMode="numeric"` on amount fields; single-column forms; modals become full-screen sheets.

**Desktop:** persistent sidebar for admin; max-width content container; real data tables with sticky header, search, filters and pagination; two-column dashboards; keyboard support (tab order, Esc closes modals, visible focus rings).

**Print:** keep the existing print rules for `#printable-statement`. Do not break them when changing the statement modal.

**Both:** same components and tokens at every size. Money, progress and status sit in the same position and style everywhere.

## 9. Components and states

- **Button:** one primary button per screen. Variants: primary, secondary, ghost, danger. Loading state.
- **Badge:** colours from tokens. Statuses: open, funded, closed, pending, approved, rejected, paid out, failed.
- **Fund card, progress bar, ledger row, contributor row** show amount, progress and status first.
- **Card, Table, Input, Select, Modal, Toast, Skeleton, EmptyState** follow the tokens above.
- Every list, form and action needs loading (skeleton, no layout jump), empty (short message and one clear action), error (plain language and retry), success and disabled states. Test with a long fund title and a large amount.

## 10. Imagery

**Default: no new photos.** Use the existing `boma-cover` component and icons. The project has no stock photos today.

When a task asks for photos:
- Use only Unsplash, Pexels or Pixabay, and read the current licence and API terms first. Never use random search-engine or social media images.
- Never invent image URLs. Use only images you have confirmed exist and load.
- API keys stay in server-side environment variables, never in client code, never in `NEXT_PUBLIC_` variables, never committed.
- If you have no network access or no key, leave a clearly marked placeholder and list the image in `docs/images-needed.md` (where it goes, search terms, aspect ratio, size).
- Prefer Kenyan context (families, markets, community events). Avoid identifiable people unless the licence clearly allows it.
- Brand logos only from the company's official brand page, following its rules. Never redraw a logo.
- No AI-generated images unless the owner asks.
- Use `next/image`, WebP or AVIF, explicit width and height, lazy loading below the fold. Alt text on meaningful images, `alt=""` on decorative ones.
- Record each photo's source, author, URL and licence in `docs/image-credits.md`.

## 11. Accessibility and performance

Visible focus states, a label on every input, semantic HTML, no status shown by colour alone, respect `prefers-reduced-motion` (already in `globals.css`). Contrast at least 4.5:1 for body text. Light bundle, no heavy animation libraries, skeletons instead of spinners for page loads. Test on a throttled slow connection.

---

## 12. Safety rules for an existing app (always apply)

- Change **layout, styling, copy and component structure only**. Do **not** change data fetching, Supabase queries, RPC names, API routes (`app/api/**`), the auth callback, middleware, payment flows (Paystack initialize, verify, webhook, transfer, subaccount), MFA and disbursement logic, ledger calculations, validation, state logic or business rules.
- Keep every existing component's **props, exports and file paths**. If a prop must change, say so and update every caller.
- Keep existing `id`, `name`, `aria-*`, `data-*` attributes, form field names, event handlers and the print IDs.
- Do not rename files, move routes or reorganise folders.
- Do not edit `lib/`, `supabase/`, `package.json`, lock files, `next.config`, environment files or `public/` icons unless asked.
- No new UI libraries or dependencies without approval and a stated reason. Tailwind only.
- Never put secrets in code, in chat or in the repository.
- Change as few files as possible. A page that already works and looks right is left alone.

## 13. Deliverable format

Deliver **one zip** containing **only the files created or changed**.
- Paths inside the zip are relative to the project root (for example `app/dashboard/page.tsx` and `components/ui/button.tsx`), with **no wrapper folder and no `src/` prefix**, so extracting at the project root replaces only those files.
- Exclude unchanged files, `node_modules`, `.next`, `.git`, lock files and environment files.
- Include `CHANGES.md` at the zip root listing each file as "added" or "changed" with a one-line summary.
- One zip per batch.
- If a zip cannot be produced, output each file in full with its exact path and mark which are new and which replace existing files.
- Before extracting a zip, commit or back up the project so any batch can be undone.

## 14. Definition of done (per screen)

- [ ] No sideways page scroll at 320, 360, 768, 1280 and 1920px
- [ ] Phone numbers, emails, amounts, dates and status labels stay on one line and are never cut off
- [ ] No text below 11px
- [ ] No large dark surfaces, and green is used as an accent, not a fill
- [ ] Loading, empty, error and success states exist
- [ ] Only tokens and shared components are used, with no raw colours
- [ ] One primary action per screen, and amounts and progress are the visual focus
- [ ] Wording is plain English, with "Contribute" as the action label
- [ ] Contrast, focus states, labels and keyboard use checked
- [ ] Diff shows no change to data fetching, API routes, payments, roles or validation
- [ ] Type check and build pass
- [ ] Tested on a real phone and on a slow connection

## 15. Pull request checklist

1. Does the diff touch only styling, copy, markup structure and the files listed in `CHANGES.md`?
2. Did any data, payment or business logic change? (It must not.)
3. Are new components added to `components/ui` instead of copied into pages?
4. Are the text rules in section 6 met on every touched page?
5. Are image sources and credits recorded, if any images were added?
