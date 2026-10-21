import Image from 'next/image';
import { Quote } from 'lucide-react';

const FOUNDER_IMAGE = '/founder-nazmus-sakib.png';

function BokehBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-[5%] -left-[10%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-900/20" />
      <div className="absolute right-[-5%] bottom-0 h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-900/25" />
      <div className="absolute top-[40%] left-[35%] h-48 w-48 rounded-full bg-white/60 blur-2xl dark:bg-white/5" />
    </div>
  );
}

export function FounderAboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--background)] py-12 md:py-16"
    >
      <BokehBackground />

      <div className="relative z-10 mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:w-[80%]">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <figure className="order-1 md:order-none">
            <Quote
              className="mb-4 h-10 w-10 text-[var(--muted-foreground)]/35 md:h-12 md:w-12"
              aria-hidden
            />
            <blockquote className="space-y-3">
              <p className="text-xl leading-snug font-bold tracking-tight md:text-2xl">
                At SoulSync Global,
              </p>
              <p className="text-lg leading-relaxed md:text-xl">We help find your life partner.</p>
              <p className="text-lg leading-snug font-semibold md:text-2xl">
                <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
                  We use Technology to make Connections easier.
                </span>
              </p>
            </blockquote>
            <figcaption className="mt-8 space-y-1 text-sm md:text-base">
              <p className="font-semibold text-[var(--foreground)]">
                — Md. Nazmus Sakib, Founder and Developer
              </p>
              <p className="text-[var(--muted-foreground)]">Dhaka, Bangladesh</p>
            </figcaption>
          </figure>

          <div className="order-2 flex justify-center md:order-none md:justify-end">
            <div className="relative aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-[var(--border)] sm:max-w-[320px] md:w-full md:max-w-[380px] md:max-w-none">
              <Image
                src={FOUNDER_IMAGE}
                alt="Md. Nazmus Sakib, Founder and Developer of SoulSync Global"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 320px, 380px"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
