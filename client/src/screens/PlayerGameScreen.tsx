import { Check, Clock3, Home, Send, Sparkles, Trophy, Users } from "lucide-react";
import { type KeyboardEvent, type ClipboardEvent, useEffect, useRef, useState } from "react";
import { type Socket } from "socket.io-client";
import { CompactStat } from "../components/CompactStat";
import { Confetti } from "../components/Confetti";
import { HistoryPanel } from "../components/HistoryPanel";
import { PunishmentReveal } from "../components/PunishmentReveal";
import { statusCopy } from "../constants";
import { isPlayableInput, segmentText, upperLetter } from "../utils/wordGuessing";
import type { GameState, Player, SocketResponse } from "../types";

export function PlayerGameScreen({
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
  }, [game.answerCells, game.code, player.guesses, player.lockedLetters, player.status]);

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

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
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
