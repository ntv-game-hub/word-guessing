import { Check, X } from "lucide-react";
import type { AnswerCell, Guess, Review } from "../types";
import { classForReview } from "../utils/wordGuessing";

export function ReviewGrid({
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
