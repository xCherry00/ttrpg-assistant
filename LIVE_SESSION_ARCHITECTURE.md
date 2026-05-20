# Live Session Workspace Architecture (v0.6.9 Live State + Scene Panel)

## 0. Current Implementation Status (v0.6.9)

- Route implemented: `/campaigns/:campaignId/sessions/:sessionId/live`.
- LiveSessionPage foundation implemented with:
  - header + back link to campaign workspace,
  - party/players list based on campaign characters,
  - role-sensitive MVP split (GM/owner vs member/player),
  - session roll history preview (best-effort read),
  - placeholders for Requested Rolls and Initiative Preview.
- Scene Panel is now connected to persisted `session_live_state`:
  - owner can edit `sceneTitle`, `sceneImageUrl`, `sceneDescription`,
  - member sees read-only scene content.
- Scene image in MVP is URL/data-url only (no upload pipeline).
- `/dice` and `/initiative` remain global tools and are not replaced.
- No WebSockets/SSE in this stage.
- No requested-roll persistence in this stage.

## 1. Screen Responsibility Split

### CampaignDetailPage
- Campaign management and ownership controls.
- Campaign roster and character assignment overview.
- Session planning and session lifecycle entrypoint.
- Materials, notes, and campaign-level settings.
- Primary navigation entry into active session room.

### DicePage
- Global free-form roller available from anywhere in the app.
- Used for quick standalone rolls outside active live session flow.
- Can optionally persist roll into campaign context.
- Does not treat live requested-roll queue as the primary UX flow.

### InitiativePage
- Global GM/off-session tool available from anywhere in the app.
- Useful for in-person sessions or fast combat handling outside live room UX.
- Full persistent encounter tracker: queue, HP/states, participant mutations, encounter controls.
- Not a player-facing active-session screen.

### LiveSessionPage (SessionRoomPage foundation in v0.6.8)
- Main active play screen for currently running campaign session.
- Separate GM and player views over the same live session state.
- Shared scene context (location image + session focus) is currently a placeholder.
- Requested rolls workflow from GM to selected players/characters is currently a placeholder.
- Lightweight initiative awareness for players; full oversight for GM is currently a placeholder.
- Short live roll history focused on session context is foundation-only in v0.6.8.
- Does not require redirecting users to `/dice` or `/initiative` for core session actions.
- Contains embedded dice/requested-roll panel and embedded initiative preview.
- Reuses the same backend data domains (`dice_rolls`, `combat_encounters`, `combat_participants`, HP/state), but presents them in active-session UX context.

## 2. Routing Proposal (Aligned With Current Routing)

### Current routes already present
- `/campaigns/:campaignId`
- `/initiative`
- `/dice`

### Proposed session routes
- `/campaigns/:campaignId/sessions/:sessionId`
  - Session details/control surface (non-live summary and controls).
- `/campaigns/:campaignId/sessions/:sessionId/live`
  - Live session room entrypoint (role-sensitive rendering).

### Notes on compatibility
- Keep `/campaigns/:campaignId` as primary campaign workspace.
- Keep `/initiative` and `/dice` as independent specialist tools.
- Do not remove existing routes; extend navigation progressively.
- `/dice` and `/initiative` remain global tools.
- Campaign dashboard must not duplicate global tools links from sidebar.
- `/campaigns/:campaignId/sessions/:sessionId/live` is the primary active-session workspace.
- LiveSessionPage may provide links to full tools, but base rolls, requested rolls, and initiative preview must work inline on the same page.

## 2a. Embedded Session Tools

### Embedded Dice / Requested Rolls Panel
- GM can request roll from selected player/character.
- Player executes requested roll without leaving LiveSessionPage.
- Result is stored in existing `dice_rolls`.
- GM sees DC and result comparison.
- Player visibility remains policy-based (only what should be visible).

### Embedded Initiative Preview
- Data source: `combat_encounters` and `combat_participants`.
- GM sees full queue and encounter context.
- Player sees current participant plus next 1/2 participants.
- Player mode is read-only.
- No forced navigation to `/initiative` for basic live-session awareness.

### Embedded Scene Panel
- GM sets/updates active scene image.
- Players see the same active scene image on the same live page.

## 3. LiveSessionPage: GM View

- Player/character roster for the active session.
- Full HP/conditions visibility and quick state checks.
- Full initiative order preview (or embedded compact tracker with jump-to-initiative option).
- Scene image panel (current location/scene context).
- Requested rolls control panel:
  - target selection,
  - roll intent metadata,
  - hidden/public DC behavior.
- Session roll history panel (recent requested and free rolls).
- Encounter control shortcuts (select active encounter, finish/advance context actions).
- Hidden DC support:
  - GM can keep DC private while still evaluating outcome.
- Private GM notes area (visible only to GM).

## 4. LiveSessionPage: Player View

- Own character focus card (identity + key state).
- Team avatar strip/party visibility.
- HP/conditions in player-appropriate range (no GM-only internals).
- Shared scene image panel.
- Active requested-roll tasks assigned to the player.
- Explicit action button to execute required roll.
- Initiative awareness limited to:
  - current turn owner,
  - next 1-2 participants.
- Roll history scope limited to:
  - own rolls,
  - public session rolls.

## 5. Requested Rolls Model (Behavior)

1. GM selects target player and/or character.
2. GM chooses roll type/category.
3. GM sets label (example: `Wiedza Tajemna`).
4. GM enters DC value.
5. GM toggles DC visibility (`hidden` vs `visible`).
6. GM may set optional skill/ability context.
7. Player executes roll from LiveSessionPage.
8. System persists result in existing `dice_rolls` history.
9. GM sees evaluation vs DC (raw + success/failure interpretation).
10. Player sees roll result and sees success/failure only according to visibility policy.

## 6. Scene Image Model (Behavior)

- GM sets the current scene/location image.
- All players in the live room see the same active scene image.
- MVP transport can be URL-based scene image reference.
- Future phase can add file upload/storage pipeline.

## 7. Live Initiative Preview Model

- Source of truth remains existing `combat_encounters` and participants data.
- GM view shows full initiative queue and encounter status context.
- Player view is read-only and trimmed (current + next 1/2 turns).
- Player side does not mutate initiative state in MVP.

## 8. Missing Backend Data (Future, No Migration In This Stage)

Potential future data units/tables:
- `session_live_state`
  - active scene/session mode metadata,
  - current encounter linkage,
  - refresh/version marker.
- `requested_rolls`
  - target, metadata, dc policy, status lifecycle.
- `session_scene`
  - active scene image metadata (URL first, upload later).

Optional later additions:
- lightweight `session_events` feed for efficient UI refresh.

No schema migration is introduced in v0.6.6; this section is design-only.

## 9. Recommended Future Implementation Order

1. Refactor CampaignDetailPage / Campaign Panel.
2. LiveSessionPage foundation.
3. Session live state + embedded scene panel.
4. Requested rolls embedded panel.
5. Embedded live initiative preview.
6. DicePage persistent campaign mode as independent global tool.
7. Optional links from LiveSessionPage to full DicePage/InitiativePage tools.

## 10. MVP Constraints

- No WebSocket requirement for first MVP.
- Polling/manual refresh is acceptable initially.
- No image upload pipeline at start (URL only for scene image).
- No full D&D/CoC automation for rules outcomes.
- No replacement of InitiativePage with LiveSessionPage in first rollout.
- DicePage and InitiativePage are not replaced by LiveSessionPage.
- LiveSessionPage does not require opening separate pages for basic session rolls and initiative awareness.
- Global tools and embedded session panels may share backend data, but they have different UX context.

## 11. Campaign System Compatibility

- Campaign has `systemCode` as the source of truth for session gameplay context.
- Assigned characters must match the campaign `systemCode` (cross-system assignment is blocked).
- Requested rolls will use campaign `systemCode` to select roll behavior.
- D&D-style requested rolls can use d20 + ability/skill modifiers.
- CoC-style requested rolls require separate percentile logic.
- Mixed-system campaigns are out of MVP scope.

## 12. Campaign Dashboard Model (Planned)

- `CampaignDetailPage` acts as a mini campaign dashboard.
- Planned dashboard modules:
  - campaign overview,
  - upcoming session,
  - attendance/availability voting,
  - players/members panel,
  - assigned characters panel,
  - player notes,
  - materials,
  - active session entrypoint.
- Active session entrypoint is session-contextual (upcoming/active session panels), not a global tools panel.
- Global `/dice` and `/initiative` access remains in sidebar navigation only.
- Notes visibility plan:
  - players can have private notes,
  - GM can view player notes,
  - players cannot view other players' private notes.
- Attendance voting plan statuses:
  - `available`,
  - `unavailable`,
  - `maybe`,
  - `no response`.
- Active session entry appears when GM starts a session.
- Attendance voting is now implemented on Campaign Dashboard for campaign sessions (v0.7.2).
- Active session/live room remains a separate stage and route.
- Player campaign notes are now implemented on Campaign Dashboard (v0.7.3).
- Notes are campaign-level in current MVP, not session-specific.
- Session-specific notes remain a future stage.
- Live mechanics lifecycle gate (v0.7.4):
  - `PLANNED`: read-only / blocked for requested rolls and embedded initiative preview.
  - `IN_PROGRESS`: active lifecycle state for live mechanics.
  - `FINISHED`: read-only / blocked for live mechanics.
- Requested rolls are now implemented as embedded LiveSessionPage feature (v0.7.5).
- `ALL` targeting creates multiple requested roll records (one per target character).
- Character/system-specific modifiers are MVP/fallback based (future stage for deeper CoC/system rollers).

