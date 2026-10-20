'use client';

import * as React from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import { Badge } from '@soulsync/ui/badge';
import { buttonVariants } from '@soulsync/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@soulsync/ui/carousel';
import { cn } from '@soulsync/ui/lib/utils';

type HeroSlide = {
  image: string;
  badge?: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
};

const HERO_SLIDES: HeroSlide[] = [
  {
    image: '/hero1.jpg',
    badge: 'Privacy-first · Multi-faith · Consent-driven',
    title: 'Find meaningful connections across faiths, on your terms.',
    description:
      'SoulSync Global is a multi-tenant matrimony marketplace built for respectful discovery and transparent consent.',
    cta: { label: 'Explore communities', href: '#communities' },
  },
  {
    image: '/hero2.jpg',
    title: 'Respectful discovery across traditions',
    description:
      'Browse communities that honor your values while welcoming thoughtful connections beyond a single label.',
    cta: { label: 'See communities', href: '#communities' },
  },
  {
    image: '/hero3.jpg',
    title: 'You control visibility, interest, and next steps',
    description:
      'Consent-driven workflows keep you in charge—from profile visibility to expressing interest and moving forward.',
    cta: { label: 'Learn how privacy works', href: '#privacy' },
  },
  {
    image: '/hero4.jpg',
    title: 'Family-supported profiles, transparent workflows',
    description:
      'Guardian-managed profiles and clear permissions help families participate with respect and accountability.',
    cta: { label: 'Explore communities', href: '#communities' },
  },
  {
    image: '/hero5.jpg',
    title: 'Join active communities',
    description:
      'Discover tenant communities live on SoulSync Global—each with its own supported faiths and discovery rules.',
    cta: { label: 'View communities', href: '#communities' },
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

export function HeroCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const plugins = React.useMemo(() => {
    const list = [Fade()];
    if (!prefersReducedMotion) {
      list.push(Autoplay({ delay: 6000, stopOnInteraction: true }));
    }
    return list;
  }, [prefersReducedMotion]);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <section
      className="relative min-h-[100dvh] w-full"
      aria-label="Featured stories"
      aria-roledescription="carousel"
    >
      <Carousel
        opts={{ loop: true, duration: prefersReducedMotion ? 0 : 30 }}
        plugins={plugins}
        setApi={setApi}
        className="h-full w-full"
      >
        <CarouselContent className="ml-0 h-[100dvh]">
          {HERO_SLIDES.map((slide, index) => (
            <CarouselItem key={slide.image} className="basis-full pl-0">
              <div className="relative min-h-[100dvh] w-full">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-black/45"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25"
                  aria-hidden
                />
                <div className="absolute inset-0 flex items-center justify-center px-6 pb-24 pt-28 md:px-10">
                  <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center text-white">
                    {slide.badge ? (
                      <Badge
                        variant="secondary"
                        className="border-white/20 bg-white/15 text-white backdrop-blur-sm"
                      >
                        {slide.badge}
                      </Badge>
                    ) : null}
                    <h1 className="text-3xl font-bold tracking-tight md:text-5xl md:leading-tight">
                      {slide.title}
                    </h1>
                    <p className="max-w-2xl text-base text-white/90 md:text-lg">{slide.description}</p>
                    <a
                      href={slide.cta.href}
                      className={cn(buttonVariants({ size: 'lg' }), 'mt-1')}
                    >
                      {slide.cta.label}
                    </a>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          className={cn(
            'hidden border-white/30 bg-black/30 text-white hover:bg-black/50 md:inline-flex',
            'disabled:opacity-40',
          )}
        />
        <CarouselNext
          className={cn(
            'hidden border-white/30 bg-black/30 text-white hover:bg-black/50 md:inline-flex',
            'disabled:opacity-40',
          )}
        />
      </Carousel>

      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2"
        role="tablist"
        aria-label="Choose slide"
      >
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            role="tab"
            aria-selected={current === index}
            aria-label={`Go to slide ${index + 1}`}
            className={cn(
              'h-11 w-11 rounded-full p-0 transition-colors',
              'flex items-center justify-center',
            )}
            onClick={() => api?.scrollTo(index)}
          >
            <span
              className={cn(
                'block h-2.5 w-2.5 rounded-full transition-colors',
                current === index ? 'bg-white' : 'bg-white/45 hover:bg-white/70',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
