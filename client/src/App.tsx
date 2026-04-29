/*
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Clock3,
  Crown,
  Home,
  Link as LinkIcon,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Theater,
  Trophy,
  Users,
  Wand2,
  X
} from "lucide-react";
import { io, Socket } from "socket.io-client";

type Review = "correct" | "wrong" | "pending";
type PlayerStatus = "playing" | "waiting_review" | "won" | "lost";
type Screen = "role" | "create" | "join" | "host" | "player";
type Filter = "all" | "pending" | "won" | "lost";

type AnswerCell = {
  index: number;
  playable: boolean;
  value: string | null;
};

type Guess = {
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

type Player = {
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

type PunishmentState = {
  id: string;
  revealedParts: number;
  totalParts: number;
};

type PunishmentDesign = {
  id: string;
  title: string;
  action: string;
  badge: string;
  theme: string;
};

type GameSummary = {
  code: string;
  hint: string;
  maxAttempts: number;
  playableCount: number;
  playerCount: number;
  status: "waiting" | "active" | "finished";
  createdAt: string;
};

type GameState = {
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

type SocketResponse = {
  ok: boolean;
  message?: string;
  state?: GameState;
  hostToken?: string;
  playerId?: string;
  rooms?: GameSummary[];
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const HOST_SESSION = "word-guessing-host";
const PLAYER_SESSION = "word-guessing-player";
const PLAYER_NAME = "word-guessing-player-name";

const statusCopy: Record<PlayerStatus, string> = {
  playing: "Đang chơi",
  waiting_review: "Chờ chấm",
  won: "Chiến thắng",
  lost: "Hết lượt"
};

const punishmentDesigns: PunishmentDesign[] = [
  {
    id: "sing-song",
    title: "Sân khấu tí hon",
    action: "Hát 1 bài hoặc 1 đoạn ngắn",
    badge: "LA",
    theme: "song"
  },
  {
    id: "funny-face",
    title: "Gương mặt kỳ cục",
    action: "Nhăn mặt, nhe răng trong 5 giây",
    badge: "HA",
    theme: "face"
  },
  {
    id: "robot-dance",
    title: "Vũ điệu robot",
    action: "Nhảy robot trong 10 giây",
    badge: "BOT",
    theme: "robot"
  },
  {
    id: "superhero-pose",
    title: "Siêu anh hùng",
    action: "Tạo dáng anh hùng 5 giây",
    badge: "POW",
    theme: "hero"
  },
  {
    id: "star-jumps",
    title: "Ngôi sao bật nhảy",
    action: "Bật nhảy 10 cái thật vui",
    badge: "10",
    theme: "star"
  },
  {
    id: "tongue-twister",
    title: "Thử thách líu lưỡi",
    action: "Đọc nhanh một câu khó",
    badge: "WOW",
    theme: "twister"
  },
  {
    id: "silly-walk",
    title: "Bước đi kỳ quặc",
    action: "Đi kiểu vui trong 5 bước",
    badge: "GO",
    theme: "walk"
  },
  {
    id: "balance-pose",
    title: "Giữ thăng bằng",
    action: "Đứng một chân trong 5 giây",
    badge: "1",
    theme: "balance"
  },
  {
    id: "compliment",
    title: "Lời khen lấp lánh",
    action: "Khen một bạn trong phòng",
    badge: "OK",
    theme: "kind"
  },
  {
    id: "draw-smile",
    title: "Họa sĩ nụ cười",
    action: "Vẽ mặt cười trong 10 giây",
    badge: "ART",
    theme: "art"
  },
  {
    id: "victory-spin",
    title: "Vòng xoay vui vẻ",
    action: "Xoay một vòng và chào cả lớp",
    badge: "GO",
    theme: "spin"
  }
];

function segmentText(value: string) {
  const text = value.normalize("NFC");
  const maybeIntl = Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: "grapheme" }) => {
      segment: (input: string) => Iterable<{ segment: string }>;
    };
  };

  if (maybeIntl.Segmenter) {
    return Array.from(new maybeIntl.Segmenter("vi", { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function isPlayableInput(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}

function tidyCode(value: string) {
  return value.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function upperLetter(value: string) {
  return value.normalize("NFC").toLocaleUpperCase("vi-VN");
}

function classForReview(review?: Review) {
  if (review === "correct") return "is-correct";
  if (review === "wrong") return "is-wrong";
  return "is-pending";
}

function getPunishmentDesign(id: string) {
  return punishmentDesigns.find((item) => item.id === id) || punishmentDesigns[0];
}

function getLatestGuessTime(player: Player) {
  const latestGuess = player.guesses[player.guesses.length - 1];
  return latestGuess ? new Date(latestGuess.createdAt).getTime() : new Date(player.createdAt).getTime();
}

function App() {
  const socket = useMemo<Socket>(
    () =>
      io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000
      }),
    []
  );
  const [screen, setScreen] = useState<Screen>("role");
  const [game, setGame] = useState<GameState | null>(null);
  const [hostToken, setHostToken] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [restoreTried, setRestoreTried] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      setRestoreTried(false);
      setConnected(true);
    };
    const onDisconnect = () => setConnected(false);
    const onState = (state: GameState) => {
      setGame(state);
      if (state.viewer.role === "host") {
        setScreen("host");
      } else {
        setPlayerId(state.viewer.playerId || "");
        setScreen("player");
      }
    };
    const onError = (payload: { message?: string }) => {
      setNotice(payload.message || "Có lỗi xảy ra. Thử lại nhé!");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:state", onState);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:state", onState);
      socket.off("error", onError);
    };
  }, [socket]);

  useEffect(() => {
    if (!connected || restoreTried) return;
    setRestoreTried(true);

    const savedHost = readSession<{ code: string; hostToken: string }>(HOST_SESSION);
    const savedPlayer = readSession<{ code: string; playerId: string }>(PLAYER_SESSION);
    const queryCode = tidyCode(new URLSearchParams(window.location.search).get("code") || "");

    if (savedHost?.code && savedHost.hostToken) {
      socket.emit("game:get", { role: "host", code: savedHost.code, hostToken: savedHost.hostToken }, (res: SocketResponse) => {
        if (res.ok && res.state) {
          setHostToken(savedHost.hostToken);
          setGame(res.state);
          setScreen("host");
          return;
        }
        localStorage.removeItem(HOST_SESSION);
        setHostToken("");
        setGame(null);
        setScreen(queryCode ? "join" : "role");
      });
      return;
    }

    if (savedPlayer?.code && savedPlayer.playerId) {
      socket.emit("game:get", { role: "player", code: savedPlayer.code, playerId: savedPlayer.playerId }, (res: SocketResponse) => {
        if (res.ok && res.state && res.playerId) {
          setPlayerId(res.playerId);
          setGame(res.state);
          setScreen("player");
          return;
        }
        localStorage.removeItem(PLAYER_SESSION);
        setPlayerId("");
        setGame(null);
        setScreen(queryCode ? "join" : "role");
      });
      return;
    }

    if (queryCode) {
      setScreen("join");
    }
  }, [connected, restoreTried, socket]);

  const handleHome = () => {
    setGame(null);
    setHostToken("");
    setPlayerId("");
    setNotice("");
    setScreen("role");
  };

  const handleCreateNewRoom = () => {
    const goCreate = () => {
      localStorage.removeItem(HOST_SESSION);
      setGame(null);
      setHostToken("");
      setNotice("");
      setScreen("create");
    };

    if (game && hostToken) {
      socket.emit("game:finish", { code: game.code, hostToken }, () => goCreate());
      return;
    }
    goCreate();
  };

  const handleJoinNewRoom = () => {
    localStorage.removeItem(PLAYER_SESSION);
    setGame(null);
    setPlayerId("");
    setNotice("");
    setScreen("join");
  };

  return (
    <main className="app-shell">
      <Decorations />
      <header className="topbar">
        <button className="brand" type="button" onClick={handleHome} aria-label="Về màn hình chính">
          <span className="brand-mark">
            <Sparkles size={24} />
          </span>
          <span>Ô Chữ Vui Vẻ</span>
          <span className={`connection ${connected ? "online" : "offline"}`}>
            <span />
            {connected ? "Online" : "Đang nối"}
          </span>
        </button>
      </header>

      {notice && (
        <button className="toast" type="button" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}

      {screen === "role" && <RoleScreen onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />}
      {screen === "create" && (
        <CreateGame
          socket={socket}
          onBack={() => setScreen("role")}
          onCreated={(state, token) => {
            setGame(state);
            setHostToken(token);
            setScreen("host");
            writeSession(HOST_SESSION, { code: state.code, hostToken: token });
          }}
          onError={setNotice}
        />
      )}
      {screen === "join" && (
        <JoinGame
          socket={socket}
          onBack={() => setScreen("role")}
          onJoined={(state, joinedPlayerId) => {
            setGame(state);
            setPlayerId(joinedPlayerId);
            setScreen("player");
            writeSession(PLAYER_SESSION, { code: state.code, playerId: joinedPlayerId });
          }}
          onError={setNotice}
        />
      )}
      {screen === "host" && game && (
        <HostDashboard
          game={game}
          hostToken={hostToken}
          socket={socket}
          onError={setNotice}
          onHome={handleHome}
          onCreateNewRoom={handleCreateNewRoom}
        />
      )}
      {screen === "player" && game?.player && (
        <PlayerGame
          game={game}
          player={game.player}
          playerId={playerId}
          socket={socket}
          onError={setNotice}
          onHome={handleHome}
          onJoinNewRoom={handleJoinNewRoom}
        />
      )}
    </main>
  );
}

function RoleScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <section className="role-stage">
      <div className="hero-copy">
        <div className="eyebrow">
          <Star size={18} />
          Game đoán chữ realtime
        </div>
        <h1>Chọn vai và bắt đầu một vòng chơi thật rực rỡ</h1>
      </div>
      <div className="role-grid">
        <button className="role-card host-card" type="button" onClick={onCreate}>
          <Crown size={42} />
          <strong>Chủ game</strong>
          <span>Tạo phòng, nhập đáp án, chấm từng chữ cái.</span>
        </button>
        <button className="role-card player-card" type="button" onClick={onJoin}>
          <Users size={42} />
          <strong>Người chơi</strong>
          <span>Vào phòng, xem gợi ý, đoán từng ô chữ.</span>
        </button>
      </div>
    </section>
  );
}

function CreateGame({
  socket,
  onCreated,
  onBack,
  onError
}: {
  socket: Socket;
  onCreated: (state: GameState, token: string) => void;
  onBack: () => void;
  onError: (message: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(20);
  const [punishmentId, setPunishmentId] = useState(punishmentDesigns[0].id);
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    socket.emit("game:create", { answer, hint, maxAttempts, punishmentId }, (res: SocketResponse) => {
      setBusy(false);
      if (!res.ok || !res.state || !res.hostToken) {
        onError(res.message || "Không thể tạo phòng.");
        return;
      }
      onCreated(res.state, res.hostToken);
    });
  };

  return (
    <section className="form-stage">
      <WizardHeader icon={<Crown size={34} />} title="Tạo phòng chơi" onBack={onBack} />
      <form className="setup-form" onSubmit={submit}>
        <label>
          <span>Từ cần đoán</span>
          <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Ví dụ: BÁNH MÌ" autoFocus />
        </label>
        <label>
          <span>Gợi ý/mô tả</span>
          <textarea value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Một món ăn thơm ngon..." rows={4} />
        </label>
        <label>
          <span>Số lượt đoán tối đa</span>
          <input
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(event) => setMaxAttempts(Number(event.target.value))}
          />
        </label>
        <fieldset className="punishment-choice">
          <legend>Chọn hình phạt bí mật</legend>
          <div className="punishment-choice-grid">
            {punishmentDesigns.map((design) => (
              <label className={punishmentId === design.id ? "selected" : ""} key={design.id}>
                <input
                  type="radio"
                  name="punishment"
                  value={design.id}
                  checked={punishmentId === design.id}
                  onChange={() => setPunishmentId(design.id)}
                />
                <span className={`choice-badge ${design.theme}`}>{design.badge}</span>
                <strong>{design.title}</strong>
                <small>{design.action}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="primary-action" type="submit" disabled={busy}>
          <Play size={22} />
          {busy ? "Đang tạo..." : "Tạo phòng"}
        </button>
      </form>
    </section>
  );
}

function JoinGame({
  socket,
  onJoined,
  onBack,
  onError
}: {
  socket: Socket;
  onJoined: (state: GameState, playerId: string) => void;
  onBack: () => void;
  onError: (message: string) => void;
}) {
  const queryCode = tidyCode(new URLSearchParams(window.location.search).get("code") || "");
  const [name, setName] = useState(() => localStorage.getItem(PLAYER_NAME) || "");
  const [code, setCode] = useState(queryCode);
  const [busy, setBusy] = useState(false);
  const [rooms, setRooms] = useState<GameSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const loadRooms = () => {
    setLoadingRooms(true);
    socket.emit("games:list", {}, (res: SocketResponse) => {
      setLoadingRooms(false);
      if (res.ok && res.rooms) {
        setRooms(res.rooms);
      }
    });
  };

  useEffect(() => {
    loadRooms();
    const onRooms = (res: SocketResponse) => {
      if (res.ok && res.rooms) {
        setRooms(res.rooms);
      }
    };
    socket.on("games:list", onRooms);
    return () => {
      socket.off("games:list", onRooms);
    };
  }, [socket]);

  const joinRoom = (roomCode = code) => {
    setBusy(true);
    socket.emit("game:join", { name, code: roomCode }, (res: SocketResponse) => {
      setBusy(false);
      if (!res.ok || !res.state || !res.playerId) {
        onError(res.message || "Không thể tham gia phòng.");
        return;
      }
      localStorage.setItem(PLAYER_NAME, name.trim());
      onJoined(res.state, res.playerId);
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    joinRoom();
  };

  return (
    <section className="form-stage">
      <WizardHeader icon={<Users size={34} />} title="Vào phòng chơi" onBack={onBack} />
      <form className="setup-form" onSubmit={submit}>
        <label>
          <span>Tên hiển thị</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Minh Anh" autoFocus />
        </label>
        <label>
          <span>Mã phòng</span>
          <input value={code} onChange={(event) => setCode(tidyCode(event.target.value))} placeholder="ABCDE" />
        </label>
        <button className="primary-action" type="submit" disabled={busy}>
          <Play size={22} />
          {busy ? "Đang vào..." : "Tham gia"}
        </button>
      </form>

      <section className="room-picker">
        <div className="section-title room-picker-title">
          <Users size={22} />
          <div>
            <h2>Phòng đang mở</h2>
            <span>Chọn một phòng để tham gia, không cần nhập mã.</span>
          </div>
          <button className="soft-button" type="button" onClick={loadRooms} disabled={loadingRooms}>
            <RefreshCw size={18} />
            {loadingRooms ? "Đang tải" : "Làm mới"}
          </button>
        </div>

        <div className="room-list">
          {rooms.length === 0 && (
            <div className="empty-state compact-empty">
              <Users size={34} />
              <strong>Chưa có phòng nào</strong>
              <span>Nhờ chủ game tạo phòng mới nhé.</span>
            </div>
          )}
          {rooms.map((room) => (
            <button
              className={`room-card ${code === room.code ? "selected" : ""}`}
              type="button"
              key={room.code}
              disabled={busy}
              onClick={() => {
                setCode(room.code);
                joinRoom(room.code);
              }}
            >
              <span className="room-code">{room.code}</span>
              <span className="room-hint">{room.hint || "Phòng chưa có gợi ý."}</span>
              <span className="room-meta">
                {room.playableCount} ký tự · {room.maxAttempts} lượt · {room.playerCount} người chơi
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function WizardHeader({ icon, title, onBack }: { icon: JSX.Element; title: string; onBack: () => void }) {
  return (
    <div className="wizard-header">
      <button className="icon-button" type="button" onClick={onBack} aria-label="Quay lại">
        <Home size={22} />
      </button>
      <div className="wizard-title">
        <span>{icon}</span>
        <h1>{title}</h1>
      </div>
    </div>
  );
}

function HostDashboard({
  game,
  hostToken,
  socket,
  onError,
  onHome,
  onCreateNewRoom
}: {
  game: GameState;
  hostToken: string;
  socket: Socket;
  onError: (message: string) => void;
  onHome: () => void;
  onCreateNewRoom: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [drafts, setDrafts] = useState<Record<string, Review[]>>({});
  const players = game.players || [];
  const joinUrl = `${window.location.origin}?code=${game.code}`;

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      const pendingIds = new Set<string>();
      for (const player of players) {
        for (const guess of player.guesses) {
          if (guess.status === "pending") {
            pendingIds.add(guess.id);
            if (!Object.prototype.hasOwnProperty.call(next, guess.id)) {
              next[guess.id] = [...guess.review];
            }
          }
        }
      }
      for (const guessId of Object.keys(next)) {
        if (!pendingIds.has(guessId)) {
          delete next[guessId];
        }
      }
      return next;
    });
  }, [players]);

  const visiblePlayers = players
    .filter((player) => {
      if (filter === "pending") return player.status === "waiting_review";
      if (filter === "won") return player.status === "won";
      if (filter === "lost") return player.status === "lost";
      return true;
    })
    .sort((left, right) => getLatestGuessTime(right) - getLatestGuessTime(left));

  const copyLink = async () => {
    await navigator.clipboard?.writeText(joinUrl);
  };

  const submitReview = (guessId: string, review: Review[]) => {
    socket.emit("guess:review", { code: game.code, hostToken, guessId, review }, (res: SocketResponse) => {
      if (!res.ok) onError(res.message || "Không thể gửi kết quả chấm.");
    });
  };

  return (
    <section className="dashboard host-dashboard">
      <div className="dashboard-banner">
        <div>
          <div className="eyebrow">
            <Crown size={18} />
            Bảng chủ game
          </div>
          <h1>Phòng {game.code}</h1>
          <p>{game.hint || "Chưa có gợi ý."}</p>
        </div>
        <div className="host-actions">
          <button className="primary-action compact" type="button" onClick={onCreateNewRoom}>
            <Crown size={20} />
            Tạo phòng mới
          </button>
          <button className="soft-button" type="button" onClick={copyLink}>
            <ClipboardCopy size={20} />
            Copy link
          </button>
          <button className="soft-button" type="button" onClick={onHome}>
            <Home size={20} />
            Trang chính
          </button>
        </div>
      </div>

      <div className="info-strip">
        <InfoPill icon={<Sparkles size={20} />} label="Đáp án" value={game.answer || ""} />
        <InfoPill icon={<LinkIcon size={20} />} label="Mã phòng" value={game.code} />
        <InfoPill icon={<RefreshCw size={20} />} label="Số ký tự" value={String(game.playableCount)} />
        <InfoPill icon={<Clock3 size={20} />} label="Lượt tối đa" value={String(game.maxAttempts)} />
      </div>

      <PunishmentReveal punishment={game.punishment} />

      <div className="filter-tabs" role="tablist" aria-label="Lọc người chơi">
        {(["all", "pending", "won", "lost"] as Filter[]).map((item) => (
          <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>
            {item === "all" ? "Tất cả" : item === "pending" ? "Chờ chấm" : item === "won" ? "Đã thắng" : "Hết lượt"}
          </button>
        ))}
      </div>

      <div className="player-list">
        {visiblePlayers.length === 0 && (
          <div className="empty-state">
            <Users size={42} />
            <strong>Đang chờ người chơi</strong>
            <span>Chia sẻ mã phòng hoặc link để các bạn nhỏ tham gia.</span>
          </div>
        )}

        {visiblePlayers.map((player) => (
          <article className="player-panel" key={player.id}>
            <div className="player-heading">
              <div>
                <h2>{player.name}</h2>
                <span className={`status-pill ${player.status}`}>{statusCopy[player.status]}</span>
              </div>
              <div className="attempt-badge">
                {player.attemptsLeft}/{player.maxAttempts} lượt
              </div>
            </div>

            <div className="guess-stack">
              {player.guesses.length === 0 && <p className="quiet">Chưa có câu trả lời nào.</p>}
              {player.guesses
                .map((guess, index) => ({ guess, guessNumber: index + 1 }))
                .reverse()
                .map(({ guess, guessNumber }) => {
                const review = drafts[guess.id] ?? guess.review;
                return (
                  <div className="guess-review" key={guess.id}>
                    <div className="guess-meta">
                      <strong>Lần {guessNumber}</strong>
                      <span>{guess.status === "pending" ? "Chưa chấm" : "Đã gửi kết quả"}</span>
                    </div>
                    <ReviewGrid
                      cells={game.answerCells}
                      guess={guess}
                      review={review}
                      setReview={(next) => setDrafts((current) => ({ ...current, [guess.id]: next }))}
                    />
                    {guess.status === "pending" && (
                      <div className="review-actions">
                        <button
                          className="soft-button success-button"
                          type="button"
                          onClick={() =>
                            setDrafts((current) => ({
                              ...current,
                              [guess.id]: game.answerCells.map((cell) => (cell.playable ? "correct" : "correct"))
                            }))
                          }
                        >
                          <Check size={19} />
                          Tất cả đúng
                        </button>
                        <button
                          className="soft-button danger-button"
                          type="button"
                          onClick={() =>
                            setDrafts((current) => ({
                              ...current,
                              [guess.id]: game.answerCells.map((cell) => (cell.playable ? "wrong" : "correct"))
                            }))
                          }
                        >
                          <X size={19} />
                          Tất cả sai
                        </button>
                        <button
                          className="soft-button"
                          type="button"
                          onClick={() => setDrafts((current) => ({ ...current, [guess.id]: guess.autoReview || guess.review }))}
                        >
                          <Wand2 size={19} />
                          Tự động chấm
                        </button>
                        <button
                          className="primary-action compact"
                          type="button"
                          disabled={review.some((item, index) => game.answerCells[index].playable && item === "pending")}
                          onClick={() => submitReview(guess.id, review)}
                        >
                          <Send size={19} />
                          Gửi kết quả
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReviewGrid({
  cells,
  guess,
  review,
  setReview
}: {
  cells: AnswerCell[];
  guess: Guess;
  review: Review[];
  setReview: (review: Review[]) => void;
}) {
  const choose = (index: number, value: Review) => {
    const next = [...review];
    next[index] = value;
    setReview(next);
  };

  return (
    <div className="review-grid">
      {cells.map((cell, index) =>
        cell.playable ? (
          <div className={`review-cell ${classForReview(review[index])}`} key={cell.index}>
            <span>{guess.letters[index]}</span>
            {guess.status === "pending" ? (
              <div className="review-toggle">
                <button
                  type="button"
                  className={review[index] === "correct" ? "active-correct" : ""}
                  onClick={() => choose(index, "correct")}
                  aria-label="Đúng"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  className={review[index] === "wrong" ? "active-wrong" : ""}
                  onClick={() => choose(index, "wrong")}
                  aria-label="Sai"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <small>{review[index] === "correct" ? "Đúng" : "Sai"}</small>
            )}
          </div>
        ) : (
          <div className="review-cell static-cell" key={cell.index}>
            <span>{cell.value}</span>
          </div>
        )
      )}
    </div>
  );
}

function PlayerGame({
  game,
  player,
  playerId,
  socket,
  onError,
  onHome,
  onJoinNewRoom
}: {
  game: GameState;
  player: Player;
  playerId: string;
  socket: Socket;
  onError: (message: string) => void;
  onHome: () => void;
  onJoinNewRoom: () => void;
}) {
  const [draft, setDraft] = useState<string[]>([]);
  const [burst, setBurst] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastGameCodeRef = useRef(game.code);
  const lastReviewedGuessIdRef = useRef("");
  const canGuess = player.status === "playing";

  useEffect(() => {
    const pendingGuess = player.status === "waiting_review" ? [...player.guesses].reverse().find((guess) => guess.status === "pending") : null;
    const latestReviewedGuess = [...player.guesses].reverse().find((guess) => guess.status === "reviewed");
    const roomChanged = lastGameCodeRef.current !== game.code;
    const reviewedChanged = Boolean(latestReviewedGuess?.id && latestReviewedGuess.id !== lastReviewedGuessIdRef.current);

    if (roomChanged) {
      lastGameCodeRef.current = game.code;
      lastReviewedGuessIdRef.current = latestReviewedGuess?.id || "";
    } else if (latestReviewedGuess?.id) {
      lastReviewedGuessIdRef.current = latestReviewedGuess.id;
    }

    setDraft((current) =>
      game.answerCells.map((cell, index) => {
        if (!cell.playable) return cell.value || "";
        if (pendingGuess) return pendingGuess.letters[index] || "";
        if (player.lockedLetters[index]) return player.lockedLetters[index] || "";
        if (player.status === "playing" && !roomChanged && !reviewedChanged) return current[index] || "";
        return "";
      })
    );
  }, [game.code, game.answerCells, player.guesses, player.lockedLetters, player.status]);

  useEffect(() => {
    if (player.status === "won") {
      setBurst(true);
      const id = window.setTimeout(() => setBurst(false), 2600);
      return () => window.clearTimeout(id);
    }
  }, [player.status]);

  const nextPlayable = (from: number, direction: 1 | -1) => {
    for (let index = from + direction; index >= 0 && index < game.answerCells.length; index += direction) {
      if (game.answerCells[index].playable && !player.lockedLetters[index]) return index;
    }
    return -1;
  };

  const updateLetter = (index: number, value: string) => {
    if (!canGuess || player.lockedLetters[index]) return;
    const letter = upperLetter(segmentText(value).find(isPlayableInput) || "");
    setDraft((current) => {
      const next = [...current];
      next[index] = letter;
      return next;
    });
    if (letter) {
      const next = nextPlayable(index, 1);
      if (next >= 0) inputRefs.current[next]?.focus();
    }
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !draft[index]) {
      const prev = nextPlayable(index, -1);
      if (prev >= 0) inputRefs.current[prev]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    const pasted = segmentText(event.clipboardData.getData("text")).filter(isPlayableInput).map(upperLetter);
    setDraft((current) => {
      const next = [...current];
      let cursor = index;
      for (const letter of pasted) {
        while (cursor < game.answerCells.length && (!game.answerCells[cursor].playable || player.lockedLetters[cursor])) cursor += 1;
        if (cursor >= game.answerCells.length) break;
        next[cursor] = letter;
        cursor += 1;
      }
      const focusAt = nextPlayable(cursor - 1, 1);
      window.setTimeout(() => {
        if (focusAt >= 0) inputRefs.current[focusAt]?.focus();
      }, 0);
      return next;
    });
  };

  const complete = game.answerCells.every((cell, index) => !cell.playable || Boolean(draft[index]));

  const submitGuess = () => {
    socket.emit("guess:submit", { code: game.code, playerId, letters: draft }, (res: SocketResponse) => {
      if (!res.ok) onError(res.message || "Không thể gửi câu trả lời.");
    });
  };

  return (
    <section className="dashboard player-dashboard">
      {burst && <Confetti />}
      <div className="dashboard-banner player-banner">
        <div>
          <div className="eyebrow">
            <Sparkles size={18} />
            Phòng {game.code}
          </div>
          <h1>{player.status === "won" ? "Bạn đoán đúng rồi!" : "Đoán từ bí mật"}</h1>
          <p>{game.hint || "Chủ game chưa nhập gợi ý."}</p>
        </div>
        <div className="host-actions">
          <button className="primary-action compact" type="button" onClick={onJoinNewRoom}>
            <Users size={20} />
            Tham gia phòng mới
          </button>
          <button className="soft-button" type="button" onClick={onHome}>
            <Home size={20} />
            Trang chính
          </button>
        </div>
      </div>

      <div className="player-layout">
        <div className="play-panel">
          <div className="play-stats">
            <CompactStat icon={<Clock3 size={18} />} label="Lượt" value={`${player.attemptsLeft}/${player.maxAttempts}`} />
            <CompactStat icon={<Trophy size={18} />} label="Trạng thái" value={statusCopy[player.status]} />
          </div>

          <div className="letter-board" aria-label="Ô nhập câu trả lời">
            {game.answerCells.map((cell, index) =>
              cell.playable ? (
                <div className={`letter-slot ${player.lockedLetters[index] ? "locked" : ""}`} key={cell.index}>
                  <input
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    value={draft[index] || ""}
                    onChange={(event) => updateLetter(index, event.target.value)}
                    onKeyDown={(event) => handleKey(event, index)}
                    onPaste={(event) => handlePaste(event, index)}
                    disabled={!canGuess || Boolean(player.lockedLetters[index])}
                    inputMode="text"
                    aria-label={`Ô chữ ${index + 1}`}
                  />
                  {player.lockedLetters[index] && (
                    <span className="slot-check">
                      <Check size={15} />
                    </span>
                  )}
                </div>
              ) : (
                <div className="letter-separator" key={cell.index}>
                  {cell.value === " " ? "" : cell.value}
                </div>
              )
            )}
          </div>

          <div className="player-actions">
            <button className="primary-action" type="button" disabled={!canGuess || !complete} onClick={submitGuess}>
              <Send size={22} />
              Trả lời
            </button>
            {player.status === "waiting_review" && <span className="waiting-note">Đang chờ chủ game chấm...</span>}
            {player.status === "lost" && <span className="waiting-note lost-note">Bạn đã hết lượt.</span>}
          </div>
        </div>

        <div className="side-stack">
          <PunishmentReveal punishment={game.punishment} />
          <HistoryPanel player={player} cells={game.answerCells} />
        </div>
      </div>
    </section>
  );
}

function PunishmentReveal({ punishment }: { punishment: PunishmentState }) {
  const design = getPunishmentDesign(punishment.id);
  const revealed = Math.min(punishment.revealedParts, punishment.totalParts);
  const progress = `${revealed}/${punishment.totalParts}`;
  const isComplete = revealed >= punishment.totalParts;

  return (
    <section className="punishment-panel" aria-label="Ảnh thử thách bị ẩn">
      <div className="section-title punishment-title">
        <Theater size={22} />
        <div>
          <h2>Hình phạt bí mật</h2>
          <span>Mỗi lần sai mở thêm 1 mảnh</span>
        </div>
      </div>
      <div className="punishment-frame">
        <div className={`punishment-art ${design.theme}`}>
          <div className="art-sunburst" />
          <div className="art-cloud cloud-left" />
          <div className="art-cloud cloud-right" />
          <div className="art-stage">
            <span>{design.badge}</span>
          </div>
          <div className="art-copy">
            <strong>{design.title}</strong>
            <p>{design.action}</p>
          </div>
          <div className="reveal-grid" aria-hidden="true">
            {Array.from({ length: punishment.totalParts }, (_, index) => (
              <span key={index} className={index < revealed ? "is-open" : ""} />
            ))}
          </div>
        </div>
        <div className="punishment-progress">
          <span>{isComplete ? "Đã mở hết" : "Đang mở dần"}</span>
          <strong>{progress}</strong>
        </div>
      </div>
    </section>
  );
}

function HistoryPanel({ player, cells }: { player: Player; cells: AnswerCell[] }) {
  const latestFirst = player.guesses
    .map((guess, index) => ({ guess, guessNumber: index + 1 }))
    .reverse();

  return (
    <aside className="history-panel">
      <div className="section-title">
        <Clock3 size={22} />
        <h2>Lịch sử đoán</h2>
      </div>
      {player.guesses.length === 0 && <p className="quiet">Bạn chưa gửi câu trả lời nào.</p>}
      <div className="history-list">
        {latestFirst.map(({ guess, guessNumber }) => (
          <div className="history-row" key={guess.id}>
            <strong>Lần {guessNumber}</strong>
            <div className="mini-letters">
              {cells.map((cell, index) =>
                cell.playable ? (
                  <span className={classForReview(guess.review[index])} key={cell.index}>
                    {guess.letters[index]}
                  </span>
                ) : (
                  <span className="mini-static" key={cell.index}>
                    {cell.value}
                  </span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function InfoPill({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="info-pill">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CompactStat({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Decorations() {
  return (
    <div className="decorations" aria-hidden="true">
      <span className="bubble bubble-one" />
      <span className="bubble bubble-two" />
      <span className="bubble bubble-three" />
      <span className="spark spark-one">✦</span>
      <span className="spark spark-two">✧</span>
    </div>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties} />
      ))}
    </div>
  );
}

function readSession<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default App;
*/
