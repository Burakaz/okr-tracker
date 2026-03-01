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

type AnimStyle = "dragon" | "fire-fill";

function getRandomMessage(level: CelebrationLevel) {
  const messages =
    level === "high" ? highMessages : level === "medium" ? mediumMessages : lowMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ===== Dragon Style — Fire Particles =====

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
    x: Math.random() * 30 + 10,
    y: Math.random() * 100,
    size: Math.random() * 8 + 3,
    color: fireColors[Math.floor(Math.random() * fireColors.length)],
    delay: Math.random() * 0.8,
    duration: 0.6 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 30,
  }));
}

// ===== Fire-Fill Style — Tongues & Embers =====

interface FireTongue {
  id: number;
  x: number;
  width: number;
  delay: number;
  duration: number;
}

function generateFireTongues(count: number): FireTongue[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i / count) * 90 + Math.random() * 8,
    width: Math.random() * 30 + 18,
    delay: Math.random() * 0.2,
    duration: 0.9 + Math.random() * 0.35,
  }));
}

interface Ember {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

function generateEmbers(count: number): Ember[] {
  const colors = ["#ff4500", "#ff6b35", "#ffa726", "#ffcc02", "#fff176"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 94 + 3,
    y: 20 + Math.random() * 65,
    size: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: 0.15 + Math.random() * 0.7,
    duration: 0.7 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 35,
  }));
}

// ===== Component =====

interface CheckinCelebrationProps {
  level: CelebrationLevel;
  onComplete: () => void;
}

export function CheckinCelebration({ level, onComplete }: CheckinCelebrationProps) {
  const [message] = useState(() => getRandomMessage(level));
  const [animStyle] = useState<AnimStyle>(() =>
    Math.random() > 0.5 ? "dragon" : "fire-fill"
  );

  // Dragon style
  const [fireParticles] = useState(() =>
    generateFireParticles(level === "high" ? 24 : level === "medium" ? 14 : 8)
  );

  // Fire-fill style
  const [fireTongues] = useState(() =>
    generateFireTongues(level === "high" ? 10 : level === "medium" ? 7 : 5)
  );
  const [embers] = useState(() =>
    generateEmbers(level === "high" ? 18 : level === "medium" ? 12 : 7)
  );

  const [phase, setPhase] = useState<"enter" | "message" | "exit">("enter");

  const dismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    const msgTimer = setTimeout(() => setPhase("message"), 1200);
    const dismissTimer = setTimeout(dismiss, level === "high" ? 4000 : 3200);
    return () => {
      clearTimeout(msgTimer);
      clearTimeout(dismissTimer);
    };
  }, [level, dismiss]);

  // Background gradient per level & style
  const bgGradient =
    animStyle === "fire-fill"
      ? level === "high"
        ? "from-red-600/10 via-orange-500/8 to-yellow-500/10"
        : level === "medium"
          ? "from-orange-500/8 via-amber-500/6 to-yellow-500/8"
          : "from-amber-500/6 via-yellow-500/4 to-orange-500/6"
      : level === "high"
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

  const styleClass = animStyle === "fire-fill" ? "style-fire-fill" : "";

  return (
    <div
      className={`celebration-inline ${styleClass} relative overflow-hidden rounded-xl bg-gradient-to-r ${bgGradient} ${glowColor} cursor-pointer`}
      onClick={dismiss}
      role="alert"
      aria-live="polite"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(0.98)" : "scale(1)",
        transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* ===== Dragon Style ===== */}
      {animStyle === "dragon" && (
        <>
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
            <span className="dragon-fire-breath" />
          </div>

          {/* Shockwave ring on high */}
          {level === "high" && (
            <div className="dragon-shockwave absolute inset-0 pointer-events-none" />
          )}
        </>
      )}

      {/* ===== Fire-Fill Style ===== */}
      {animStyle === "fire-fill" && (
        <>
          {/* Main fire sweep overlay — fills from bottom */}
          <div className="fire-fill-sweep absolute inset-0 pointer-events-none rounded-xl" />

          {/* Fire tongues for organic texture */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {fireTongues.map((t) => (
              <div
                key={t.id}
                className="fire-tongue"
                style={{
                  "--ft-x": `${t.x}%`,
                  "--ft-width": `${t.width}px`,
                  "--ft-delay": `${t.delay}s`,
                  "--ft-duration": `${t.duration}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Inner glow */}
          <div className="fire-fill-glow absolute inset-0 pointer-events-none rounded-xl" />

          {/* Floating embers */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {embers.map((e) => (
              <div
                key={e.id}
                className="fire-ember"
                style={{
                  "--em-x": `${e.x}%`,
                  "--em-y": `${e.y}%`,
                  "--em-size": `${e.size}px`,
                  "--em-color": e.color,
                  "--em-delay": `${e.delay}s`,
                  "--em-duration": `${e.duration}s`,
                  "--em-drift": `${e.drift}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Bright flash at peak (high only) */}
          {level === "high" && (
            <div className="fire-fill-flash absolute inset-0 pointer-events-none rounded-xl" />
          )}
        </>
      )}

      {/* ===== Message (shared) ===== */}
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
