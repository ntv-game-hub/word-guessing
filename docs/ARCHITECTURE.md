# Architecture

Word Guessing Game is a single-page React app backed by a long-running Express + Socket.IO server. The shared rule module stays pure so both client and server can depend on the same text-processing behavior.

## Runtime Model

- `server/app.js` serves the production bundle from `dist/` and registers Socket.IO handlers.
- Room/game state is in memory. Restarting the server clears all active games.
- `localStorage` stores player display name and session references for reconnect.
- Host permission is guarded by a temporary `hostToken`.

## Source Layout

```text
client/
  src/
    AppShell.tsx        Realtime/session orchestration and top-level routing
    components/         Small reusable UI pieces
    screens/            Role, create, join, host, and player screens
    constants.ts        Storage keys and presentation constants
    types.ts            Client-facing domain types
    utils/              URL/session helpers and word-guessing utilities
server/
  app.js                Express + Socket.IO bootstrap
  config.js             Environment and dist path configuration
  socketHandlers.js     Socket.IO event handlers
  lib/
    runtime.js          Serialization, broadcast, ids, and error helpers
    store.js            In-memory game store
shared/
  gameLogic.js          Pure grapheme, review, and lock logic
tests/
  gameLogic.test.js     Shared logic tests
```

## Client Boundaries

`client/src/AppShell.tsx` is a container only. It owns the socket connection, reconnect flow, screen state, and session restore. It should not contain screen markup.

Screen composition belongs in `client/src/screens`:

- `RoleScreen` chooses the entry mode.
- `CreateGameScreen` submits the host setup form.
- `JoinGameScreen` handles direct code entry and room list joining.
- `HostDashboard` shows review controls and host-level room state.
- `PlayerGameScreen` renders the letter board and per-player history.

Reusable UI belongs in `client/src/components`:

- `Decorations`, `Confetti`
- `WizardHeader`
- `InfoPill`, `CompactStat`
- `PunishmentReveal`
- `ReviewGrid`
- `HistoryPanel`

Shared browser helpers belong in `client/src/utils`.

## Server Boundaries

`server/app.js` should stay thin. It should only create Express, create Socket.IO, register handlers, serve the static bundle, and start listening.

`server/socketHandlers.js` owns all realtime behavior:

- create/join/get/finish flow
- submit/review flow
- room list updates
- join-room membership

`server/lib/store.js` is the only module that should touch the in-memory maps.

`server/lib/runtime.js` owns serialization and broadcast helpers. Keep all payload shaping here so socket handlers stay readable.

## Shared Rules

`shared/gameLogic.js` must remain pure and side-effect free. It handles:

- Vietnamese grapheme segmentation
- sanitizing answer and player input
- static character handling
- auto review
- applying review results
- win detection

Any rule change should start here and be covered by `tests/gameLogic.test.js`.

## Naming Conventions

- Screens and components use PascalCase file names.
- Utility files use descriptive camelCase names.
- Socket.IO events use `domain:action`, such as `game:create` and `guess:review`.
- Storage keys use the `word-guessing-` prefix.

## Extension Guide

- Add new UI in a screen/component file before wiring it into `AppShell.tsx`.
- Add new realtime events in `socketHandlers.js`, then update the client screens.
- Add new room metadata in `server/lib/runtime.js` and the client `types.ts`.
- Keep server-side payloads serializable. Avoid passing class instances or functions through Socket.IO state.
