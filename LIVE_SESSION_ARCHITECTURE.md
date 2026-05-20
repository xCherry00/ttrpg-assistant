# Live Session Workspace Architecture (Draft v0.6.7)

## Goal
Prepare a clear MVP path for a future `LiveSessionPage` without changing current backend contracts for campaigns, dice, and initiative.

## Responsibility Split (Pages)
- `CampaignDetailsPage`: long-term campaign management (sessions, materials, notes, members).
- `DicePage`: generic/global dice utility (not session-context-first).
- `InitiativePage`: persistent encounter tracker (encounters, turns, participant state, encounter-scoped roll history).
- `LiveSessionPage` (future): one runtime GM workspace combining scene context, requested rolls, quick initiative visibility, and session flow actions.

## Routing Proposal
- Keep existing:
  - `/campaigns/:campaignId`
  - `/dice`
  - `/initiative`
- Add future:
  - `/campaigns/:campaignId/live`
  - optional nested tabs later: `/campaigns/:campaignId/live/:tab`

## Live Views (MVP)
- GM view:
  - session stage controls,
  - quick encounter picker/status,
  - request-roll broadcast form,
  - scene image + short scene note,
  - compact initiative preview (read-mostly, with shortcut to full initiative page).
- Player view:
  - currently active requested rolls,
  - scene image and scene note,
  - own quick roll submission flow,
  - simplified initiative snapshot (turn owner + top order rows).

## Requested Rolls Model (Future Backend)
- Proposed table: `session_requested_rolls`
- Suggested fields:
  - `id`, `campaign_id`, `session_id`,
  - `requested_by_user_id`, `target_scope` (`ALL`, `USER`, `CHARACTER`),
  - `target_user_id` nullable, `target_character_id` nullable,
  - `roll_expression`, `roll_type`, `label`, `note`,
  - `status` (`OPEN`, `FULFILLED`, `CANCELLED`, `EXPIRED`),
  - `expires_at` nullable, `created_at`, `closed_at`.
- Fulfillment can reference existing `dice_rolls` row id.

## Scene Image Model (Future Backend)
- Proposed table: `session_scene_assets`
- Suggested fields:
  - `id`, `campaign_id`, `session_id`,
  - `image_url` or storage pointer,
  - `caption`, `is_active`,
  - `created_by_user_id`, `created_at`, `updated_at`.
- MVP rule: one active scene image at a time per session.

## Live Initiative Preview Model
- Reuse existing initiative backend read endpoints.
- `LiveSessionPage` should consume current active encounter summary only:
  - encounter id/name/status/round/current participant,
  - top N ordered participants with `isDefeated` marker.
- Full mutations remain in `InitiativePage` for MVP.

## Missing Backend Data for Live Session MVP
- Session runtime state marker (e.g. `session_runtime_state`: `PREP`, `LIVE`, `PAUSED`, `WRAPUP`).
- Requested roll queue (`session_requested_rolls`).
- Scene asset binding (`session_scene_assets`).
- Optional lightweight event feed table for live UX refresh.

No migrations are introduced in v0.6.7; this is an architecture preparation document only.

## Proposed Implementation Sequence
1. Add backend read models and minimal tables for requested rolls + scene assets.
2. Add write endpoints for GM (create/cancel requests, set active scene).
3. Add player-facing read endpoint for pending requested rolls.
4. Implement `LiveSessionPage` with GM layout first.
5. Add player-focused live view mode.
6. Add lightweight polling or SSE/WebSocket as a later optimization.

## MVP Constraints (Explicit)
- No replacement of current `InitiativePage`.
- No combat automation rules (D&D/CoC logic remains manual).
- No redesign of existing campaign or initiative workflows in this stage.
- No auth model migration in this stage.
