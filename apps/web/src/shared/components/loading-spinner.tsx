"use client";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  message = "Carregando...",
  className = "py-16",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {message}
      </span>
    </div>
  );
}
