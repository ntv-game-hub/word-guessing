import { Play, RefreshCw, Users } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { type Socket } from "socket.io-client";
import { WizardHeader } from "../components/WizardHeader";
import { PLAYER_NAME } from "../constants";
import { getQueryCode } from "../utils/navigation";
import { tidyCode } from "../utils/wordGuessing";
import type { GameSummary, GameState, SocketResponse } from "../types";

export function JoinGameScreen({
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
  const queryCode = getQueryCode();
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
