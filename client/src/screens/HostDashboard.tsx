import { Check, ClipboardCopy, Clock3, Crown, Home, Link as LinkIcon, RefreshCw, Send, Sparkles, Trophy, Users, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type Socket } from "socket.io-client";
import { CompactStat } from "../components/CompactStat";
import { InfoPill } from "../components/InfoPill";
import { PunishmentReveal } from "../components/PunishmentReveal";
import { ReviewGrid } from "../components/ReviewGrid";
import { statusCopy } from "../constants";
import { getLatestGuessTime } from "../utils/wordGuessing";
import type { Filter, GameState, Review, SocketResponse } from "../types";

export function HostDashboard({
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
              <div className="attempt-badge">{player.attemptsLeft}/{player.maxAttempts} lượt</div>
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
