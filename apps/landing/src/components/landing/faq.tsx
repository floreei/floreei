"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { faqData } from "@/data/landing";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section-y">
      <div className="sf-wrap">
        <SectionHeading eyebrow="Ainda com dúvidas?" title="Perguntas frequentes" />

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqData.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
