import { Theater } from "lucide-react";
import { getPunishmentDesign } from "../utils/wordGuessing";
import type { PunishmentState } from "../types";

export function PunishmentReveal({ punishment }: { punishment: PunishmentState }) {
  const design = getPunishmentDesign(punishment.id);
  const revealed = Math.min(punishment.revealedParts, punishment.totalParts);
  const progress = `${revealed}/${punishment.totalParts}`;
  const isComplete = revealed >= punishment.totalParts;

  return (
    <section className="punishment-panel" aria-label="Ảnh thử thách bị ẩn">
      <div className="section-title punishment-title">
        <Theater size={22} />
        <div>
          <h2>Hình phạt bí mật</h2>
          <span>Mỗi lần sai mở thêm 1 mảnh</span>
        </div>
      </div>
      <div className="punishment-frame">
        <div className={`punishment-art ${design.theme}`}>
          <div className="art-sunburst" />
          <div className="art-cloud cloud-left" />
          <div className="art-cloud cloud-right" />
          <div className="art-stage">
            <span>{design.badge}</span>
          </div>
          <div className="art-copy">
            <strong>{design.title}</strong>
            <p>{design.action}</p>
          </div>
          <div className="reveal-grid" aria-hidden="true">
            {Array.from({ length: punishment.totalParts }, (_, index) => (
              <span key={index} className={index < revealed ? "is-open" : ""} />
            ))}
          </div>
        </div>
        <div className="punishment-progress">
          <span>{isComplete ? "Đã mở hết" : "Đang mở dần"}</span>
          <strong>{progress}</strong>
        </div>
      </div>
    </section>
  );
}
