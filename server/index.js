import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  applyReview,
  autoReviewGuess,
  countPlayableCells,
  createAnswerCells,
  createInitialLockedLetters,
  fillStaticLetters,
  hasWon,
  isGuessComplete,
  normalizeText,
  REVIEW_CORRECT,
  REVIEW_PENDING,
  REVIEW_WRONG,
  sanitizeCode,
  sanitizeName
} from "../shared/gameLogic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 6670);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ["websocket"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gamesByCode = new Map();
const gamesById = new Map();
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

function now() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (gamesByCode.has(code));
  return code;
}

function createPunishment(selectedId) {
  const id = PUNISHMENT_IDS.includes(selectedId) ? selectedId : PUNISHMENT_IDS[crypto.randomInt(PUNISHMENT_IDS.length)];
  return {
    id,
    revealedParts: 0,
    totalParts: 10
  };
}

function publicCells(answerCells, role) {
  return answerCells.map((cell) => ({
    index: cell.index,
    playable: cell.playable,
    value: role === "host" || !cell.playable ? cell.value : null
  }));
}

function serializeGuess(guess, role) {
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

function serializePlayer(player, role) {
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

function serializeGame(game, viewer = {}) {
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

function serializeGameSummary(game) {
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

function listAvailableGames() {
  return Array.from(gamesByCode.values())
    .filter((game) => game.status === "active")
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(serializeGameSummary);
}

function emitGameList() {
  io.emit("games:list", { ok: true, rooms: listAvailableGames() });
}

function emitHostState(game) {
  io.to(`host:${game.id}`).emit("game:state", serializeGame(game, { role: "host" }));
}

function emitPlayerState(game, playerId) {
  io.to(`player:${playerId}`).emit("game:state", serializeGame(game, { role: "player", playerId }));
}

function emitAllStates(game) {
  emitHostState(game);
  for (const player of game.players.values()) {
    emitPlayerState(game, player.id);
  }
}

function findGame(rawCode) {
  const code = sanitizeCode(rawCode);
  return gamesByCode.get(code);
}

function acknowledge(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

function sendError(socket, callback, message, code = "BAD_REQUEST") {
  const payload = { ok: false, code, message };
  if (typeof callback === "function") {
    callback(payload);
    return;
  }
  socket.emit("error", payload);
}

function canReview(game, hostToken) {
  if (!game || !hostToken) {
    return false;
  }
  const expected = Buffer.from(game.hostToken);
  const received = Buffer.from(String(hostToken));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function joinViewerRooms(socket, game, viewer) {
  socket.join(`game:${game.id}`);
  if (viewer.role === "host") {
    socket.join(`host:${game.id}`);
  }
  if (viewer.playerId) {
    socket.join(`player:${viewer.playerId}`);
  }
}

io.on("connection", (socket) => {
  socket.on("game:create", (payload = {}, callback) => {
    const answer = normalizeText(payload.answer).trim();
    const hint = normalizeText(payload.hint).trim();
    const maxAttempts = Number(payload.maxAttempts || 20);
    const punishmentId = normalizeText(payload.punishmentId).trim();

    if (!answer) {
      sendError(socket, callback, "Vui lòng nhập từ cần đoán.", "ANSWER_REQUIRED");
      return;
    }
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
      sendError(socket, callback, "Số lượt đoán tối đa phải từ 1 trở lên.", "MAX_ATTEMPTS_INVALID");
      return;
    }

    const answerCells = createAnswerCells(answer);
    if (countPlayableCells(answerCells) === 0) {
      sendError(socket, callback, "Từ cần đoán cần có ít nhất một chữ cái hoặc chữ số.", "ANSWER_INVALID");
      return;
    }

    const game = {
      id: makeId(),
      code: makeCode(),
      answer,
      answerCells,
      hint,
      maxAttempts: Math.floor(maxAttempts),
      punishment: createPunishment(punishmentId),
      hostToken: crypto.randomBytes(24).toString("hex"),
      status: "active",
      createdAt: now(),
      players: new Map()
    };

    gamesByCode.set(game.code, game);
    gamesById.set(game.id, game);
    joinViewerRooms(socket, game, { role: "host" });

    const state = serializeGame(game, { role: "host" });
    const response = { ok: true, state, hostToken: game.hostToken };
    socket.emit("game:created", response);
    acknowledge(callback, response);
    emitGameList();
  });

  socket.on("games:list", (_payload = {}, callback) => {
    acknowledge(callback, { ok: true, rooms: listAvailableGames() });
  });

  socket.on("game:finish", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game || !canReview(game, payload.hostToken)) {
      sendError(socket, callback, "Bạn không có quyền kết thúc phòng này.", "HOST_TOKEN_INVALID");
      return;
    }
    game.status = "finished";
    emitAllStates(game);
    emitGameList();
    acknowledge(callback, { ok: true });
  });

  socket.on("game:get", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game) {
      sendError(socket, callback, "Không tìm thấy phòng chơi.", "GAME_NOT_FOUND");
      return;
    }

    if (payload.role === "host") {
      if (!canReview(game, payload.hostToken)) {
        sendError(socket, callback, "Mã chủ game không hợp lệ.", "HOST_TOKEN_INVALID");
        return;
      }
      joinViewerRooms(socket, game, { role: "host" });
      const state = serializeGame(game, { role: "host" });
      acknowledge(callback, { ok: true, state });
      socket.emit("game:state", state);
      return;
    }

    const player = game.players.get(String(payload.playerId || ""));
    if (!player) {
      sendError(socket, callback, "Không tìm thấy người chơi trong phòng này.", "PLAYER_NOT_FOUND");
      return;
    }
    joinViewerRooms(socket, game, { role: "player", playerId: player.id });
    const state = serializeGame(game, { role: "player", playerId: player.id });
    acknowledge(callback, { ok: true, state, playerId: player.id });
    socket.emit("game:state", state);
  });

  socket.on("game:join", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const name = sanitizeName(payload.name);

    if (!game) {
      sendError(socket, callback, "Mã phòng không tồn tại.", "GAME_NOT_FOUND");
      return;
    }
    if (game.status !== "active") {
      sendError(socket, callback, "Phòng này đã kết thúc. Vui lòng chọn phòng khác.", "GAME_FINISHED");
      return;
    }
    if (!name) {
      sendError(socket, callback, "Vui lòng nhập tên hiển thị.", "NAME_REQUIRED");
      return;
    }

    const player = {
      id: makeId(),
      gameId: game.id,
      name,
      attemptsUsed: 0,
      maxAttempts: game.maxAttempts,
      status: "playing",
      lockedLetters: createInitialLockedLetters(game.answerCells),
      createdAt: now(),
      guesses: []
    };

    game.players.set(player.id, player);
    joinViewerRooms(socket, game, { role: "player", playerId: player.id });

    const state = serializeGame(game, { role: "player", playerId: player.id });
    const response = { ok: true, state, playerId: player.id };
    socket.emit("game:state", state);
    socket.to(`host:${game.id}`).emit("player:joined", serializePlayer(player, "host"));
    acknowledge(callback, response);
    emitHostState(game);
    emitGameList();
  });

  socket.on("guess:submit", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const player = game?.players.get(String(payload.playerId || ""));

    if (!game || !player) {
      sendError(socket, callback, "Không tìm thấy người chơi hoặc phòng chơi.", "PLAYER_NOT_FOUND");
      return;
    }
    if (game.status !== "active") {
      sendError(socket, callback, "Phòng này đã kết thúc. Vui lòng tham gia phòng mới.", "GAME_FINISHED");
      return;
    }
    if (player.status === "waiting_review") {
      sendError(socket, callback, "Bạn đang có câu trả lời chờ chủ game chấm.", "GUESS_PENDING");
      return;
    }
    if (player.status === "won") {
      sendError(socket, callback, "Bạn đã đoán đúng rồi.", "PLAYER_WON");
      return;
    }
    if (player.status === "lost" || player.attemptsUsed >= player.maxAttempts) {
      player.status = "lost";
      emitPlayerState(game, player.id);
      sendError(socket, callback, "Bạn đã hết lượt đoán.", "PLAYER_LOST");
      return;
    }

    const letters = fillStaticLetters(game.answerCells, payload.letters || []);
    if (!isGuessComplete(game.answerCells, letters)) {
      sendError(socket, callback, "Vui lòng nhập đủ các ô chữ cần đoán.", "GUESS_INCOMPLETE");
      return;
    }

    player.attemptsUsed += 1;
    player.status = "waiting_review";
    const guess = {
      id: makeId(),
      gameId: game.id,
      playerId: player.id,
      letters,
      review: game.answerCells.map((cell) => (cell.playable ? REVIEW_PENDING : REVIEW_CORRECT)),
      autoReview: autoReviewGuess(game.answerCells, letters),
      status: "pending",
      createdAt: now(),
      reviewedAt: null
    };
    player.guesses.push(guess);

    socket.to(`host:${game.id}`).emit("guess:submitted", serializeGuess(guess, "host"));
    emitHostState(game);
    emitPlayerState(game, player.id);
    acknowledge(callback, { ok: true, state: serializeGame(game, { role: "player", playerId: player.id }) });
  });

  socket.on("guess:review", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game || !canReview(game, payload.hostToken)) {
      sendError(socket, callback, "Bạn không có quyền chấm phòng này.", "HOST_TOKEN_INVALID");
      return;
    }

    let targetPlayer = null;
    let targetGuess = null;
    for (const player of game.players.values()) {
      const guess = player.guesses.find((item) => item.id === payload.guessId);
      if (guess) {
        targetPlayer = player;
        targetGuess = guess;
        break;
      }
    }

    if (!targetPlayer || !targetGuess || targetGuess.status !== "pending") {
      sendError(socket, callback, "Không tìm thấy câu trả lời đang chờ chấm.", "GUESS_NOT_FOUND");
      return;
    }

    const review = Array.isArray(payload.review) ? payload.review : [];
    const normalizedReview = game.answerCells.map((cell, index) => {
      if (!cell.playable) {
        return REVIEW_CORRECT;
      }
      return review[index] === REVIEW_CORRECT ? REVIEW_CORRECT : review[index] === REVIEW_WRONG ? REVIEW_WRONG : REVIEW_PENDING;
    });

    if (normalizedReview.some((item) => item === REVIEW_PENDING)) {
      sendError(socket, callback, "Vui lòng chấm tất cả ô chữ trước khi gửi.", "REVIEW_INCOMPLETE");
      return;
    }

    const hasWrongLetter = normalizedReview.some((item, index) => game.answerCells[index].playable && item === REVIEW_WRONG);
    if (hasWrongLetter) {
      game.punishment.revealedParts = Math.min(game.punishment.totalParts, game.punishment.revealedParts + 1);
    }

    targetGuess.review = normalizedReview;
    targetGuess.status = "reviewed";
    targetGuess.reviewedAt = now();
    targetPlayer.lockedLetters = applyReview(
      game.answerCells,
      targetPlayer.lockedLetters,
      targetGuess.letters,
      normalizedReview
    );
    targetPlayer.status = hasWon(game.answerCells, targetPlayer.lockedLetters)
      ? "won"
      : targetPlayer.attemptsUsed >= targetPlayer.maxAttempts
        ? "lost"
        : "playing";

    io.to(`player:${targetPlayer.id}`).emit("guess:reviewed", serializeGuess(targetGuess, "player"));
    io.to(`host:${game.id}`).emit("player:updated", serializePlayer(targetPlayer, "host"));
    emitAllStates(game);
    acknowledge(callback, { ok: true, state: serializeGame(game, { role: "host" }) });
  });

  socket.on("player:leave", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const player = game?.players.get(String(payload.playerId || ""));
    if (game && player) {
      player.status = player.status === "won" || player.status === "lost" ? player.status : "playing";
      socket.leave(`player:${player.id}`);
      emitHostState(game);
    }
    acknowledge(callback, { ok: true });
  });
});

app.use(express.static(distDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Word Guessing Game listening at http://${HOST}:${PORT}`);
});
