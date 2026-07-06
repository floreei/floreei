import { Star } from "lucide-react";
import { testimonials } from "@/data/landing";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Testimonials() {
  return (
    <section className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Quem já usa"
          title="Floriculturas que respiram mais aliviadas"
        />
        <div className="mt-10 grid grid-cols-3 gap-5 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 70}>
              <figure className="h-full rounded-xl border border-border/70 bg-card p-6 shadow-card">
                <div className="flex gap-0.5 text-clay">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="mt-4 text-[15px] leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {(t as { avatar?: string }).avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(t as { avatar?: string }).avatar}
                      alt={t.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: t.bg }}
                    >
                      {t.initials}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
