export type Review = "correct" | "wrong" | "pending";
export type PlayerStatus = "playing" | "waiting_review" | "won" | "lost";
export type Screen = "role" | "create" | "join" | "host" | "player";
export type Filter = "all" | "pending" | "won" | "lost";

export type AnswerCell = {
  index: number;
  playable: boolean;
  value: string | null;
};

export type Guess = {
  id: string;
  gameId: string;
  playerId: string;
  letters: string[];
  review: Review[];
  autoReview?: Review[];
  status: "pending" | "reviewed";
  createdAt: string;
  reviewedAt: string | null;
};

export type Player = {
  id: string;
  gameId: string;
  name: string;
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  status: PlayerStatus;
  lockedLetters: Array<string | null>;
  createdAt: string;
  guesses: Guess[];
};

export type PunishmentState = {
  id: string;
  revealedParts: number;
  totalParts: number;
};

export type PunishmentDesign = {
  id: string;
  title: string;
  action: string;
  badge: string;
  theme: string;
};

export type GameSummary = {
  code: string;
  hint: string;
  maxAttempts: number;
  playableCount: number;
  playerCount: number;
  status: "waiting" | "active" | "finished";
  createdAt: string;
};

export type GameState = {
  id: string;
  code: string;
  answer?: string;
  answerCells: AnswerCell[];
  hint: string;
  maxAttempts: number;
  playableCount: number;
  punishment: PunishmentState;
  status: "waiting" | "active" | "finished";
  createdAt: string;
  viewer: {
    role: "host" | "player";
    playerId: string | null;
  };
  players?: Player[];
  player?: Player | null;
};

export type SocketResponse = {
  ok: boolean;
  message?: string;
  state?: GameState;
  hostToken?: string;
  playerId?: string;
  rooms?: GameSummary[];
};
