import type { ReactNode } from "react";

export function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="info-pill">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
