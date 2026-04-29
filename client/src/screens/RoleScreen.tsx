import { Crown, Star, Users } from "lucide-react";

export function RoleScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <section className="role-stage">
      <div className="hero-copy">
        <div className="eyebrow">
          <Star size={18} />
          Game đoán chữ realtime
        </div>
        <h1>Chọn vai và bắt đầu một vòng chơi thật rực rỡ</h1>
      </div>
      <div className="role-grid">
        <button className="role-card host-card" type="button" onClick={onCreate}>
          <Crown size={42} />
          <strong>Chủ game</strong>
          <span>Tạo phòng, nhập đáp án, chấm từng chữ cái.</span>
        </button>
        <button className="role-card player-card" type="button" onClick={onJoin}>
          <Users size={42} />
          <strong>Người chơi</strong>
          <span>Vào phòng, xem gợi ý, đoán từng ô chữ.</span>
        </button>
      </div>
    </section>
  );
}
