# Realtime Events

Socket.IO events are implemented in `server/socketHandlers.js`. Callback responses use a simple `{ ok, ... }` shape.

## Client To Server

| Event | Payload | Ack | Notes |
| --- | --- | --- | --- |
| `game:create` | `{ answer, hint, maxAttempts, punishmentId }` | `{ ok, state, hostToken }` | Creates a room, assigns host token, stores the game in memory, and emits `game:created`. |
| `games:list` | `{}` | `{ ok, rooms }` | Returns the active room list for the join screen. |
| `game:finish` | `{ code, hostToken }` | `{ ok }` | Host-only. Marks the game finished and updates the room list. |
| `game:get` | `{ role, code, hostToken? playerId? }` | `{ ok, state, playerId? }` | Restores a host or player session. |
| `game:join` | `{ name, code }` | `{ ok, state, playerId }` | Adds a new player to an active room. |
| `guess:submit` | `{ code, playerId, letters }` | `{ ok, state }` | Creates a pending guess for host review. |
| `guess:review` | `{ code, hostToken, guessId, review }` | `{ ok, state }` | Host-only. Applies the review, updates locks, and may reveal a punishment part. |
| `player:leave` | `{ code, playerId }` | `{ ok }` | Leaves the player view state on the server. |

## Server To Client

| Event | Payload | Notes |
| --- | --- | --- |
| `game:created` | `{ ok, state, hostToken }` | Convenience event sent to the creator in addition to the callback. |
| `game:state` | `GameState` | Canonical room state for host or player clients. |
| `games:list` | `{ ok, rooms }` | Active rooms broadcast to join screens. |
| `guess:submitted` | `Guess` | Sent to the host when a player submits a guess. |
| `guess:reviewed` | `Guess` | Sent to the player whose guess was reviewed. |
| `player:joined` | `Player` | Sent to the host when a player joins. |
| `player:updated` | `Player` | Sent to the host after review updates a player. |

## State Flow

1. Client connects and requests `games:list` or restores a saved session.
2. Host creates a game with `game:create`.
3. Player joins with `game:join`, or restores with `game:get`.
4. Player submits a guess with `guess:submit`.
5. Host reviews with `guess:review`.
6. Server emits the canonical `game:state` after state-changing operations.

## Validation

- Empty answers and invalid attempt counts are rejected at create time.
- Empty player names are rejected at join time.
- Guess submission requires all playable letters to be filled.
- Review submission requires every playable cell to be marked correct or wrong.
- Host-only actions are gated by `hostToken`.
