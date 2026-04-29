import { Clock3 } from "lucide-react";
import { classForReview } from "../utils/wordGuessing";
import type { AnswerCell, Player } from "../types";

export function HistoryPanel({ player, cells }: { player: Player; cells: AnswerCell[] }) {
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
