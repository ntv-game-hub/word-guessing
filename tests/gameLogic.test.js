import { describe, expect, it } from "vitest";
import {
  applyReview,
  autoReviewGuess,
  createAnswerCells,
  createInitialLockedLetters,
  fillStaticLetters,
  isGuessComplete,
  REVIEW_CORRECT,
  REVIEW_WRONG,
  segmentGraphemes
} from "../shared/gameLogic.js";

describe("game logic", () => {
  it("segments Vietnamese graphemes and keeps spaces separate", () => {
    expect(segmentGraphemes("BÁNH MÌ")).toEqual(["B", "Á", "N", "H", " ", "M", "Ì"]);
    expect(segmentGraphemes("BỨC TRANH")).toEqual(["B", "Ứ", "C", " ", "T", "R", "A", "N", "H"]);
  });

  it("prefills static characters and ignores them for completion", () => {
    const cells = createAnswerCells("A-B");
    const letters = fillStaticLetters(cells, ["A", "", "B"]);

    expect(letters).toEqual(["A", "-", "B"]);
    expect(isGuessComplete(cells, ["A", "", "B"])).toBe(true);
    expect(isGuessComplete(cells, ["A", "", ""])).toBe(false);
  });

  it("auto reviews case-insensitively while preserving Vietnamese marks", () => {
    const cells = createAnswerCells("BÁNH");
    expect(autoReviewGuess(cells, ["b", "á", "n", "h"])).toEqual([
      REVIEW_CORRECT,
      REVIEW_CORRECT,
      REVIEW_CORRECT,
      REVIEW_CORRECT
    ]);
    expect(autoReviewGuess(cells, ["B", "A", "N", "H"])[1]).toBe(REVIEW_WRONG);
  });

  it("locks correct letters and clears wrong letters after review", () => {
    const cells = createAnswerCells("PIE");
    const locked = createInitialLockedLetters(cells);
    const next = applyReview(cells, locked, ["P", "A", "E"], [
      REVIEW_CORRECT,
      REVIEW_WRONG,
      REVIEW_CORRECT
    ]);

    expect(next).toEqual(["P", null, "E"]);
  });
});
