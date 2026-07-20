interface GestCliniLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

export function GestCliniLogo({ className = "", size = "md", variant = "dark" }: GestCliniLogoProps) {
  const configs = {
    sm: { fontSize: 20, toothW: 9, toothH: 10, dotOffset: -11, iWidth: 6 },
    md: { fontSize: 26, toothW: 11, toothH: 13, dotOffset: -14, iWidth: 8 },
    lg: { fontSize: 42, toothW: 17, toothH: 20, dotOffset: -22, iWidth: 13 },
  };
  const c = configs[size];
  const color = variant === "dark" ? "#ffffff" : "#111111";

  return (
    <div className={`inline-flex items-baseline select-none leading-none ${className}`} style={{ lineHeight: 1 }}>
      {/* Gest — bold */}
      <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 800, fontSize: c.fontSize, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        Gest
      </span>
      {/* Clin — light */}
      <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 300, fontSize: c.fontSize, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        Clin
      </span>
      {/* Custom "i" with tooth as dot */}
      <span style={{ position: "relative", display: "inline-block", width: c.iWidth, lineHeight: 1 }}>
        {/* i stem — no dot */}
        <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 300, fontSize: c.fontSize, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
          ı
        </span>
        {/* Tooth as the dot above the i */}
        <svg
          width={c.toothW}
          height={c.toothH}
          viewBox="0 0 12 16"
          fill="none"
          style={{
            position: "absolute",
            top: c.dotOffset,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Clean tooth: rounded crown + two roots */}
          <path
            d="M6 0C4.3 0 2 1 1 3C0.4 4.2 0 5.5 0 7C0 8.8 1 10 2.5 10.5L3 16H4.5L5 10.5H7L7.5 16H9L9.5 10.5C11 10 12 8.8 12 7C12 5.5 11.6 4.2 11 3C10 1 7.7 0 6 0Z"
            fill={color}
          />
        </svg>
      </span>
    </div>
  );
}
