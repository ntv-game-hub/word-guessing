import type { PlayerStatus, PunishmentDesign } from "./types";

export const HOST_SESSION = "word-guessing-host";
export const PLAYER_SESSION = "word-guessing-player";
export const PLAYER_NAME = "word-guessing-player-name";

export const statusCopy: Record<PlayerStatus, string> = {
  playing: "Đang chơi",
  waiting_review: "Chờ chấm",
  won: "Chiến thắng",
  lost: "Hết lượt"
};

export const punishmentDesigns: PunishmentDesign[] = [
  { id: "sing-song", title: "Sân khấu tí hon", action: "Hát 1 bài hoặc 1 đoạn ngắn", badge: "LA", theme: "song" },
  { id: "funny-face", title: "Gương mặt kỳ cục", action: "Nhăn mặt, nhe răng trong 5 giây", badge: "HA", theme: "face" },
  { id: "robot-dance", title: "Vũ điệu robot", action: "Nhảy robot trong 10 giây", badge: "BOT", theme: "robot" },
  { id: "superhero-pose", title: "Siêu anh hùng", action: "Tạo dáng anh hùng 5 giây", badge: "POW", theme: "hero" },
  { id: "star-jumps", title: "Ngôi sao bật nhảy", action: "Bật nhảy 10 cái thật vui", badge: "10", theme: "star" },
  { id: "tongue-twister", title: "Thử thách líu lưỡi", action: "Đọc nhanh một câu khó", badge: "WOW", theme: "twister" },
  { id: "silly-walk", title: "Bước đi kỳ quặc", action: "Đi kiểu vui trong 5 bước", badge: "GO", theme: "walk" },
  { id: "balance-pose", title: "Giữ thăng bằng", action: "Đứng một chân trong 5 giây", badge: "1", theme: "balance" },
  { id: "compliment", title: "Lời khen lấp lánh", action: "Khen một bạn trong phòng", badge: "OK", theme: "kind" },
  { id: "draw-smile", title: "Họa sĩ nụ cười", action: "Vẽ mặt cười trong 10 giây", badge: "ART", theme: "art" },
  { id: "victory-spin", title: "Vòng xoay vui vẻ", action: "Xoay một vòng và chào cả lớp", badge: "GO", theme: "spin" }
];
