"use client";

import { useEffect, useState } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";

export function FuturisticBackground() {
  const [mounted, setMounted] = useState(false);

  // Springs for smooth mouse tracking glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      {/* Moving Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(60deg) translateY(-30px)",
          transformOrigin: "top center",
          animation: "gridTravel 40s linear infinite",
        }}
      />

      {/* Cyber Grid Masking for Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />

      {/* Slow pulsing organic light blobs (Aurora) */}
      <div className="absolute inset-0 opacity-20">
        <m.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-1/4 -top-1/4 h-[80vw] w-[80vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3)_0%,transparent_60%)] blur-[80px]"
        />
        <m.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-1/4 -bottom-1/4 h-[75vw] w-[75vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.25)_0%,transparent_60%)] blur-[100px]"
        />
      </div>

      {/* Interactive mouse follow glow (desktop only) */}
      <m.div
        className="hidden md:block absolute -left-[250px] -top-[250px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] blur-[40px] mix-blend-screen"
        style={{
          x: glowX,
          y: glowY,
        }}
      />
    </div>
  );
}
