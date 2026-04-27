export const REVIEW_CORRECT = "correct";
export const REVIEW_WRONG = "wrong";
export const REVIEW_PENDING = "pending";

const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

export function normalizeText(value) {
  return String(value ?? "").normalize("NFC");
}

export function compareText(value) {
  return normalizeText(value).toLocaleUpperCase("vi-VN");
}

export function segmentGraphemes(value) {
  const text = normalizeText(value);
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("vi", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

export function isPlayableCell(value) {
  return LETTER_OR_NUMBER.test(value);
}

export function createAnswerCells(answer) {
  return segmentGraphemes(answer).map((value, index) => ({
    index,
    value,
    playable: isPlayableCell(value)
  }));
}

export function createInitialLockedLetters(answerCells) {
  return answerCells.map((cell) => (cell.playable ? null : cell.value));
}

export function fillStaticLetters(answerCells, letters) {
  return answerCells.map((cell, index) => {
    if (!cell.playable) {
      return cell.value;
    }
    return normalizeText(letters[index] ?? "").trim();
  });
}

export function isGuessComplete(answerCells, letters) {
  return answerCells.every((cell, index) => {
    if (!cell.playable) {
      return true;
    }
    return normalizeText(letters[index] ?? "").trim().length > 0;
  });
}

export function autoReviewGuess(answerCells, letters) {
  return answerCells.map((cell, index) => {
    if (!cell.playable) {
      return REVIEW_CORRECT;
    }
    return compareText(cell.value) === compareText(letters[index]) ? REVIEW_CORRECT : REVIEW_WRONG;
  });
}

export function applyReview(answerCells, lockedLetters, letters, review) {
  return answerCells.map((cell, index) => {
    if (!cell.playable) {
      return cell.value;
    }
    if (lockedLetters[index]) {
      return lockedLetters[index];
    }
    if (review[index] === REVIEW_CORRECT) {
      return normalizeText(letters[index]);
    }
    return null;
  });
}

export function hasWon(answerCells, lockedLetters) {
  return answerCells.every((cell, index) => !cell.playable || Boolean(lockedLetters[index]));
}

export function countPlayableCells(answerCells) {
  return answerCells.filter((cell) => cell.playable).length;
}

export function sanitizeCode(value) {
  return normalizeText(value).trim().toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "");
}

export function sanitizeName(value) {
  return normalizeText(value).trim().replace(/\s+/g, " ").slice(0, 32);
}
