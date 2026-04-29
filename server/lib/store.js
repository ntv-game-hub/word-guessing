const gamesByCode = new Map();
const gamesById = new Map();

export function saveGame(game) {
  gamesByCode.set(game.code, game);
  gamesById.set(game.id, game);
}

export function getGame(code) {
  return gamesByCode.get(code);
}

export function getGameById(id) {
  return gamesById.get(id);
}

export function listGames() {
  return Array.from(gamesByCode.values());
}

export function hasGameCode(code) {
  return gamesByCode.has(code);
}

export function deleteGame(code) {
  const game = gamesByCode.get(code);
  if (game) {
    gamesById.delete(game.id);
  }
  gamesByCode.delete(code);
}
