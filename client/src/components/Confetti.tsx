import type React from "react";

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties} />
      ))}
    </div>
  );
}
