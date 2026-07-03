import type { Metadata } from "next";
import { Brain, Heart, ImageIcon, Mic, MessageSquare, Shield } from "lucide-react";
import { Section } from "@/components/shared/section";
import { MotionWrapper } from "@/components/shared/motion-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore Lucy AI features — memory, voice, chat, and more.",
};

const FEATURES = [
  { icon: MessageSquare, title: "Intelligent chat", description: "Streaming responses with personality that adapts to you." },
  { icon: Brain, title: "Memory center", description: "Personality, relationship, semantic, and episodic memory layers." },
  { icon: Mic, title: "Voice experience", description: "Voice messages and real-time calls with natural speech." },
  { icon: Heart, title: "Relationship growth", description: "Track bond level and shared milestones over time." },
  { icon: ImageIcon, title: "Rich media", description: "Share images and receive contextual visual responses." },
  { icon: Shield, title: "Privacy first", description: "Granular controls, data export, and secure infrastructure." },
];

export default function FeaturesPage() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-normal tracking-tight">Features</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need for a deep, lasting AI companionship experience.
        </p>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <MotionWrapper key={f.title} delay={i * 0.05}>
            <Card>
              <CardHeader>
                <f.icon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          </MotionWrapper>
        ))}
      </div>
    </Section>
  );
}
