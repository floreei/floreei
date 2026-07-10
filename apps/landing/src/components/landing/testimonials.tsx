import { Star } from "lucide-react";
import { testimonials } from "@/data/landing";
import { StatBadge } from "./photo-badge";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Testimonials() {
  const [featured, ...rest] = testimonials;

  return (
    <section className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Quem já usa"
          title="Floriculturas que respiram mais aliviadas"
          align="left"
        />

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal variant="scale" className="relative mx-auto max-w-md lg:mx-0">
            <span
              aria-hidden="true"
              className="absolute -left-5 -top-5 h-full w-full rounded-2xl bg-clay/15"
            />
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/landing/testimonials.webp"
                alt="Florista usando o Floreei em um laptop"
                className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
                loading="lazy"
              />
              <Reveal
                variant="pop"
                delay={200}
                className="absolute right-4 top-4 flex items-center gap-0.5 rounded-full bg-card px-2.5 py-1.5 text-clay shadow-lg"
              >
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-3.5 w-3.5" fill="currentColor" />
                ))}
              </Reveal>
              <Reveal variant="pop" delay={320}>
                <StatBadge
                  value="+30%"
                  label="orçamentos fechados"
                  className="-bottom-5 left-5"
                />
              </Reveal>
            </div>
          </Reveal>

          <div>
            <Reveal variant="left">
              <figure>
                <div className="flex gap-0.5 text-clay">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="sf-serif mt-4 text-2xl font-medium leading-snug">
                  “{featured.quote}”
                </blockquote>
                <figcaption className="mt-5">
                  <span className="block text-sm font-semibold">
                    {featured.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {featured.role}
                  </span>
                </figcaption>
              </figure>
            </Reveal>

            <div className="mt-8 space-y-6 border-t border-border pt-7">
              {rest.map((t, i) => (
                <Reveal key={t.name} variant="left" delay={i * 90}>
                  <figure className="flex gap-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: t.bg }}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <blockquote className="text-[15px] leading-relaxed">
                        “{t.quote}”
                      </blockquote>
                      <figcaption className="mt-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {t.name}
                        </span>{" "}
                        · {t.role}
                      </figcaption>
                    </div>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
