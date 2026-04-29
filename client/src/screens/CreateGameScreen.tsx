import { Play, Crown } from "lucide-react";
import { type FormEvent, useState } from "react";
import { WizardHeader } from "../components/WizardHeader";
import { punishmentDesigns } from "../constants";
import type { GameState, SocketResponse } from "../types";

export function CreateGameScreen({
  socket,
  onCreated,
  onBack,
  onError
}: {
  socket: { emit: (event: string, payload: unknown, callback: (response: SocketResponse) => void) => void };
  onCreated: (state: GameState, token: string) => void;
  onBack: () => void;
  onError: (message: string) => void;
}) {
  return (
    <section className="form-stage">
      <WizardHeader icon={<Crown size={34} />} title="Tạo phòng chơi" onBack={onBack} />
      <CreateGameForm socket={socket} onCreated={onCreated} onError={onError} />
    </section>
  );
}

function CreateGameForm({
  socket,
  onCreated,
  onError
}: {
  socket: { emit: (event: string, payload: unknown, callback: (response: SocketResponse) => void) => void };
  onCreated: (state: GameState, token: string) => void;
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
        <input type="number" min={1} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} />
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
  );
}
