import type { ReactNode } from "react";

export default function Button({ children, onClick, type = "button", className = "" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} onClick={onClick} className={`button ${className}`}>
      {children}
    </button>
  );
}
