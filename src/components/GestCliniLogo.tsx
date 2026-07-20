interface GestCliniLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

// Clean tooth SVG path (viewBox 0 0 20 26)
function ToothIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 26" fill="none">
      {/* Crown */}
      <path
        d="M10 1 C6.5 1 4 3 3 6 C2 3 -0.5 1 -3 1"
        stroke="none"
      />
      <path
        d="M16 1 C13.5 1 12 2.5 10 4 C8 2.5 6.5 1 4 1 C1.5 1 0 3 0 5.5 C0 8 1.5 10 3 11.5 C4.5 13 5 15 5 17 L5.5 22 L7 22 L8 17 L10 17 L12 17 L13 22 L14.5 22 L15 17 C15 15 15.5 13 17 11.5 C18.5 10 20 8 20 5.5 C20 3 18.5 1 16 1 Z"
        fill={color}
      />
    </svg>
  );
}

export function GestCliniLogo({ className = "", size = "md", variant = "dark" }: GestCliniLogoProps) {
  const sizes = {
    sm: { gestText: "text-xl", cliniText: "text-xl", tooth: 13 },
    md: { gestText: "text-2xl", cliniText: "text-2xl", tooth: 16 },
    lg: { gestText: "text-4xl", cliniText: "text-4xl", tooth: 24 },
  };
  const s = sizes[size];
  const color = variant === "dark" ? "text-white" : "text-foreground";
  const toothColor = variant === "dark" ? "#ffffff" : "#1a1a1a";

  return (
    <div className={`flex items-baseline gap-0 select-none ${className}`}>
      <span className={`${s.gestText} font-black tracking-tight leading-none ${color}`}>
        Gest
      </span>
      <span className={`${s.cliniText} font-light tracking-tight leading-none ${color}`}>
        Clini
      </span>
      <ToothIcon size={s.tooth} color={toothColor} />
    </div>
  );
}
