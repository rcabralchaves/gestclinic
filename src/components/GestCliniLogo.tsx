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
          viewBox="0 0 11 13"
          fill="none"
          style={{
            position: "absolute",
            top: c.dotOffset,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <path
            d="M5.5 0.5C4.2 0.5 3.3 1.1 2.8 2C2.3 1.1 1.4 0.5 0.5 0.5C0.5 0.5 0 3 1.5 5C2.2 5.9 2.5 7 2.5 8.5L3 12.5H4L4.5 8.5L5.5 8.5L6.5 8.5L7 12.5H8L8.5 8.5C8.5 7 8.8 5.9 9.5 5C11 3 10.5 0.5 10.5 0.5C9.6 0.5 8.7 1.1 8.2 2C7.7 1.1 6.8 0.5 5.5 0.5Z"
            fill={color}
          />
        </svg>
      </span>
    </div>
  );
}
