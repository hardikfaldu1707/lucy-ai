"use client";

import { MessageCircle } from "lucide-react";

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
    <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-pink-500/80 px-3 py-1.5 text-[10px] text-white">
          Hey Lucy 💕
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-1.5 text-[10px] text-white/80">
          I missed you today...
        </div>
      </div>
      <div className="flex items-center gap-1 text-[9px] text-white/40">
        <MessageCircle className="h-3 w-3" />
        typing...
      </div>
    </div>
  );
}

function AvatarsMockup() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {AVATAR_COLORS.map((gradient, i) => (
        <div
          key={i}
          className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} ring-2 ring-black/50`}
        />
      ))}
    </div>
  );
}

const DOT_POSITIONS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const r = 36;
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
      <div className="relative h-20 w-20 animate-[spin_20s_linear_infinite]">
        {DOT_POSITIONS.map((pos, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
            style={{
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
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
      {STATS.map((stat) => (
        <article
          key={stat.subtitle}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-5 sm:p-6"
        >
          <p className="text-2xl font-bold text-white sm:text-3xl">{stat.title}</p>
          <p className="text-sm font-medium text-white/60">{stat.subtitle}</p>
          {stat.visual}
        </article>
      ))}
    </section>
  );
}
