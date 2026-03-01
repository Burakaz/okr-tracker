"use client";

import { useEffect, useState, useCallback } from "react";

// ===== Motivation Messages per Level =====

const highMessages = [
  { emoji: "🚀", text: "Krass, du übertriffst dich selbst!" },
  { emoji: "🔥", text: "On fire! Weiter so, Champion!" },
  { emoji: "💪", text: "Starke Leistung — du rockst das Quartal!" },
  { emoji: "⭐", text: "Vorbildlich! Du setzt neue Maßstäbe." },
  { emoji: "🎯", text: "Volltreffer! Genau so geht Fortschritt." },
  { emoji: "🏆", text: "Top-Performance! Du bist auf dem besten Weg." },
  { emoji: "✨", text: "Brillant! Deine Arbeit zahlt sich aus." },
  { emoji: "🎉", text: "Mega! Das Ziel ist fast erreicht!" },
  { emoji: "💎", text: "Erstklassig — du machst den Unterschied!" },
  { emoji: "🌟", text: "Überragend! Das ist echte Exzellenz." },
  { emoji: "⚡", text: "Unaufhaltbar! Du bist in Bestform." },
  { emoji: "🙌", text: "Respekt! Das ist professionelle Arbeit." },
];

const mediumMessages = [
  { emoji: "💡", text: "Guter Fortschritt — bleib am Ball!" },
  { emoji: "📈", text: "Es geht aufwärts! Weiter Schritt für Schritt." },
  { emoji: "🎯", text: "Du bist auf Kurs — Dranbleiben lohnt sich." },
  { emoji: "✊", text: "Solide Arbeit! Der nächste Push zählt." },
  { emoji: "🛠️", text: "Stück für Stück kommt der Erfolg." },
  { emoji: "🧗", text: "Du kletterst stetig — nicht aufgeben!" },
  { emoji: "🌱", text: "Die Saat geht auf. Weitermachen!" },
  { emoji: "🔄", text: "Fortschritt ist Fortschritt. Respekt!" },
  { emoji: "🧭", text: "Der Kompass zeigt in die richtige Richtung." },
  { emoji: "⏳", text: "Die Zeit läuft — nutze den Schwung!" },
  { emoji: "🎵", text: "Du findest deinen Rhythmus. Stark!" },
  { emoji: "🏃", text: "Dein Tempo stimmt — bleib dran!" },
];

const lowMessages = [
  { emoji: "💭", text: "Jeder Schritt zählt — fang klein an!" },
  { emoji: "🔑", text: "Was ist der eine Hebel, der alles ändert?" },
  { emoji: "⏰", text: "Investiere bewusst Zeit in dieses Ziel." },
  { emoji: "🎯", text: "Refokussiere dich — du schaffst das!" },
  { emoji: "🤝", text: "Hol dir Unterstützung — zusammen geht's schneller." },
  { emoji: "📋", text: "Breche es in kleinere Schritte runter." },
  { emoji: "🔍", text: "Analysiere, was blockiert — und räum es weg." },
  { emoji: "💪", text: "Rückschläge gehören dazu. Weiterkämpfen!" },
  { emoji: "🌅", text: "Morgen ist ein neuer Tag — starte durch!" },
  { emoji: "🧩", text: "Ein Puzzleteil nach dem anderen. Du packst das!" },
  { emoji: "🛤️", text: "Der Weg ist das Ziel. Bleib auf deinem Pfad." },
  { emoji: "🔋", text: "Lade auf und gib dann richtig Gas!" },
];

export type CelebrationLevel = "high" | "medium" | "low";

function getRandomMessage(level: CelebrationLevel) {
  const messages =
    level === "high" ? highMessages : level === "medium" ? mediumMessages : lowMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ===== Fire Particles =====

interface FireParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

function generateFireParticles(count: number): FireParticle[] {
  const fireColors = [
    "#ff4500", "#ff6b35", "#ff8c42", "#ffa726", "#ffcc02",
    "#ff3d00", "#ff7043", "#ffab40", "#ffd54f", "#fff176",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 30 + 10, // Left side trail area
    y: Math.random() * 100,
    size: Math.random() * 8 + 3,
    color: fireColors[Math.floor(Math.random() * fireColors.length)],
    delay: Math.random() * 0.8,
    duration: 0.6 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 30,
  }));
}

// ===== Component =====

interface CheckinCelebrationProps {
  level: CelebrationLevel;
  onComplete: () => void;
}

export function CheckinCelebration({ level, onComplete }: CheckinCelebrationProps) {
  const [message] = useState(() => getRandomMessage(level));
  const [fireParticles] = useState(() => generateFireParticles(level === "high" ? 24 : level === "medium" ? 14 : 8));
  const [phase, setPhase] = useState<"dragon-fly" | "message" | "exit">("dragon-fly");

  const dismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    // Dragon flies across → message appears → auto-dismiss
    const msgTimer = setTimeout(() => setPhase("message"), 1200);
    const dismissTimer = setTimeout(dismiss, level === "high" ? 4000 : 3200);
    return () => {
      clearTimeout(msgTimer);
      clearTimeout(dismissTimer);
    };
  }, [level, dismiss]);

  const bgGradient =
    level === "high"
      ? "from-orange-500/8 via-red-500/5 to-yellow-500/8"
      : level === "medium"
        ? "from-blue-500/6 via-indigo-500/4 to-cyan-500/6"
        : "from-amber-500/6 via-orange-500/4 to-yellow-500/6";

  const glowColor =
    level === "high"
      ? "shadow-[inset_0_0_30px_rgba(255,69,0,0.1)]"
      : level === "medium"
        ? "shadow-[inset_0_0_30px_rgba(59,130,246,0.08)]"
        : "shadow-[inset_0_0_20px_rgba(245,158,11,0.08)]";

  const dragonEmoji = level === "high" ? "🐉" : level === "medium" ? "🔥" : "⚡";

  return (
    <div
      className={`celebration-inline relative overflow-hidden rounded-xl bg-gradient-to-r ${bgGradient} ${glowColor} cursor-pointer`}
      onClick={dismiss}
      role="alert"
      aria-live="polite"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(0.98)" : "scale(1)",
        transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Fire particles trail */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fireParticles.map((p) => (
          <div
            key={p.id}
            className="fire-particle"
            style={{
              "--fx": `${p.x}%`,
              "--fy": `${p.y}%`,
              "--fsize": `${p.size}px`,
              "--fcolor": p.color,
              "--fdelay": `${p.delay}s`,
              "--fduration": `${p.duration}s`,
              "--fdrift": `${p.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Dragon flying across */}
      <div
        className="dragon-fly absolute pointer-events-none"
        style={{
          fontSize: level === "high" ? "48px" : "36px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
        }}
      >
        {dragonEmoji}
        {/* Fire breath trail */}
        <span className="dragon-fire-breath" />
      </div>

      {/* Shockwave ring on high */}
      {level === "high" && (
        <div className="dragon-shockwave absolute inset-0 pointer-events-none" />
      )}

      {/* Message content */}
      <div
        className="relative z-20 flex items-center justify-center gap-3 py-5 px-6"
        style={{
          opacity: phase === "message" || phase === "exit" ? 1 : 0,
          transform: phase === "message" || phase === "exit" ? "translateY(0) scale(1)" : "translateY(6px) scale(0.95)",
          transition: "all 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span
          className="text-3xl celebration-msg-emoji"
          style={{
            animationPlayState: phase === "message" ? "running" : "paused",
          }}
        >
          {message.emoji}
        </span>
        <p className="text-[14px] font-semibold text-foreground leading-snug">
          {message.text}
        </p>
      </div>
    </div>
  );
}
