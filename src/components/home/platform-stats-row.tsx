"use client";

import { MessageCircle } from "lucide-react";
import { m } from "framer-motion";

const AVATAR_COLORS = [
  "from-pink-500 to-rose-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-500 to-teal-600",
];

function ChatMockup() {
  return (
    <div className="mt-4 space-y-2.5 rounded-xl border border-white/5 bg-black/60 p-3.5 shadow-inner">
      <div className="flex justify-end">
        <m.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[70%] rounded-2xl rounded-br-xs bg-pink-500/85 px-3 py-1.5 text-[10px] text-white shadow-md shadow-pink-500/10 font-medium"
        >
          Hey Lucy 💕
        </m.div>
      </div>
      <div className="flex justify-start">
        <m.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="max-w-[75%] rounded-2xl rounded-bl-xs bg-white/10 px-3 py-1.5 text-[10px] text-white/90 shadow-sm border border-white/5 font-medium"
        >
          I missed you today...
        </m.div>
      </div>
      <div className="flex items-center gap-1.5 text-[9px] text-white/50 pl-1 font-semibold tracking-wider">
        <MessageCircle className="h-3 w-3 text-pink-400 animate-pulse" />
        <span className="flex items-center gap-0.5">
          typing
          <m.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.5, 1] }}
          >.</m.span>
          <m.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, times: [0.15, 0.65, 1] }}
          >.</m.span>
          <m.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, times: [0.3, 0.8, 1] }}
          >.</m.span>
        </span>
      </div>
    </div>
  );
}

function AvatarsMockup() {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {AVATAR_COLORS.map((gradient, i) => (
        <m.div
          key={i}
          whileHover={{ scale: 1.15, y: -4, zIndex: 10 }}
          className={`h-9 w-9 cursor-pointer rounded-full bg-gradient-to-br ${gradient} ring-2 ring-black/50 shadow-md transition-shadow hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]`}
        />
      ))}
    </div>
  );
}

const RING1_POSITIONS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const r = 34;
  const x = 40 + Math.cos(angle) * r;
  const y = 40 + Math.sin(angle) * r;
  return {
    left: `${x.toFixed(2)}px`,
    top: `${y.toFixed(2)}px`,
  };
});

const RING2_POSITIONS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  const r = 20;
  const x = 40 + Math.cos(angle) * r;
  const y = 40 + Math.sin(angle) * r;
  return {
    left: `${x.toFixed(2)}px`,
    top: `${y.toFixed(2)}px`,
  };
});

function DotsSphereMockup() {
  return (
    <div className="relative mt-2 flex h-24 items-center justify-center">
      {/* Central Pulsating AI Core */}
      <m.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-6 w-6 rounded-full bg-pink-500 blur-[4px] shadow-[0_0_16px_rgba(236,72,153,0.85)] z-0"
      />

      <div className="relative h-20 w-20">
        {/* Outer Ring (Clockwise) */}
        <m.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-10"
        >
          {RING1_POSITIONS.map((pos, i) => (
            <span
              key={`r1-${i}`}
              className="absolute h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.9)]"
              style={{
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </m.div>

        {/* Inner Ring (Counter-Clockwise) */}
        <m.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-10"
        >
          {RING2_POSITIONS.map((pos, i) => (
            <span
              key={`r2-${i}`}
              className="absolute h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]"
              style={{
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </m.div>
      </div>
    </div>
  );
}

const STATS = [
  {
    title: "20M+",
    subtitle: "Monthly Messages",
    visual: <ChatMockup />,
  },
  {
    title: "200+",
    subtitle: "AI Models",
    visual: <AvatarsMockup />,
  },
  {
    title: "3,000,000+",
    subtitle: "Monthly Visits",
    visual: <DotsSphereMockup />,
  },
];

export function PlatformStatsRow() {
  return (
    <section
      className="grid w-full max-w-[1400px] grid-cols-1 gap-4 sm:grid-cols-3"
      aria-label="Platform statistics"
    >
      {STATS.map((stat, index) => (
        <m.article
          key={stat.subtitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: index * 0.12 }}
          whileHover={{ y: -5 }}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7 shadow-2xl transition-all duration-300 hover:border-pink-500/25"
        >
          {/* Ambient Hover Glow */}
          <div className="absolute -inset-px bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">{stat.title}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-pink-300">{stat.subtitle}</p>
            {stat.visual}
          </div>
        </m.article>
      ))}
    </section>
  );
}
