import type { ReactNode } from "react";

export function CompactStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
