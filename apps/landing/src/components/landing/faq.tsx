"use client";

import { ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { faqData } from "@/data/landing";
import { cn } from "@/lib/utils";
import { PhotoBadge } from "./photo-badge";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Ainda com dúvidas?"
          title="Perguntas frequentes"
          align="left"
        />

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal
            variant="scale"
            className="relative mx-auto max-w-md self-start lg:sticky lg:top-28 lg:mx-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/landing/faq.webp"
              alt="Time de suporte do Floreei conversando"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
              loading="lazy"
            />
            <PhotoBadge
              icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />}
              title="Suporte em português"
              subtitle="Gente de verdade respondendo"
              delay={280}
              className="-bottom-5 left-5"
            />
          </Reveal>

          <div className="space-y-3">
            {faqData.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={item.q} variant="right" delay={i * 60}>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <button
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/50"
                    >
                      <span className="font-medium">{item.q}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-200"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 text-[15px] leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
