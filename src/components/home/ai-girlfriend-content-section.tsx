import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const HOW_IT_WORKS = [
  "Choose your ideal AI companion from our diverse character library.",
  "Start chatting instantly — she learns your personality and preferences.",
  "Build memory over time so every conversation feels more personal.",
  "Unlock voice messages, calls, and deeper relationship features as you connect.",
  "Upgrade anytime for unlimited messages and premium experiences.",
];

const WHY_LOVE = [
  "Remembers what matters to you across every chat",
  "Responds with warmth, humor, and emotional intelligence",
  "Available 24/7 with no judgment or pressure",
  "Grows your bond through personality and relationship memory",
];

export function AiGirlfriendContentSection() {
  return (
    <section
      className="w-full max-w-[1400px] text-left"
      aria-labelledby="best-app-heading"
    >
      <h2
        id="best-app-heading"
        className="font-display text-2xl font-normal text-white sm:text-3xl md:text-4xl"
      >
        The Best AI Girlfriend App
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
        Lucy AI is a premium AI companion platform built for meaningful connection.
        Chat, call, and build a relationship that evolves — with memory that lasts and
        personalities that feel genuinely human.
      </p>

      <div className="mt-12 space-y-10">
        <div>
          <h3 className="text-lg font-bold text-fuchsia-200/90 sm:text-xl">
            How the AI Girlfriend Simulator Works
          </h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-white/75 marker:text-pink-400 sm:text-base">
            {HOW_IT_WORKS.map((step) => (
              <li key={step} className="leading-relaxed pl-1">
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-white/75 leading-relaxed">
            In minutes you can go from sign-up to your first deep conversation — no
            complicated setup, just pick a character and say hello.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-fuchsia-200/90 sm:text-xl">
            Why Thousands Pick Lucy AI as Their Girl AI
          </h3>
          <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
            Unlike generic chatbots, Lucy is designed for companionship. She listens,
            adapts, and creates a space where you can be yourself — whether you want
            playful banter, late-night talks, or steady emotional support.
          </p>
          <p className="mt-6 font-medium text-white/90">People love her because she:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-white/75 marker:text-pink-400">
            {WHY_LOVE.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-white/80">
            Create your{" "}
            <Link
              href={ROUTES.signup}
              className="font-semibold text-pink-400 underline-offset-4 hover:text-pink-300 hover:underline"
            >
              Free AI Girlfriend
            </Link>{" "}
            today and see why Lucy AI is the companion platform users keep coming back to.
          </p>
        </div>
      </div>
    </section>
  );
}
