import { punishmentDesigns } from "../constants";
import type { Player, PunishmentDesign, Review } from "../types";

export function segmentText(value: string) {
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

export function isPlayableInput(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}

export function tidyCode(value: string) {
  return value.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function upperLetter(value: string) {
  return value.normalize("NFC").toLocaleUpperCase("vi-VN");
}

export function classForReview(review?: Review) {
  if (review === "correct") return "is-correct";
  if (review === "wrong") return "is-wrong";
  return "is-pending";
}

export function getPunishmentDesign(id: string): PunishmentDesign {
  return punishmentDesigns.find((item) => item.id === id) || punishmentDesigns[0];
}

export function getLatestGuessTime(player: Player) {
  const latestGuess = player.guesses[player.guesses.length - 1];
  return latestGuess ? new Date(latestGuess.createdAt).getTime() : new Date(player.createdAt).getTime();
}

export function readSession<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

