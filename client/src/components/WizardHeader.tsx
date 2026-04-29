import { Home } from "lucide-react";
import type { ReactNode } from "react";

export function WizardHeader({ icon, title, onBack }: { icon: ReactNode; title: string; onBack: () => void }) {
  return (
    <div className="wizard-header">
      <button className="icon-button" type="button" onClick={onBack} aria-label="Quay lại">
        <Home size={22} />
      </button>
      <div className="wizard-title">
        <span>{icon}</span>
        <h1>{title}</h1>
      </div>
    </div>
  );
}
