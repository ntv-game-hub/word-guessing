import crypto from "node:crypto";
import { countPlayableCells, sanitizeCode } from "../../shared/gameLogic.js";
import { deleteGame, getGame, hasGameCode, listGames, saveGame } from "./store.js";

const PUNISHMENT_IDS = [
  "sing-song",
  "funny-face",
  "robot-dance",
  "superhero-pose",
  "star-jumps",
  "tongue-twister",
  "silly-walk",
  "balance-pose",
  "compliment",
  "draw-smile"
];

export function now() {
  return new Date().toISOString();
}

export function makeId() {
  return crypto.randomUUID();
}

export function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (hasGameCode(code));
  return code;
}

export function createPunishment(selectedId) {
  const id = PUNISHMENT_IDS.includes(selectedId) ? selectedId : PUNISHMENT_IDS[crypto.randomInt(PUNISHMENT_IDS.length)];
  return {
    id,
    revealedParts: 0,
    totalParts: 10
  };
}

export function publicCells(answerCells, role) {
  return answerCells.map((cell) => ({
    index: cell.index,
    playable: cell.playable,
    value: role === "host" || !cell.playable ? cell.value : null
  }));
}

export function serializeGuess(guess, role) {
  return {
    id: guess.id,
    gameId: guess.gameId,
    playerId: guess.playerId,
    letters: guess.letters,
    review: guess.review,
    status: guess.status,
    createdAt: guess.createdAt,
    reviewedAt: guess.reviewedAt,
    autoReview: role === "host" ? guess.autoReview : undefined
  };
}

export function serializePlayer(player, role) {
  return {
    id: player.id,
    gameId: player.gameId,
    name: player.name,
    attemptsUsed: player.attemptsUsed,
    attemptsLeft: Math.max(0, player.maxAttempts - player.attemptsUsed),
    maxAttempts: player.maxAttempts,
    status: player.status,
    lockedLetters: player.lockedLetters,
    createdAt: player.createdAt,
    guesses: player.guesses.map((guess) => serializeGuess(guess, role))
  };
}

export function serializeGame(game, viewer = {}) {
  const role = viewer.role === "host" ? "host" : "player";
  const state = {
    id: game.id,
    code: game.code,
    answer: role === "host" ? game.answer : undefined,
    answerCells: publicCells(game.answerCells, role),
    hint: game.hint,
    maxAttempts: game.maxAttempts,
    playableCount: countPlayableCells(game.answerCells),
    punishment: game.punishment,
    status: game.status,
    createdAt: game.createdAt,
    viewer: {
      role,
      playerId: viewer.playerId || null
    }
  };

  if (role === "host") {
    state.players = Array.from(game.players.values()).map((player) => serializePlayer(player, role));
    return state;
  }

  const player = viewer.playerId ? game.players.get(viewer.playerId) : null;
  state.player = player ? serializePlayer(player, role) : null;
  return state;
}

export function serializeGameSummary(game) {
  return {
    code: game.code,
    hint: game.hint,
    maxAttempts: game.maxAttempts,
    playableCount: countPlayableCells(game.answerCells),
    playerCount: game.players.size,
    status: game.status,
    createdAt: game.createdAt
  };
}

export function listAvailableGames() {
  return listGames()
    .filter((game) => game.status === "active")
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(serializeGameSummary);
}

export function emitGameList(io) {
  io.emit("games:list", { ok: true, rooms: listAvailableGames() });
}

export function emitHostState(io, game) {
  io.to(`host:${game.id}`).emit("game:state", serializeGame(game, { role: "host" }));
}

export function emitPlayerState(io, game, playerId) {
  io.to(`player:${playerId}`).emit("game:state", serializeGame(game, { role: "player", playerId }));
}

export function emitAllStates(io, game) {
  emitHostState(io, game);
  for (const player of game.players.values()) {
    emitPlayerState(io, game, player.id);
  }
}

export function findGame(rawCode) {
  const code = sanitizeCode(rawCode);
  return getGame(code);
}

export function acknowledge(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

export function sendError(socket, callback, message, code = "BAD_REQUEST") {
  const payload = { ok: false, code, message };
  if (typeof callback === "function") {
    callback(payload);
    return;
  }
  socket.emit("error", payload);
}

export function canReview(game, hostToken) {
  if (!game || !hostToken) {
    return false;
  }
  const expected = Buffer.from(game.hostToken);
  const received = Buffer.from(String(hostToken));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function joinViewerRooms(socket, game, viewer) {
  socket.join(`game:${game.id}`);
  if (viewer.role === "host") {
    socket.join(`host:${game.id}`);
  }
  if (viewer.playerId) {
    socket.join(`player:${viewer.playerId}`);
  }
}
