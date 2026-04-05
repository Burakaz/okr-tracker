"use client";

import { useEffect, useState, useCallback } from "react";

// ===== Motivation Messages =====

const highMessages = [
  { emoji: "🏆", text: "Krass, du übertriffst dich selbst!" },
  { emoji: "🚀", text: "On fire! Weiter so, Champion!" },
  { emoji: "⭐", text: "Vorbildlich! Du setzt neue Maßstäbe." },
  { emoji: "🎯", text: "Volltreffer! Genau so geht Fortschritt." },
  { emoji: "💎", text: "Erstklassig — du machst den Unterschied!" },
  { emoji: "⚡", text: "Unaufhaltbar! Du bist in Bestform." },
];

const mediumMessages = [
  { emoji: "💪", text: "Guter Fortschritt — bleib am Ball!" },
  { emoji: "📈", text: "Es geht aufwärts! Weiter so." },
  { emoji: "🎯", text: "Du bist auf Kurs — Dranbleiben lohnt sich." },
  { emoji: "🧗", text: "Du kletterst stetig — stark!" },
  { emoji: "🌱", text: "Die Saat geht auf. Weitermachen!" },
  { emoji: "🏃", text: "Dein Tempo stimmt — bleib dran!" },
];

const lowMessages = [
  { emoji: "💡", text: "Jeder Schritt zählt — fang klein an!" },
  { emoji: "🔑", text: "Was ist der eine Hebel, der alles ändert?" },
  { emoji: "🎯", text: "Refokussiere dich — du schaffst das!" },
  { emoji: "🧩", text: "Ein Puzzleteil nach dem anderen." },
  { emoji: "🌅", text: "Neuer Tag, neue Chance — starte durch!" },
  { emoji: "💪", text: "Rückschläge gehören dazu. Weiterkämpfen!" },
];

export type CelebrationLevel = "high" | "medium" | "low";

function getRandomMessage(level: CelebrationLevel) {
  const messages = level === "high" ? highMessages : level === "medium" ? mediumMessages : lowMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ===== Sparkle Generation =====

interface Sparkle {
  id: number;
  sx: number;
  sy: number;
  delay: number;
  size: number;
}

function generateSparkles(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 28 + Math.random() * 20;
    return {
      id: i,
      sx: Math.cos(angle) * distance,
      sy: Math.sin(angle) * distance,
      delay: Math.random() * 0.3,
      size: 4 + Math.random() * 4,
    };
  });
}

// ===== Confetti Generation =====

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  rotation: number;
  size: number;
}

function generateConfetti(count: number): ConfettiPiece[] {
  const colors = ["#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: 180 + Math.random() * 360,
    size: 4 + Math.random() * 4,
  }));
}

// ===== Component =====

interface CheckinCelebrationProps {
  level: CelebrationLevel;
  onComplete: () => void;
  /** Actual OKR progress 0-100. Shown in the ring instead of a fake percentage. */
  progress?: number;
}

export function CheckinCelebration({ level, onComplete, progress }: CheckinCelebrationProps) {
  const [message] = useState(() => getRandomMessage(level));
  const [sparkles] = useState(() =>
    generateSparkles(level === "high" ? 16 : level === "medium" ? 10 : 5)
  );
  const [confetti] = useState(() =>
    level === "high" ? generateConfetti(20) : []
  );
  const [phase, setPhase] = useState<"ring" | "message" | "exit">("ring");

  const dismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(onComplete, 400);
  }, [onComplete]);

  useEffect(() => {
    const msgTimer = setTimeout(() => setPhase("message"), 600);
    const dismissTimer = setTimeout(dismiss, level === "high" ? 3500 : 2800);
    return () => {
      clearTimeout(msgTimer);
      clearTimeout(dismissTimer);
    };
  }, [level, dismiss]);

  const ringColor = level === "high" ? "#22c55e" : level === "medium" ? "#22c55e" : "#f59e0b";
  const ringProgress = progress != null ? Math.min(progress, 100) / 100 : (level === "high" ? 0.85 : level === "medium" ? 0.6 : 0.35);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - ringProgress);

  return (
    <div
      className="celebration-card relative overflow-hidden rounded-xl bg-cream-50 cursor-pointer"
      onClick={dismiss}
      role="alert"
      aria-live="polite"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(0.97)" : "scale(1)",
        transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Confetti (high only) */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((c) => (
            <div
              key={c.id}
              style={{
                position: "absolute",
                left: `${c.x}%`,
                top: -8,
                width: c.size,
                height: c.size * 1.4,
                backgroundColor: c.color,
                borderRadius: "1px",
                opacity: 0,
                animation: `confetti-fall 1.8s ease-in ${c.delay + 0.6}s forwards`,
                ["--confetti-rotation" as string]: `${c.rotation}deg`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-5 py-5 px-6">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="block">
            {/* Background ring */}
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke="var(--cream-300)"
              strokeWidth="4"
            />
            {/* Animated fill ring */}
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke={ringColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                animation: `ring-fill 800ms cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards`,
                ["--ring-circumference" as string]: circumference,
                ["--ring-offset" as string]: offset,
              }}
            />
          </svg>
          {/* Center score */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: "score-pop 500ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both",
            }}
          >
            <span className="text-[15px] font-bold text-foreground">
              {Math.round(ringProgress * 100)}%
            </span>
          </div>
          {/* Sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {sparkles.map((s) => (
              <div
                key={s.id}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: s.size,
                  height: s.size,
                  backgroundColor: ringColor,
                  borderRadius: "50%",
                  boxShadow: `0 0 ${s.size}px ${ringColor}`,
                  opacity: 0,
                  animation: `sparkle-burst 700ms ease-out ${s.delay + 0.3}s forwards`,
                  ["--sx" as string]: `${s.sx}px`,
                  ["--sy" as string]: `${s.sy}px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Message */}
        <div
          style={{
            opacity: phase === "message" || phase === "exit" ? 1 : 0,
            transform: phase === "message" || phase === "exit" ? "translateY(0)" : "translateY(8px)",
            transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span className="text-2xl mr-2">{message.emoji}</span>
          <span className="text-[14px] font-semibold text-foreground">
            {message.text}
          </span>
        </div>
      </div>
    </div>
  );
}
