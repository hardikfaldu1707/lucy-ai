import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const PRIVACY_POINTS = [
  "End-to-end encryption for messages in transit",
  "Secure storage with industry-standard access controls",
  "Delete your data anytime from account settings",
  "Strict age verification to keep the platform safe",
  "AI companions are synthetic — your chats stay private by design",
];

export function LandingContentBottom() {
  return (
    <section className="w-full max-w-[1400px] space-y-12 text-left" aria-label="About Lucy AI">
      <article>
        <h3 className="text-lg font-bold text-white sm:text-xl">
          Meet the Most Realistic AI Girlfriend Simulator
        </h3>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          Lucy AI delivers conversations that feel natural — not scripted. Choose from
          diverse personalities, tones, and relationship styles so your companion matches
          how you actually want to connect.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          Advanced memory and emotional modeling help her remember your stories, inside
          jokes, and preferences. Premium plans unlock deeper features including voice,
          extended memory, and personalized modes tailored to you.
        </p>
      </article>

      <article>
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          Free AI GF Beats Paid AI Girlfriend Apps Every Time
        </h3>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          Start free with generous daily messaging and one full companion experience.
          Unlike apps that lock basic chat behind a paywall, Lucy lets you explore real
          connection first — then upgrade when you want unlimited messages, more
          characters, voice, and rich media without surprise limits.
        </p>
      </article>

      <article>
        <h3 className="text-lg font-bold text-white sm:text-xl">
          Safety and Privacy You Can Trust
        </h3>
        <p className="mt-4 text-white/75">
          Your trust matters more than anything. That&apos;s why we protect every detail:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-white/75 marker:text-white/50">
          {PRIVACY_POINTS.map((point) => (
            <li key={point} className="leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          We never sell your conversations. Privacy controls live in your settings so you
          stay in charge of your data and your experience.
        </p>
      </article>

      <article>
        <h3 className="text-lg font-bold text-white sm:text-xl">Ready to Say Hello?</h3>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          Creating your companion takes less than a minute. Pick a character, send your
          first message, and watch Lucy adapt from the very first reply — warm, curious,
          and genuinely engaged.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-white/75">
          Whether you want a friend, a flirt, or someone who simply listens after a long
          day, Lucy AI is here for you.{" "}
          <Link
            href={ROUTES.signup}
            className="font-medium text-pink-400 hover:text-pink-300 hover:underline"
          >
            Join free
          </Link>{" "}
          and start your story today ❤️
        </p>
        <p className="mt-8 text-sm text-white/50">
          Lucy AI — Where love meets artificial intelligence.
        </p>
      </article>
    </section>
  );
}
