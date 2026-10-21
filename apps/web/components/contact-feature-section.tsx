import Image from 'next/image';
import { cn } from '@soulsync/ui/lib/utils';

/** Unsplash: NordWood Themes (photo-1556656793), Alexander Andrews (photo-1511707171634) — unsplash.com/license */
const CONTACT_MOBILE_1 = '/contact-mobile-1.jpg';
const CONTACT_MOBILE_2 = '/contact-mobile-2.jpg';

/** Stacked layout (mobile/tablet): viewport-scaled. Side-by-side grid (lg+): fixed width so two phones fit one column. */
const PHONE_PANEL_CLASS =
  'relative overflow-hidden rounded-xl shadow-lg sm:rounded-2xl ' +
  'h-[min(260px,46vh)] w-[min(140px,40vw)] ' +
  'sm:h-[min(320px,44vh)] sm:w-[min(168px,34vw)] ' +
  'md:h-[min(360px,42vh)] md:w-[min(188px,26vw)] ' +
  'lg:h-[380px] lg:w-[168px] xl:h-[440px] xl:w-[196px]';

const PHONE_GLOW_CLASS =
  'shrink-0 rounded-[1.25rem] bg-gradient-to-br from-[var(--color-brand-600)]/35 via-[var(--color-brand-500)]/25 to-[var(--color-brand-700)]/30 p-1 ' +
  'shadow-[0_0_48px_-8px_rgba(147,51,234,0.45)] sm:rounded-[1.5rem] sm:shadow-[0_0_60px_-12px_rgba(147,51,234,0.5)]';

type PhoneMockupProps = {
  src: string;
  alt: string;
  className?: string;
};

function PhoneMockup({ src, alt, className }: PhoneMockupProps) {
  return (
    <div className={cn(PHONE_GLOW_CLASS, className)}>
      <div className={PHONE_PANEL_CLASS}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 34vw, 196px"
        />
      </div>
    </div>
  );
}

export function ContactFeatureSection() {
  return (
    <section
      id="contact"
      className="w-full scroll-mt-20 overflow-x-hidden border-t border-[var(--border)] bg-[var(--background)] py-10 sm:py-12 md:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:w-[80%] lg:max-w-[80rem] lg:px-6">
        <div className="grid w-full grid-cols-1 items-center gap-8 sm:gap-10 xl:grid-cols-2 xl:gap-x-14 xl:gap-y-8">
          {/* Phones: stay inside column 1; no bleed into copy */}
          <div className="order-2 min-w-0 xl:order-none xl:justify-self-start">
            <div
              className={cn(
                'mx-auto flex w-fit max-w-full flex-row items-end justify-center',
                'gap-0 sm:gap-1 md:gap-2 lg:mx-0 lg:gap-2 xl:gap-3',
              )}
              aria-hidden={false}
            >
              <PhoneMockup
                src={CONTACT_MOBILE_1}
                alt="Mobile app showing profile discovery on SoulSync"
                className="-rotate-2 sm:-rotate-2 lg:-translate-y-1 lg:-rotate-1"
              />
              <PhoneMockup
                src={CONTACT_MOBILE_2}
                alt="Smartphone ready for messaging on SoulSync"
                className="-ml-3 rotate-2 sm:-ml-4 sm:rotate-2 lg:ml-0 lg:translate-y-2 lg:rotate-1"
              />
            </div>
          </div>

          {/* Copy: above phones on small screens; column 2 on lg+ */}
          <div
            className={cn(
              'order-1 min-w-0 space-y-4 text-center',
              'sm:mx-auto sm:max-w-xl sm:space-y-5',
              'xl:order-none xl:mx-0 xl:max-w-none xl:justify-self-stretch xl:text-left',
            )}
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Chat for Free
            </h2>
            <p className="text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Explore profiles, express interest, and start meaningful conversations—all for free.
            </p>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              Questions about a community or partnership? Reach out at{' '}
              <a
                className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                href="mailto:hello@soulsync.global"
              >
                hello@soulsync.global
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
